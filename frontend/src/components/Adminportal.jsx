import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Users, Calendar, Clock, Trash2, Search, Filter,
  Star, Video, MapPin, CheckCircle, Stethoscope,
  Shield, Bell, RefreshCw, AlertTriangle, Ban, X,
  Save, UserCheck, Loader2, Eye, EyeOff, LogOut,
  Lock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ─── API ──────────────────────────────────────────────────────────────────────
const BASE = 'https://nhbackend.onrender.com/api/admin';

const api = axios.create({ baseURL: BASE });

// ─── Constants ────────────────────────────────────────────────────────────────
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const DR_STATUS = {
  approved: { bg:'bg-green-100', text:'text-green-700', dot:'bg-green-500', label:'Approved' },
  pending:  { bg:'bg-amber-100', text:'text-amber-700', dot:'bg-amber-500', label:'Pending'  },
  rejected: { bg:'bg-red-100',   text:'text-red-600',   dot:'bg-red-400',   label:'Rejected' },
};
const APT_STATUS = {
  confirmed: { bg:'bg-green-100',  text:'text-green-700'  },
  pending:   { bg:'bg-amber-100',  text:'text-amber-700'  },
  completed: { bg:'bg-blue-100',   text:'text-blue-700'   },
  cancelled: { bg:'bg-red-100',    text:'text-red-600'    },
  missed:    { bg:'bg-orange-100', text:'text-orange-600' },
};
const AVATAR_COLORS = ['bg-indigo-500','bg-pink-500','bg-amber-500','bg-emerald-500','bg-violet-500','bg-cyan-500'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function initials(name='') { return name.split(' ').filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join(''); }
function fmtDate(d) {
  if (!d) return '—';
  const [y,mo,day]=d.split('-').map(Number);
  return new Date(y,mo-1,day).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
}
function avatarBg(name='') { let s=0; for(const c of name) s+=c.charCodeAt(0); return AVATAR_COLORS[s%AVATAR_COLORS.length]; }

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type='success', onClose }) {
  useEffect(()=>{ const t=setTimeout(onClose,3000); return ()=>clearTimeout(t); },[]);
  return (
    <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-white text-sm font-semibold ${type==='error'?'bg-red-600':'bg-gray-900'}`}>
      {type==='success'?<CheckCircle className="w-5 h-5 text-green-400"/>:<AlertTriangle className="w-5 h-5 text-red-300"/>}
      {message}
      <button onClick={onClose}><X className="w-4 h-4 opacity-60 hover:opacity-100"/></button>
    </div>
  );
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────
function ConfirmModal({ title, message, confirmLabel, danger, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-gray-600"/></button>
        </div>
        <p className="text-sm text-gray-500 mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={()=>{onConfirm();onClose();}} className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white ${danger?'bg-red-500 hover:bg-red-600':'bg-blue-700 hover:bg-blue-800'}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Doctor Detail Modal ──────────────────────────────────────────────────────
function DoctorDetailModal({ doctor, onClose }) {
  const regNo = doctor.registrationNo?.trim();
  const hasReg = regNo && regNo !== '—';

  const infoRows = [
    ['Email',       doctor.email],
    ['Phone',       doctor.phone       || '—'],
    ['Experience',  doctor.experience  || '—'],
    ['Hospital',    doctor.hospital    || '—'],
    ['Department',  doctor.department  || '—'],
    ['Degree',      doctor.degree      || '—'],
    ['Clinic',      doctor.clinic?.name|| '—'],
    ['Consult Fee', doctor.clinic?.fee      ? `₹${doctor.clinic.fee}`      : '—'],
    ['Video Fee',   doctor.clinic?.videoFee ? `₹${doctor.clinic.videoFee}` : '—'],
    ['Status',      doctor.status],
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            {doctor.photo
              ? <img src={doctor.photo} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-white/30"/>
              : <div className={`w-14 h-14 rounded-full ${avatarBg(doctor.name)} flex items-center justify-center text-white font-bold text-xl border-2 border-white/30`}>{initials(doctor.name)}</div>
            }
            <div>
              <h3 className="font-bold text-white text-lg">{doctor.name}</h3>
              <p className="text-blue-200 text-sm">{doctor.specialization}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X className="w-5 h-5"/></button>
        </div>

        <div className="overflow-y-auto">
          {/* ── Registration Number — prominent verification card ── */}
          <div className={`mx-6 mt-5 mb-4 rounded-xl p-4 border-2 flex items-center gap-4 ${hasReg ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${hasReg ? 'bg-green-600' : 'bg-red-400'}`}>
              {hasReg
                ? <CheckCircle className="w-5 h-5 text-white"/>
                : <AlertTriangle className="w-5 h-5 text-white"/>
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide mb-0.5 flex items-center gap-1.5">
                <span className={hasReg ? 'text-green-700' : 'text-red-600'}>Medical Registration Number</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${hasReg ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-700'}`}>
                  {hasReg ? 'PROVIDED' : 'MISSING'}
                </span>
              </p>
              <p className={`text-lg font-bold font-mono tracking-widest ${hasReg ? 'text-green-900' : 'text-red-500 italic text-sm'}`}>
                {hasReg ? regNo : 'Not provided at signup'}
              </p>
              {hasReg && (
                <p className="text-xs text-green-600 mt-0.5">Verify this number against the medical council registry before approving</p>
              )}
              {!hasReg && (
                <p className="text-xs text-red-500 mt-0.5">Doctor did not submit a registration number — verify manually before approving</p>
              )}
            </div>
          </div>

          {/* Other info grid */}
          <div className="px-6 pb-6 grid grid-cols-2 gap-3 text-sm">
            {infoRows.map(([label, val]) => (
              <div key={label} className="bg-gray-50 rounded-xl px-3 py-2.5">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
                <p className="font-semibold text-gray-800 capitalize truncate">{val}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Schedule Modal ───────────────────────────────────────────────────────────
function ScheduleModal({ doctor, onSave, onClose }) {
  const toDisplay = (schedule={}) => {
    const form={};
    DAYS.forEach(day=>{
      const d=schedule[day];
      if (!d?.open||!d.slots?.length){form[day]='Closed';return;}
      const s=d.slots[0];
      form[day]=s?.start&&s?.end?`${s.start} - ${s.end}`:'Closed';
    });
    return form;
  };
  const [form,setForm]=useState(toDisplay(doctor.schedule));
  const [saving,setSaving]=useState(false);

  const handleSave=async()=>{
    setSaving(true);
    const schedule={};
    DAYS.forEach(day=>{
      const val=form[day];
      if(!val||val==='Closed'){schedule[day]={open:false,slots:[]};return;}
      const parts=val.split('-').map(s=>s.trim());
      schedule[day]={open:true,slots:[{start:parts[0]||'09:00',end:parts[1]||'17:00'}]};
    });
    await onSave(doctor._id,schedule);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {doctor.photo?<img src={doctor.photo} className="w-10 h-10 rounded-full object-cover"/>:<div className={`w-10 h-10 rounded-full ${avatarBg(doctor.name)} flex items-center justify-center text-white font-bold text-sm`}>{initials(doctor.name)}</div>}
            <div><h3 className="font-bold text-gray-900 text-sm">{doctor.name}</h3><p className="text-xs text-gray-500">{doctor.specialization}</p></div>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-gray-600"/></button>
        </div>
        <div className="px-6 py-4 space-y-3">
          {DAYS.map(day=>(
            <div key={day} className="flex items-center gap-3">
              <span className="w-24 text-sm font-semibold text-gray-700 shrink-0">{day}</span>
              <div className="flex gap-2 flex-1">
                <input type="text" value={form[day]==='Closed'?'':form[day]} onChange={e=>setForm(p=>({...p,[day]:e.target.value}))}
                  placeholder="e.g. 09:00 - 17:00" disabled={form[day]==='Closed'}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 disabled:bg-gray-50 disabled:text-gray-400"/>
                <button onClick={()=>setForm(p=>({...p,[day]:p[day]==='Closed'?'09:00 - 17:00':'Closed'}))}
                  className={`px-3 py-2 rounded-xl text-xs font-bold ${form[day]==='Closed'?'bg-gray-200 text-gray-500 hover:bg-gray-300':'bg-red-50 text-red-600 hover:bg-red-100'}`}>
                  {form[day]==='Closed'?'Open':'Close'}
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 bg-blue-700 text-white rounded-xl text-sm font-bold hover:bg-blue-800 flex items-center justify-center gap-2 disabled:opacity-60">
            {saving?<Loader2 className="w-4 h-4 animate-spin"/>:<Save className="w-4 h-4"/>} Save Schedule
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Table skeleton ───────────────────────────────────────────────────────────
function TableSkeleton({ cols=7, rows=5 }) {
  return (
    <tbody>{Array(rows).fill(0).map((_,i)=>(
      <tr key={i} className="border-b border-gray-50">
        {Array(cols).fill(0).map((_,j)=>(
          <td key={j} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded-full animate-pulse" style={{width:`${50+Math.random()*40}%`}}/></td>
        ))}
      </tr>
    ))}</tbody>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState('');
  const [shake,    setShake]    = useState(false);

  // ← Change this to whatever password you want
  const ADMIN_PASSWORD = 'admin@123';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('adminAuth', '1');
      onLogin();
    } else {
      setError('Incorrect password');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transition-transform ${shake ? 'animate-bounce' : ''}`}>
        {/* Header */}
        <div className="bg-blue-700 px-6 py-6 text-center">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Shield className="w-6 h-6 text-white"/>
          </div>
          <h2 className="text-lg font-bold text-white">Admin Access</h2>
          <p className="text-blue-200 text-xs mt-1">Enter your password to continue</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
          <div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                placeholder="Password"
                autoFocus
                className={`w-full pl-10 pr-11 py-3 border rounded-xl text-sm outline-none transition
                  ${error ? 'border-red-400 focus:ring-2 focus:ring-red-100' : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'}`}
              />
              <button type="button" onClick={() => setShowPw(p => !p)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPw ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
              </button>
            </div>
            {error && (
              <p className="text-xs text-red-500 font-medium mt-1.5 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5"/> {error}
              </p>
            )}
          </div>

          <button type="submit"
            className="w-full py-3 bg-blue-700 hover:bg-blue-800 active:scale-[0.98] text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2">
            <Shield className="w-4 h-4"/> Enter
          </button>
        </form>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// MAIN ADMIN PORTAL (authenticated)
// ─────────────────────────────────────────────────────────────────────────────
function AdminDashboard({ onLogout }) {
  const [activeTab, setActiveTab]   = useState('doctors');
  const [search,    setSearch]      = useState('');
  const [doctors,   setDoctors]     = useState([]);
  const [patients,  setPatients]    = useState([]);
  const [appts,     setAppts]       = useState([]);
  const [stats,     setStats]       = useState(null);
  const [loading,   setLoading]     = useState({ doctors:true, patients:true, appts:true, stats:true });
  const [modal,     setModal]       = useState(null);
  const [toast,     setToast]       = useState(null);

  const showToast = (msg, type='success') => setToast({msg,type});

  const fetchStats    = useCallback(()=>{ api.get('/stats').then(r=>setStats(r.data)).catch(()=>{}).finally(()=>setLoading(p=>({...p,stats:false}))); },[]);
  const fetchDoctors  = useCallback(()=>{ setLoading(p=>({...p,doctors:true})); api.get('/doctors').then(r=>setDoctors(r.data||[])).catch(()=>showToast('Failed to load doctors','error')).finally(()=>setLoading(p=>({...p,doctors:false}))); },[]);
  const fetchPatients = useCallback(()=>{ setLoading(p=>({...p,patients:true})); api.get('/patients').then(r=>setPatients(r.data||[])).catch(()=>showToast('Failed to load patients','error')).finally(()=>setLoading(p=>({...p,patients:false}))); },[]);
  const fetchAppts    = useCallback(()=>{ setLoading(p=>({...p,appts:true})); api.get('/appointments').then(r=>setAppts(r.data||[])).catch(()=>showToast('Failed to load appointments','error')).finally(()=>setLoading(p=>({...p,appts:false}))); },[]);

  useEffect(()=>{ fetchStats(); fetchDoctors(); fetchPatients(); fetchAppts(); },[]);

  const changeStatus = async (id, status) => {
    try { const res=await api.put(`/doctors/${id}/status`,{status}); setDoctors(prev=>prev.map(d=>d._id===id?res.data:d)); fetchStats(); showToast(`Doctor ${status}`); }
    catch { showToast('Failed to update status','error'); }
  };
  const deleteDoctor  = async id => { try { await api.delete(`/doctors/${id}`);  setDoctors(prev=>prev.filter(d=>d._id!==id));  fetchStats(); showToast('Doctor removed'); }  catch { showToast('Failed','error'); } };
  const deletePatient = async id => { try { await api.delete(`/patients/${id}`); setPatients(prev=>prev.filter(p=>p._id!==id)); fetchStats(); showToast('Patient removed'); } catch { showToast('Failed','error'); } };
  const deleteAppt    = async id => { try { await api.delete(`/appointments/${id}`); setAppts(prev=>prev.filter(a=>a._id!==id)); fetchStats(); showToast('Appointment removed'); } catch { showToast('Failed','error'); } };
  const verifyRegNo   = async (id, verified) => {
    try { const res=await api.put(`/doctors/${id}/status`,{status: verified ? 'approved' : 'pending', regVerified: verified}); setDoctors(prev=>prev.map(d=>d._id===id?{...d,regVerified:verified}:d)); showToast(verified ? 'Registration verified ✓' : 'Verification removed'); }
    catch { showToast('Failed to update verification','error'); }
  };
  const saveSchedule  = async (doctorId, schedule) => {
    try { const res=await api.put(`/doctors/${doctorId}/schedule`,{schedule,slotDuration:30}); setDoctors(prev=>prev.map(d=>d._id===doctorId?res.data:d)); showToast('Schedule updated'); }
    catch { showToast('Failed to save schedule','error'); }
  };

  const handleLogout = () => { sessionStorage.removeItem('adminAuth'); onLogout(); };

  const q = search.toLowerCase();
  const filteredDoctors  = doctors.filter(d=>d.name?.toLowerCase().includes(q)||d.specialization?.toLowerCase().includes(q)||d.email?.toLowerCase().includes(q));
  const filteredPatients = patients.filter(p=>p.name?.toLowerCase().includes(q)||p.email?.toLowerCase().includes(q)||p.phone?.includes(q));
  const filteredAppts    = appts.filter(a=>a.doctorName?.toLowerCase().includes(q)||a.patientName?.toLowerCase().includes(q)||a.status?.includes(q));
  const pendingCount = doctors.filter(d=>d.status==='pending').length;
  const TABS = ['doctors','appointments','patients','schedules'];

  return (
    <div className="flex-1 overflow-auto bg-gray-50 min-h-screen">
      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200 px-8 py-5 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-700 rounded-xl flex items-center justify-center"><Shield className="w-5 h-5 text-white"/></div>
            <div><h1 className="text-xl font-bold text-gray-900">Admin Portal</h1><p className="text-gray-500 text-xs">Manage doctors, appointments and patients</p></div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={()=>{fetchStats();fetchDoctors();fetchPatients();fetchAppts();}} className="p-2 hover:bg-gray-100 rounded-xl" title="Refresh"><RefreshCw className="w-5 h-5 text-gray-600"/></button>
            <button className="relative p-2 hover:bg-gray-100 rounded-xl">
              <Bell className="w-5 h-5 text-gray-600"/>
              {pendingCount>0&&<span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"/>}
            </button>
            <button onClick={()=>setModal({type:'confirm',title:'Logout',message:'Are you sure you want to logout from the admin portal?',confirmLabel:'Logout',danger:false,onConfirm:handleLogout})}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-sm font-semibold text-gray-600 rounded-xl hover:bg-gray-50">
              <LogOut className="w-4 h-4"/> Logout
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-3 mb-5">
          {[
            {label:'Total Doctors',  value:stats?.totalDoctors,      icon:Stethoscope, bg:'bg-blue-50',   color:'text-blue-600'  },
            {label:'Appointments',   value:stats?.totalAppointments, icon:Calendar,    bg:'bg-violet-50', color:'text-violet-600'},
            {label:'Total Patients', value:stats?.totalPatients,     icon:Users,       bg:'bg-emerald-50',color:'text-emerald-600'},
            {label:'Pending Review', value:stats?.pendingDoctors,    icon:AlertTriangle,bg:'bg-amber-50',  color:'text-amber-600' },
            {label:"Today's Appts",  value:stats?.todayAppointments, icon:Clock,       bg:'bg-pink-50',   color:'text-pink-600'  },
          ].map(({label,value,icon:Icon,bg,color})=>(
            <div key={label} className="bg-gray-50 rounded-2xl p-4 flex items-center gap-3 border border-gray-100">
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center shrink-0`}><Icon className={`w-5 h-5 ${color}`}/></div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{value??<span className="w-8 h-5 bg-gray-200 rounded animate-pulse inline-block align-middle"/>}</p>
                <p className="text-xs text-gray-500 font-medium">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200">
          {TABS.map(tab=>(
            <button key={tab} onClick={()=>{setActiveTab(tab);setSearch('');}}
              className={`relative pb-3 px-5 text-sm font-semibold transition-colors capitalize ${activeTab===tab?'text-blue-700 border-b-2 border-blue-700':'text-gray-500 hover:text-gray-800'}`}>
              {tab}{tab==='doctors'&&pendingCount>0&&<span className="ml-1.5 text-xs bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded-full">{pendingCount}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="p-8">
        {/* Toolbar */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
            <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder={`Search ${activeTab}…`}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white transition"/>
          </div>
          <button className="px-4 py-2.5 border border-gray-200 bg-white rounded-xl hover:bg-gray-50 flex items-center gap-2 text-sm font-semibold text-gray-600">
            <Filter className="w-4 h-4"/> Filter
          </button>
        </div>

        {/* DOCTORS */}
        {activeTab==='doctors'&&(
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                {['Doctor','Specialty','Experience','Hospital','Fee','Status','Actions'].map(h=>(
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr></thead>
              {loading.doctors?<TableSkeleton cols={7}/>:(
                <tbody className="divide-y divide-gray-50">
                  {filteredDoctors.map(doc=>{
                    const s=DR_STATUS[doc.status]||DR_STATUS.pending;
                    return (
                      <tr key={doc._id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3 cursor-pointer" onClick={()=>setModal({type:'doctorDetail',doctor:doc})}>
                            {doc.photo?<img src={doc.photo} className="w-10 h-10 rounded-full object-cover border border-gray-100"/>:<div className={`w-10 h-10 rounded-full ${avatarBg(doc.name)} flex items-center justify-center text-white font-bold text-sm shrink-0`}>{initials(doc.name)}</div>}
                            <div><div className="flex items-center gap-1.5"><p className="font-semibold text-gray-900 text-sm hover:text-blue-600">{doc.name}</p>{doc.regVerified&&<span title="Registration Verified"><CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0"/></span>}</div><p className="text-xs text-gray-400">{doc.email}</p></div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600">{doc.specialization}</td>
                        <td className="px-5 py-4 text-sm text-gray-600">{doc.experience||'—'}</td>
                        <td className="px-5 py-4 text-sm text-gray-600 max-w-[130px] truncate">{doc.hospital||doc.clinic?.name||'—'}</td>
                        <td className="px-5 py-4 text-sm font-bold text-gray-800">{doc.clinic?.fee?`₹${doc.clinic.fee}`:'—'}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${s.bg} ${s.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}/>{s.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1">
                            {doc.status==='pending'&&<button onClick={()=>setModal({type:'confirm',title:'Approve Doctor',message:`Approve ${doc.name}?`,confirmLabel:'Approve',danger:false,onConfirm:()=>changeStatus(doc._id,'approved')})} className="flex items-center gap-1 px-2.5 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700"><CheckCircle className="w-3 h-3"/> Approve</button>}
                            {doc.status==='approved'&&<button onClick={()=>setModal({type:'confirm',title:'Reject Doctor',message:`Reject ${doc.name}?`,confirmLabel:'Reject',danger:true,onConfirm:()=>changeStatus(doc._id,'rejected')})} className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg hover:bg-amber-100"><Ban className="w-3 h-3"/> Reject</button>}
                            {doc.status==='rejected'&&<button onClick={()=>changeStatus(doc._id,'approved')} className="flex items-center gap-1 px-2.5 py-1.5 bg-green-50 text-green-700 text-xs font-bold rounded-lg hover:bg-green-100"><UserCheck className="w-3 h-3"/> Restore</button>}
                            <button onClick={()=>setModal({type:'confirm',title:'Delete Doctor',message:`Delete ${doc.name} permanently?`,confirmLabel:'Delete',danger:true,onConfirm:()=>deleteDoctor(doc._id)})} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-500"/></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              )}
            </table>
            {!loading.doctors&&filteredDoctors.length===0&&<div className="py-16 text-center text-gray-400"><Stethoscope className="w-10 h-10 mx-auto mb-2 opacity-40"/><p className="text-sm">No doctors found</p></div>}
          </div>
        )}

        {/* APPOINTMENTS */}
        {activeTab==='appointments'&&(
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                {['Patient','Doctor','Date & Time','Type','Fee','Status','Actions'].map(h=>(
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr></thead>
              {loading.appts?<TableSkeleton cols={7}/>:(
                <tbody className="divide-y divide-gray-50">
                  {filteredAppts.map(a=>{
                    const s=APT_STATUS[a.status]||{bg:'bg-gray-100',text:'text-gray-600'};
                    return (
                      <tr key={a._id} className="hover:bg-gray-50/70">
                        <td className="px-5 py-4"><div className="flex items-center gap-2"><div className={`w-8 h-8 rounded-full ${avatarBg(a.patientName||'')} flex items-center justify-center text-white font-bold text-xs shrink-0`}>{initials(a.patientName||'')}</div><p className="text-sm font-semibold text-gray-900">{a.patientName||'—'}</p></div></td>
                        <td className="px-5 py-4 text-sm text-gray-600">{a.doctorName||'—'}</td>
                        <td className="px-5 py-4"><p className="text-sm font-semibold text-gray-800">{fmtDate(a.date)}</p><p className="text-xs text-gray-400">{a.time}</p></td>
                        <td className="px-5 py-4"><span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg ${a.type==='video'?'bg-indigo-50 text-indigo-600':'bg-emerald-50 text-emerald-600'}`}>{a.type==='video'?<Video className="w-3 h-3"/>:<MapPin className="w-3 h-3"/>}{a.type==='video'?'Video':'In-person'}</span></td>
                        <td className="px-5 py-4 text-sm font-bold text-gray-800">{a.doctorFee?`₹${a.doctorFee}`:'—'}</td>
                        <td className="px-5 py-4"><span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${s.bg} ${s.text}`}>{a.status}</span></td>
                        <td className="px-5 py-4"><button onClick={()=>setModal({type:'confirm',title:'Delete Appointment',message:'Remove this appointment permanently?',confirmLabel:'Delete',danger:true,onConfirm:()=>deleteAppt(a._id)})} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-500"/></button></td>
                      </tr>
                    );
                  })}
                </tbody>
              )}
            </table>
            {!loading.appts&&filteredAppts.length===0&&<div className="py-16 text-center text-gray-400"><Calendar className="w-10 h-10 mx-auto mb-2 opacity-40"/><p className="text-sm">No appointments found</p></div>}
          </div>
        )}

        {/* PATIENTS */}
        {activeTab==='patients'&&(
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                {['Patient','Contact','Gender','Blood Group','Conditions','Allergies','Actions'].map(h=>(
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr></thead>
              {loading.patients?<TableSkeleton cols={7}/>:(
                <tbody className="divide-y divide-gray-50">
                  {filteredPatients.map(p=>(
                    <tr key={p._id} className="hover:bg-gray-50/70">
                      <td className="px-5 py-4"><div className="flex items-center gap-3">{p.photo?<img src={p.photo} className="w-9 h-9 rounded-full object-cover"/>:<div className={`w-9 h-9 rounded-full ${avatarBg(p.name||'')} flex items-center justify-center text-white font-bold text-xs shrink-0`}>{initials(p.name||'')}</div>}<div><p className="font-semibold text-gray-900 text-sm">{p.name||'—'}</p><p className="text-xs text-gray-400">{p.dob||''}{p.gender?` · ${p.gender}`:''}</p></div></div></td>
                      <td className="px-5 py-4"><p className="text-sm text-gray-600">{p.email||'—'}</p><p className="text-xs text-gray-400">{p.phone||''}</p></td>
                      <td className="px-5 py-4 text-sm text-gray-600 capitalize">{p.gender||'—'}</td>
                      <td className="px-5 py-4">{p.bloodGroup?<span className="text-xs font-bold px-2 py-1 bg-red-50 text-red-600 rounded-lg">{p.bloodGroup}</span>:<span className="text-gray-400 text-sm">—</span>}</td>
                      <td className="px-5 py-4">{p.conditions?.length>0?<div className="flex flex-wrap gap-1">{p.conditions.slice(0,2).map(c=><span key={c} className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full font-medium">{c}</span>)}{p.conditions.length>2&&<span className="text-xs text-gray-400">+{p.conditions.length-2}</span>}</div>:<span className="text-gray-400 text-sm">—</span>}</td>
                      <td className="px-5 py-4">{p.allergies?.length>0?<div className="flex flex-wrap gap-1">{p.allergies.slice(0,2).map(a=><span key={a} className="text-xs bg-pink-50 text-pink-700 px-2 py-0.5 rounded-full font-medium">{a}</span>)}{p.allergies.length>2&&<span className="text-xs text-gray-400">+{p.allergies.length-2}</span>}</div>:<span className="text-gray-400 text-sm">—</span>}</td>
                      <td className="px-5 py-4"><button onClick={()=>setModal({type:'confirm',title:'Delete Patient',message:`Remove ${p.name}?`,confirmLabel:'Delete',danger:true,onConfirm:()=>deletePatient(p._id)})} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-500"/></button></td>
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
            {!loading.patients&&filteredPatients.length===0&&<div className="py-16 text-center text-gray-400"><Users className="w-10 h-10 mx-auto mb-2 opacity-40"/><p className="text-sm">No patients found</p></div>}
          </div>
        )}

        {/* SCHEDULES */}
        {activeTab==='schedules'&&(
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {loading.doctors
              ?Array(6).fill(0).map((_,i)=><div key={i} className="bg-white rounded-2xl border border-gray-100 h-64 animate-pulse"/>)
              :doctors.filter(d=>d.status==='approved').map(doc=>{
                const sch=doc.schedule||{};
                const openDays=DAYS.filter(day=>sch[day]?.open).length;
                return (
                  <div key={doc._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 p-5 border-b border-gray-100">
                      {doc.photo?<img src={doc.photo} className="w-12 h-12 rounded-full object-cover border border-gray-100 shrink-0"/>:<div className={`w-12 h-12 rounded-full ${avatarBg(doc.name)} flex items-center justify-center text-white font-bold shrink-0`}>{initials(doc.name)}</div>}
                      <div className="flex-1 min-w-0"><h3 className="font-bold text-gray-900 text-sm truncate">{doc.name}</h3><p className="text-xs text-gray-500">{doc.specialization}</p></div>
                      <span className="shrink-0 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">{openDays}d/wk</span>
                    </div>
                    <div className="px-5 py-3">
                      {DAYS.map(day=>{
                        const d=sch[day];
                        const isOpen=d?.open&&d.slots?.length>0;
                        const timeStr=isOpen?(d.slots[0]?.start&&d.slots[0]?.end?`${d.slots[0].start} – ${d.slots[0].end}`:'Open'):'Closed';
                        return (
                          <div key={day} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                            <span className={`text-xs font-semibold w-20 ${isOpen?'text-gray-700':'text-gray-400'}`}>{day}</span>
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${isOpen?'bg-blue-50 text-blue-700':'bg-gray-100 text-gray-400'}`}>{timeStr}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="px-5 pb-5">
                      <button onClick={()=>setModal({type:'schedule',doctor:doc})} className="w-full py-2.5 border border-blue-700 text-blue-700 rounded-xl hover:bg-blue-50 text-sm font-bold flex items-center justify-center gap-2">
                        <Clock className="w-4 h-4"/> Edit Schedule
                      </button>
                    </div>
                  </div>
                );
              })
            }
            {!loading.doctors&&doctors.filter(d=>d.status==='approved').length===0&&(
              <div className="col-span-3 py-16 text-center text-gray-400"><Clock className="w-10 h-10 mx-auto mb-2 opacity-40"/><p className="text-sm">No approved doctors yet</p></div>
            )}
          </div>
        )}
      </div>

      {modal?.type==='confirm'&&<ConfirmModal {...modal} onClose={()=>setModal(null)}/>}
      {modal?.type==='schedule'&&<ScheduleModal doctor={modal.doctor} onSave={saveSchedule} onClose={()=>setModal(null)}/>}
      {modal?.type==='doctorDetail'&&<DoctorDetailModal doctor={modal.doctor} onVerify={verifyRegNo} onClose={()=>setModal(null)}/>}
      {toast&&<Toast message={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT EXPORT — handles auth state
// ─────────────────────────────────────────────────────────────────────────────
export function AdminPortal() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('adminAuth') === '1');

  return (
    <>
      {!authed && <AdminLogin onLogin={() => setAuthed(true)} />}
      {authed  && <AdminDashboard onLogout={() => { sessionStorage.removeItem('adminAuth'); setAuthed(false); }} />}
    </>
  );
}