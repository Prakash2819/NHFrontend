import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Search, Bell, Calendar, FileText, Clock, Heart, Star,
  TrendingUp, Activity, Pill, ChevronRight, X, CheckCircle,
  Stethoscope, Video, Building2, Droplets, Ruler, Weight,
  AlertTriangle, ShieldAlert, User
} from 'lucide-react';
import { DoctorSearch } from './DoctorSearch';
import { DoctorDetail } from './DoctorDetail';
import { BookingModal } from './BookingModal';
import { VideoCallRoom, getCallStatus } from './Videocallroom';

// ─── Axios ────────────────────────────────────────────────────────────────────
const BASE_URL = 'https://nhbackend.onrender.com';
const api = axios.create({ baseURL: `${BASE_URL}/api` });
const getPatientId = () => localStorage.getItem('patientId');

// ─── Build health metrics from patient profile ────────────────────────────────
function buildHealthMetrics(profile) {
  if (!profile) return [];
  const p = profile.personal || {};
  const m = profile.medical  || {};
  const metrics = [];

  if (p.bloodGroup) metrics.push({
    label: 'Blood Group', value: p.bloodGroup, unit: '',
    icon: Droplets, bg: 'bg-red-50', iconColor: 'text-red-500',
  });
  if (p.height) metrics.push({
    label: 'Height', value: p.height, unit: 'cm',
    icon: Ruler, bg: 'bg-blue-50', iconColor: 'text-blue-500',
  });
  if (p.weight) metrics.push({
    label: 'Weight', value: p.weight, unit: 'kg',
    icon: Weight, bg: 'bg-amber-50', iconColor: 'text-amber-500',
  });
  if (m.conditions?.length > 0) metrics.push({
    label: 'Conditions', value: m.conditions.length, unit: 'chronic',
    icon: Activity, bg: 'bg-orange-50', iconColor: 'text-orange-500',
    detail: m.conditions.join(', '),
  });
  if (m.allergies?.length > 0) metrics.push({
    label: 'Allergies', value: m.allergies.length, unit: 'known',
    icon: ShieldAlert, bg: 'bg-pink-50', iconColor: 'text-pink-500',
    detail: m.allergies.join(', '),
  });
  // Pad to at least 4 with placeholders if not enough
  const PLACEHOLDERS = [
    { label: 'Blood Pressure', value: '—', unit: 'mmHg', icon: Activity,   bg: 'bg-red-50',   iconColor: 'text-red-400'   },
    { label: 'Heart Rate',     value: '—', unit: 'bpm',  icon: Heart,      bg: 'bg-pink-50',  iconColor: 'text-pink-400'  },
    { label: 'Blood Sugar',    value: '—', unit: 'mg/dL',icon: TrendingUp, bg: 'bg-amber-50', iconColor: 'text-amber-400' },
    { label: 'Medications',    value: '—', unit: 'active',icon: Pill,       bg: 'bg-blue-50',  iconColor: 'text-blue-400'  },
  ];
  let i = 0;
  while (metrics.length < 4 && i < PLACEHOLDERS.length) {
    if (!metrics.find(x => x.label === PLACEHOLDERS[i].label)) metrics.push(PLACEHOLDERS[i]);
    i++;
  }
  return metrics.slice(0, 4);
}

// Consistent avatar color from name
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
function formatDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
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

