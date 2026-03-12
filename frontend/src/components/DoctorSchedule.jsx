import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Bell, Clock, Plus, X, Save, AlertCircle, CheckCircle,
  Calendar, Copy, Trash2, Info
} from 'lucide-react';

// ─── Axios instance ───────────────────────────────────────────────────────────
const BASE_URL = 'https://nhbackend.onrender.com';
const api = axios.create({ baseURL: `${BASE_URL}/api` });
const getId = () => localStorage.getItem('doctorId');

// ─── Constants ────────────────────────────────────────────────────────────────
function photoSrc(p) {
  if (!p || typeof p !== 'string' || p.trim() === '') return null;
  if (p.startsWith('data:') || p.startsWith('http') || p.startsWith('//')) return p;
  return `data:image/jpeg;base64,${p}`;
}

const DAYS      = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const TIME_OPTIONS = [
  '06:00','06:30','07:00','07:30','08:00','08:30',
  '09:00','09:30','10:00','10:30','11:00','11:30',
  '12:00','12:30','13:00','13:30','14:00','14:30',
  '15:00','15:30','16:00','16:30','17:00','17:30',
  '18:00','18:30','19:00','19:30','20:00',
];

// Display label for a 24h time  e.g. "09:00" → "9:00 AM"
function displayTime(t) {
  if (!t) return '';
  // Handle legacy 12h strings stored in DB
  if (t.includes('AM') || t.includes('PM')) return t;
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour  = h % 12 || 12;
  return `${hour}:${String(m).padStart(2,'0')} ${ampm}`;
}

// Default empty schedule — filled from MongoDB on load
const DEFAULT_SCHEDULE = Object.fromEntries(
  DAYS.map(d => [d, { open: false, slots: [] }])
);

