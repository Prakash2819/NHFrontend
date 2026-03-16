import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Calendar, Clock, Video, MapPin, Search, Filter,
  ChevronDown, X, CheckCircle, AlertCircle, RotateCcw,
  Star, Phone, Plus, Stethoscope, FileText, RefreshCw,
  AlertTriangle, CalendarCheck, Repeat2
} from 'lucide-react';
import { BookingModal } from './BookingModal';
import { VideoCallRoom, getCallStatus } from './VideoCallRoom';

// ─── Axios ────────────────────────────────────────────────────────────────────
const api = axios.create({ baseURL: 'https://nhbackend.onrender.com/api' });
const getPatientId = () => localStorage.getItem('patientId');

const TABS         = ['all', 'pending', 'confirmed', 'completed', 'missed', 'cancelled'];
const SORT_OPTIONS = ['Newest First', 'Oldest First', 'Fee: High to Low', 'Fee: Low to High'];

// ─── Status config (now includes missed) ─────────────────────────────────────
const STATUS = {
  pending:   { label: 'Pending',   bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-400',  border: 'border-amber-200' },
  confirmed: { label: 'Confirmed', bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500',   border: 'border-blue-200'  },
  completed: { label: 'Completed', bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500',  border: 'border-green-200' },
  cancelled: { label: 'Cancelled', bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-400',    border: 'border-red-200'   },
  missed:    { label: 'Missed',    bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-400', border: 'border-orange-200'},
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  'bg-indigo-500','bg-pink-500','bg-amber-500','bg-emerald-500',
  'bg-violet-500','bg-cyan-500','bg-rose-500','bg-teal-500',
];
function avatarColor(name = '') {
  let sum = 0;
  for (const c of name) sum += c.charCodeAt(0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}
function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}
function formatDate(dateStr) {
  const [y, mo, d] = dateStr.split('-').map(Number);
  return new Date(y, mo - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type = 'success', onClose }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-white ${type === 'error' ? 'bg-red-600' : 'bg-gray-900'}`}>
      <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
      <p className="text-sm font-semibold">{message}</p>
      <button onClick={onClose}><X className="w-4 h-4 opacity-60 hover:opacity-100" /></button>
    </div>
  );
}

// ─── Star Rating ──────────────────────────────────────────────────────────────
function StarRating({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(n => (
        <button key={n} onClick={() => onChange?.(n)} className="focus:outline-none">
          <Star className={`w-5 h-5 transition-colors ${n <= value ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
        </button>
      ))}
    </div>
  );
}

// ─── Review Modal ─────────────────────────────────────────────────────────────
function ReviewModal({ appt, onClose, onSubmit, saving }) {
  const [rating, setRating] = useState(appt.rating || 0);
  const [review, setReview] = useState(appt.review || '');
  const color = avatarColor(appt.doctorName);
  const ini   = initials(appt.doctorName);
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-900">Rate Your Visit</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl mb-5">
          <div className={`w-12 h-12 ${color} rounded-full flex items-center justify-center text-white font-bold overflow-hidden shrink-0`}>
            {appt.doctorPhoto ? <img src={appt.doctorPhoto} alt="" className="w-full h-full object-cover" /> : ini}
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">{appt.doctorName}</p>
            <p className="text-xs text-gray-500">{appt.doctorSpecialty} · {formatDate(appt.date)}</p>
          </div>
        </div>
        <div className="mb-4">
          <p className="text-sm font-bold text-gray-700 mb-2">How was your experience?</p>
          <StarRating value={rating} onChange={setRating} />
        </div>
        <div className="mb-5">
          <label className="block text-sm font-bold text-gray-700 mb-1.5">Write a review (optional)</label>
          <textarea value={review} onChange={e => setReview(e.target.value)}
            placeholder="Share your experience with this doctor..." rows={3}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none transition" />
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={() => onSubmit(appt._id, rating, review)} disabled={!rating || saving}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            {saving ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Cancel Modal ─────────────────────────────────────────────────────────────
function CancelModal({ appt, onClose, onConfirm, saving }) {
  const [reason, setReason] = useState('');
  const REASONS = ['Schedule conflict', 'Doctor unavailable', 'Personal reasons', 'Medical emergency', 'Other'];
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-900">Cancel Appointment</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex gap-3 mb-5">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-700">Are you sure?</p>
            <p className="text-xs text-red-500 mt-0.5">Cancellations within 24 hours may incur a cancellation fee.</p>
          </div>
        </div>
        <div className="mb-5">
          <p className="text-sm font-bold text-gray-700 mb-2.5">Reason for cancellation</p>
          <div className="space-y-2">
            {REASONS.map(r => (
              <button key={r} onClick={() => setReason(r)}
                className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${reason === r ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                {r}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Keep Appointment</button>
          <button onClick={() => onConfirm(appt._id, reason)} disabled={!reason || saving}
            className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <X className="w-4 h-4" />}
            {saving ? 'Cancelling...' : 'Yes, Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Reschedule Modal ─────────────────────────────────────────────────────────
// Wraps BookingModal but submits via /reschedule endpoint instead of /book
function RescheduleModal({ appt, onClose, onRescheduled }) {
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  // Build a doctor object from the appointment snapshot so BookingModal works
  const doctor = {
    _id:            appt.doctorId,
    name:           appt.doctorName,
    photo:          appt.doctorPhoto,
    specialization: appt.doctorSpecialty,
    hospital:       appt.doctorHospital,
    clinic:         { fee: appt.doctorFee },
  };

  // Override BookingModal's onBooked to instead call /reschedule
  const handleReschedule = async ({ date, time, type }) => {
    setSaving(true);
    setError('');
    try {
      await api.post(`/appointments/${appt._id}/reschedule`, { date, time, type });
      onRescheduled?.();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reschedule');
    } finally {
      setSaving(false);
    }
  };

  return (
    <BookingModal
      doctor={doctor}
      defaultType={appt.type}
      isReschedule
      originalAppt={appt}
      onClose={onClose}
      onBooked={handleReschedule}
      saving={saving}
      externalError={error}
    />
  );
}

// ─── Missed Banner (shown inside the card) ────────────────────────────────────
function MissedBanner({ appt, onReschedule, onRebook }) {
  const isVideo    = appt.type === 'video';
  const isInPerson = appt.type === 'in-person';
  return (
    <div className="mx-5 mb-4 bg-orange-50 border border-orange-200 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-orange-700 mb-0.5">
            {isVideo ? 'You missed your video call' : 'You missed this appointment'}
          </p>
          <p className="text-xs text-orange-600 mb-3">
            {isVideo
              ? 'The scheduled video consultation time has passed.'
              : 'You were unable to visit the clinic at the scheduled time.'}
            {' '}You can reschedule with the same doctor or book a new appointment.
          </p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={onReschedule}
              className="flex items-center gap-1.5 px-3 py-2 bg-orange-500 text-white text-xs font-bold rounded-xl hover:bg-orange-600 transition-colors"
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              Reschedule with {appt.doctorName.split(' ')[0]}
            </button>
            <button
              onClick={onRebook}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-orange-300 text-orange-700 text-xs font-bold rounded-xl hover:bg-orange-50 transition-colors"
            >
              <Repeat2 className="w-3.5 h-3.5" />
              Book Different Doctor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Appointment Card ─────────────────────────────────────────────────────────
function AppointmentCard({ appt, livePhoto, onCancel, onReview, onRebook, onReschedule, onJoinCall }) {
  const [expanded, setExpanded] = useState(appt.status === 'missed');
  const s     = STATUS[appt.status] || STATUS.pending;
  const color = avatarColor(appt.doctorName);
  const ini   = initials(appt.doctorName);
  const isMissed = appt.status === 'missed';

  return (
    <div className={`bg-white rounded-2xl border shadow-sm transition-all duration-200 overflow-hidden
      ${isMissed ? 'border-orange-200 ring-1 ring-orange-100' : expanded ? 'border-blue-200' : 'border-gray-100 hover:border-gray-200 hover:shadow-md'}`}>

      {/* ── Missed top ribbon ── */}
      {isMissed && (
        <div className="bg-orange-500 text-white text-xs font-bold px-4 py-1.5 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5" />
          Appointment Missed — Action Required
        </div>
      )}

      {/* ── Main Row ── */}
      <div className="flex items-center gap-5 p-5">
        <div className={`w-14 h-14 ${color} rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0 overflow-hidden`}>
          {(livePhoto || appt.doctorPhoto)
            ? <img src={livePhoto || appt.doctorPhoto} alt="" className="w-full h-full object-cover" />
            : ini
          }
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-bold text-gray-900 text-sm">{appt.doctorName}</h4>
              <p className="text-xs text-gray-500 font-medium mt-0.5">{appt.doctorSpecialty}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {appt.isRunningLate && appt.delayMinutes > 0 && (
                <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-orange-100 text-orange-700">
                  <Clock className="w-3 h-3"/>
                  +{appt.delayMinutes}m late
                </span>
              )}
              <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                {s.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-2.5 flex-wrap">
            <span className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
              <Calendar className="w-3.5 h-3.5 text-blue-500" /> {formatDate(appt.date)}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
              <Clock className="w-3.5 h-3.5 text-blue-500" /> {appt.time}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
              {appt.type === 'video'
                ? <Video className="w-3.5 h-3.5 text-indigo-500" />
                : <MapPin className="w-3.5 h-3.5 text-emerald-500" />}
              {appt.type === 'video' ? 'Video Consult' : 'In-person'}
            </span>
            {appt.doctorFee && (
              <span className="text-xs font-bold text-blue-600 ml-auto">₹{appt.doctorFee}</span>
            )}
          </div>
        </div>

        <button onClick={() => setExpanded(!expanded)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors shrink-0">
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* ── Expanded Details ── */}
      {expanded && (
        <div className="border-t border-gray-100">

          {/* ── Delay banner ── */}
          {appt.isRunningLate && appt.delayMinutes > 0 && (
            <div className="mx-5 mt-4 bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-orange-600"/>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-orange-700">
                  ⏰ Running {appt.delayMinutes >= 60
                    ? `${Math.floor(appt.delayMinutes/60)}hr${appt.delayMinutes%60>0?' '+appt.delayMinutes%60+'min':''}`
                    : `${appt.delayMinutes} min`} late
                </p>
                <p className="text-xs text-orange-600 mt-0.5">
                  {appt.delayReason && <span>{appt.delayReason} · </span>}
                  New estimated time: <strong>{appt.estimatedTime || appt.time}</strong>
                </p>
              </div>
            </div>
          )}

          {/* Missed banner — rendered before notes */}
          {isMissed && (
            <MissedBanner
              appt={appt}
              onReschedule={() => onReschedule(appt)}
              onRebook={() => onRebook(appt)}
            />
          )}

          <div className="px-5 pb-5 pt-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Hospital</p>
                <p className="text-sm font-semibold text-gray-700">{appt.doctorHospital || 'N/A'}</p>
              </div>
              {appt.reason && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Reason</p>
                  <p className="text-sm font-semibold text-gray-700">{appt.reason}</p>
                </div>
              )}
              {appt.rescheduledFrom && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Rescheduled</p>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Repeat2 className="w-3.5 h-3.5 text-blue-400" /> From a previous appointment
                  </p>
                </div>
              )}
              {appt.notes && (
                <div className="col-span-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Doctor Notes</p>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2">{appt.notes}</p>
                </div>
              )}
            </div>

            {/* Existing rating */}
            {appt.status === 'completed' && appt.rating && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-bold text-amber-700">Your Rating</p>
                  <StarRating value={appt.rating} />
                </div>
                {appt.review && <p className="text-xs text-amber-600 italic">"{appt.review}"</p>}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 flex-wrap">
              {(appt.status === 'pending' || appt.status === 'confirmed') && (
                <>
                  {appt.type === 'video' && appt.status === 'confirmed' && (() => {
                    const cs = getCallStatus(appt);
                    return (
                      <button
                        onClick={() => onJoinCall(appt)}
                        className={`flex items-center gap-1.5 px-4 py-2 text-white text-xs font-bold rounded-xl transition-colors
                          ${cs.canJoin ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'}`}
                        title={cs.canJoin ? 'Join video call' : cs.reason}
                      >
                        <Video className="w-3.5 h-3.5" />
                        {cs.canJoin ? 'Join Call' : cs.isTooEarly ? '⏳ Not Yet' : cs.isExpired ? 'Expired' : 'Join Call'}
                      </button>
                    );
                  })()}
                  {appt.type === 'in-person' && (
                    <button className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-xl hover:bg-green-700 transition-colors">
                      <MapPin className="w-3.5 h-3.5" /> Get Directions
                    </button>
                  )}
                  <button className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-200 transition-colors">
                    <Phone className="w-3.5 h-3.5" /> Contact Clinic
                  </button>
                  <button
                    onClick={() => onCancel(appt)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-xl hover:bg-red-100 transition-colors ml-auto"
                  >
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                </>
              )}

              {appt.status === 'completed' && (
                <>
                  <button className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-600 text-xs font-bold rounded-xl hover:bg-blue-100 transition-colors">
                    <FileText className="w-3.5 h-3.5" /> View Prescription
                  </button>
                  <button onClick={() => onRebook(appt)} className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-200 transition-colors">
                    <RotateCcw className="w-3.5 h-3.5" /> Rebook
                  </button>
                  {!appt.rating && (
                    <button onClick={() => onReview(appt)} className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 text-amber-700 text-xs font-bold rounded-xl hover:bg-amber-100 transition-colors">
                      <Star className="w-3.5 h-3.5" /> Rate Visit
                    </button>
                  )}
                </>
              )}

              {appt.status === 'cancelled' && (
                <button onClick={() => onRebook(appt)} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors">
                  <RotateCcw className="w-3.5 h-3.5" /> Rebook Appointment
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function MyAppointments({ onBookNew }) {
  const [appointments,   setAppointments]   = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [activeTab,      setActiveTab]      = useState('all');
  const [search,         setSearch]         = useState('');
  const [sort,           setSort]           = useState('Newest First');
  const [showSort,       setShowSort]       = useState(false);
  const [reviewAppt,     setReviewAppt]     = useState(null);
  const [cancelAppt,     setCancelAppt]     = useState(null);
  const [rescheduleAppt, setRescheduleAppt] = useState(null); // missed → reschedule
  const [rebookAppt,     setRebookAppt]     = useState(null); // open BookingModal for new booking
  const [activeCall,     setActiveCall]     = useState(null); // video call
  const [savingReview,   setSavingReview]   = useState(false);
  const [savingCancel,   setSavingCancel]   = useState(false);
  const [toast,          setToast]          = useState(null);
  const [doctorPhotos,   setDoctorPhotos]   = useState({}); // { doctorId: photoUrl }

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Load + auto-mark missed ───────────────────────────────────────────────
  const loadAppointments = async () => {
    const patientId = getPatientId();
    if (!patientId) { setLoading(false); return; }
    try {
      // Auto-mark any past pending/confirmed as missed first
      await api.post('/appointments/mark-missed', { patientId }).catch(() => {});
      const res = await api.get(`/appointments/patient/${patientId}`);
      const appts = res.data || [];
      setAppointments(appts);

      // Fetch live doctor photos (in parallel) to override stale snapshot photos
      const uniqueDoctorIds = [...new Set(appts.map(a => a.doctorId).filter(Boolean))];
      const photoResults = await Promise.allSettled(
        uniqueDoctorIds.map(id =>
          api.get(`/doctor/profile/${id}`).then(r => ({ id, photo: r.data?.personal?.photo || null }))
        )
      );
      const photoMap = {};
      photoResults.forEach(r => { if (r.status === 'fulfilled') photoMap[r.value.id] = r.value.photo; });
      setDoctorPhotos(photoMap);
    } catch {
      showToast('Failed to load appointments', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAppointments(); }, []);

  // ── Cancel ────────────────────────────────────────────────────────────────
  const handleCancel = async (id) => {
    setSavingCancel(true);
    try {
      await api.delete(`/appointments/${id}`);
      setAppointments(prev => prev.map(a => a._id === id ? { ...a, status: 'cancelled' } : a));
      setCancelAppt(null);
      showToast('Appointment cancelled');
    } catch {
      showToast('Failed to cancel appointment', 'error');
    } finally {
      setSavingCancel(false);
    }
  };

  // ── Review ────────────────────────────────────────────────────────────────
  const handleReview = async (id, rating, review) => {
    setSavingReview(true);
    try {
      const res = await api.put(`/appointments/${id}/review`, { rating, review });
      setAppointments(prev => prev.map(a => a._id === id ? res.data : a));
      setReviewAppt(null);
      showToast('Review submitted! ⭐');
    } catch {
      showToast('Failed to submit review', 'error');
    } finally {
      setSavingReview(false);
    }
  };

  // ── Reschedule (missed → new appt via /reschedule endpoint) ──────────────
  const handleRescheduled = async () => {
    setRescheduleAppt(null);
    showToast('Appointment rescheduled! ✅');
    await loadAppointments();
  };

  // ── Rebook (opens BookingModal → fresh /book endpoint) ───────────────────
  const handleRebooked = async () => {
    setRebookAppt(null);
    showToast('New appointment booked! 🎉');
    await loadAppointments();
  };

  // ── Filter + sort ─────────────────────────────────────────────────────────
  const filtered = appointments
    .filter(a => activeTab === 'all' || a.status === activeTab)
    .filter(a =>
      a.doctorName?.toLowerCase().includes(search.toLowerCase()) ||
      a.doctorSpecialty?.toLowerCase().includes(search.toLowerCase()) ||
      a.reason?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === 'Newest First')     return new Date(b.date) - new Date(a.date);
      if (sort === 'Oldest First')     return new Date(a.date) - new Date(b.date);
      if (sort === 'Fee: High to Low') return Number(b.doctorFee || 0) - Number(a.doctorFee || 0);
      if (sort === 'Fee: Low to High') return Number(a.doctorFee || 0) - Number(b.doctorFee || 0);
      return 0;
    });

  // ── Counts per tab ────────────────────────────────────────────────────────
  const counts = TABS.reduce((acc, t) => {
    acc[t] = t === 'all' ? appointments.length : appointments.filter(a => a.status === t).length;
    return acc;
  }, {});

  const missedCount   = counts.missed || 0;
  const totalSpent    = appointments.filter(a => a.status === 'completed').reduce((s, a) => s + Number(a.doctorFee || 0), 0);
  const completedCount= appointments.filter(a => a.status === 'completed').length;

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-500 font-medium">Loading appointments...</p>
      </div>
    </div>
  );

  return (
    <>
    <div className="flex-1 flex flex-col min-w-0">

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200 px-8 py-[15px] flex items-center justify-between sticky top-0 z-10">
        <div>
          <p className="text-gray-500 text-sm">Track and manage your visits</p>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">My Appointments</h1>
        </div>
        <div className="flex items-center gap-2">
          {missedCount > 0 && (
            <button
              onClick={() => setActiveTab('missed')}
              className="flex items-center gap-2 px-4 py-2.5 bg-orange-50 border border-orange-200 text-orange-700 text-sm font-bold rounded-xl hover:bg-orange-100 transition-colors"
            >
              <AlertTriangle className="w-4 h-4" />
              {missedCount} Missed
            </button>
          )}
          <button onClick={loadAppointments} className="p-2 hover:bg-gray-100 rounded-xl transition-colors" title="Refresh">
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
          <button onClick={() => onBookNew?.()} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" /> Book New
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto py-4 px-8 space-y-6">

        {/* ── Missed alert banner (if any) ── */}
        {missedCount > 0 && activeTab !== 'missed' && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-orange-700">
                You have {missedCount} missed appointment{missedCount > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-orange-600 mt-0.5">
                Reschedule or book a new appointment to continue your care.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('missed')}
              className="shrink-0 px-4 py-2 bg-orange-500 text-white text-xs font-bold rounded-xl hover:bg-orange-600 transition-colors"
            >
              View Missed
            </button>
          </div>
        )}

        {/* ── Stats ── */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Appointments', value: appointments.length,              icon: Calendar,       bg: 'bg-blue-50',   color: 'text-blue-600'   },
            { label: 'Completed Visits',   value: completedCount,                   icon: CheckCircle,    bg: 'bg-green-50',  color: 'text-green-600'  },
            { label: 'Missed',             value: missedCount,                      icon: AlertTriangle,  bg: 'bg-orange-50', color: 'text-orange-500' },
            { label: 'Total Spent',        value: `₹${totalSpent.toLocaleString('en-IN')}`, icon: Stethoscope, bg: 'bg-purple-50', color: 'text-purple-600' },
          ].map(({ label, value, icon: Icon, bg, color }) => (
            <div key={label} className="bg-white rounded-2xl p-5 flex items-center gap-4 border border-gray-100 shadow-sm">
              <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Filters Bar ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-3 flex-wrap">

            {/* Tab pills */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
              {TABS.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors capitalize whitespace-nowrap
                    ${activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}
                    ${tab === 'missed' && counts.missed > 0 ? 'text-orange-600' : ''}`}>
                  {tab === 'missed' && <AlertTriangle className="w-3.5 h-3.5" />}
                  {tab}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold
                    ${activeTab === tab ? 'bg-blue-100 text-blue-700' : tab === 'missed' && counts[tab] > 0 ? 'bg-orange-100 text-orange-600' : 'bg-gray-200 text-gray-500'}`}>
                    {counts[tab]}
                  </span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 flex-1 min-w-40">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input type="text" placeholder="Search doctor, specialty, reason..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400" />
              {search && (
                <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort */}
            <div className="relative">
              <button onClick={() => setShowSort(!showSort)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 bg-white transition-colors">
                <Filter className="w-4 h-4" />
                {sort}
                <ChevronDown className={`w-4 h-4 transition-transform ${showSort ? 'rotate-180' : ''}`} />
              </button>
              {showSort && (
                <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-20 min-w-48 overflow-hidden">
                  {SORT_OPTIONS.map(opt => (
                    <button key={opt} onClick={() => { setSort(opt); setShowSort(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors ${sort === opt ? 'text-blue-600 font-bold bg-blue-50' : 'text-gray-700'}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── List ── */}
        {filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map(appt => (
              <AppointmentCard
                key={appt._id}
                appt={appt}
                livePhoto={doctorPhotos[appt.doctorId]}
                onCancel={a => setCancelAppt(a)}
                onReview={a => setReviewAppt(a)}
                onRebook={a => setRebookAppt(a)}
                onReschedule={a => setRescheduleAppt(a)}
                onJoinCall={a => setActiveCall(a)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-base font-bold text-gray-700 mb-1">No appointments found</h3>
            <p className="text-sm text-gray-400 mb-5">
              {search ? `No results for "${search}"` : `You have no ${activeTab === 'all' ? '' : activeTab} appointments`}
            </p>
            <button onClick={() => onBookNew?.()} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors">
              <Plus className="w-4 h-4" /> Book an Appointment
            </button>
          </div>
        )}
      </div>
    </div>

    {/* ── Modals ── */}
    {reviewAppt && (
      <ReviewModal appt={{...reviewAppt, doctorPhoto: doctorPhotos[reviewAppt.doctorId] || reviewAppt.doctorPhoto}} onClose={() => setReviewAppt(null)}
        onSubmit={handleReview} saving={savingReview} />
    )}
    {cancelAppt && (
      <CancelModal appt={cancelAppt} onClose={() => setCancelAppt(null)}
        onConfirm={handleCancel} saving={savingCancel} />
    )}

    {/* Reschedule: same doctor, new slot via /reschedule endpoint */}
    {rescheduleAppt && (
      <RescheduleModal
        appt={rescheduleAppt}
        onClose={() => setRescheduleAppt(null)}
        onRescheduled={handleRescheduled}
      />
    )}

    {/* Rebook: open BookingModal targeting same doctor via normal /book */}
    {rebookAppt && (
      <BookingModal
        doctor={{
          _id:            rebookAppt.doctorId,
          name:           rebookAppt.doctorName,
          photo:          rebookAppt.doctorPhoto,
          specialization: rebookAppt.doctorSpecialty,
          hospital:       rebookAppt.doctorHospital,
          clinic:         { fee: rebookAppt.doctorFee },
        }}
        defaultType={rebookAppt.type}
        onClose={() => setRebookAppt(null)}
        onBooked={handleRebooked}
      />
    )}

    {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

    {/* ── Video Call ── */}
    {activeCall && <VideoCallRoom appt={activeCall} role="patient" onClose={() => setActiveCall(null)} />}
    </>
  );
}