// ─── Rating Stars ─────────────────────────────────────────────────────────────
function RatingStars({ avg, count }) {
  if (!avg || !count) return (
    <span className="text-xs text-gray-300 font-medium">No reviews</span>
  );
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(n => (
        <Star key={n} className={`w-3 h-3 ${n <= Math.round(avg) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
      ))}
      <span className="text-xs font-black text-amber-600 ml-0.5">{avg}</span>
      <span className="text-xs text-gray-400">({count})</span>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export function PatientDashboard() {
  const navigate = useNavigate();
  const [view,          setView]          = useState('dashboard');
  const [searchQuery,   setSearchQuery]   = useState('');
  const [selectedDoctor,setSelectedDoctor]= useState(null);
  const [doctors,       setDoctors]       = useState([]);
  const [appointments,  setAppointments]  = useState([]);
  const [selectedSpec,  setSelectedSpec]  = useState('All');
  const [bookingDoctor, setBookingDoctor] = useState(null);
  const [savedDoctors,  setSavedDoctors]  = useState([]);
  const [ratingsMap,    setRatingsMap]    = useState({});
  const [patientProfile,setPatientProfile]= useState(null);
  const [loading,       setLoading]       = useState(true);
  const [toast,         setToast]         = useState(null);
  const [activeCall,    setActiveCall]    = useState(null);

  const patientName = localStorage.getItem('patientName') || 'there';

  // ── Load doctors + patient appointments ───────────────────────────────────
  useEffect(() => {
    const patientId = getPatientId();
    Promise.all([
      api.get('/doctors'),
      patientId ? api.get(`/appointments/patient/${patientId}`) : Promise.resolve({ data: [] }),
      api.get('/appointments/ratings/bulk'),
      patientId ? api.get(`/patient/profile/${patientId}`) : Promise.resolve({ data: null }),
    ])
      .then(([docRes, apptRes, ratingsRes, profileRes]) => {
        setDoctors(docRes.data || []);
        setAppointments(apptRes.data || []);
        setRatingsMap(ratingsRes.data || {});
        setPatientProfile(profileRes.data || null);
      })
      .catch(() => showToast('Failed to load data', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Refresh appointments after booking
  const handleBooked = async () => {
    showToast('Appointment booked successfully! 🎉');
    try {
      const res = await api.get(`/appointments/patient/${getPatientId()}`);
      setAppointments(res.data);
    } catch { /* silent */ }
  };

  const toggleSave = (id) =>
    setSavedDoctors(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);

  // ── Derive specialties from real DB data ──────────────────────────────────
  const specialties = ['All', ...new Set(doctors.map(d => d.specialization).filter(Boolean))];

  const filteredDoctors = doctors.filter(d => {
    const matchSpec  = selectedSpec === 'All' || d.specialization === selectedSpec;
    const matchQuery = d.name?.toLowerCase().includes(searchQuery.toLowerCase())
                    || d.specialization?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSpec && matchQuery;
  });

  // ── Upcoming appointments (pending/confirmed, future dates) ───────────────
  const today = new Date().toISOString().split('T')[0];
  const upcoming = appointments.filter(a =>
    a.date >= today && ['pending', 'confirmed'].includes(a.status)
  ).slice(0, 3);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-500 font-medium">Loading...</p>
      </div>
    </div>
  );

  // ── Search view — BookingModal overlays on top if open ──
  if (view === 'search') return (
    <>
      <DoctorSearch
        initialQuery={searchQuery}
        onBack={() => setView('dashboard')}
        onDoctorClick={(doctor) => { setSelectedDoctor(doctor); setView('detail'); }}
        onBookDoctor={(doctor) => setBookingDoctor(doctor)}
      />
      {bookingDoctor && (
        <BookingModal
          doctor={bookingDoctor}
          defaultType={bookingDoctor.defaultType}
          onClose={() => setBookingDoctor(null)}
          onBooked={handleBooked}
        />
      )}
    </>
  );

  // ── Doctor detail view — BookingModal overlays on top if open ──
  if (view === 'detail' && selectedDoctor) return (
    <>
      <DoctorDetail
        doctor={selectedDoctor}
        onBack={() => setView('search')}
        onBook={(doctor, type) => setBookingDoctor({ ...doctor, defaultType: type })}
      />
      {bookingDoctor && (
        <BookingModal
          doctor={bookingDoctor}
          defaultType={bookingDoctor.defaultType}
          onClose={() => setBookingDoctor(null)}
          onBooked={handleBooked}
        />
      )}
    </>
  );

  return (
    <>
    <div className="flex-1 flex flex-col min-w-0">

      {/* ── Top Bar ── */}
      <header className="bg-white border-b border-gray-200 px-8 py-[15px] flex items-center justify-between sticky top-0 z-10">
        <div>
          <p className="text-gray-500 text-sm">Hi, {(patientProfile?.personal?.name || patientName).split(' ')[0]} 👋</p>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Welcome Back</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
          </button>
          {/* Profile avatar + name — clickable to profile page */}
          <button
            onClick={() => navigate('/patient/profile')}
            className="flex items-center gap-2 pl-3 border-l border-gray-200 hover:opacity-80 transition-opacity"
          >
            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden shrink-0">
              {patientProfile?.personal?.photo
                ? <img src={patientProfile.personal.photo} alt="" className="w-full h-full object-cover" />
                : (patientProfile?.personal?.name || patientName)[0]?.toUpperCase() || 'P'
              }
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-800 text-sm leading-none">
                {(patientProfile?.personal?.name || patientName).split(' ')[0]}
              </p>
              {/* <p className="text-xs text-blue-600 font-medium mt-0.5">View Profile →</p>? */}
            </div>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto py-4 px-8 space-y-7">

        {/* ── Hero Search ── */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
          <p className="text-blue-200 text-sm mb-0.5">Find the right care</p>
          <h2 className="text-xl font-bold mb-5">Book Your Appointment Today</h2>
          <div className="flex gap-3">
            <div className="flex-1 flex items-center gap-3 bg-white rounded-xl px-4 py-3">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input type="text" placeholder="Search doctors, specialties..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && setView('search')}
                onFocus={() => setView('search')}
                className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400 cursor-pointer" />
            </div>
            <button
              onClick={() => setView('search')}
              className="px-6 py-3 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors text-sm">
              Search
            </button>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Appointments', value: appointments.length,                                         Icon: Calendar, bg: 'bg-blue-50',  text: 'text-blue-600'  },
            { label: 'Upcoming',           value: upcoming.length,                                             Icon: Clock,    bg: 'bg-green-50', text: 'text-green-600' },
            { label: 'Completed',          value: appointments.filter(a => a.status === 'completed').length,   Icon: FileText, bg: 'bg-amber-50', text: 'text-amber-600' },
            { label: 'Saved Doctors',      value: savedDoctors.length,                                         Icon: Heart,    bg: 'bg-pink-50',  text: 'text-pink-600'  },
          ].map(({ label, value, Icon, bg, text }) => (
            <div key={label} className="bg-white rounded-2xl p-5 flex items-center gap-4 border border-gray-100 shadow-sm">
              <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${text}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Appointments + Health Metrics ── */}
        <div className="grid grid-cols-3 gap-6">

          {/* Upcoming Appointments */}
          <div className="col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900">Upcoming Appointments</h3>
              <button
                onClick={() => navigate('/patient/appointments')}
                className="text-blue-600 text-sm font-semibold hover:underline flex items-center gap-1">
                View all <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {upcoming.length === 0 ? (
              <div className="text-center py-10">
                <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm font-semibold text-gray-500">No upcoming appointments</p>
                <p className="text-xs text-gray-400 mt-1">Book one from the doctors list below</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcoming.map(appt => {
                  const color = avatarColor(appt.doctorName);
                  const ini   = initials(appt.doctorName);
                  return (
                    <div key={appt._id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors">
                      <div className={`w-12 h-12 ${color} rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden`}>
                        {appt.doctorPhoto
                          ? <img src={appt.doctorPhoto} alt="" className="w-full h-full object-cover" />
                          : ini
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{appt.doctorName}</p>
                        <p className="text-xs text-gray-500">{appt.doctorSpecialty}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-gray-800">{formatDate(appt.date)}</p>
                        <p className="text-xs text-gray-500">{appt.time}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${appt.type === 'video' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                          {appt.type === 'video' ? 'Video' : 'In-person'}
                        </span>
                        {/* Status badge */}
                        <span className={`text-xs font-bold px-2 py-1 rounded-full capitalize ${
                          appt.status === 'confirmed' ? 'bg-green-100 text-green-700'
                          : appt.status === 'pending' ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-gray-600'
                        }`}>
                          {appt.status}
                        </span>
                        {appt.type === 'video' && appt.status === 'confirmed' && (() => {
                          const cs = getCallStatus(appt);
                          return (
                            <button
                              onClick={() => setActiveCall(appt)}
                              className={`text-xs font-bold px-3 py-1 rounded-full transition-colors
                                ${cs.canJoin ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                              title={cs.canJoin ? 'Join video call' : cs.reason}
                            >
                              {cs.canJoin ? 'Join' : cs.isTooEarly ? 'Soon' : 'Join'}
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Health Metrics */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900">Health Profile</h3>
              <button
                onClick={() => navigate('/patient/profile')}
                className="text-blue-600 text-xs font-semibold hover:underline flex items-center gap-1">
                Edit <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            {!patientProfile?.personal?.bloodGroup && !patientProfile?.personal?.height && !patientProfile?.personal?.weight
              && !patientProfile?.medical?.conditions?.length && !patientProfile?.medical?.allergies?.length ? (
              <div className="text-center py-6">
                <User className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-xs font-semibold text-gray-400 mb-3">No health data yet</p>
                <button onClick={() => navigate('/patient/profile')}
                  className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl hover:bg-blue-100 transition-colors">
                  Complete Profile →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {buildHealthMetrics(patientProfile).map((m, i) => (
                  <div key={i} className={`${m.bg} rounded-xl p-4`}>
                    <m.icon className={`w-4 h-4 ${m.iconColor} mb-2`} />
                    <p className="text-xs text-gray-500 font-medium leading-tight">{m.label}</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">{m.value}</p>
                    {m.unit && <p className="text-xs text-gray-400">{m.unit}</p>}
                    {m.detail && (
                      <p className="text-xs text-gray-500 mt-1 truncate" title={m.detail}>{m.detail}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Doctors from DB ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">
              Top Doctors
              <span className="ml-2 text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{filteredDoctors.length}</span>
            </h3>
          </div>

          {/* Specialty filter chips */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
            {specialties.map(s => (
              <button key={s} onClick={() => setSelectedSpec(s)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${selectedSpec === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'}`}>
                {s}
              </button>
            ))}
          </div>

          {/* Doctor Cards */}
          <div className="grid grid-cols-4 gap-4">
            {filteredDoctors.map(doctor => {
              const color = avatarColor(doctor.name);
              const ini   = initials(doctor.name);
              const saved = savedDoctors.includes(doctor._id);
              return (
                <div
                  key={doctor._id}
                  className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                  onClick={() => { setSelectedDoctor(doctor); setView('detail'); }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-14 h-14 ${color} rounded-full flex items-center justify-center text-white font-bold text-lg overflow-hidden shrink-0`}>
                      {doctor.photo
                        ? <img src={doctor.photo} alt="" className="w-full h-full object-cover" />
                        : ini
                      }
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); toggleSave(doctor._id); }}
                      className={`p-1.5 rounded-full transition-colors ${saved ? 'text-red-500' : 'text-gray-300 hover:text-red-400'}`}>
                      <Heart className="w-4 h-4" fill={saved ? 'currentColor' : 'none'} />
                    </button>
                  </div>

                  <h4 className="font-bold text-gray-900 text-sm leading-tight truncate">{doctor.name}</h4>
                  <p className="text-xs text-gray-500 font-medium mt-0.5 mb-1">{doctor.specialization}</p>

                  {doctor.experience && (
                    <p className="text-xs text-gray-400 mb-2">{doctor.experience} yrs exp</p>
                  )}

                  {/* Rating */}
                  <div className="mb-2">
                    <RatingStars avg={ratingsMap[doctor._id]?.avg} count={ratingsMap[doctor._id]?.count} />
                  </div>

                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1">
                      <Stethoscope className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500 truncate max-w-[80px]">
                        {doctor.hospital || doctor.clinic?.name || 'Available'}
                      </span>
                    </div>
                    {doctor.clinic?.fee && (
                      <span className="text-sm font-bold text-blue-600">₹{doctor.clinic.fee}</span>
                    )}
                  </div>

                  {/* Status dot */}
                  <div className="flex items-center gap-1.5 mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="text-xs text-gray-500 font-medium">Available</span>
                  </div>

                  <button onClick={(e) => { e.stopPropagation(); setBookingDoctor(doctor); }}
                    className="w-full py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 active:scale-95 transition-all">
                    Book Appointment
                  </button>
                </div>
              );
            })}

            {filteredDoctors.length === 0 && (
              <div className="col-span-4 text-center py-12 text-gray-400">
                <Search className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No doctors found{searchQuery ? ` for "${searchQuery}"` : ''}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* ── Booking Modal ── */}
    {bookingDoctor && (
      <BookingModal
        doctor={bookingDoctor}
        onClose={() => setBookingDoctor(null)}
        onBooked={handleBooked}
      />
    )}

    {/* ── Video Call ── */}
    {activeCall && <VideoCallRoom appt={activeCall} role="patient" onClose={() => setActiveCall(null)} />}

    {/* ── Toast ── */}
    {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}