const LEAVE_TYPES = ['personal', 'medical', 'conference', 'vacation', 'other'];
const LEAVE_COLORS = {
  personal:   'bg-blue-50 text-blue-700 border-blue-200',
  medical:    'bg-red-50 text-red-600 border-red-200',
  conference: 'bg-violet-50 text-violet-700 border-violet-200',
  vacation:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  other:      'bg-gray-50 text-gray-600 border-gray-200',
};

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Works with both "09:00" (24h) and "09:00 AM" (12h legacy)
function calcSlots(start, end, duration = 30) {
  if (!start || !end) return 0;
  const toMin = t => {
    t = t.trim();
    if (t.includes('AM') || t.includes('PM')) {
      const [time, mer] = t.split(' ');
      let [h, m] = time.split(':').map(Number);
      if (mer === 'PM' && h !== 12) h += 12;
      if (mer === 'AM' && h === 12) h = 0;
      return h * 60 + m;
    }
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  return Math.max(0, Math.floor((toMin(end) - toMin(start)) / duration));
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

// ─── Add Leave Modal ──────────────────────────────────────────────────────────
function AddLeaveModal({ onClose, onSave, saving }) {
  const [form, setForm] = useState({ from: '', to: '', reason: '', type: 'personal' });
  const valid = form.from && form.to && form.reason;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Add Unavailability</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">From Date</label>
              <input type="date" value={form.from}
                onChange={e => setForm(p => ({ ...p, from: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">To Date</label>
              <input type="date" value={form.to}
                onChange={e => setForm(p => ({ ...p, to: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Type</label>
            <div className="flex flex-wrap gap-2">
              {LEAVE_TYPES.map(t => (
                <button key={t} onClick={() => setForm(p => ({ ...p, type: t }))}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border capitalize transition-colors ${
                    form.type === t ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Reason</label>
            <input type="text" value={form.reason}
              onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
              placeholder="e.g. Medical conference, vacation..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition" />
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Patients with existing appointments during this period will be notified automatically.
            </p>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button
            disabled={!valid || saving}
            onClick={() => onSave(form)}
            className="flex-1 py-2.5 bg-blue-700 text-white rounded-xl text-sm font-bold hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
          >
            {saving
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Save className="w-4 h-4" />
            }
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Day Editor ───────────────────────────────────────────────────────────────
function DayEditor({ day, data, slotDuration, onChange }) {
  const totalSlots = data.slots.reduce((s, sl) => s + calcSlots(sl.start, sl.end, slotDuration), 0);

  const addSlot    = () => onChange(day, { ...data, slots: [...data.slots, { start: '09:00', end: '17:00' }] });
  const removeSlot = (i) => onChange(day, { ...data, slots: data.slots.filter((_, idx) => idx !== i) });
  const updateSlot = (i, field, val) => {
    const slots = data.slots.map((s, idx) => idx === i ? { ...s, [field]: val } : s);
    onChange(day, { ...data, slots });
  };
  const toggleDay = () => onChange(day, {
    ...data,
    open:  !data.open,
    slots: data.open ? [] : [{ start: '09:00', end: '17:00' }],
  });

  return (
    <div className={`bg-white rounded-2xl border transition-all ${data.open ? 'border-gray-100 shadow-sm' : 'border-gray-100 opacity-60'}`}>

      {/* Day header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleDay}
            className={`relative w-10 h-5 rounded-full transition-colors ${data.open ? 'bg-blue-700' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${data.open ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
          <div>
            <p className="font-bold text-gray-900 text-sm">{day}</p>
            {data.open
              ? <p className="text-xs text-blue-600 font-semibold">{totalSlots} slots · {data.slots.length} session{data.slots.length !== 1 ? 's' : ''}</p>
              : <p className="text-xs text-gray-400">Day off</p>
            }
          </div>
        </div>
        {data.open && (
          <button onClick={addSlot}
            className="flex items-center gap-1 text-xs font-bold text-blue-700 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Session
          </button>
        )}
      </div>

      {/* Slots */}
      {data.open && data.slots.length > 0 && (
        <div className="px-5 pb-4 space-y-2.5">
          {data.slots.map((slot, i) => {
            const count = calcSlots(slot.start, slot.end, slotDuration);
            return (
              <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 flex-1">
                  <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <select value={slot.start} onChange={e => updateSlot(i, 'start', e.target.value)}
                    className="bg-transparent text-sm font-semibold text-gray-800 outline-none cursor-pointer">
                    {TIME_OPTIONS.map(t => <option key={t} value={t}>{displayTime(t)}</option>)}
                  </select>
                  <span className="text-gray-400 text-sm font-bold">→</span>
                  <select value={slot.end} onChange={e => updateSlot(i, 'end', e.target.value)}
                    className="bg-transparent text-sm font-semibold text-gray-800 outline-none cursor-pointer">
                    {TIME_OPTIONS.map(t => <option key={t} value={t}>{displayTime(t)}</option>)}
                  </select>
                </div>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full shrink-0">
                  {count} slots
                </span>
                <button onClick={() => removeSlot(i)}
                  className="text-gray-400 hover:text-red-500 transition-colors shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function DoctorSchedule() {
  const [schedule, setSchedule]         = useState(DEFAULT_SCHEDULE);
  const [leaves, setLeaves]             = useState([]);
  const [slotDuration, setSlotDuration] = useState(30);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [addingLeave, setAddingLeave]   = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [toast, setToast]               = useState(null);
  const [doctorPhoto, setDoctorPhoto]   = useState(null);

  // ── 1. Load schedule from MongoDB on mount ────────────────────────────────
  useEffect(() => {
    const doctorId = getId();
    if (!doctorId) { setLoading(false); return; }

    // Convert any legacy "09:00 AM" strings to "09:00" 24h on load
    const normalizeTo24h = (t) => {
      if (!t || (!t.includes('AM') && !t.includes('PM'))) return t;
      const match = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
      if (!match) return t;
      let [, h, m, mer] = match;
      h = parseInt(h, 10); m = parseInt(m, 10);
      if (mer.toUpperCase() === 'PM' && h !== 12) h += 12;
      if (mer.toUpperCase() === 'AM' && h === 12) h = 0;
      return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    };

    api.get(`/doctor/schedule/${doctorId}`)
      .then(res => {
        const { schedule: dbSchedule, slotDuration: dbDuration, leaves: dbLeaves } = res.data;

        // Merge DB data with defaults so all 7 days always exist
        const merged = { ...DEFAULT_SCHEDULE };
        DAYS.forEach(d => {
          if (dbSchedule?.[d]) {
            merged[d] = {
              ...dbSchedule[d],
              // Normalize any legacy 12h slot times to 24h
              slots: (dbSchedule[d].slots || []).map(s => ({
                start: normalizeTo24h(s.start),
                end:   normalizeTo24h(s.end),
              })),
            };
          }
        });

        setSchedule(merged);
        setSlotDuration(dbDuration || 30);
        setLeaves(dbLeaves || []);
      })
      .catch(() => showToast('Failed to load schedule', 'error'))
      .finally(() => setLoading(false));
  }, []);


  // ── Fetch doctor photo for header ─────────────────────────────────────────
  useEffect(() => {
    const id = getId();
    if (!id) return;
    api.get(`/doctor/profile/${id}`)
      .then(r => setDoctorPhoto(r.data?.personal?.photo || null))
      .catch(() => {});
  }, []);

  // ── 2. Save schedule to MongoDB ───────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/doctor/schedule/${getId()}`, { schedule, slotDuration });
      showToast('Schedule saved successfully!');
    } catch {
      showToast('Save failed. Try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── 3. Add leave ──────────────────────────────────────────────────────────
  const handleAddLeave = async (formData) => {
    setAddingLeave(true);
    try {
      const res = await api.post(`/doctor/schedule/${getId()}/leave`, formData);
      setLeaves(res.data.leaves);       // MongoDB returns updated leaves array
      setShowLeaveModal(false);
      showToast('Leave added!');
    } catch {
      showToast('Failed to add leave', 'error');
    } finally {
      setAddingLeave(false);
    }
  };

  // ── 4. Delete leave ───────────────────────────────────────────────────────
  const handleDeleteLeave = async (leaveId) => {
    try {
      const res = await api.delete(`/doctor/schedule/${getId()}/leave/${leaveId}`);
      setLeaves(res.data.leaves);       // MongoDB returns updated leaves array
      showToast('Leave removed');
    } catch {
      showToast('Failed to remove leave', 'error');
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleDayChange = (day, data) => setSchedule(prev => ({ ...prev, [day]: data }));

  const copyMonToAll = () => {
    const mon = schedule['Monday'];
    const updated = {};
    DAYS.forEach(d => { updated[d] = { ...mon, slots: [...mon.slots] }; });
    setSchedule(updated);
  };

  // ── Computed stats ─────────────────────────────────────────────────────────
  const openDays         = DAYS.filter(d => schedule[d]?.open).length;
  const totalWeeklySlots = DAYS.reduce((sum, d) => {
    if (!schedule[d]?.open) return sum;
    return sum + schedule[d].slots.reduce((s, sl) => s + calcSlots(sl.start, sl.end, slotDuration), 0);
  }, 0);

  const doctorPhotoSrc = photoSrc(doctorPhoto);
  const doctorName      = localStorage.getItem('doctorName') || 'Doctor';

  // ── Loading screen ─────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-700 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-500 font-medium">Loading schedule...</p>
      </div>
    </div>
  );

  return (
    <>
    <div className="flex-1 overflow-auto bg-gray-50">

      {/* ── Top Bar ── */}
      <header className="bg-white border-b border-gray-200 px-8 py-[15px] flex items-center justify-between sticky top-0 z-10">
        <div>
          <p className="text-gray-500 text-sm">Set your working hours & availability</p>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Schedule</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
          </button>
          <button onClick={() => {}} className="flex items-center gap-2 pl-3 border-l border-gray-200 hover:opacity-80">
            {doctorPhotoSrc
              ? <img src={doctorPhotoSrc} className="w-9 h-9 rounded-full object-cover border border-gray-200"/>
              : <div className="w-9 h-9 bg-blue-700 rounded-full flex items-center justify-center text-white font-bold text-sm">{doctorName[0]?.toUpperCase() || 'D'}</div>
            }
            <span className="font-semibold text-gray-800 text-sm">{doctorName.split(' ').slice(0, 2).join(' ')}</span>
          </button>
        </div>
      </header>

      <div className="p-8 space-y-6">

        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Working Days',   value: `${openDays} / 7`,    bg: 'bg-blue-50',  color: 'text-blue-600',  icon: Calendar    },
            { label: 'Weekly Slots',   value: totalWeeklySlots,      bg: 'bg-green-50', color: 'text-green-600', icon: Clock       },
            { label: 'Slot Duration',  value: `${slotDuration} min`, bg: 'bg-amber-50', color: 'text-amber-600', icon: Clock       },
            { label: 'Leaves Planned', value: leaves.length,         bg: 'bg-red-50',   color: 'text-red-500',   icon: AlertCircle },
          ].map(({ label, value, bg, color, icon: Icon }) => (
            <div key={label} className="bg-white rounded-2xl p-5 flex items-center gap-4 border border-gray-100 shadow-sm">
              <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-3 gap-6">

          {/* Left: Schedule Editor */}
          <div className="col-span-2 space-y-4">

            {/* Toolbar */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Slot Duration</p>
                <div className="flex gap-1.5">
                  {[15, 20, 30, 45, 60].map(d => (
                    <button key={d} onClick={() => setSlotDuration(d)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${slotDuration === d ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {d}m
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={copyMonToAll}
                  className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 rounded-xl transition-colors">
                  <Copy className="w-4 h-4" /> Apply Monday to All
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 text-white text-sm font-bold rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-70 min-w-[140px] justify-center">
                  {saving
                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <Save className="w-4 h-4" />
                  }
                  {saving ? 'Saving...' : 'Save Schedule'}
                </button>
              </div>
            </div>

            {/* Day Editors */}
            {DAYS.map(day => (
              <DayEditor
                key={day}
                day={day}
                data={schedule[day] || { open: false, slots: [] }}
                slotDuration={slotDuration}
                onChange={handleDayChange}
              />
            ))}
          </div>

          {/* Right: Overview + Leaves */}
          <div className="space-y-5">

            {/* Weekly Visual */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" /> Weekly Overview
              </h3>
              <div className="space-y-2.5">
                {DAYS.map((day, i) => {
                  const d     = schedule[day] || { open: false, slots: [] };
                  const slots = d.open ? d.slots.reduce((s, sl) => s + calcSlots(sl.start, sl.end, slotDuration), 0) : 0;
                  const pct   = Math.min((slots / 20) * 100, 100);
                  return (
                    <div key={day} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-500 w-8 shrink-0">{DAY_SHORT[i]}</span>
                      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${d.open ? 'bg-blue-700' : 'bg-gray-200'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className={`text-xs font-bold w-14 text-right shrink-0 ${d.open ? 'text-blue-700' : 'text-gray-400'}`}>
                        {d.open ? `${slots} slots` : 'Off'}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-500 font-medium">Total weekly slots</p>
                <p className="text-sm font-bold text-blue-700">{totalWeeklySlots}</p>
              </div>
            </div>

            {/* Leaves / Unavailability */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" /> Unavailability
                </h3>
                <button onClick={() => setShowLeaveModal(true)}
                  className="flex items-center gap-1 text-xs font-bold text-blue-700 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>

              {leaves.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-600">No leaves planned</p>
                  <p className="text-xs text-gray-400 mt-0.5">You're available all days</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {leaves.map(leave => (
                    <div key={leave._id} className="flex items-start gap-3 px-5 py-4">
                      <div className={`mt-0.5 px-2 py-1 rounded-lg border text-xs font-bold capitalize shrink-0 ${LEAVE_COLORS[leave.type] || LEAVE_COLORS.other}`}>
                        {leave.type}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{leave.reason}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {leave.from === leave.to
                            ? formatDate(leave.from)
                            : `${formatDate(leave.from)} → ${formatDate(leave.to)}`}
                        </p>
                      </div>
                      {/* Uses leave._id from MongoDB (not leave.id) */}
                      <button onClick={() => handleDeleteLeave(leave._id)}
                        className="text-gray-400 hover:text-red-500 transition-colors shrink-0 mt-0.5">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info card */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3">
              <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-blue-800 mb-1">How slots work</p>
                <p className="text-xs text-blue-600 leading-relaxed">
                  Each session is divided into {slotDuration}-minute slots. Patients can book individual slots within your available hours.
                  Changes take effect from the next working day.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Leave Modal ── */}
      {showLeaveModal && (
        <AddLeaveModal
          onClose={() => setShowLeaveModal(false)}
          onSave={handleAddLeave}
          saving={addingLeave}
        />
      )}

      {/* ── Toast ── */}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
    </>
  );
}