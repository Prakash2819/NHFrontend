import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Pill, Search, Download, Eye, AlertCircle, CheckCircle,
  X, RefreshCw, Shield, Info, Package, Bell,
  ChevronRight, Plus, FileText, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const api = axios.create({ baseURL: 'https://nhbackend.onrender.com/api' });
const getPatientId = () => localStorage.getItem('patientId');

function formatDate(d){if(!d)return'—';return new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});}
function daysUntil(dateStr){return Math.ceil((new Date(dateStr)-Date.now())/(1000*60*60*24));}
function photoSrc(p){if(!p||typeof p!=='string'||p.trim()==='')return null;if(p.startsWith('data:')||p.startsWith('http')||p.startsWith('//'))return p;return`data:image/jpeg;base64,${p}`;}

const AVATAR_COLORS=['bg-indigo-500','bg-pink-500','bg-amber-500','bg-emerald-500','bg-violet-500','bg-cyan-500','bg-rose-500','bg-teal-500','bg-orange-500','bg-blue-500'];
function avatarBg(name=''){let s=0;for(const c of name)s+=c.charCodeAt(0);return AVATAR_COLORS[s%AVATAR_COLORS.length];}
function initials(name=''){return name.split(' ').filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join('');}

const STATUS_CONFIG={
  active: {label:'Active', bg:'bg-green-100',text:'text-green-700',dot:'bg-green-500'},
  expired:{label:'Expired',bg:'bg-gray-100', text:'text-gray-500', dot:'bg-gray-400'},
};

