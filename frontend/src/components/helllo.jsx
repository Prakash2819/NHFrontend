import { useState } from 'react';
import { Search, MapPin, SlidersHorizontal, Bell, ChevronDown, Calendar, Video, FileText, Clock, Star, Heart, TrendingUp, Activity, Pill, ChevronRight } from 'lucide-react';
import { Sidebar } from './sidebar';

const MOCK_DOCTORS = [
  { id: 1, name: 'Dr. Anita Sharma', specialty: 'Cardiologist', rating: 4.9, reviews: 312, available: 'Today', fee: 800, initials: 'AS', color: 'bg-indigo-500', nextSlot: '10:30 AM' },
  { id: 2, name: 'Dr. Rahul Mehta', specialty: 'Neurologist', rating: 4.8, reviews: 245, available: 'Tomorrow', fee: 1200, initials: 'RM', color: 'bg-pink-500', nextSlot: '2:00 PM' },
  { id: 3, name: 'Dr. Priya Nair', specialty: 'Dermatologist', rating: 4.7, reviews: 189, available: 'Today', fee: 600, initials: 'PN', color: 'bg-amber-500', nextSlot: '11:00 AM' },
  { id: 4, name: 'Dr. Vikram Patel', specialty: 'Orthopedic', rating: 4.9, reviews: 421, available: 'Today', fee: 1000, initials: 'VP', color: 'bg-emerald-500', nextSlot: '3:30 PM' },
];

const UPCOMING_APPOINTMENTS = [
  { id: 1, doctor: 'Dr. Anita Sharma', specialty: 'Cardiologist', date: 'Feb 28', time: '10:30 AM', type: 'video', initials: 'AS', color: 'bg-indigo-500' },
  { id: 2, doctor: 'Dr. Priya Nair', specialty: 'Dermatologist', date: 'Mar 3', time: '2:00 PM', type: 'in-person', initials: 'PN', color: 'bg-amber-500' },
];

const SPECIALTIES = ['All', 'Cardiologist', 'Neurologist', 'Dermatologist', 'Orthopedic', 'Psychiatrist', 'Pediatrician'];

const HEALTH_METRICS = [
  { label: 'Blood Pressure', value: '120/80', unit: 'mmHg', icon: Activity, bg: 'bg-red-50', iconColor: 'text-red-500' },
  { label: 'Heart Rate', value: '72', unit: 'bpm', icon: Heart, bg: 'bg-pink-50', iconColor: 'text-pink-500' },
  { label: 'Blood Sugar', value: '98', unit: 'mg/dL', icon: TrendingUp, bg: 'bg-amber-50', iconColor: 'text-amber-500' },
  { label: 'Medications', value: '3', unit: 'active', icon: Pill, bg: 'bg-blue-50', iconColor: 'text-blue-500' },
];

