import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Search, Filter, Bell, ChevronRight, X, Plus,
  FileText, Calendar, Clock, Phone, Mail, Heart,
  Activity, Pill, AlertCircle, CheckCircle, Video,
  MapPin, User, Download, Loader2, RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ─── API ──────────────────────────────────────────────────────────────────────
const api = axios.create({ baseURL: 'https://nhbackend.onrender.com/api' });
const getDoctorId = () => localStorage.getItem('doctorId');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const AVATAR_COLORS = ['bg-indigo-500','bg-pink-500','bg-amber-500','bg-emerald-500','bg-violet-500','bg-cyan-500','bg-rose-500','bg-teal-500','bg-orange-500','bg-blue-500'];
function avatarBg(name='') { let s=0; for(const c of name) s+=c.charCodeAt(0); return AVATAR_COLORS[s%AVATAR_COLORS.length]; }
function initials(name='') { return name.split(' ').filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join(''); }
function fmtDate(d) {
  if (!d) return '—';
  const [y,mo,day] = d.split('-').map(Number);
  return new Date(y,mo-1,day).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
}
function photoSrc(p) {
  if (!p || typeof p !== 'string' || p.trim() === '') return null;
  if (p.startsWith('data:') || p.startsWith('http') || p.startsWith('//')) return p;
  return `data:image/jpeg;base64,${p}`;
}
function calcAge(dob) {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob)) / 31557600000);
}

