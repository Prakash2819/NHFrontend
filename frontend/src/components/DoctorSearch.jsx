import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  ArrowLeft, Search, X, Star, Heart, Stethoscope,
  MapPin, SlidersHorizontal
} from 'lucide-react';
import { BookingModal } from './BookingModal';


const BASE_URL = 'https://nhbackend.onrender.com';
const api = axios.create({ baseURL: `${BASE_URL}/api` });

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

export function DoctorSearch({ initialQuery = '', onBack, onDoctorClick, onBookDoctor }) {
  const [query,        setQuery]        = useState(initialQuery);
  const [doctors,      setDoctors]      = useState([]);
  const [filtered,     setFiltered]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [savedDoctors, setSavedDoctors] = useState([]);
  const [specFilter,   setSpecFilter]   = useState('All');
  const [showFilters,  setShowFilters]  = useState(false);
  const [bookingDoctor,setBookingDoctor]= useState(null);
  const [ratingsMap,   setRatingsMap]   = useState({}); // { doctorId: { avg, count } }
  const inputRef = useRef(null);

  // Load all doctors + their bulk ratings in parallel
  useEffect(() => {
    Promise.all([
      api.get('/doctors'),
      api.get('/appointments/ratings/bulk'),
    ])
      .then(([docRes, ratingsRes]) => {
        setDoctors(docRes.data || []);
        setRatingsMap(ratingsRes.data || {});
      })
      .finally(() => setLoading(false));
  }, []);

  // Filter whenever query or specFilter changes
  useEffect(() => {
    const q = query.toLowerCase();
    setFiltered(
      doctors.filter(d => {
        const matchQuery = !q
          || d.name?.toLowerCase().includes(q)
          || d.specialization?.toLowerCase().includes(q)
          || d.hospital?.toLowerCase().includes(q)
          || d.clinic?.city?.toLowerCase().includes(q);
        const matchSpec = specFilter === 'All' || d.specialization === specFilter;
        return matchQuery && matchSpec;
      })
    );
  }, [query, specFilter, doctors]);

  // Focus input on mount
  useEffect(() => { inputRef.current?.focus(); }, []);

  const specialties = ['All', ...new Set(doctors.map(d => d.specialization).filter(Boolean))];
  const toggleSave  = (id) => setSavedDoctors(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);

  return (
    <>
    <div className="flex-1 flex flex-col min-w-0 bg-gray-50">

      {/* ── Sticky Top Bar ── */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">

          {/* Back button */}
          <button
            onClick={onBack}
            className="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-gray-100 transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>

          {/* Search bar */}
          <div className="flex-1 flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search doctors, specialties, hospitals..."
              className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400"
            />
            {query && (
              <button onClick={() => setQuery('')}>
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(p => !p)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border transition-colors ${showFilters ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filter
          </button>
        </div>

        {/* Specialty filter chips */}
        {showFilters && (
          <div className="flex gap-2 overflow-x-auto pt-3 pb-1 scrollbar-hide">
            {specialties.map(s => (
              <button key={s} onClick={() => setSpecFilter(s)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${specFilter === s ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}>
                {s}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ── Results ── */}
      <div className="flex-1 overflow-y-auto p-6">

        {/* Result count */}
        {!loading && (
          <p className="text-sm text-gray-500 font-medium mb-4">
            {filtered.length === 0
              ? 'No results found'
              : `${filtered.length} doctor${filtered.length > 1 ? 's' : ''} found${query ? ` for "${query}"` : ''}`
            }
          </p>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-7 h-7 text-gray-300" />
            </div>
            <p className="font-semibold text-gray-500">No doctors found</p>
            <p className="text-sm text-gray-400 mt-1">Try a different name, specialty or location</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4">
            {filtered.map(doctor => {
              const color = avatarColor(doctor.name);
              const ini   = initials(doctor.name);
              const saved = savedDoctors.includes(doctor._id);
              return (
                <div
                  key={doctor._id}
                  onClick={() => onDoctorClick?.(doctor)}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-blue-200 transition-all duration-200 cursor-pointer flex flex-col"
                  style={{ width: '250px' }}
                >
                  <div className="p-5 flex flex-col flex-1">

                    {/* Avatar row */}
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center text-white font-bold text-xl overflow-hidden shrink-0`}>
                        {doctor.photo
                          ? <img src={doctor.photo} alt="" className="w-full h-full object-cover" />
                          : ini
                        }
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); toggleSave(doctor._id); }}
                        className={`p-1.5 rounded-full transition-colors ${saved ? 'text-red-500' : 'text-gray-300 hover:text-red-400'}`}
                      >
                        <Heart className="w-4 h-4" fill={saved ? 'currentColor' : 'none'} />
                      </button>
                    </div>

                    {/* Name + specialty */}
                    <h4 className="font-bold text-gray-900 text-sm leading-tight truncate">{doctor.name}</h4>
                    <p className="text-xs text-blue-600 font-semibold mt-0.5 mb-1.5">{doctor.specialization}</p>

                    {/* Rating */}
                    <div className="mb-2">
                      <RatingStars avg={ratingsMap[doctor._id]?.avg} count={ratingsMap[doctor._id]?.count} />
                    </div>

                    {/* Meta */}
                    <div className="space-y-1 mb-3 flex-1">
                      {doctor.experience && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Stethoscope className="w-3 h-3 shrink-0" /> {doctor.experience} yrs experience
                        </span>
                      )}
                      {(doctor.hospital || doctor.clinic?.name) && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{doctor.hospital || doctor.clinic?.name}</span>
                        </span>
                      )}
                      {doctor.clinic?.city && (
                        <p className="text-xs text-gray-400 pl-4">{doctor.clinic.city}</p>
                      )}
                    </div>

                    {/* Fee + Book */}
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
                      {doctor.clinic?.fee
                        ? <span className="text-sm font-bold text-blue-600">₹{doctor.clinic.fee}</span>
                        : <span />
                      }
                      <button
                        onClick={e => { e.stopPropagation(); setBookingDoctor(doctor); }}
                        className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 active:scale-95 transition-all"
                      >
                        Book
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>

    {bookingDoctor && (
      <BookingModal
        doctor={bookingDoctor}
        onClose={() => setBookingDoctor(null)}
        onBooked={() => setBookingDoctor(null)}
      />
    )}
    </>
  );
}