export function PatientDashboard({ onBookAppointment, onJoinVideoCall, onLogout }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [bookingDoctor, setBookingDoctor] = useState(null);
  const [savedDoctors, setSavedDoctors] = useState([]);

  const toggleSave = (id) =>
    setSavedDoctors(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);

  const filteredDoctors = MOCK_DOCTORS.filter(d =>
    (selectedSpecialty === 'All' || d.specialty === selectedSpecialty) &&
    (d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.specialty.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />

      <div className="flex-1 flex flex-col min-w-0">

        {/* ── Top Bar ── */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <p className="text-gray-500 text-sm">Hi, Prakash 👋</p>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">Welcome Back</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-1 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              EN <ChevronDown className="w-4 h-4" />
            </button>
            <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
            </button>
            <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
              <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">P</div>
              <span className="font-semibold text-gray-800 text-sm">Prakash</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-7">

          {/* ── Hero Search ── */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
            <p className="text-blue-200 text-sm mb-0.5">Find the right care</p>
            <h2 className="text-xl font-bold mb-5">Book Your Appointment Today</h2>
            <div className="flex gap-3">
              <div className="flex-1 flex items-center gap-3 bg-white rounded-xl px-4 py-3">
                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search doctors, specialties..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400"
                />
              </div>
              <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3">
                <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Location"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="w-28 bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400"
                />
              </div>
              <button className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-colors">
                <SlidersHorizontal className="w-5 h-5 text-white" />
              </button>
              <button className="px-6 py-3 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors text-sm">
                Search
              </button>
            </div>
          </div>

          {/* ── Stats Row ── */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total Appointments', value: '12', Icon: Calendar, bg: 'bg-blue-50',   text: 'text-blue-600' },
              { label: 'Upcoming',           value: '2',  Icon: Clock,     bg: 'bg-green-50',  text: 'text-green-600' },
              { label: 'Prescriptions',      value: '5',  Icon: FileText,  bg: 'bg-amber-50',  text: 'text-amber-600' },
              { label: 'Saved Doctors',      value: savedDoctors.length.toString(), Icon: Heart, bg: 'bg-pink-50', text: 'text-pink-600' },
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
            {/* Appointments */}
            <div className="col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-gray-900">Upcoming Appointments</h3>
                <button className="text-blue-600 text-sm font-semibold hover:underline flex items-center gap-1">
                  View all <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                {UPCOMING_APPOINTMENTS.map(appt => (
                  <div key={appt.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors">
                    <div className={`w-12 h-12 ${appt.color} rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                      {appt.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{appt.doctor}</p>
                      <p className="text-xs text-gray-500">{appt.specialty}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-gray-800">{appt.date}</p>
                      <p className="text-xs text-gray-500">{appt.time}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${appt.type === 'video' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                        {appt.type === 'video' ? '📹 Video' : '🏥 In-person'}
                      </span>
                      {appt.type === 'video' && (
                        <button
                          onClick={() => onJoinVideoCall?.(appt)}
                          className="text-xs font-bold px-3 py-1 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                        >
                          Join
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Health Metrics */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-5">Health Metrics</h3>
              <div className="grid grid-cols-2 gap-3">
                {HEALTH_METRICS.map((m, i) => (
                  <div key={i} className={`${m.bg} rounded-xl p-4`}>
                    <m.icon className={`w-4 h-4 ${m.iconColor} mb-2`} />
                    <p className="text-xs text-gray-500 font-medium leading-tight">{m.label}</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">{m.value}</p>
                    <p className="text-xs text-gray-400">{m.unit}</p>
                    {i < 3 && (
                      <span className="inline-block mt-1.5 text-xs font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">● Normal</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Top Doctors ── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Top Doctors</h3>
              <button className="text-blue-600 text-sm font-semibold hover:underline flex items-center gap-1">
                See all <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Specialty Chips */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
              {SPECIALTIES.map(s => (
                <button
                  key={s}
                  onClick={() => setSelectedSpecialty(s)}
                  className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                    selectedSpecialty === s
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Doctor Cards */}
            <div className="grid grid-cols-4 gap-4">
              {filteredDoctors.map(doctor => (
                <div
                  key={doctor.id}
                  className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-14 h-14 ${doctor.color} rounded-2xl flex items-center justify-center text-white font-bold text-lg`}>
                      {doctor.initials}
                    </div>
                    <button
                      onClick={() => toggleSave(doctor.id)}
                      className={`p-1.5 rounded-full transition-colors ${savedDoctors.includes(doctor.id) ? 'text-red-500' : 'text-gray-300 hover:text-red-400'}`}
                    >
                      <Heart className="w-4 h-4" fill={savedDoctors.includes(doctor.id) ? 'currentColor' : 'none'} />
                    </button>
                  </div>

                  <h4 className="font-bold text-gray-900 text-sm leading-tight">{doctor.name}</h4>
                  <p className="text-xs text-gray-500 font-medium mt-0.5 mb-3">{doctor.specialty}</p>

                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-sm font-bold text-gray-800">{doctor.rating}</span>
                      <span className="text-xs text-gray-400">({doctor.reviews})</span>
                    </div>
                    <span className="text-sm font-bold text-blue-600">₹{doctor.fee}</span>
                  </div>

                  <div className="flex items-center gap-1.5 mb-4">
                    <span className={`w-1.5 h-1.5 rounded-full ${doctor.available === 'Today' ? 'bg-green-500' : 'bg-amber-400'}`} />
                    <span className="text-xs text-gray-500 font-medium">
                      {doctor.available} · {doctor.nextSlot}
                    </span>
                  </div>

                  <button
                    onClick={() => onBookAppointment ? onBookAppointment(doctor) : setBookingDoctor(doctor)}
                    className="w-full py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 active:scale-95 transition-all"
                  >
                    Book Appointment
                  </button>
                </div>
              ))}

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
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setBookingDoctor(null)}
        >
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">Book Appointment</h3>
              <button onClick={() => setBookingDoctor(null)} className="text-gray-400 hover:text-gray-600 text-xl font-medium leading-none">✕</button>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl mb-5">
              <div className={`w-12 h-12 ${bookingDoctor.color} rounded-xl flex items-center justify-center text-white font-bold`}>
                {bookingDoctor.initials}
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">{bookingDoctor.name}</p>
                <p className="text-xs text-gray-500">{bookingDoctor.specialty} · ₹{bookingDoctor.fee}</p>
              </div>
            </div>

            <div className="space-y-4 mb-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Select Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Consultation Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {[{ label: '📹 Video Consult', val: 'video' }, { label: '🏥 In-person', val: 'in-person' }].map(({ label, val }) => (
                    <button key={val} className="p-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:border-blue-400 hover:bg-blue-50 transition-colors">
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => { alert('Appointment booked! 🎉'); setBookingDoctor(null); }}
              className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"
            >
              Confirm Booking
            </button>
          </div>
        </div>
      )}
    </div>
  );
}