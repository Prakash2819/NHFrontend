import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import {
  Bell, Search, Calendar, Clock, CheckCircle, X, Timer,
  Video, Building2, Filter, RefreshCw, User, Phone,
  FileText, ChevronDown, AlertTriangle, RotateCcw,
  Star, Download, NotepadText, History, Repeat2,
  MessageSquare, ChevronRight, Eye
} from 'lucide-react';
import { VideoCallRoom, getCallStatus } from './VideoCallRoom';

const BASE_URL = 'https://nhbackend.onrender.com';

// ── Frontend time helper ──────────────────────────────────────────────────────
function addMinsToTime(timeStr, mins) {
  if (!timeStr || !mins) return timeStr;
  const m = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return timeStr;
  let [, h, min, mer] = m; h = +h; min = +min;
  if (mer.toUpperCase() === 'PM' && h !== 12) h += 12;
  if (mer.toUpperCase() === 'AM' && h === 12) h = 0;
  let total = h * 60 + min + mins;
  let nh = Math.floor(total / 60) % 24, nm = total % 60;
  const nmer = nh >= 12 ? 'PM' : 'AM';
  if (nh > 12) nh -= 12; if (nh === 0) nh = 12;
  return `${String(nh).padStart(2,'0')}:${String(nm).padStart(2,'0')} ${nmer}`;
}
const api = axios.create({ baseURL: `${BASE_URL}/api` });
const getDoctorId = () => localStorage.getItem('doctorId');

const AVATAR_COLORS = [
  'bg-indigo-500','bg-pink-500','bg-amber-500','bg-emerald-500',
  'bg-violet-500','bg-cyan-500','bg-rose-500','bg-teal-500',
];
function avatarColor(name = '') {
  let sum = 0;
  for (const c of name) sum += c.charCodeAt(0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

// ── Photo helper (same as DoctorDashboard) ────────────────────────────────────
function photoSrc(p) {
  if (!p || typeof p !== 'string' || p.trim() === '') return null;
  if (p.startsWith('data:') || p.startsWith('http') || p.startsWith('//')) return p;
  return `data:image/jpeg;base64,${p}`;
}

function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}
function formatDateLong(d) {
  const [y, mo, day] = d.split('-').map(Number);
  return new Date(y, mo - 1, day).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}
function isToday(dateStr) {
  return dateStr === new Date().toISOString().split('T')[0];
}
function isTomorrow(dateStr) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return dateStr === tomorrow.toISOString().split('T')[0];
}
function dayLabel(dateStr) {
  if (isToday(dateStr))    return 'Today';
  if (isTomorrow(dateStr)) return 'Tomorrow';
  return formatDateLong(dateStr);
}