// ─── Stock Bar ────────────────────────────────────────────────────────────────
function StockBar({stock,max=30}){
  const pct=Math.min((stock/max)*100,100);
  const color=stock===0?'bg-red-400':stock<=5?'bg-amber-400':'bg-green-400';
  return(
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{width:`${pct}%`}}/>
      </div>
      <span className={`text-xs font-bold ${stock===0?'text-red-500':stock<=5?'text-amber-600':'text-gray-500'}`}>{stock} left</span>
    </div>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function PrescriptionModal({rx,onClose}){
  return(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <p className="text-xs text-gray-500 font-semibold">{rx.rxNumber}</p>
            <h3 className="text-lg font-bold text-gray-900">{rx.diagnosis}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-500"/></button>
        </div>
        <div className="p-6 space-y-5">
          {/* Doctor info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
              <div className={`w-10 h-10 ${avatarBg(rx.doctorName)} rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0`}>{initials(rx.doctorName)}</div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Prescribed by</p>
                <p className="text-sm font-bold text-gray-900">{rx.doctorName||'Doctor'}</p>
                <p className="text-xs text-gray-500">{rx.doctorSpecialty||''}</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-400 font-medium">Issued</p>
                <p className="text-sm font-bold text-gray-800">{formatDate(rx.issuedDate||rx.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Expires</p>
                <p className={`text-sm font-bold ${rx.status==='expired'?'text-red-500':'text-gray-800'}`}>{formatDate(rx.expiryDate)}</p>
              </div>
            </div>
          </div>
          {/* Medications */}
          <div>
            <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><Pill className="w-4 h-4 text-blue-500"/> Prescribed Medications</h4>
            <div className="space-y-3">
              {(rx.medications||[]).map((med,i)=>(
                <div key={i} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{med.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{med.dose} · {med.frequency}</p>
                    </div>
                    <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full border border-blue-100">{med.timing}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="bg-gray-50 rounded-lg p-2 text-center"><p className="text-gray-400 font-medium">Duration</p><p className="font-bold text-gray-800 mt-0.5">{med.duration}</p></div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center"><p className="text-gray-400 font-medium">Stock</p><p className={`font-bold mt-0.5 ${(med.stock||0)===0?'text-red-500':(med.stock||0)<=5?'text-amber-600':'text-gray-800'}`}>{med.stock||'—'} {med.stock!==undefined?'tablets':''}</p></div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center"><p className="text-gray-400 font-medium">Instructions</p><p className="font-bold text-gray-800 mt-0.5">{med.instructions||'—'}</p></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Notes */}
          {rx.notes&&(
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2"><Info className="w-4 h-4 text-amber-600"/><p className="text-sm font-bold text-amber-800">Doctor's Notes</p></div>
              <p className="text-sm text-amber-700 leading-relaxed">{rx.notes}</p>
            </div>
          )}
          {/* Pharmacy */}
          {rx.pharmacy&&(
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
              <Package className="w-5 h-5 text-gray-400"/>
              <div><p className="text-xs text-gray-400 font-medium">Dispensing Pharmacy</p><p className="text-sm font-bold text-gray-800">{rx.pharmacy}</p></div>
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors">
              <Download className="w-4 h-4"/> Download PDF
            </button>
            {rx.status==='active'&&(
              <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 transition-colors">
                <RefreshCw className="w-4 h-4"/> Request Refill
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Prescription Card ────────────────────────────────────────────────────────
function PrescriptionCard({rx,onView}){
  const s=STATUS_CONFIG[rx.status];
  const expDays=daysUntil(rx.expiryDate);
  const isExpiringSoon=rx.status==='active'&&expDays<=30&&expDays>0;
  const lowStock=rx.status==='active'&&(rx.medications||[]).some(m=>(m.stock||0)<=5&&m.stock!==undefined);

  return(
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
      {(isExpiringSoon||lowStock)&&(
        <div className={`px-5 py-2 text-xs font-semibold flex items-center gap-2 ${lowStock?'bg-red-50 text-red-600':'bg-amber-50 text-amber-700'}`}>
          <AlertCircle className="w-3.5 h-3.5"/>
          {lowStock?'Low medication stock — refill soon':`Expires in ${expDays} days`}
        </div>
      )}
      <div className="p-5">
        {/* Doctor row */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 ${avatarBg(rx.doctorName)} rounded-full flex items-center justify-center text-white font-bold`}>{initials(rx.doctorName||'')}</div>
            <div>
              <p className="font-bold text-gray-900 text-sm">{rx.doctorName||'Doctor'}</p>
              <p className="text-xs text-gray-500">{rx.doctorSpecialty||''}</p>
            </div>
          </div>
          <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}/>{s.label}
          </span>
        </div>
        {/* Diagnosis */}
        <div className="mb-4">
          <p className="font-bold text-gray-800 text-sm">{rx.diagnosis}</p>
          <p className="text-xs text-gray-400 font-mono mt-0.5">{rx.rxNumber}</p>
        </div>
        {/* Dates */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 rounded-xl px-3 py-2"><p className="text-xs text-gray-400 font-medium">Issued</p><p className="text-xs font-bold text-gray-700 mt-0.5">{formatDate(rx.issuedDate||rx.createdAt)}</p></div>
          <div className={`rounded-xl px-3 py-2 ${rx.status==='expired'?'bg-red-50':'bg-gray-50'}`}><p className="text-xs text-gray-400 font-medium">Expires</p><p className={`text-xs font-bold mt-0.5 ${rx.status==='expired'?'text-red-500':'text-gray-700'}`}>{formatDate(rx.expiryDate)}</p></div>
        </div>
        {/* Meds */}
        <div className="space-y-2 mb-4">
          {(rx.medications||[]).map((med,i)=>(
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full shrink-0"/>
                <span className="text-xs font-semibold text-gray-700 truncate">{med.name} {med.dose}</span>
                <span className="text-xs text-gray-400 shrink-0">· {med.frequency}</span>
              </div>
              {rx.status==='active'&&med.stock!==undefined&&<StockBar stock={med.stock||0}/>}
            </div>
          ))}
        </div>
        <div className="flex gap-2 pt-3 border-t border-gray-100">
          <button onClick={()=>onView(rx)} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-50 text-blue-600 text-xs font-bold rounded-xl hover:bg-blue-100 transition-colors">
            <Eye className="w-3.5 h-3.5"/> View Details
          </button>
          <button className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-50 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-100 transition-colors">
            <Download className="w-3.5 h-3.5"/> Download
          </button>
          {rx.status==='active'&&(
            <button className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-50 text-green-700 text-xs font-bold rounded-xl hover:bg-green-100 transition-colors">
              <RefreshCw className="w-3.5 h-3.5"/> Refill
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function Prescriptions(){
  const navigate  = useNavigate();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading,  setLoading]    = useState(true);
  const [activeTab,setActiveTab]  = useState('all');
  const [search,   setSearch]     = useState('');
  const [selectedRx,setSelectedRx]= useState(null);
  const [showTracker,setShowTracker]=useState(true);
  const [patientProfile,setPatientProfile]=useState(null);

  const patientId   = getPatientId();
  const patientName = localStorage.getItem('patientName')||'Patient';

  const load = useCallback(async()=>{
    if(!patientId){setLoading(false);return;}
    setLoading(true);
    try{
      const [rxRes,profileRes] = await Promise.allSettled([
        api.get(`/prescriptions/patient/${patientId}`),
        api.get(`/patient/profile/${patientId}`),
      ]);
      if(rxRes.status==='fulfilled') setPrescriptions(rxRes.value.data||[]);
      if(profileRes.status==='fulfilled') setPatientProfile(profileRes.value.data||null);
    }catch(err){console.error(err);}
    finally{setLoading(false);}
  },[patientId]);

  useEffect(()=>{load();},[load]);

  const counts={
    all:     prescriptions.length,
    active:  prescriptions.filter(p=>p.status==='active').length,
    expired: prescriptions.filter(p=>p.status==='expired').length,
  };

  const filtered = prescriptions
    .filter(p=>activeTab==='all'||p.status===activeTab)
    .filter(p=>
      (p.doctorName||'').toLowerCase().includes(search.toLowerCase())||
      (p.diagnosis||'').toLowerCase().includes(search.toLowerCase())||
      (p.rxNumber||'').toLowerCase().includes(search.toLowerCase())||
      (p.medications||[]).some(m=>m.name.toLowerCase().includes(search.toLowerCase()))
    );

  // active medications for tracker (those with stock field)
  const activeMeds = prescriptions
    .filter(p=>p.status==='active')
    .flatMap(p=>(p.medications||[]).filter(m=>m.stock!==undefined).map(m=>({...m,doctorName:p.doctorName,rxNumber:p.rxNumber,_color:avatarBg(p.doctorName)})));

  const lowStockMeds = activeMeds.filter(m=>(m.stock||0)<=5);

  return(
    <>
    <div className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-[15px] flex items-center justify-between sticky top-0 z-10">
        <div>
          <p className="text-gray-500 text-sm">View and manage your medications</p>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Prescriptions</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="p-2 hover:bg-gray-100 rounded-xl"><RefreshCw className="w-5 h-5 text-gray-600"/></button>
          <button onClick={()=>navigate('/patient/profile')} className="flex items-center gap-2 pl-3 border-l border-gray-200 hover:opacity-80">
            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden shrink-0">
              {patientProfile?.personal?.photo
                ? <img src={patientProfile.personal.photo} alt="" className="w-full h-full object-cover"/>
                : (patientProfile?.personal?.name||patientName)[0]?.toUpperCase()||'P'
              }
            </div>
            <span className="font-semibold text-gray-800 text-sm">{(patientProfile?.personal?.name||patientName).split(' ')[0]}</span>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto py-4 px-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            {label:'Total Prescriptions',value:counts.all,   icon:FileText,   bg:'bg-blue-50',  color:'text-blue-600'},
            {label:'Active',             value:counts.active, icon:CheckCircle,bg:'bg-green-50', color:'text-green-600'},
            {label:'Active Medications', value:activeMeds.length,icon:Pill,   bg:'bg-purple-50',color:'text-purple-600'},
            {label:'Low Stock Alerts',   value:lowStockMeds.length,icon:AlertCircle,bg:'bg-red-50',color:'text-red-500'},
          ].map(({label,value,icon:Icon,bg,color})=>(
            <div key={label} className="bg-white rounded-2xl p-5 flex items-center gap-4 border border-gray-100 shadow-sm">
              <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center shrink-0`}><Icon className={`w-5 h-5 ${color}`}/></div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{label}</p>
                {loading?<div className="w-8 h-6 bg-gray-200 rounded animate-pulse mt-1"/>:<p className="text-2xl font-bold text-gray-900">{value}</p>}
              </div>
            </div>
          ))}
        </div>

        {/* Medication Tracker */}
        {showTracker&&activeMeds.length>0&&(
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center"><Pill className="w-4 h-4 text-white"/></div>
                <h3 className="font-bold text-gray-900 text-sm">Active Medication Tracker</h3>
              </div>
              <button onClick={()=>setShowTracker(false)} className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4"/></button>
            </div>
            <div className="divide-y divide-gray-50">
              {activeMeds.map((med,i)=>{
                const isLow=(med.stock||0)<=5;
                const isOut=(med.stock||0)===0;
                return(
                  <div key={i} className="flex items-center gap-5 px-6 py-4">
                    <div className={`w-10 h-10 ${med._color} rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0`}>{initials(med.doctorName||'')}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900 text-sm">{med.name} {med.dose}</p>
                        {isOut&&<span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">Out of stock</span>}
                        {isLow&&!isOut&&<span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">Low stock</span>}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{med.frequency} · {med.timing} · <span className="text-gray-400">{med.doctorName}</span></p>
                    </div>
                    <div className="w-36 shrink-0"><StockBar stock={med.stock||0}/></div>
                    {(isLow||med.refillsLeft>0)&&(
                      <button className={`shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-colors ${isOut?'bg-red-600 text-white hover:bg-red-700':'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>
                        <RefreshCw className="w-3 h-3"/>{isOut?'Order Now':'Refill'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Low stock banner when tracker closed */}
        {lowStockMeds.length>0&&!showTracker&&(
          <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-red-100 transition-colors" onClick={()=>setShowTracker(true)}>
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500"/>
              <div>
                <p className="text-sm font-bold text-red-700">{lowStockMeds.length} medication{lowStockMeds.length>1?'s':''} running low</p>
                <p className="text-xs text-red-500">{lowStockMeds.map(m=>m.name).join(', ')}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-red-400"/>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 flex-wrap">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            {['all','active','expired'].map(tab=>(
              <button key={tab} onClick={()=>setActiveTab(tab)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-colors ${activeTab===tab?'bg-white text-gray-900 shadow-sm':'text-gray-500 hover:text-gray-700'}`}>
                {tab}<span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${activeTab===tab?'bg-blue-100 text-blue-700':'bg-gray-200 text-gray-500'}`}>{counts[tab]}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 flex-1 min-w-48">
            <Search className="w-4 h-4 text-gray-400 shrink-0"/>
            <input type="text" placeholder="Search by doctor, diagnosis, or medication..." value={search} onChange={e=>setSearch(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"/>
            {search&&<button onClick={()=>setSearch('')}><X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600"/></button>}
          </div>
        </div>

        {/* Cards */}
        {loading?(
          <div className="flex items-center justify-center py-20"><Loader2 className="w-10 h-10 text-blue-500 animate-spin"/></div>
        ):filtered.length>0?(
          <div className="grid grid-cols-2 gap-4">
            {filtered.map(rx=><PrescriptionCard key={rx._id} rx={rx} onView={setSelectedRx}/>)}
          </div>
        ):(
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4"><Pill className="w-8 h-8 text-gray-400"/></div>
            <h3 className="text-base font-bold text-gray-700 mb-1">No prescriptions found</h3>
            <p className="text-sm text-gray-400">{search?`No results for "${search}"`:activeTab==='all'?'Your doctor will add prescriptions here after your appointment':'No '+activeTab+' prescriptions'}</p>
          </div>
        )}

        {/* Safety note */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-500 shrink-0 mt-0.5"/>
          <div>
            <p className="text-sm font-bold text-blue-800">Important Reminder</p>
            <p className="text-xs text-blue-600 mt-0.5 leading-relaxed">Always consult your doctor before stopping or changing medications. Do not share prescriptions with others. Contact your doctor if you experience any unusual side effects.</p>
          </div>
        </div>
      </div>
    </div>

    {selectedRx&&<PrescriptionModal rx={selectedRx} onClose={()=>setSelectedRx(null)}/>}
    </>
  );
}