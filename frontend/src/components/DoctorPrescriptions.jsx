import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Search, Plus, X, FileText, Download, Eye,
  Bell, Trash2, CheckCircle, Clock, Pill,
  Save, ChevronRight, Loader2, RefreshCw, AlertTriangle, User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const api = axios.create({ baseURL: 'https://nhbackend.onrender.com/api' });
const getDoctorId = () => localStorage.getItem('doctorId');

const AVATAR_COLORS = ['bg-indigo-500','bg-pink-500','bg-amber-500','bg-emerald-500','bg-violet-500','bg-cyan-500','bg-rose-500','bg-teal-500','bg-orange-500','bg-blue-500'];
function avatarBg(name=''){let s=0;for(const c of name)s+=c.charCodeAt(0);return AVATAR_COLORS[s%AVATAR_COLORS.length];}
function initials(name=''){return name.split(' ').filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join('');}
function formatDate(d){if(!d)return'—';return new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});}
function photoSrc(p){if(!p||typeof p!=='string'||p.trim()==='')return null;if(p.startsWith('data:')||p.startsWith('http')||p.startsWith('//'))return p;return`data:image/jpeg;base64,${p}`;}

const STATUS_CFG = {
  active:  {label:'Active', bg:'bg-green-100',text:'text-green-700',dot:'bg-green-500'},
  expired: {label:'Expired',bg:'bg-gray-100', text:'text-gray-500', dot:'bg-gray-400'},
};
const FREQUENCIES = ['Once daily','Twice daily','Thrice daily','Every 8 hours','Every 6 hours','As needed'];
const TIMINGS     = ['Morning','Afternoon','Night','Morning & Night','After meals','Before meals','As needed'];
const DURATIONS   = ['3 days','5 days','1 week','2 weeks','1 month','3 months','6 months','1 year'];
const BLANK_MED   = {name:'',dose:'',frequency:'Once daily',duration:'1 month',timing:'Morning',instructions:''};
const COMMON_MEDS = ['Amlodipine','Atorvastatin','Metoprolol','Aspirin','Telmisartan','Furosemide','Ramipril','Clopidogrel','Paracetamol','Amoxicillin','Cetirizine','Omeprazole'];

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({message,type='success',onClose}){
  useEffect(()=>{const t=setTimeout(onClose,3500);return()=>clearTimeout(t);},[]);
  return(
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-white ${type==='error'?'bg-red-600':'bg-gray-900'}`}>
      <CheckCircle className="w-5 h-5 text-green-400 shrink-0"/>
      <p className="text-sm font-semibold">{message}</p>
      <button onClick={onClose}><X className="w-4 h-4 opacity-60 hover:opacity-100"/></button>
    </div>
  );
}

// ─── View Modal ───────────────────────────────────────────────────────────────
function ViewModal({rx,onClose}){
  return(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <p className="text-xs text-gray-400 font-mono">{rx.rxNumber}</p>
            <h3 className="font-bold text-gray-900 text-lg">{rx.diagnosis}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-500"/></button>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
              <div className={`w-10 h-10 ${avatarBg(rx.patientName)} rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0`}>{initials(rx.patientName)}</div>
              <div>
                <p className="text-xs text-gray-400">Patient</p>
                <p className="font-bold text-gray-900 text-sm">{rx.patientName}</p>
                <p className="text-xs text-gray-500">{rx.patientAge?`${rx.patientAge} years old`:'—'}</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Prescribed on</p>
              <p className="font-bold text-gray-900 text-sm">{formatDate(rx.issuedDate||rx.createdAt)}</p>
              <p className="text-xs text-gray-400 mt-1">Expires: <span className="font-semibold text-gray-600">{formatDate(rx.expiryDate)}</span></p>
              <span className={`inline-flex items-center gap-1.5 mt-2 text-xs font-bold px-2 py-1 rounded-full ${STATUS_CFG[rx.status].bg} ${STATUS_CFG[rx.status].text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CFG[rx.status].dot}`}/>{STATUS_CFG[rx.status].label}
              </span>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><Pill className="w-4 h-4 text-blue-600"/> Medications</h4>
            <div className="space-y-3">
              {(rx.medications||[]).map((m,i)=>(
                <div key={i} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-gray-900">{m.name} <span className="text-gray-500 font-normal text-sm">— {m.dose}</span></p>
                    <span className="text-xs bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded-full border border-blue-100">{m.timing}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-gray-50 rounded-lg p-2"><p className="text-gray-400">Frequency</p><p className="font-bold text-gray-800 mt-0.5">{m.frequency}</p></div>
                    <div className="bg-gray-50 rounded-lg p-2"><p className="text-gray-400">Duration</p><p className="font-bold text-gray-800 mt-0.5">{m.duration}</p></div>
                    <div className="bg-gray-50 rounded-lg p-2"><p className="text-gray-400">Instructions</p><p className="font-bold text-gray-800 mt-0.5">{m.instructions||'—'}</p></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {rx.notes&&(
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <p className="text-sm font-bold text-amber-800 mb-1">Doctor's Notes</p>
              <p className="text-sm text-amber-700 leading-relaxed">{rx.notes}</p>
            </div>
          )}
          <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-700 text-white text-sm font-bold rounded-xl hover:bg-blue-800 transition-colors">
            <Download className="w-4 h-4"/> Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Write Prescription Modal ─────────────────────────────────────────────────
function WriteModal({onClose,onSaved,patients}){
  const [patientId,  setPatientId]  = useState('');
  const [diagnosis,  setDiagnosis]  = useState('');
  const [notes,      setNotes]      = useState('');
  const [meds,       setMeds]       = useState([{...BLANK_MED}]);
  const [step,       setStep]       = useState(1);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');

  const selectedPatient = patients.find(p=>String(p.patientId)===patientId);
  const addMed    = ()=>setMeds(prev=>[...prev,{...BLANK_MED}]);
  const removeMed = (i)=>setMeds(prev=>prev.filter((_,idx)=>idx!==i));
  const updateMed = (i,field,val)=>setMeds(prev=>prev.map((m,idx)=>idx===i?{...m,[field]:val}:m));
  const canNext   = step===1?(patientId&&diagnosis):step===2?meds.every(m=>m.name&&m.dose):true;

  const handleSave = async()=>{
    setSaving(true); setError('');
    try{
      const doctorId   = getDoctorId();
      const doctorName = localStorage.getItem('doctorName')||'Doctor';
      await api.post('/prescriptions',{
        doctorId, doctorName,
        patientId, patientName:selectedPatient?.name||'',
        patientAge:selectedPatient?.age||0,
        diagnosis, medications:meds, notes,
      });
      onSaved(); onClose();
    }catch(err){
      setError(err.response?.data?.error||'Failed to save');
      setSaving(false);
    }
  };

  return(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h3 className="font-bold text-gray-900">Write Prescription</h3>
            <p className="text-xs text-gray-400 mt-0.5">Step {step} of 3 — {['Patient & Diagnosis','Medications','Review & Save'][step-1]}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-500"/></button>
        </div>
        <div className="px-6 pt-4">
          <div className="flex gap-2">{[1,2,3].map(s=><div key={s} className={`flex-1 h-1.5 rounded-full transition-all ${s<=step?'bg-blue-700':'bg-gray-100'}`}/>)}</div>
        </div>
        <div className="px-6 py-5">
          {step===1&&(
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Select Patient</label>
                {patients.length===0
                  ?<div className="py-8 text-center text-gray-400"><User className="w-10 h-10 mx-auto mb-2 opacity-30"/><p className="text-sm">No patients yet. Patients appear after their first appointment.</p></div>
                  :<div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                    {patients.map(p=>(
                      <button key={String(p.patientId)} onClick={()=>setPatientId(String(p.patientId))}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${String(p.patientId)===patientId?'border-blue-400 bg-blue-50':'border-gray-200 hover:border-gray-300'}`}>
                        {photoSrc(p.photo)
                          ?<img src={photoSrc(p.photo)} className="w-9 h-9 rounded-full object-cover shrink-0"/>
                          :<div className={`w-9 h-9 ${avatarBg(p.name)} rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0`}>{initials(p.name)}</div>
                        }
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{p.name}</p>
                          <p className="text-xs text-gray-400">{p.age?`${p.age} yrs`:'—'}</p>
                        </div>
                        {String(p.patientId)===patientId&&<CheckCircle className="w-4 h-4 text-blue-600 ml-auto shrink-0"/>}
                      </button>
                    ))}
                  </div>
                }
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Diagnosis / Condition</label>
                <input value={diagnosis} onChange={e=>setDiagnosis(e.target.value)} placeholder="e.g. Stage 1 Hypertension"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"/>
              </div>
            </div>
          )}
          {step===2&&(
            <div className="space-y-4">
              {meds.map((med,i)=>(
                <div key={i} className="border border-gray-100 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-bold text-gray-800">Medicine {i+1}</p>
                    {meds.length>1&&<button onClick={()=>removeMed(i)} className="p-1 hover:bg-red-50 rounded-lg"><X className="w-4 h-4 text-red-400"/></button>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Medicine Name</label>
                      <input list={`meds-${i}`} value={med.name} onChange={e=>updateMed(i,'name',e.target.value)} placeholder="e.g. Amlodipine"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"/>
                      <datalist id={`meds-${i}`}>{COMMON_MEDS.map(m=><option key={m} value={m}/>)}</datalist>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Dosage</label>
                      <input value={med.dose} onChange={e=>updateMed(i,'dose',e.target.value)} placeholder="e.g. 5mg"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"/>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Frequency</label>
                      <select value={med.frequency} onChange={e=>updateMed(i,'frequency',e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 bg-white">
                        {FREQUENCIES.map(f=><option key={f}>{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Duration</label>
                      <select value={med.duration} onChange={e=>updateMed(i,'duration',e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 bg-white">
                        {DURATIONS.map(d=><option key={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Timing</label>
                      <select value={med.timing} onChange={e=>updateMed(i,'timing',e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 bg-white">
                        {TIMINGS.map(t=><option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Special Instructions</label>
                      <input value={med.instructions} onChange={e=>updateMed(i,'instructions',e.target.value)} placeholder="e.g. Take with food"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"/>
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={addMed} className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-sm font-bold text-gray-500 hover:border-blue-300 hover:text-blue-600 flex items-center justify-center gap-2 transition-colors">
                <Plus className="w-4 h-4"/> Add Another Medicine
              </button>
            </div>
          )}
          {step===3&&(
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2"><User className="w-4 h-4 text-blue-600"/><p className="text-sm font-bold text-gray-800">Patient: {selectedPatient?.name}</p></div>
                <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-amber-500"/><p className="text-sm font-bold text-gray-800">Diagnosis: {diagnosis}</p></div>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Medications ({meds.length})</p>
                <div className="space-y-2">
                  {meds.map((m,i)=>(
                    <div key={i} className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5">
                      <span className="text-sm font-bold text-gray-900">{m.name} {m.dose}</span>
                      <span className="text-xs text-blue-700 font-semibold">{m.frequency} · {m.duration}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Doctor's Notes (optional)</label>
                <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Lifestyle advice, follow-up instructions..." rows={3}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none transition"/>
              </div>
              {error&&<p className="text-xs text-red-500 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5"/>{error}</p>}
            </div>
          )}
        </div>
        <div className="flex gap-3 px-6 pb-5">
          {step>1
            ?<button onClick={()=>setStep(s=>s-1)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Back</button>
            :<button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
          }
          {step<3
            ?<button onClick={()=>setStep(s=>s+1)} disabled={!canNext}
                className="flex-1 py-2.5 bg-blue-700 text-white rounded-xl text-sm font-bold hover:bg-blue-800 disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5">
                Next<ChevronRight className="w-4 h-4"/>
              </button>
            :<button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 bg-blue-700 text-white rounded-xl text-sm font-bold hover:bg-blue-800 disabled:opacity-60 transition-colors flex items-center justify-center gap-1.5">
                {saving?<Loader2 className="w-4 h-4 animate-spin"/>:<Save className="w-4 h-4"/>}
                {saving?'Saving…':'Save Prescription'}
              </button>
          }
        </div>
      </div>
    </div>
  );
}

// ─── Prescription Card ────────────────────────────────────────────────────────
function PrescriptionCard({rx,onView,onDelete}){
  const s=STATUS_CFG[rx.status];
  return(
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 ${avatarBg(rx.patientName)} rounded-full flex items-center justify-center text-white font-bold`}>{initials(rx.patientName)}</div>
          <div>
            <p className="font-bold text-gray-900 text-sm">{rx.patientName}</p>
            <p className="text-xs text-gray-500">{rx.patientAge?`${rx.patientAge} yrs · `:''}{formatDate(rx.issuedDate||rx.createdAt)}</p>
          </div>
        </div>
        <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}/>{s.label}
        </span>
      </div>
      <div className="mb-4">
        <p className="text-xs font-mono text-gray-400 mb-0.5">{rx.rxNumber}</p>
        <p className="font-bold text-gray-800 text-sm">{rx.diagnosis}</p>
      </div>
      <div className="space-y-1.5 mb-4">
        {(rx.medications||[]).map((m,i)=>(
          <div key={i} className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full shrink-0"/>
            <span className="text-xs font-semibold text-gray-700">{m.name} {m.dose}</span>
            <span className="text-xs text-gray-400">· {m.frequency}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-2 pt-3 border-t border-gray-100">
        <button onClick={()=>onView(rx)} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-50 text-blue-700 text-xs font-bold rounded-xl hover:bg-blue-100 transition-colors">
          <Eye className="w-3.5 h-3.5"/> View
        </button>
        <button className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-50 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-100 transition-colors">
          <Download className="w-3.5 h-3.5"/> PDF
        </button>
        <button onClick={()=>onDelete(rx._id)} className="flex items-center justify-center py-2 px-3 bg-red-50 text-red-500 text-xs font-bold rounded-xl hover:bg-red-100 transition-colors">
          <Trash2 className="w-3.5 h-3.5"/>
        </button>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function DoctorPrescriptions(){
  const navigate = useNavigate();
  const [prescriptions,setPrescriptions] = useState([]);
  const [patients,setPatients]           = useState([]);
  const [loading,setLoading]             = useState(true);
  const [search,setSearch]               = useState('');
  const [filter,setFilter]               = useState('all');
  const [modal,setModal]                 = useState(null);
  const [toast,setToast]                 = useState(null);
  const [doctorPhoto,setDoctorPhoto]     = useState(null);

  const doctorId   = getDoctorId();
  const doctorName = localStorage.getItem('doctorName')||'Doctor';
  const showToast  = (msg,type='success')=>setToast({msg,type});

  const load = useCallback(async()=>{
    if(!doctorId){setLoading(false);return;}
    setLoading(true);
    try{
      const [rxRes,ptRes,profileRes] = await Promise.allSettled([
        api.get(`/prescriptions/doctor/${doctorId}`),
        api.get(`/appointments/doctor/${doctorId}/patients/full`),
        api.get(`/doctor/profile/${doctorId}`),
      ]);
      if(rxRes.status==='fulfilled') setPrescriptions(rxRes.value.data||[]);
      if(ptRes.status==='fulfilled') setPatients(ptRes.value.data||[]);
      if(profileRes.status==='fulfilled') setDoctorPhoto(profileRes.value.data?.personal?.photo||null);
    }catch{showToast('Failed to load','error');}
    finally{setLoading(false);}
  },[doctorId]);

  useEffect(()=>{load();},[load]);

  const handleDelete = async(id)=>{
    try{
      await api.delete(`/prescriptions/${id}`);
      setPrescriptions(prev=>prev.filter(r=>r._id!==id));
      showToast('Prescription deleted');
    }catch{showToast('Delete failed','error');}
  };

  const filtered = prescriptions
    .filter(rx=>filter==='all'||rx.status===filter)
    .filter(rx=>
      rx.patientName?.toLowerCase().includes(search.toLowerCase())||
      rx.diagnosis?.toLowerCase().includes(search.toLowerCase())||
      rx.rxNumber?.toLowerCase().includes(search.toLowerCase())
    );

  const counts = {
    all:     prescriptions.length,
    active:  prescriptions.filter(r=>r.status==='active').length,
    expired: prescriptions.filter(r=>r.status==='expired').length,
  };

  return(
    <>
    <div className="flex-1 overflow-auto bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-8 py-[15px] flex items-center justify-between sticky top-0 z-10">
        <div>
          <p className="text-gray-500 text-sm">Write and manage prescriptions</p>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Prescriptions</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="p-2 hover:bg-gray-100 rounded-xl" title="Refresh"><RefreshCw className="w-5 h-5 text-gray-600"/></button>
          <button className="relative p-2 hover:bg-gray-100 rounded-xl"><Bell className="w-5 h-5 text-gray-600"/></button>
          <button onClick={()=>navigate('/doctor/profile')} className="flex items-center gap-2 pl-3 border-l border-gray-200 hover:opacity-80">
            {photoSrc(doctorPhoto)
              ?<img src={photoSrc(doctorPhoto)} className="w-9 h-9 rounded-full object-cover border border-gray-200"/>
              :<div className="w-9 h-9 bg-blue-700 rounded-full flex items-center justify-center text-white font-bold text-sm">{initials(doctorName)}</div>
            }
            <span className="font-semibold text-gray-800 text-sm">{doctorName.split(' ')[0]}</span>
          </button>
        </div>
      </header>
      <div className="p-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            {label:'Total Prescriptions',value:counts.all,    icon:FileText,   bg:'bg-blue-50', color:'text-blue-600'},
            {label:'Active',             value:counts.active, icon:CheckCircle,bg:'bg-green-50',color:'text-green-600'},
            {label:'Expired',            value:counts.expired,icon:Clock,      bg:'bg-gray-50', color:'text-gray-500'},
          ].map(({label,value,icon:Icon,bg,color})=>(
            <div key={label} className="bg-white rounded-2xl p-5 flex items-center gap-4 border border-gray-100 shadow-sm">
              <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center shrink-0`}><Icon className={`w-5 h-5 ${color}`}/></div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{label}</p>
                {loading?<div className="w-8 h-7 bg-gray-200 rounded animate-pulse mt-1"/>:<p className="text-3xl font-bold text-gray-900">{value}</p>}
              </div>
            </div>
          ))}
        </div>
        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 flex-wrap">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            {['all','active','expired'].map(tab=>(
              <button key={tab} onClick={()=>setFilter(tab)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-colors ${filter===tab?'bg-white text-gray-900 shadow-sm':'text-gray-500 hover:text-gray-700'}`}>
                {tab}<span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${filter===tab?'bg-blue-100 text-blue-700':'bg-gray-200 text-gray-500'}`}>{counts[tab]}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 flex-1 min-w-48">
            <Search className="w-4 h-4 text-gray-400 shrink-0"/>
            <input type="text" placeholder="Search patient, diagnosis, RX number…" value={search} onChange={e=>setSearch(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"/>
            {search&&<button onClick={()=>setSearch('')}><X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600"/></button>}
          </div>
          <button onClick={()=>setModal('write')} className="flex items-center gap-2 px-5 py-2.5 bg-blue-700 text-white text-sm font-bold rounded-xl hover:bg-blue-800 transition-colors">
            <Plus className="w-4 h-4"/> Write Prescription
          </button>
        </div>
        {/* Cards */}
        {loading?(
          <div className="flex items-center justify-center py-20"><Loader2 className="w-10 h-10 text-blue-500 animate-spin"/></div>
        ):filtered.length>0?(
          <div className="grid grid-cols-2 gap-4">
            {filtered.map(rx=>(
              <PrescriptionCard key={rx._id} rx={rx}
                onView={r=>setModal({type:'view',rx:r})}
                onDelete={handleDelete}/>
            ))}
          </div>
        ):(
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4"><FileText className="w-8 h-8 text-gray-400"/></div>
            <h3 className="text-base font-bold text-gray-700 mb-1">No prescriptions found</h3>
            <p className="text-sm text-gray-400 mb-4">{search?`No results for "${search}"`:'Start by writing your first prescription'}</p>
            <button onClick={()=>setModal('write')} className="flex items-center gap-2 px-5 py-2.5 bg-blue-700 text-white text-sm font-bold rounded-xl hover:bg-blue-800 transition-colors">
              <Plus className="w-4 h-4"/> Write Prescription
            </button>
          </div>
        )}
      </div>
    </div>
    {modal==='write'&&<WriteModal onClose={()=>setModal(null)} onSaved={()=>{load();showToast('Prescription saved ✅');}} patients={patients}/>}
    {modal?.type==='view'&&<ViewModal rx={modal.rx} onClose={()=>setModal(null)}/>}
    {toast&&<Toast message={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
    </>
  );
}