// ─── Patient Detail Modal ─────────────────────────────────────────────────────
function PatientModal({ patient, doctorId, onClose, onBookFollowup }) {
  const [tab, setTab]         = useState('overview');
  const [history, setHistory] = useState([]);
  const [loadingH, setLoadingH] = useState(false);

  useEffect(() => {
    if (tab !== 'history') return;
    setLoadingH(true);
    api.get(`/appointments/doctor/${doctorId}/patient/${patient.patientId}/history`)
      .then(r => setHistory(r.data || []))
      .catch(() => {})
      .finally(() => setLoadingH(false));
  }, [tab, patient.patientId, doctorId]);

  const src = photoSrc(patient.photo);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col" onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-5 border-b border-gray-100">
          {src
            ? <img src={src} className="w-14 h-14 rounded-full object-cover shrink-0 border border-gray-100"/>
            : <div className={`w-14 h-14 ${avatarBg(patient.name)} rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0`}>{initials(patient.name)}</div>
          }
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-lg">{patient.name}</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {patient.age ? `${patient.age} yrs` : '—'}
              {patient.gender ? ` · ${patient.gender}` : ''}
              {patient.bloodGroup ? ` · ${patient.bloodGroup}` : ''}
              {patient.conditions?.[0] ? ` · ${patient.conditions[0]}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={onBookFollowup}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-700 text-white text-xs font-bold rounded-xl hover:bg-blue-800">
              <Calendar className="w-3.5 h-3.5"/> Book Follow-up
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
              <X className="w-5 h-5 text-gray-400"/>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-3 border-b border-gray-100">
          {['overview','history','medications'].map(t=>(
            <button key={t} onClick={()=>setTab(t)}
              className={`pb-3 px-4 text-sm font-semibold capitalize transition-colors ${tab===t?'text-blue-700 border-b-2 border-blue-700':'text-gray-500 hover:text-gray-800'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* ── Overview ── */}
          {tab==='overview' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Contact</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Phone className="w-3.5 h-3.5 text-gray-400"/> {patient.phone || '—'}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Mail className="w-3.5 h-3.5 text-gray-400"/> {patient.email || '—'}
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Visit Summary</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-400">Total Visits</p>
                      <p className="text-xl font-bold text-blue-700">{patient.visits}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Last Visit</p>
                      <p className="text-sm font-bold text-gray-800">{fmtDate(patient.lastVisit)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Blood Group</p>
                      <p className="text-sm font-bold text-red-600">{patient.bloodGroup || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Gender</p>
                      <p className="text-sm font-bold text-gray-800 capitalize">{patient.gender || '—'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Conditions */}
              {patient.conditions?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Conditions</p>
                  <div className="flex flex-wrap gap-2">
                    {patient.conditions.map(c=>(
                      <span key={c} className="flex items-center gap-1 text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200 px-3 py-1.5 rounded-full">
                        <Heart className="w-3 h-3"/> {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Allergies */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Allergies</p>
                {patient.allergies?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {patient.allergies.map(a=>(
                      <span key={a} className="flex items-center gap-1 text-xs font-bold bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-full">
                        <AlertCircle className="w-3 h-3"/> {a}
                      </span>
                    ))}
                  </div>
                ) : <p className="text-sm text-gray-400">No known allergies</p>}
              </div>
            </div>
          )}

          {/* ── History ── */}
          {tab==='history' && (
            loadingH ? (
              <div className="py-16 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin"/>
              </div>
            ) : history.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-40"/>
                <p className="text-sm">No appointment history</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map(h=>(
                  <div key={h._id} className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${h.type==='video'?'bg-indigo-50 text-indigo-600':'bg-emerald-50 text-emerald-600'}`}>
                          {h.type==='video'?<Video className="w-3 h-3"/>:<MapPin className="w-3 h-3"/>}
                          {h.type==='video'?'Video':'In-person'}
                        </span>
                        <p className="text-sm font-bold text-gray-900">{h.reason||'Consultation'}</p>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize
                          ${h.status==='completed'?'bg-green-100 text-green-700':
                            h.status==='cancelled'?'bg-red-100 text-red-600':
                            h.status==='missed'?'bg-orange-100 text-orange-600':
                            'bg-gray-100 text-gray-600'}`}>
                          {h.status}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-gray-500">{fmtDate(h.date)}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{h.time}</p>
                        {h.doctorFee && <p className="text-xs text-gray-400">₹{h.doctorFee}</p>}
                      </div>
                    </div>
                    {h.notes && (
                      <p className="text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2 leading-relaxed mt-2">{h.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )
          )}

          {/* ── Medications (from prescriptions placeholder) ── */}
          {tab==='medications' && (
            <div className="space-y-3">
              {patient.conditions?.length > 0 ? patient.conditions.map((cond,i)=>(
                <div key={i} className="flex items-center gap-4 border border-gray-100 rounded-xl p-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                    <Pill className="w-5 h-5 text-blue-600"/>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-sm">{cond}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Chronic condition on record</p>
                  </div>
                </div>
              )) : (
                <div className="py-10 text-center">
                  <Pill className="w-10 h-10 text-gray-300 mx-auto mb-2"/>
                  <p className="text-sm text-gray-400">No conditions on record</p>
                </div>
              )}
              <button onClick={()=>{ onClose(); }}
                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 text-sm font-bold text-gray-500 hover:border-blue-300 hover:text-blue-600 rounded-xl transition-colors mt-2">
                <Plus className="w-4 h-4"/> Write New Prescription
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Patient Card ─────────────────────────────────────────────────────────────
function PatientCard({ patient, onView }) {
  const src = photoSrc(patient.photo);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {src
            ? <img src={src} className="w-12 h-12 rounded-full object-cover shrink-0 border border-gray-100"/>
            : <div className={`w-12 h-12 ${avatarBg(patient.name)} rounded-full flex items-center justify-center text-white font-bold shrink-0`}>{initials(patient.name)}</div>
          }
          <div>
            <p className="font-bold text-gray-900 text-sm">{patient.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {patient.age ? `${patient.age} yrs` : '—'}
              {patient.gender ? ` · ${patient.gender}` : ''}
              {patient.bloodGroup ? ` · ${patient.bloodGroup}` : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Condition */}
      <div className="bg-gray-50 rounded-xl px-3 py-2 mb-4">
        <p className="text-xs text-gray-400 font-medium">Condition</p>
        <p className="text-sm font-bold text-gray-800">{patient.conditions?.[0] || '—'}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="text-center">
          <p className="text-lg font-bold text-blue-700">{patient.visits}</p>
          <p className="text-xs text-gray-400">Visits</p>
        </div>
        <div className="text-center border-l border-gray-100">
          <p className="text-xs font-bold text-gray-700 mt-1">{fmtDate(patient.lastVisit)}</p>
          <p className="text-xs text-gray-400">Last Visit</p>
        </div>
      </div>

      {/* Allergies */}
      {patient.allergies?.length > 0 && (
        <div className="flex items-center gap-1.5 mb-4">
          <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0"/>
          <p className="text-xs text-red-600 font-semibold truncate">Allergic: {patient.allergies.join(', ')}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-gray-100">
        <button onClick={()=>onView(patient)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-700 text-white text-xs font-bold rounded-xl hover:bg-blue-800">
          <User className="w-3.5 h-3.5"/> View Profile
        </button>
        <button onClick={()=>onView(patient)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-50 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-100">
          <Calendar className="w-3.5 h-3.5"/> History
        </button>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function MyPatients() {
  const navigate = useNavigate();
  const [patients,  setPatients]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [view,      setView]      = useState('grid');
  const [selected,  setSelected]  = useState(null);

  const doctorId = getDoctorId();
  const [doctorPhoto, setDoctorPhoto] = useState(null);

  const fetchPatients = useCallback(async () => {
    if (!doctorId) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await api.get(`/appointments/doctor/${doctorId}/patients/full`);
      setPatients(res.data || []);
    } catch (err) {
      console.error('Failed to load patients:', err.response?.data || err.message);
    } finally { setLoading(false); }
  }, [doctorId]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);
  // Fetch doctor photo for header
  useEffect(() => {
    if (!doctorId) return;
    api.get(`/doctor/profile/${doctorId}`)
      .then(r => setDoctorPhoto(r.data?.personal?.photo || null))
      .catch(() => {});
  }, [doctorId]);



  const filtered = patients.filter(p => {
    const q = search.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.conditions?.some(c=>c.toLowerCase().includes(q)) ||
      p.phone?.includes(q) ||
      p.email?.toLowerCase().includes(q)
    );
  });

  const doctorName = localStorage.getItem('doctorName') || 'Doctor';
  const doctorPhotoSrc = photoSrc(doctorPhoto);

  return (
    <div className="flex-1 overflow-auto bg-gray-50">

      {/* ── Top Bar ── */}
      <header className="bg-white border-b border-gray-200 px-8 py-[15px] flex items-center justify-between sticky top-0 z-10">
        <div>
          <p className="text-gray-500 text-sm">Your patient records</p>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">My Patients</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchPatients} className="p-2 hover:bg-gray-100 rounded-xl" title="Refresh">
            <RefreshCw className="w-5 h-5 text-gray-600"/>
          </button>
          <button className="relative p-2 hover:bg-gray-100 rounded-xl">
            <Bell className="w-5 h-5 text-gray-600"/>
          </button>
          <button onClick={()=>navigate('/doctor/profile')} className="flex items-center gap-2 pl-3 border-l border-gray-200 hover:opacity-80">
            {doctorPhotoSrc
              ? <img src={doctorPhotoSrc} className="w-9 h-9 rounded-full object-cover border border-gray-200"/>
              : <div className="w-9 h-9 bg-blue-700 rounded-full flex items-center justify-center text-white font-bold text-sm">{initials(doctorName)}</div>
            }
            <span className="font-semibold text-gray-800 text-sm">{doctorName.split(' ').slice(0, 2).join(' ')}</span>
          </button>
        </div>
      </header>

      <div className="p-8 space-y-6">

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label:'Total Patients', value:patients.length,  bg:'bg-blue-50',   color:'text-blue-600',  icon:User      },
            { label:'Seen This Month',value:patients.filter(p=>{
                if (!p.lastVisit) return false;
                const d=new Date(p.lastVisit);
                const now=new Date();
                return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();
              }).length,               bg:'bg-green-50',  color:'text-green-600', icon:CheckCircle },
            { label:'With Allergies', value:patients.filter(p=>p.allergies?.length>0).length, bg:'bg-red-50', color:'text-red-500', icon:AlertCircle },
          ].map(({label,value,bg,color,icon:Icon})=>(
            <div key={label} className="bg-white rounded-2xl p-5 flex items-center gap-4 border border-gray-100 shadow-sm">
              <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${color}`}/>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{label}</p>
                {loading
                  ? <div className="w-8 h-6 bg-gray-200 rounded animate-pulse mt-1"/>
                  : <p className="text-2xl font-bold text-gray-900">{value}</p>
                }
              </div>
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 flex-1 min-w-52">
            <Search className="w-4 h-4 text-gray-400 shrink-0"/>
            <input type="text" placeholder="Search by name, condition, phone…"
              value={search} onChange={e=>setSearch(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"/>
            {search && <button onClick={()=>setSearch('')}><X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600"/></button>}
          </div>
          {/* View toggle */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            {[{v:'grid',icon:'⊞'},{v:'table',icon:'☰'}].map(({v,icon})=>(
              <button key={v} onClick={()=>setView(v)}
                className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${view===v?'bg-white shadow-sm text-gray-900':'text-gray-500 hover:text-gray-700'}`}>
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin"/>
          </div>
        )}

        {/* ── Grid View ── */}
        {!loading && view==='grid' && (
          filtered.length > 0
            ? <div className="grid grid-cols-3 gap-4">{filtered.map(p=><PatientCard key={String(p.patientId)} patient={p} onView={setSelected}/>)}</div>
            : <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 flex flex-col items-center text-center">
                <User className="w-12 h-12 text-gray-300 mb-3"/>
                <p className="font-bold text-gray-600">No patients found</p>
                <p className="text-sm text-gray-400 mt-1">{search?`No results for "${search}"`:'No patients yet'}</p>
              </div>
        )}

        {/* ── Table View ── */}
        {!loading && view==='table' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Patient','Condition','Allergies','Blood Group','Last Visit','Visits','Actions'].map(h=>(
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(p=>{
                  const src=photoSrc(p.photo);
                  return (
                    <tr key={String(p.patientId)} className="hover:bg-gray-50/60 cursor-pointer transition-colors" onClick={()=>setSelected(p)}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {src
                            ? <img src={src} className="w-9 h-9 rounded-xl object-cover shrink-0"/>
                            : <div className={`w-9 h-9 ${avatarBg(p.name)} rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0`}>{initials(p.name)}</div>
                          }
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{p.name}</p>
                            <p className="text-xs text-gray-400">{p.age?`${p.age} yrs`:''}{p.gender?` · ${p.gender}`:''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">{p.conditions?.[0]||'—'}</td>
                      <td className="px-5 py-4">
                        {p.allergies?.length>0
                          ? <div className="flex flex-wrap gap-1">{p.allergies.slice(0,2).map(a=><span key={a} className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium">{a}</span>)}{p.allergies.length>2&&<span className="text-xs text-gray-400">+{p.allergies.length-2}</span>}</div>
                          : <span className="text-gray-400 text-sm">—</span>
                        }
                      </td>
                      <td className="px-5 py-4">
                        {p.bloodGroup
                          ? <span className="text-xs font-bold px-2 py-1 bg-red-50 text-red-600 rounded-lg">{p.bloodGroup}</span>
                          : <span className="text-gray-400 text-sm">—</span>
                        }
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">{fmtDate(p.lastVisit)}</td>
                      <td className="px-5 py-4 text-sm font-bold text-blue-700">{p.visits}</td>
                      <td className="px-5 py-4">
                        <button onClick={e=>{e.stopPropagation();setSelected(p);}}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-xl hover:bg-blue-100">
                          <User className="w-3 h-3"/> View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length===0 && (
              <div className="py-16 text-center text-gray-400">
                <User className="w-10 h-10 mx-auto mb-2 opacity-40"/>
                <p className="text-sm">{search?`No results for "${search}"`:'No patients yet'}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Patient Detail Modal ── */}
      {selected && (
        <PatientModal
          patient={selected}
          doctorId={doctorId}
          onClose={()=>setSelected(null)}
          onBookFollowup={()=>{ setSelected(null); navigate('/doctor/appointments'); }}
        />
      )}
    </div>
  );
}