import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Bell, ChevronDown, Calendar, Clock, Users, Star,
  Video, MapPin, CheckCircle, TrendingUp, Activity,
  IndianRupee, ChevronRight, MoreVertical, FileText,
  XCircle, ArrowUpRight, Stethoscope, Loader2, X,
  AlertTriangle, Save, Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ─── API ──────────────────────────────────────────────────────────────────────
const BASE_URL = 'https://nhbackend.onrender.com';
const api = axios.create({ baseURL: `${BASE_URL}/api` });
const getDoctorId   = () => localStorage.getItem('doctorId');
const getDoctorName = () => localStorage.getItem('doctorName') || 'Doctor';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const AVATAR_COLORS = ['bg-indigo-500','bg-pink-500','bg-amber-500','bg-emerald-500','bg-violet-500','bg-cyan-500','bg-rose-500','bg-teal-500','bg-orange-500','bg-blue-500'];
function avatarBg(name='') { let s=0; for(const c of name) s+=c.charCodeAt(0); return AVATAR_COLORS[s%AVATAR_COLORS.length]; }
function initials(name='') { return name.split(' ').filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join(''); }
function fmtINR(n) {
  if (!n) return '₹0';
  if (n>=100000) return `₹${(n/100000).toFixed(1)}L`;
  if (n>=1000)   return `₹${(n/1000).toFixed(1)}K`;
  return `₹${n}`;
}
function fmtDate(d) {
  if (!d) return '—';
  const [y,mo,day] = d.split('-').map(Number);
  return new Date(y,mo-1,day).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
}
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning 👋';
  if (h < 17) return 'Good Afternoon 👋';
  return 'Good Evening 👋';
}

const APPT_STATUS = {
  completed: { label:'Done',      bg:'bg-green-100', text:'text-green-700', dot:'bg-green-500' },
  confirmed: { label:'Upcoming',  bg:'bg-gray-100',  text:'text-gray-600',  dot:'bg-gray-400'  },
  pending:   { label:'Pending',   bg:'bg-amber-100', text:'text-amber-700', dot:'bg-amber-400'  },
  cancelled: { label:'Cancelled', bg:'bg-red-100',   text:'text-red-600',   dot:'bg-red-400'   },
  missed:    { label:'Missed',    bg:'bg-orange-100',text:'text-orange-600', dot:'bg-orange-400'},
};

