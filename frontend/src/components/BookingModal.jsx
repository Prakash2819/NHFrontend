import { useState, useEffect } from 'react';
import axios from 'axios';
import { X, CheckCircle, Video, Building2, Clock, AlertCircle } from 'lucide-react';

const api = axios.create({ baseURL: 'https://nhbackend.onrender.com/api' });
const getPatientId = () => localStorage.getItem('patientId');

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

// Convert "HH:MM" 24h to "hh:MM AM/PM"
function to12h(time24) {
  const [h, m] = time24.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour  = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

// Convert "hh:MM AM/PM" → "HH:MM" 24h  (handles both formats safely)
function to24h(timeStr) {
  if (!timeStr) return '00:00';
  timeStr = timeStr.trim();
  // Already 24h format like "09:00"
  if (!timeStr.includes('AM') && !timeStr.includes('PM')) return timeStr;
  // 12h format like "09:00 AM" or "9:00AM"
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return '00:00';
  let [, h, m, mer] = match;
  h = parseInt(h, 10);
  m = parseInt(m, 10);
  if (mer.toUpperCase() === 'PM' && h !== 12) h += 12;
  if (mer.toUpperCase() === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Generate slots — accepts both 12h ("09:00 AM") and 24h ("09:00") start/end
function generateSlots(start, end, durationMins) {
  const slots = [];
  const start24 = to24h(start);
  const end24   = to24h(end);
  const [sh, sm] = start24.split(':').map(Number);
  const [eh, em] = end24.split(':').map(Number);
  let current = sh * 60 + sm;
  const endMin = eh * 60 + em;
  while (current + durationMins <= endMin) {
    const h = Math.floor(current / 60);
    const m = current % 60;
    slots.push(to12h(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`));
    current += durationMins;
  }
  return slots;
}

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

// ─── BookingModal ─────────────────────────────────────────────────────────────
export function BookingModal({ doctor, defaultType = 'in-person', onClose, onBooked }) {
  const [date,          setDate]          = useState('');
  const [time,          setTime]          = useState('');
  const [type,          setType]          = useState(defaultType);
  const [reason,        setReason]        = useState('');
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState('');
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [availableSlots,  setAvailableSlots]  = useState([]);   // slots for selected date
  const [scheduleError,   setScheduleError]   = useState('');   // "Doctor not available on this day"
  const [schedule,        setSchedule]        = useState(null); // full schedule object from DB
  const [slotDuration,    setSlotDuration]    = useState(30);
  const [leaves,          setLeaves]          = useState([]);
  const [bookedSlots,     setBookedSlots]     = useState([]); // times already taken

  // Load doctor schedule once on mount
  useEffect(() => {
    if (!doctor?._id) return;
    setScheduleLoading(true);
    api.get(`/doctor/schedule/${doctor._id}`)
      .then(res => {
        console.log('[BookingModal] schedule response:', res.data);
        setSchedule(res.data.schedule || {});
        setSlotDuration(Number(res.data.slotDuration) || 30);
        setLeaves(res.data.leaves || []);
      })
      .catch(err => {
        console.error('[BookingModal] failed to load schedule:', err);
      }) // silently fail — fallback handled below
      .finally(() => setScheduleLoading(false));
  }, [doctor?._id]);

  // Recompute slots whenever date or schedule changes
  useEffect(() => {
    if (!date || !schedule) { setAvailableSlots([]); setScheduleError(''); return; }

    // ── Timezone-safe day name ──────────────────────────────────────────────
    // Parsing "YYYY-MM-DD" directly avoids UTC-offset shifting the day
    const [y, mo, d] = date.split('-').map(Number);
    const dayName = DAY_NAMES[new Date(y, mo - 1, d).getDay()]; // e.g. "Monday"

    // ── Case-insensitive key lookup ─────────────────────────────────────────
    const scheduleKey = Object.keys(schedule).find(
      k => k.toLowerCase() === dayName.toLowerCase()
    );
    const daySchedule = scheduleKey ? schedule[scheduleKey] : null;

    // Debug — remove after confirming slots work
    console.log('[BookingModal] day:', dayName, '| raw daySchedule:', JSON.stringify(daySchedule));

    // Check if doctor is on leave
    const onLeave = leaves.some(l => date >= l.from && date <= l.to);
    if (onLeave) {
      setAvailableSlots([]);
      setScheduleError('Doctor is on leave on this date');
      return;
    }

    // ── Robust `open` check ─────────────────────────────────────────────────
    // Handles: true (boolean), "true" (string), or { type: "Boolean" } (bad schema legacy)
    const isOpen = daySchedule?.open === true
      || daySchedule?.open === 'true'
      || (typeof daySchedule?.open === 'object' && daySchedule?.open !== null
          ? false  // malformed schema — treat as closed, user must re-save schedule
          : false);

    if (!daySchedule || !isOpen) {
      setAvailableSlots([]);
      setScheduleError(`Doctor is not available on ${dayName}s`);
      return;
    }

    // ── Flexible slots format ───────────────────────────────────────────────
    // Supports: [{start, end}]  OR  ["09:00-17:00"]  OR  ["09:00","17:00"]
    const rawSlots = daySchedule.slots || [];
    const slots = rawSlots.flatMap(slot => {
      if (!slot) return [];

      // Format 1: { start: "09:00", end: "17:00" }
      if (typeof slot === 'object' && slot.start && slot.end) {
        return generateSlots(slot.start, slot.end, slotDuration);
      }

      // Format 2: "09:00-17:00"
      if (typeof slot === 'string' && slot.includes('-')) {
        const [start, end] = slot.split('-').map(s => s.trim());
        return generateSlots(start, end, slotDuration);
      }

      // Format 3: bare time string "09:00" — skip single times, can't make range
      return [];
    });

    if (slots.length === 0) {
      setAvailableSlots([]);
      setScheduleError('No slots configured for this day');
    } else {
      setAvailableSlots(slots);
      setScheduleError('');
    }
    setTime(''); // reset selected time when date changes

    // Fetch already-booked slots for this doctor+date
    if (slots.length > 0 && doctor?._id) {
      api.get(`/appointments/available-slots?doctorId=${doctor._id}&date=${date}`)
        .then(res => setBookedSlots(res.data.bookedSlots || []))
        .catch(() => setBookedSlots([]));
    } else {
      setBookedSlots([]);
    }
  }, [date, schedule, slotDuration, leaves]);

  const handleBook = async () => {
    if (!date) { setError('Please select a date'); return; }
    if (!time) { setError('Please select a time slot'); return; }
    setSaving(true);
    setError('');
    try {
      await api.post('/appointments/book', {
        patientId: getPatientId(),
        doctorId:  doctor._id,
        date,
        time,
        type,
        reason,
      });
      onBooked?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const color = avatarColor(doctor.name);
  const ini   = initials(doctor.name);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col"
        style={{ maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Fixed Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h3 className="text-lg font-bold text-gray-900">Book Appointment</h3>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        {/* ── Scrollable Body ── */}
        <div className="flex-1 overflow-y-auto">

          {/* Doctor summary */}
          <div className="flex items-center gap-3 mx-6 mt-5 p-4 bg-gray-50 rounded-xl">
            <div className={`w-12 h-12 ${color} rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden shrink-0`}>
              {doctor.photo
                ? <img src={doctor.photo} alt="" className="w-full h-full object-cover" />
                : ini
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm truncate">{doctor.name}</p>
              <p className="text-xs text-gray-500">{doctor.specialization}</p>
            </div>
            <div className="text-right shrink-0">
              {(() => {
                const fee = type === 'video' ? doctor.clinic?.videoFee : doctor.clinic?.fee;
                return fee ? (
                  <>
                    <p className="text-sm font-bold text-blue-600">₹{fee}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {type === 'video' ? 'Video fee' : 'Consult fee'}
                    </p>
                  </>
                ) : null;
              })()}
            </div>
          </div>

          {/* Form */}
          <div className="px-6 py-5 space-y-4">

            {/* Date */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Date</label>
              <input
                type="date"
                value={date}
                min={(() => {
                  const now = new Date();
                  const y   = now.getFullYear();
                  const mo  = String(now.getMonth() + 1).padStart(2, '0');
                  const d   = String(now.getDate()).padStart(2, '0');
                  return `${y}-${mo}-${d}`;
                })()}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>

            {/* Time slots — dynamic from DB */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide">
                  Available Slots
                </label>
                {date && !scheduleLoading && availableSlots.length > 0 && (
                  <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {slotDuration} min each
                  </span>
                )}
              </div>

              {/* Loading */}
              {scheduleLoading && (
                <div className="flex items-center justify-center py-6">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {/* No date selected yet */}
              {!scheduleLoading && !date && (
                <div className="py-4 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <p className="text-xs text-gray-400 font-medium">Select a date to see available slots</p>
                </div>
              )}

              {/* Not available / on leave */}
              {!scheduleLoading && date && scheduleError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-xs font-semibold text-red-600">{scheduleError}</p>
                </div>
              )}

              {/* Slot grid */}
              {!scheduleLoading && availableSlots.length > 0 && (
                <div className="grid grid-cols-3 gap-1.5">
                  {availableSlots.map(t => {
                    const isBooked = bookedSlots.includes(t);
                    return (
                      <button
                        key={t}
                        onClick={() => !isBooked && setTime(t)}
                        disabled={isBooked}
                        title={isBooked ? 'Already booked' : ''}
                        className={`py-2 rounded-xl text-xs font-bold border transition-colors relative ${
                          isBooked
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through opacity-60'
                            : time === t
                              ? 'bg-blue-700 text-white border-blue-700'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        {t}
                        {isBooked && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-400 rounded-full border border-white"/>}
                      </button>
                    );
                  })}
                  {bookedSlots.length > 0 && (
                    <div className="col-span-3 flex items-center gap-3 pt-1 text-[10px] text-gray-400">
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-blue-700 rounded inline-block"/>Selected</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-gray-100 border border-gray-300 rounded inline-block"/>Booked</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-white border border-gray-200 rounded inline-block"/>Available</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Consultation type */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Consultation Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setType('in-person')}
                  className={`p-3 rounded-xl text-sm font-bold border flex items-center justify-center gap-2 transition-colors ${
                    type === 'in-person'
                      ? 'bg-blue-700 text-white border-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-blue-300'
                  }`}
                >
                  <Building2 className="w-4 h-4" /> In-person
                </button>
                <button
                  onClick={() => setType('video')}
                  className={`p-3 rounded-xl text-sm font-bold border flex items-center justify-center gap-2 transition-colors ${
                    type === 'video'
                      ? 'bg-blue-700 text-white border-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-blue-300'
                  }`}
                >
                  <Video className="w-4 h-4" /> Video
                </button>
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">
                Reason <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="e.g. Follow-up, chest pain..."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>

            {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
          </div>
        </div>

        {/* ── Fixed Footer ── */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleBook}
            disabled={saving || !!scheduleError || !time}
            className="flex-1 py-3 bg-blue-700 text-white rounded-xl text-sm font-bold hover:bg-blue-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {saving
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <CheckCircle className="w-4 h-4" />
            }
            {saving ? 'Booking...' : 'Confirm Booking'}
          </button>
        </div>
      </div>
    </div>
  );
}