const STATUS_STYLES = {
  pending:   { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  dot: 'bg-amber-400',  label: 'Pending'   },
  confirmed: { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  dot: 'bg-green-500',  label: 'Confirmed' },
  completed: { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   dot: 'bg-blue-500',   label: 'Completed' },
  cancelled: { bg: 'bg-gray-50',   text: 'text-gray-400',   border: 'border-gray-200',   dot: 'bg-gray-300',   label: 'Cancelled' },
  missed:    { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-400', label: 'Missed'    },
};

// Toast
function Toast({ message, type = 'success', onClose }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-white ${type === 'error' ? 'bg-red-600' : 'bg-gray-900'}`}>
      <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
      <p className="text-sm font-semibold">{message}</p>
      <button onClick={onClose}><X className="w-4 h-4 opacity-60 hover:opacity-100" /></button>
    </div>
  );
}

// Complete Modal
function CompleteModal({ appt, onClose, onConfirm, saving }) {
  const [notes, setNotes] = useState(appt.notes || '');
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-900">Complete Appointment</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-5">
          <div className={`w-10 h-10 ${avatarColor(appt.patientName)} rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0`}>
            {initials(appt.patientName)}
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">{appt.patientName}</p>
            <p className="text-xs text-gray-500">{appt.time} · {appt.type === 'video' ? 'Video' : 'In-person'}</p>
          </div>
        </div>
        <div className="mb-5">
          <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
            <NotepadText className="w-4 h-4 text-blue-500" /> Doctor Notes <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4}
            placeholder="Diagnosis, prescriptions, follow-up instructions..."
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none transition" />
          <p className="text-xs text-gray-400 mt-1">These notes will be visible to the patient.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={() => onConfirm(appt._id, notes)} disabled={saving}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Mark as Completed'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Patient History Modal
function PatientHistoryModal({ appt, doctorId, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get(`/appointments/doctor/${doctorId}/patient/${appt.patientId}/history`)
      .then(res => setHistory(res.data || []))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, []);
  const past = history.filter(h => h._id !== appt._id);
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-gray-900">Visit History</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 ${avatarColor(appt.patientName)} rounded-full flex items-center justify-center text-white font-bold text-sm`}>
              {initials(appt.patientName)}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-none">{appt.patientName}</p>
              {appt.patientAge && <p className="text-xs text-gray-400 mt-0.5">{appt.patientAge} yrs</p>}
            </div>
            <button onClick={onClose} className="ml-2 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : past.length === 0 ? (
            <div className="text-center py-10">
              <History className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-500 font-semibold">No previous visits</p>
              <p className="text-xs text-gray-400 mt-1">This is the patient's first appointment with you</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">{past.length} previous visit{past.length > 1 ? 's' : ''}</p>
              {past.map(h => {
                const s = STATUS_STYLES[h.status] || STATUS_STYLES.pending;
                return (
                  <div key={h._id} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <p className="text-sm font-bold text-gray-800">{formatDateLong(h.date)}</p>
                        <p className="text-xs text-gray-400">{h.time} · {h.type === 'video' ? 'Video' : 'In-person'}</p>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>{s.label}</span>
                    </div>
                    {h.reason && <p className="text-xs text-gray-600 italic mb-1.5">"{h.reason}"</p>}
                    {h.notes && (
                      <div className="bg-blue-50 rounded-lg px-3 py-2 mt-2">
                        <p className="text-xs font-bold text-blue-600 mb-0.5">Notes</p>
                        <p className="text-xs text-blue-700">{h.notes}</p>
                      </div>
                    )}
                    {h.rating && (
                      <div className="flex items-center gap-1 mt-2">
                        {[1,2,3,4,5].map(n => (
                          <Star key={n} className={`w-3 h-3 ${n <= h.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                        ))}
                        {h.review && <span className="text-xs text-gray-400 ml-1 italic">"{h.review}"</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Notes Drawer
function NotesDrawer({ appt, onSave, saving }) {
  const [text, setText] = useState(appt.notes || '');
  const changed = text !== (appt.notes || '');
  return (
    <div className="px-5 pb-4 pt-3">
      <label className="text-xs font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1.5 mb-2">
        <NotepadText className="w-3.5 h-3.5" /> Doctor Notes
      </label>
      <textarea value={text} onChange={e => setText(e.target.value)} rows={3}
        placeholder="Add diagnosis, prescriptions, follow-up instructions..."
        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none transition bg-gray-50" />
      {changed && (
        <div className="flex justify-end mt-2">
          <button onClick={() => onSave(appt._id, text)} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors">
            {saving ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
            {saving ? 'Saving...' : 'Save Notes'}
          </button>
        </div>
      )}
    </div>
  );
}

// Appointment Card
function AppointmentCard({ appt, onUpdate, updating, onComplete, onCompleteEarly, onViewHistory, onSaveNotes, savingNotes, onStartCall }) {
  const [expanded,  setExpanded]  = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const color    = avatarColor(appt.patientName);
  const ini      = initials(appt.patientName);
  const s        = STATUS_STYLES[appt.status] || STATUS_STYLES.pending;
  const isDone   = appt.status === 'cancelled' || appt.status === 'completed';
  const isMissed = appt.status === 'missed';

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-200
      ${isMissed ? 'border-orange-200 ring-1 ring-orange-100'
        : expanded ? 'border-blue-200 shadow-md'
        : 'border-gray-100 hover:border-gray-200 hover:shadow-md'}`}>

      {isMissed && (
        <div className="bg-orange-400 text-white text-xs font-bold px-4 py-1 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5" /> Patient missed this appointment
        </div>
      )}

      {/* Main row */}
      <div className="flex items-start gap-4 p-5">
        {photoSrc(appt.patientPhoto)
          ? <img src={photoSrc(appt.patientPhoto)} className="w-12 h-12 rounded-full object-cover shrink-0 mt-0.5 border border-gray-100"/>
          : <div className={`w-12 h-12 ${color} rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 mt-0.5`}>{ini}</div>
        }

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-bold text-gray-900 text-sm">{appt.patientName || 'Unknown Patient'}</p>
              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                {appt.patientPhone && (
                  <span className="flex items-center gap-1 text-xs text-gray-400"><Phone className="w-3 h-3" /> {appt.patientPhone}</span>
                )}
                {appt.patientAge && (
                  <span className="flex items-center gap-1 text-xs text-gray-400"><User className="w-3 h-3" /> {appt.patientAge} yrs</span>
                )}
              </div>
            </div>
            <span className={`shrink-0 flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${s.bg} ${s.text} ${s.border}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} /> {s.label}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-gray-50 px-2.5 py-1.5 rounded-lg">
              <Clock className="w-3 h-3 text-blue-500" /> {appt.time}
            </span>
            <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg ${appt.type === 'video' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'}`}>
              {appt.type === 'video' ? <><Video className="w-3 h-3" /> Video</> : <><Building2 className="w-3 h-3" /> In-person</>}
            </span>
            {appt.rescheduledFrom && (
              <span className="flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-lg">
                <Repeat2 className="w-3 h-3" /> Rescheduled
              </span>
            )}
            {appt.isRunningLate && appt.delayMinutes > 0 && (
              <span className="flex items-center gap-1.5 text-xs font-bold bg-orange-100 text-orange-700 px-2.5 py-1.5 rounded-lg border border-orange-200">
                <Timer className="w-3 h-3" />
                +{appt.delayMinutes}m · Est. {addMinsToTime(appt.time, appt.delayMinutes)}
              </span>
            )}
            {appt.reason && <span className="text-xs text-gray-400 italic">"{appt.reason}"</span>}
            {appt.notes && !expanded && (
              <span className="flex items-center gap-1 text-xs text-gray-400"><NotepadText className="w-3 h-3" /> Has notes</span>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2 shrink-0">
          {appt.status === 'pending' && (
            <button onClick={() => onUpdate(appt._id, 'confirmed')} disabled={updating === appt._id}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-xl hover:bg-green-700 transition-colors disabled:opacity-60">
              {updating === appt._id ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
              Confirm
            </button>
          )}
          {appt.status === 'confirmed' && appt.type === 'video' && (() => {
              const cs = getCallStatus(appt);
              return (
                <button
                  onClick={() => onStartCall(appt)}
                  className={`flex items-center gap-1 px-3 py-1.5 text-white text-xs font-bold rounded-xl transition-colors
                    ${cs.canJoin ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-400 cursor-not-allowed'}`}
                  title={cs.canJoin ? 'Start video call' : cs.reason}
                >
                  <Video className="w-3.5 h-3.5" />
                  {cs.canJoin ? 'Start Call' : cs.isTooEarly ? '⏳ Not Yet' : cs.isExpired ? 'Expired' : 'Start Call'}
                </button>
              );
            })()}
          {appt.status === 'confirmed' && (
            <button onClick={() => onCompleteEarly(appt._id)} disabled={updating === appt._id}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg hover:bg-emerald-100 transition-colors">
              <CheckCircle className="w-3 h-3"/> Done Early
            </button>
          )}
          {appt.status === 'confirmed' && (
            <button onClick={() => onComplete(appt)} disabled={updating === appt._id}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60">
              {updating === appt._id ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
              Done
            </button>
          )}
          <button onClick={() => setExpanded(!expanded)} className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors">
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Expanded section */}
      {expanded && (
        <div className="border-t border-gray-100">
          {/* Action bar */}
          <div className="flex items-center gap-2 px-5 py-3 bg-gray-50 border-b border-gray-100 flex-wrap">
            <button onClick={() => onViewHistory(appt)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              <History className="w-3.5 h-3.5 text-blue-500" /> Visit History
            </button>
            <button onClick={() => setShowNotes(!showNotes)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-colors ${showNotes ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600 bg-white border-gray-200 hover:bg-gray-50'}`}>
              <NotepadText className="w-3.5 h-3.5" /> {appt.notes ? 'Edit Notes' : 'Add Notes'}
            </button>
            {!isDone && !isMissed && (
              <button onClick={() => onUpdate(appt._id, 'cancelled')} disabled={updating === appt._id}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-500 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors ml-auto">
                <X className="w-3.5 h-3.5" /> Cancel Appt.
              </button>
            )}
          </div>

          {/* Notes drawer */}
          {showNotes && (
            <div className="border-b border-gray-100">
              <NotesDrawer appt={appt} onSave={onSaveNotes} saving={savingNotes === appt._id} />
            </div>
          )}

          {/* Notes read-only */}
          {!showNotes && appt.notes && (
            <div className="px-5 py-4 border-b border-gray-100 bg-blue-50/40">
              <p className="text-xs font-bold text-blue-600 mb-1 flex items-center gap-1.5">
                <NotepadText className="w-3.5 h-3.5" /> Doctor Notes
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">{appt.notes}</p>
            </div>
          )}

          {/* Patient rating */}
          {appt.status === 'completed' && appt.rating && (
            <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(n => (
                  <Star key={n} className={`w-4 h-4 ${n <= appt.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                ))}
              </div>
              <p className="text-xs font-bold text-amber-600">{appt.rating}.0</p>
              {appt.review && (
                <p className="text-xs text-gray-500 italic flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" /> "{appt.review}"
                </p>
              )}
            </div>
          )}

          <div className="px-5 py-3 flex items-center justify-between">
            <p className="text-xs text-gray-400">Booked {new Date(appt.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            {appt.doctorFee && <span className="text-sm font-black text-blue-600">₹{appt.doctorFee}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

// Main Component
export function DoctorAppointments() {
  const [appointments,   setAppointments]   = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [statusFilter,   setStatusFilter]   = useState('all');
  const [dateFilter,     setDateFilter]     = useState('');
  const [searchQuery,    setSearchQuery]    = useState('');
  const [updating,       setUpdating]       = useState(null);
  const [savingNotes,    setSavingNotes]    = useState(null);
  const [completeAppt,   setCompleteAppt]   = useState(null);
  const [savingComplete, setSavingComplete] = useState(false);
  const [historyAppt,    setHistoryAppt]    = useState(null);
  const [activeCall,     setActiveCall]     = useState(null);  // appt object for active video call
  const [toast,          setToast]          = useState(null);
  const [doctorPhoto,    setDoctorPhoto]    = useState(null);

  const doctorName = localStorage.getItem('doctorName') || 'Doctor';

  // ── Delay state ──────────────────────────────────────────────────────────
  const [showDelayModal,  setShowDelayModal]  = useState(false);
  const [delayMinutes,    setDelayMinutes]    = useState(15);
  const [delayReason,     setDelayReason]     = useState('Previous patient took longer');
  const [sendingDelay,    setSendingDelay]    = useState(false);
  const [overdueAppts,    setOverdueAppts]    = useState([]); // auto-detected overdue
  const doctorPhotoSrc = doctorPhoto ? photoSrc(doctorPhoto) : null;

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (dateFilter)             params.date   = dateFilter;
      const res = await api.get(`/appointments/doctor/${getDoctorId()}`, { params });
      setAppointments(res.data);
    } catch {
      showToast('Failed to load appointments', 'error');
    } finally {
      setLoading(false);
    }
  };


  // Fetch doctor photo for header
  useEffect(() => {
    const id = getDoctorId();
    if (!id) return;
    api.get(`/doctor/profile/${id}`)
      .then(r => setDoctorPhoto(r.data?.personal?.photo || null))
      .catch(() => {});
  }, []);

  useEffect(() => { loadAppointments(); }, [statusFilter, dateFilter]);

  // ── Auto-detect + auto-notify overdue appointments ───────────────────────────
  // Polls every 3 min. If overdue detected and not notified in last 25 min → auto SMS
  const autoDelayFiredRef = useRef(0); // timestamp of last auto-fire

  useEffect(() => {
    const check = async () => {
      try {
        const res = await api.get(`/appointments/doctor/${getDoctorId()}/check-overdue`);
        const overdue = res.data.overdue || [];
        setOverdueAppts(overdue);

        if (overdue.length > 0) {
          const now = Date.now();
          const twentyFiveMins = 25 * 60 * 1000;
          // Fire immediately on first detect, then throttle to once per 25 mins
          if (now - autoDelayFiredRef.current > twentyFiveMins) {
            autoDelayFiredRef.current = now;
            const delayRes = await api.post(`/appointments/doctor/${getDoctorId()}/auto-delay`);
            if (delayRes.data.notified > 0) {
              showToast(
                `⏰ Auto-detected: Dr running ${delayRes.data.delayMins} min late — ${delayRes.data.notified} patient(s) notified`,
                'success'
              );
              loadAppointments();
            }
          }
        }
      } catch (err) {
        console.warn('[AutoDelay]', err.message);
      }
    };

    check();
    const t = setInterval(check, 3 * 60 * 1000); // every 3 minutes
    return () => clearInterval(t);
  }, []);

  // ── Send delay notification to all upcoming patients ──────────────────────
  const handleDelay = async () => {
    setSendingDelay(true);
    try {
      const res = await api.post(`/appointments/doctor/${getDoctorId()}/delay`, {
        delayMinutes,
        reason: delayReason,
      });
      setShowDelayModal(false);
      setOverdueAppts([]);
      showToast(`⏰ ${res.data.notified} patient(s) notified of ${delayMinutes} min delay`);
      loadAppointments();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to send delay notification', 'error');
    } finally {
      setSendingDelay(false);
    }
  };

  // ── Complete early — marks done + SMS next patient ────────────────────────
  const handleCompleteEarly = async (id) => {
    setUpdating(id);
    try {
      const res = await api.post(`/appointments/${id}/complete-early`);
      setAppointments(prev => prev.map(a => a._id === id ? { ...a, status: 'completed' } : a));
      const next = res.data.nextPatient;
      showToast(next
        ? `✅ Completed early — ${next.patientName} notified to come in`
        : '✅ Completed early'
      );
    } catch { showToast('Failed', 'error'); }
    finally { setUpdating(null); }
  };

  const handleUpdate = async (id, status) => {
    setUpdating(id);
    try {
      const res = await api.put(`/appointments/${id}/status`, { status });
      setAppointments(prev => prev.map(a => a._id === id ? res.data : a));
      showToast(status === 'confirmed' ? 'Appointment confirmed! ✅' : status === 'completed' ? 'Marked as completed' : 'Appointment cancelled');
    } catch { showToast('Update failed', 'error'); }
    finally { setUpdating(null); }
  };

  const handleComplete = async (id, notes) => {
    setSavingComplete(true);
    try {
      const res = await api.put(`/appointments/${id}/status`, { status: 'completed', notes });
      setAppointments(prev => prev.map(a => a._id === id ? res.data : a));
      setCompleteAppt(null);
      showToast('Appointment completed with notes! ✅');
    } catch { showToast('Failed to complete', 'error'); }
    finally { setSavingComplete(false); }
  };

  const DELAY_REASONS = [
    'Previous patient took longer',
    'Emergency case',
    'Medical procedure running late',
    'Technical issues',
    'Personal reason',
  ];

  const handleSaveNotes = async (id, notes) => {
    setSavingNotes(id);
    try {
      const res = await api.put(`/appointments/${id}/notes`, { notes });
      setAppointments(prev => prev.map(a => a._id === id ? res.data : a));
      showToast('Notes saved');
    } catch { showToast('Failed to save notes', 'error'); }
    finally { setSavingNotes(null); }
  };

  const today = new Date().toISOString().split('T')[0];
  const filtered = appointments.filter(a =>
    !searchQuery || a.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) || a.reason?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const stats = {
    today:     appointments.filter(a => a.date === today).length,
    pending:   appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    missed:    appointments.filter(a => a.status === 'missed').length,
  };
  const grouped = filtered.reduce((acc, appt) => {
    if (!acc[appt.date]) acc[appt.date] = [];
    acc[appt.date].push(appt);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort();
  const STATUS_TABS = ['all', 'pending', 'confirmed', 'completed', 'missed', 'cancelled'];

  return (
    <>
    <div className="flex-1 overflow-auto bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-8 py-[15px] flex items-center justify-between sticky top-0 z-10">
        <div>
          <p className="text-gray-500 text-sm">Manage your patient bookings</p>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Appointments</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadAppointments} className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <Bell className="w-5 h-5 text-gray-600" />
            {stats.pending > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">{stats.pending}</span>
            )}
          </button>
          <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
            {doctorPhotoSrc
              ? <img src={doctorPhotoSrc} className="w-9 h-9 rounded-full object-cover border border-gray-200"/>
              : <div className="w-9 h-9 bg-blue-700 rounded-full flex items-center justify-center text-white font-bold text-sm">{initials(doctorName)}</div>
            }
            <span className="font-semibold text-gray-800 text-sm">{doctorName.split(' ').slice(0, 2).join(' ')}</span>
          </div>
        </div>
      </header>

      <div className="p-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-5 gap-4">
          {[
            { label: 'Today',     value: stats.today,     bg: 'bg-blue-50',   color: 'text-blue-600',   icon: Calendar,      click: () => { setDateFilter(today); setStatusFilter('all'); } },
            { label: 'Pending',   value: stats.pending,   bg: 'bg-amber-50',  color: 'text-amber-600',  icon: Clock,         click: () => { setStatusFilter('pending');   setDateFilter(''); } },
            { label: 'Confirmed', value: stats.confirmed, bg: 'bg-green-50',  color: 'text-green-600',  icon: CheckCircle,   click: () => { setStatusFilter('confirmed'); setDateFilter(''); } },
            { label: 'Completed', value: stats.completed, bg: 'bg-indigo-50', color: 'text-indigo-600', icon: CheckCircle,   click: () => { setStatusFilter('completed'); setDateFilter(''); } },
            { label: 'Missed',    value: stats.missed,    bg: 'bg-orange-50', color: 'text-orange-500', icon: AlertTriangle, click: () => { setStatusFilter('missed');    setDateFilter(''); } },
          ].map(({ label, value, bg, color, icon: Icon, click }) => (
            <button key={label} onClick={click}
              className="bg-white rounded-2xl p-5 flex items-center gap-3 border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all text-left group">
              <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 space-y-3">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-48 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-blue-400 transition">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input type="text" placeholder="Search patient name or reason..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400" />
              {searchQuery && <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>}
            </div>
            <div className="flex items-center gap-2">
              <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 text-gray-600" />
              {dateFilter && (
                <button onClick={() => setDateFilter('')} className="text-xs font-bold text-red-500 hover:text-red-700 px-2 py-1.5 rounded-xl hover:bg-red-50 transition-colors flex items-center gap-1">
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
            </div>
          </div>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
            {STATUS_TABS.map(s => {
              const count = s === 'all' ? appointments.length : appointments.filter(a => a.status === s).length;
              return (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold capitalize whitespace-nowrap transition-colors
                    ${statusFilter === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}
                    ${s === 'missed' && stats.missed > 0 && statusFilter !== s ? 'text-orange-600' : ''}`}>
                  {s === 'missed' && <AlertTriangle className="w-3 h-3" />}
                  {s}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold
                    ${statusFilter === s ? 'bg-blue-100 text-blue-700' : s === 'missed' && count > 0 ? 'bg-orange-100 text-orange-600' : 'bg-gray-200 text-gray-500'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
            <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-500">No appointments found</p>
            <p className="text-xs text-gray-400 mt-1">{statusFilter !== 'all' ? `No ${statusFilter} appointments` : 'Nothing here yet'}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {sortedDates.map(date => (
              <div key={date}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold
                    ${isToday(date) ? 'bg-blue-700 text-white' : isTomorrow(date) ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                    <Calendar className="w-3.5 h-3.5" /> {dayLabel(date)}
                  </div>
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-xs text-gray-400 font-medium">{grouped[date].length} appointment{grouped[date].length > 1 ? 's' : ''}</span>
                </div>
                <div className="space-y-3">
                  {grouped[date].map(appt => (
                    <AppointmentCard key={appt._id} appt={appt}
                      onUpdate={handleUpdate} updating={updating}
                      onComplete={a => setCompleteAppt(a)}
                      onViewHistory={a => setHistoryAppt(a)}
                      onSaveNotes={handleSaveNotes} savingNotes={savingNotes}
                      onStartCall={a => setActiveCall(a)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

    {completeAppt && <CompleteModal appt={completeAppt} onClose={() => setCompleteAppt(null)} onConfirm={handleComplete} saving={savingComplete} />}
    {historyAppt  && <PatientHistoryModal appt={historyAppt} doctorId={getDoctorId()} onClose={() => setHistoryAppt(null)} />}
    {activeCall   && <VideoCallRoom appt={activeCall} role="doctor" onClose={() => setActiveCall(null)} />}
    {/* ── Delay Modal ── */}
    {showDelayModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDelayModal(false)}>
        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <Timer className="w-5 h-5 text-orange-600"/>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Notify Patients of Delay</h3>
                <p className="text-xs text-gray-500">SMS will be sent to all upcoming patients today</p>
              </div>
            </div>
            <button onClick={() => setShowDelayModal(false)}><X className="w-5 h-5 text-gray-400"/></button>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Delay Duration</label>
            <div className="grid grid-cols-4 gap-2">
              {[10, 15, 20, 30, 45, 60, 90, 120].map(m => (
                <button key={m} onClick={() => setDelayMinutes(m)}
                  className={`py-2.5 rounded-xl text-sm font-bold border transition-colors ${delayMinutes === m ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300'}`}>
                  {m >= 60 ? `${m/60}hr` : `${m}m`}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Reason</label>
            <div className="space-y-2">
              {DELAY_REASONS.map(r => (
                <button key={r} onClick={() => setDelayReason(r)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm border transition-colors ${delayReason === r ? 'bg-orange-50 border-orange-300 text-orange-800 font-semibold' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-orange-50 rounded-xl p-3 mb-5 border border-orange-100">
            <p className="text-xs text-orange-700 font-medium">
              📱 SMS preview: "Dr. {doctorName} is running late by {delayMinutes >= 60 ? `${Math.floor(delayMinutes/60)}hr${delayMinutes%60>0?' '+delayMinutes%60+'min':''}` : `${delayMinutes} minutes`}. New estimated time will be included."
            </p>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setShowDelayModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
            <button onClick={handleDelay} disabled={sendingDelay}
              className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 disabled:opacity-60 flex items-center justify-center gap-2">
              {sendingDelay ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <Timer className="w-4 h-4"/>}
              {sendingDelay ? 'Sending SMS...' : 'Send Delay Notification'}
            </button>
          </div>
        </div>
      </div>
    )}

    {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}