// ─── Leave Modal (Set Unavailability) ─────────────────────────────────────────
function LeaveModal({ onClose, onSaved }) {
  const [form, setForm]   = useState({ from:'', to:'', reason:'', type:'personal' });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const handleSave = async () => {
    if (!form.from || !form.to) { setError('Please select from and to dates'); return; }
    if (form.from > form.to)    { setError('From date must be before to date'); return; }
    setSaving(true);
    try {
      await api.post(`/doctor/schedule/${getDoctorId()}/leave`, form);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save leave');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Set Unavailability</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-gray-600"/></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">From</label>
              <input type="date" value={form.from} onChange={e=>setForm(p=>({...p,from:e.target.value}))}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">To</label>
              <input type="date" value={form.to} onChange={e=>setForm(p=>({...p,to:e.target.value}))}
                min={form.from || new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"/>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Type</label>
            <select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 bg-white">
              {['personal','medical','conference','vacation','other'].map(t=><option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Reason (optional)</label>
            <input type="text" value={form.reason} onChange={e=>setForm(p=>({...p,reason:e.target.value}))}
              placeholder="e.g. Medical conference"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"/>
          </div>
          {error && <p className="text-xs text-red-500 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5"/>{error}</p>}
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 bg-blue-700 text-white rounded-xl text-sm font-bold hover:bg-blue-800 flex items-center justify-center gap-2 disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} Save Leave
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Note Modal ───────────────────────────────────────────────────────────────
function NoteModal({ todayAppts, onClose }) {
  const [selectedAppt, setSelected] = useState('');
  const [note, setNote]             = useState('');
  const [saving, setSaving]         = useState(false);
  const [done, setDone]             = useState(false);

  const apptOptions = todayAppts.filter(a => a.status === 'completed' || a.status === 'confirmed');

  const handleSave = async () => {
    if (!selectedAppt || !note.trim()) return;
    setSaving(true);
    try {
      await api.put(`/appointments/${selectedAppt}/notes`, { notes: note });
      setDone(true);
      setTimeout(onClose, 1200);
    } catch { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Add Patient Note</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-gray-600"/></button>
        </div>
        {done ? (
          <div className="px-6 py-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3"/>
            <p className="font-bold text-gray-900">Note saved!</p>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Select Appointment</label>
              <select value={selectedAppt} onChange={e=>setSelected(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 bg-white">
                <option value="">-- Select patient --</option>
                {apptOptions.map(a=><option key={a._id} value={a._id}>{a.patientName} · {a.time}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Note</label>
              <textarea value={note} onChange={e=>setNote(e.target.value)} rows={4}
                placeholder="Write clinical notes here…"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none"/>
            </div>
          </div>
        )}
        {!done && (
          <div className="flex gap-3 px-6 pb-5">
            <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
            <button onClick={handleSave} disabled={saving||!selectedAppt||!note.trim()} className="flex-1 py-2.5 bg-blue-700 text-white rounded-xl text-sm font-bold hover:bg-blue-800 flex items-center justify-center gap-2 disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} Save Note
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function DoctorDashboard() {
  const navigate = useNavigate();
  const [profile,  setProfile]  = useState(null);
  const [stats,    setStats]    = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(null); // 'leave' | 'note'

  const doctorId = getDoctorId();

  const fetchAll = useCallback(async () => {
    if (!doctorId) { setLoading(false); return; }
    setLoading(true);
    const [profileRes, statsRes, patientsRes] = await Promise.allSettled([
      api.get(`/doctor/profile/${doctorId}`),
      api.get(`/appointments/doctor/${doctorId}/stats`),
      api.get(`/appointments/doctor/${doctorId}/patients`),
    ]);
    if (profileRes.status  === 'fulfilled') setProfile(profileRes.value.data);
    else console.error('Profile fetch failed:', profileRes.reason?.response?.data || profileRes.reason);
    if (statsRes.status    === 'fulfilled') setStats(statsRes.value.data);
    else console.error('Stats fetch failed:', statsRes.reason?.response?.data || statsRes.reason);
    if (patientsRes.status === 'fulfilled') setPatients(patientsRes.value.data || []);
    else console.error('Patients fetch failed:', patientsRes.reason?.response?.data || patientsRes.reason);
    setLoading(false);
  }, [doctorId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const name         = profile?.personal?.name        || getDoctorName();
  const specialty    = profile?.professional?.specialty || '';
  const hospital     = profile?.professional?.hospital  || '';
  const experience   = profile?.professional?.experience || '';
  const photo        = profile?.personal?.photo;
  const photoSrc     = photo ? (photo.startsWith('data:') || photo.startsWith('http') ? photo : `data:image/jpeg;base64,${photoSrc}`) : null;
  const doctorInitials = profile?.personal?.initials || initials(name);

  const todayAppts   = stats?.today?.appointments || [];
  const weeklyStats  = stats?.weekly?.stats       || [];
  const maxCount     = Math.max(...(weeklyStats.map(d=>d.count)||[0]), 1);

  const completed    = stats?.today?.completed || 0;
  const upcoming     = stats?.today?.upcoming  || 0;
  const totalToday   = stats?.today?.total     || 0;

  // Find ongoing — confirmed appt whose time window is now
  const nowHHMM = (() => { const d=new Date(); return d.getHours()*60+d.getMinutes(); })();
  const ongoingAppt = todayAppts.find(a => {
    if (a.status !== 'confirmed') return false;
    const [t,mod] = a.time.split(' ');
    const [h,m]   = t.split(':').map(Number);
    const mins    = (mod==='PM'&&h!==12?h+12:h===12&&mod==='AM'?0:h)*60+m;
    return nowHHMM >= mins-5 && nowHHMM <= mins+45;
  });

  // Next upcoming appointment
  const nextAppt = todayAppts
    .filter(a=>a.status==='pending'||a.status==='confirmed')
    .sort((a,b)=>a.time.localeCompare(b.time))[0];

  const QUICK_ACTIONS = [
    { label:'Write Prescription',  icon:FileText,    bg:'bg-blue-50',   text:'text-blue-600',   action:()=>navigate('/doctor/prescriptions') },
    { label:'Add Patient Note',    icon:Activity,    bg:'bg-purple-50', text:'text-purple-600', action:()=>setModal('note')                   },
    { label:'Set Unavailability',  icon:XCircle,     bg:'bg-red-50',    text:'text-red-500',    action:()=>setModal('leave')                  },
    { label:'View Analytics',      icon:TrendingUp,  bg:'bg-teal-50',   text:'text-teal-600',   action:()=>navigate('/doctor/appointments')   },
    { label:'Manage Schedule',     icon:Clock,       bg:'bg-amber-50',  text:'text-amber-600',  action:()=>navigate('/doctor/schedule')       },
  ];

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin"/>
        <p className="text-gray-500 text-sm font-medium">Loading dashboard…</p>
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-auto bg-gray-50">

      {/* ── Top Bar ── */}
      <header className="bg-white border-b border-gray-200 px-8 py-[15px] flex items-center justify-between sticky top-0 z-10">
        <div>
          <p className="text-gray-500 text-sm">{getGreeting()}</p>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">{name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <Bell className="w-5 h-5 text-gray-600"/>
            {upcoming > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"/>}
          </button>
          {/* Avatar → profile */}
          <button onClick={()=>navigate('/doctor/profile')} className="flex items-center gap-2 pl-3 border-l border-gray-200 hover:opacity-80 transition-opacity">
            {photoSrc
              ? <img src={photoSrc} className="w-9 h-9 rounded-full object-cover border border-gray-200"/>
              : <div className={`w-9 h-9 ${avatarBg(name)} rounded-full flex items-center justify-center text-white font-bold text-sm`}>{doctorInitials}</div>
            }
            <div className="text-left">
              <p className="text-sm font-bold text-gray-800 leading-tight">{name}</p>
              <p className="text-xs text-gray-400">{specialty}</p>
            </div>
          </button>
        </div>
      </header>

      <div className="p-8 space-y-6">

        {/* ── Hero Banner ── */}
        <div className="bg-gradient-to-br from-blue-700 to-blue-600 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10"
            style={{backgroundImage:'radial-gradient(circle, white 1px, transparent 1px)',backgroundSize:'28px 28px'}}/>
          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Doctor photo */}
              {photoSrc
                ? <img src={photoSrc} className="w-16 h-16 rounded-2xl object-cover border-2 border-white/30 shadow-lg shrink-0"/>
                : <div className={`w-16 h-16 rounded-2xl ${avatarBg(name)} flex items-center justify-center text-white font-bold text-xl border-2 border-white/20 shrink-0`}>{doctorInitials}</div>
              }
              <div>
                <h2 className="text-lg font-bold text-white leading-tight">{name}</h2>
                <p className="text-blue-200 text-sm mb-2">{specialty}{hospital?` · ${hospital}`:''}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {stats?.rating?.avg > 0 && (
                    <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1">
                      <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300"/>
                      <span className="text-sm font-bold">{stats.rating.avg}</span>
                      <span className="text-xs text-blue-200">({stats.rating.count} reviews)</span>
                    </div>
                  )}
                  {experience && (
                    <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1">
                      <Stethoscope className="w-3.5 h-3.5 text-blue-200"/>
                      <span className="text-xs font-semibold">{experience} experience</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-blue-300 text-xs font-semibold uppercase tracking-wider mb-1">Today</p>
              <p className="text-5xl font-bold">{totalToday}</p>
              <p className="text-blue-300 text-sm">appointments</p>
            </div>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label:"Today's Patients", value:totalToday,                    icon:Users,       bg:'bg-blue-50',   color:'text-blue-600',   trend: ongoingAppt ? '1 in progress' : 'No active session' },
            { label:'Completed',        value:completed,                     icon:CheckCircle, bg:'bg-green-50',  color:'text-green-600',  trend:'So far today'                    },
            { label:'Upcoming',         value:upcoming,                      icon:Clock,       bg:'bg-amber-50',  color:'text-amber-600',  trend:nextAppt?`Next at ${nextAppt.time}`:'No upcoming today' },
            { label:'This Month',       value:stats?.monthly?.total || 0,    icon:TrendingUp,  bg:'bg-violet-50', color:'text-violet-600', trend:`${fmtINR(stats?.monthly?.earnings)} earned` },
          ].map(({label,value,icon:Icon,bg,color,trend})=>(
            <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}><Icon className={`w-5 h-5 ${color}`}/></div>
                <ArrowUpRight className="w-4 h-4 text-gray-300"/>
              </div>
              <p className="text-3xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 font-medium mt-0.5">{label}</p>
              <p className="text-xs text-blue-600 font-semibold mt-1.5">{trend}</p>
            </div>
          ))}
        </div>

        {/* ── Schedule + Right Column ── */}
        <div className="grid grid-cols-3 gap-6">

          {/* Today's Schedule */}
          <div className="col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600"/> Today's Schedule
              </h3>
              <button onClick={()=>navigate('/doctor/appointments')}
                className="text-blue-600 text-sm font-semibold hover:underline flex items-center gap-1">
                Full schedule <ChevronRight className="w-4 h-4"/>
              </button>
            </div>

            {todayAppts.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-40"/>
                <p className="text-sm font-medium">No appointments today</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {todayAppts.map(appt => {
                  const s = APPT_STATUS[appt.status] || APPT_STATUS.pending;
                  const isLive = ongoingAppt?._id === appt._id;
                  return (
                    <div key={appt._id}
                      className={`flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50/60 transition-colors ${isLive?'bg-blue-50/40':''}`}>
                      {/* Time */}
                      <div className="w-16 shrink-0 text-center">
                        <p className="text-xs font-bold text-gray-700">{appt.time?.split(' ')[0]}</p>
                        <p className="text-xs text-gray-400">{appt.time?.split(' ')[1]}</p>
                      </div>
                      {/* Dot + line */}
                      <div className="flex flex-col items-center gap-0.5 shrink-0">
                        <div className={`w-2.5 h-2.5 rounded-full ${s.dot}`}/>
                        <div className="w-px h-4 bg-gray-200"/>
                      </div>
                      {/* Avatar */}
                      <div className={`w-9 h-9 ${avatarBg(appt.patientName||'')} rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0`}>
                        {initials(appt.patientName||'')}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{appt.patientName}</p>
                        <p className="text-xs text-gray-500 truncate">{appt.reason||'Consultation'}{appt.patientAge?` · ${appt.patientAge}y`:''}</p>
                      </div>
                      {/* Type badge */}
                      <span className={`shrink-0 flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${appt.type==='video'?'bg-indigo-50 text-indigo-600':'bg-emerald-50 text-emerald-600'}`}>
                        {appt.type==='video'?<Video className="w-3 h-3"/>:<MapPin className="w-3 h-3"/>}
                        {appt.type==='video'?'Video':'Visit'}
                      </span>
                      {/* Status badge */}
                      <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>{s.label}</span>
                      {/* Action */}
                      {isLive && appt.type==='video' && (
                        <button onClick={()=>navigate('/doctor/appointments')}
                          className="shrink-0 px-3 py-1.5 bg-blue-700 text-white text-xs font-bold rounded-lg hover:bg-blue-800">
                          Join
                        </button>
                      )}
                      {(appt.status==='pending'||appt.status==='confirmed') && !isLive && (
                        <button onClick={()=>navigate('/doctor/appointments')}
                          className="shrink-0 p-1.5 hover:bg-gray-100 rounded-lg">
                          <MoreVertical className="w-4 h-4 text-gray-400"/>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Chart + Earnings */}
          <div className="flex flex-col gap-5">

            {/* Weekly Bar Chart */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-600"/> This Week
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">{stats?.weekly?.total || 0} total appointments</p>
                </div>
              </div>
              <div className="flex items-end gap-2 h-20">
                {weeklyStats.length > 0 ? weeklyStats.map(({ day, count }, i) => {
                  const isToday = i === (new Date().getDay() + 6) % 7;
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center gap-1.5">
                      <div className="w-full flex items-end justify-center" style={{height:'64px'}}>
                        <div className={`w-full rounded-t-lg transition-all ${isToday?'bg-blue-700':'bg-gray-100 hover:bg-blue-200'}`}
                          style={{height: count===0?'3px':`${(count/maxCount)*64}px`}}/>
                      </div>
                      <p className="text-xs text-gray-400">{day}</p>
                    </div>
                  );
                }) : (
                  <div className="flex-1 flex items-center justify-center text-gray-300 text-xs">No data</div>
                )}
              </div>
            </div>

            {/* Earnings */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 mb-4">
                <IndianRupee className="w-4 h-4 text-blue-600"/> Earnings
              </h3>
              <div className="space-y-2">
                {[
                  { label:'Today',      value: fmtINR(stats?.today?.earnings),   highlight:false },
                  { label:'This Week',  value: fmtINR(stats?.weekly?.earnings),  highlight:false },
                  { label:'This Month', value: fmtINR(stats?.monthly?.earnings), highlight:true  },
                ].map(({label,value,highlight})=>(
                  <div key={label} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                    <p className="text-xs text-gray-500 font-medium">{label}</p>
                    <p className={`text-sm font-bold ${highlight?'text-blue-700':'text-gray-900'}`}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Recent Patients + Quick Actions ── */}
        <div className="grid grid-cols-3 gap-6">

          {/* Recent Patients */}
          <div className="col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600"/> Recent Patients
              </h3>
              <button onClick={()=>navigate('/doctor/patients')}
                className="text-blue-600 text-sm font-semibold hover:underline flex items-center gap-1">
                All patients <ChevronRight className="w-4 h-4"/>
              </button>
            </div>
            {patients.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-40"/>
                <p className="text-sm">No patients yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {patients.slice(0,5).map(p => (
                  <div key={String(p.patientId)} onClick={()=>navigate('/doctor/patients')}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/60 transition-colors cursor-pointer group">
                    {p.photo
                      ? <img src={p.photo.startsWith('data:')||p.photo.startsWith('http') ? p.photo : `data:image/jpeg;base64,${p.photo}`} className="w-11 h-11 rounded-full object-cover shrink-0"/>
                      : <div className={`w-11 h-11 ${avatarBg(p.name||'')} rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0`}>{initials(p.name||'')}</div>
                    }
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm">{p.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{p.condition||'—'} · {p.age?`${p.age} yrs`:'—'}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-400 font-medium">Last visit</p>
                      <p className="text-xs font-bold text-gray-700 mt-0.5">{fmtDate(p.lastVisit)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-400 font-medium">Visits</p>
                      <p className="text-sm font-bold text-blue-700">{p.visits}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0"/>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 text-sm mb-4">Quick Actions</h3>
            <div className="space-y-2.5">
              {QUICK_ACTIONS.map(({label,icon:Icon,bg,text,action})=>(
                <button key={label} onClick={action}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 border border-gray-100 hover:border-gray-200 transition-colors text-left group">
                  <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center shrink-0`}>
                    <Icon className={`w-4 h-4 ${text}`}/>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">{label}</span>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 ml-auto transition-colors"/>
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ── Modals ── */}
      {modal==='leave' && <LeaveModal onClose={()=>setModal(null)} onSaved={fetchAll}/>}
      {modal==='note'  && <NoteModal  todayAppts={todayAppts} onClose={()=>setModal(null)}/>}
    </div>
  );
}