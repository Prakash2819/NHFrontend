import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ArrowLeft, MapPin, Phone, Star, Heart,
  Stethoscope, GraduationCap, Building2, Globe,
  Video, Calendar, ExternalLink, Award, MessageSquare
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

// ─── Google Maps Embed ────────────────────────────────────────────────────────
function GoogleMap({ address }) {
  if (!address) return null;
  const query    = encodeURIComponent(address);
  const mapsUrl  = `https://www.google.com/maps/search/?api=1&query=${query}`;
  const embedUrl = `https://maps.google.com/maps?q=${query}&output=embed&z=15`;
  return (
    <div className="rounded-2xl overflow-hidden border border-gray-100 flex flex-col">
      <div className="bg-gray-50 px-4 py-2.5 flex items-center justify-between border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-xs font-bold text-gray-700">Location</span>
        </div>
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">
          Open <ExternalLink className="w-3 h-3" />
        </a>
      </div>
      <iframe
        title="Clinic Location"
        src={embedUrl}
        width="100%"
        height="220"
        style={{ border: 0, display: 'block' }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <div className="px-3 py-2 bg-white shrink-0">
        <p className="text-xs text-gray-400 leading-relaxed">{address}</p>
      </div>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ children }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{children}</p>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );
}

// ─── Info Row ─────────────────────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value, color = 'text-blue-500' }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
      <div className="w-7 h-7 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-semibold text-gray-800 break-words">{value}</p>
      </div>
    </div>
  );
}

// ─── Rating Stars ─────────────────────────────────────────────────────────────
function RatingStars({ value = 0, size = 'w-4 h-4' }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(n => (
        <Star key={n} className={`${size} ${n <= Math.round(value)
          ? 'text-amber-400 fill-amber-400'
          : 'text-gray-200 fill-gray-200'}`} />
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function DoctorDetail({ doctor: doctorProp, doctorId, onBack }) {
  const [doctor,       setDoctor]       = useState(doctorProp || null);
  const [loading,      setLoading]      = useState(!doctorProp);
  const [saved,        setSaved]        = useState(false);
  const [bookingDoctor,setBookingDoctor]= useState(null);

  const [ratings,        setRatings]        = useState(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  // Load doctor if only id passed
  useEffect(() => {
    if (doctorProp) { setDoctor(doctorProp); return; }
    if (!doctorId) return;
    api.get(`/doctor/profile/${doctorId}`)
      .then(res => {
        const d = res.data;
        setDoctor({
          _id:            doctorId,
          name:           d.personal.name,
          photo:          d.personal.photo,
          specialization: d.professional.specialty,
          subSpecialty:   d.professional.subSpecialty,
          experience:     d.professional.experience,
          degree:         d.professional.degree,
          registrationNo: d.professional.registrationNo,
          hospital:       d.professional.hospital,
          department:     d.professional.department,
          languages:      d.professional.languages,
          clinic:         d.clinic,
        });
      })
      .finally(() => setLoading(false));
  }, [doctorProp, doctorId]);

  // Fetch reviews from DB once doctor._id is known
  useEffect(() => {
    const id = doctor?._id;
    if (!id) return;
    setReviewsLoading(true);
    api.get(`/appointments/doctor/${id}/reviews`)
      .then(res => setRatings(res.data))
      .catch(() => setRatings({ avg: 0, count: 0, breakdown: {1:0,2:0,3:0,4:0,5:0}, reviews: [] }))
      .finally(() => setReviewsLoading(false));
  }, [doctor?._id]);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!doctor) return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <p className="text-gray-500">Doctor not found</p>
    </div>
  );

  const color = avatarColor(doctor.name);
  const ini   = initials(doctor.name);
  const addressParts = [
    doctor.clinic?.address, doctor.clinic?.city,
    doctor.clinic?.state,   doctor.clinic?.pincode,
  ].filter(Boolean);
  const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : doctor.hospital || '';

  const displayedReviews = showAllReviews
    ? (ratings?.reviews || [])
    : (ratings?.reviews || []).slice(0, 3);

  return (
    <>
    <div className="flex-1 flex flex-col min-w-0 bg-gray-50 overflow-y-auto">

      {/* ── Sticky Header ── */}
      <header className="bg-white border-b border-gray-100 px-5 py-3.5 sticky top-0 z-10 flex items-center gap-3">
        <button onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors shrink-0">
          <ArrowLeft className="w-4 h-4 text-gray-700" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-sm truncate">{doctor.name}</p>
          <p className="text-xs text-gray-400 truncate">{doctor.specialization}</p>
        </div>
        <button onClick={() => setSaved(p => !p)}
          className={`w-8 h-8 flex items-center justify-center rounded-xl transition-colors ${saved ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:bg-gray-100'}`}>
          <Heart className="w-4 h-4" fill={saved ? 'currentColor' : 'none'} />
        </button>
      </header>

      <div className="p-5 space-y-4 pb-10">

        {/* ── Hero Card ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-start gap-4 mb-4">
            <div className={`${color} rounded-2xl flex items-center justify-center text-white font-black text-xl overflow-hidden shrink-0 shadow-md`}
              style={{ width: 72, height: 72 }}>
              {doctor.photo
                ? <img src={doctor.photo} alt="" className="w-full h-full object-cover" />
                : ini
              }
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <h2 className="text-base font-black text-gray-900 leading-tight">{doctor.name}</h2>
              <p className="text-xs font-bold text-blue-600 mt-0.5">{doctor.specialization}</p>
              {doctor.subSpecialty && <p className="text-xs text-gray-400 mt-0.5">{doctor.subSpecialty}</p>}
              {doctor.experience && (
                <div className="flex items-center gap-1 mt-1.5">
                  <Award className="w-3 h-3 text-amber-500" />
                  <span className="text-xs font-semibold text-gray-500">{doctor.experience} yrs experience</span>
                </div>
              )}
              {ratings && ratings.count > 0 && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <RatingStars value={ratings.avg} size="w-3 h-3" />
                  <span className="text-xs font-black text-amber-600">{ratings.avg}</span>
                  <span className="text-xs text-gray-400">({ratings.count})</span>
                </div>
              )}
            </div>
          </div>

          {/* Fee pills */}
          <div className="flex gap-2 mb-4">
            {doctor.clinic?.fee && (
              <div className="flex-1 bg-blue-50 rounded-xl px-3 py-2.5 text-center">
                <p className="text-sm font-black text-blue-700">₹{doctor.clinic.fee}</p>
                <p className="text-xs text-gray-400 mt-0.5">Consult fee</p>
              </div>
            )}
            {doctor.clinic?.videoFee && (
              <div className="flex-1 bg-violet-50 rounded-xl px-3 py-2.5 text-center">
                <p className="text-sm font-black text-violet-700">₹{doctor.clinic.videoFee}</p>
                <p className="text-xs text-gray-400 mt-0.5">Video fee</p>
              </div>
            )}
            {doctor.experience && (
              <div className="flex-1 bg-amber-50 rounded-xl px-3 py-2.5 text-center">
                <p className="text-sm font-black text-amber-700">{doctor.experience} yrs</p>
                <p className="text-xs text-gray-400 mt-0.5">Experience</p>
              </div>
            )}
          </div>

          {/* Book buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setBookingDoctor({ ...doctor, defaultType: 'video' })}
              className="flex-1 py-2.5 border-2 border-blue-600 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5"
            >
              <Video className="w-3.5 h-3.5" /> Video Consult
            </button>
            <button
              onClick={() => setBookingDoctor({ ...doctor, defaultType: 'in-person' })}
              className="flex-1 py-2.5 bg-blue-700 text-white rounded-xl text-xs font-bold hover:bg-blue-800 transition-colors flex items-center justify-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5" /> Book Appointment
            </button>
          </div>
        </div>

        {/* ── 2-Column Grid: Info left, Map right ── */}
        <div className="grid grid-cols-2 gap-4 items-start">

          {/* Left column — professional + clinic text */}
          <div className="space-y-4">

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <SectionHeader>Professional Details</SectionHeader>
              <InfoRow icon={GraduationCap} label="Education"      value={doctor.degree}         color="text-indigo-500" />
              <InfoRow icon={Stethoscope}   label="Specialization" value={doctor.specialization} color="text-blue-500"   />
              <InfoRow icon={Building2}     label="Department"     value={doctor.department}     color="text-emerald-500"/>
              <InfoRow icon={Building2}     label="Hospital"       value={doctor.hospital}       color="text-amber-500"  />
              <InfoRow icon={Award}         label="Reg. Number"    value={doctor.registrationNo} color="text-gray-400"   />
              {doctor.languages?.length > 0 && (
                <div className="flex items-start gap-3 pt-2">
                  <div className="w-7 h-7 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                    <Globe className="w-3.5 h-3.5 text-cyan-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1.5">Languages</p>
                    <div className="flex flex-wrap gap-1.5">
                      {doctor.languages.map(l => (
                        <span key={l} className="text-xs font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">{l}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {(doctor.clinic?.name || doctor.clinic?.address) && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <SectionHeader>Clinic Info</SectionHeader>
                <InfoRow icon={Building2} label="Clinic"   value={doctor.clinic?.name}    color="text-blue-500"   />
                <InfoRow icon={MapPin}    label="Address"  value={doctor.clinic?.address} color="text-red-500"    />
                <InfoRow icon={MapPin}    label="City"     value={[doctor.clinic?.city, doctor.clinic?.state, doctor.clinic?.pincode].filter(Boolean).join(', ')} color="text-orange-500" />
                <InfoRow icon={Phone}     label="Phone"    value={doctor.clinic?.phone}   color="text-green-500"  />
              </div>
            )}
          </div>

          {/* Right column — sticky map */}
          <div className="sticky top-16">
            {fullAddress ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <GoogleMap address={fullAddress} />
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
                <MapPin className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-xs text-gray-400 font-medium">Location not added</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Ratings & Reviews ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <SectionHeader>Ratings & Reviews</SectionHeader>

          {reviewsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !ratings || ratings.count === 0 ? (
            <div className="text-center py-8">
              <Star className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-500">No reviews yet</p>
              <p className="text-xs text-gray-400 mt-1">Reviews appear after completed appointments</p>
            </div>
          ) : (
            <>
              {/* Score + bar breakdown */}
              <div className="flex items-center gap-4 mb-4 p-4 bg-gray-50 rounded-xl">
                <div className="text-center shrink-0">
                  <p className="text-4xl font-black text-gray-900 leading-none">{ratings.avg}</p>
                  <RatingStars value={ratings.avg} size="w-3.5 h-3.5" />
                  <p className="text-xs text-gray-400 mt-1">{ratings.count} review{ratings.count !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex-1 space-y-1.5">
                  {[5,4,3,2,1].map(n => {
                    const pct = ratings.count > 0
                      ? Math.round(((ratings.breakdown[n] || 0) / ratings.count) * 100)
                      : 0;
                    return (
                      <div key={n} className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 w-3 shrink-0">{n}</span>
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-400 w-7 text-right shrink-0">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Review cards */}
              <div className="space-y-3">
                {displayedReviews.map(r => (
                  <div key={r._id} className="border border-gray-100 rounded-xl p-3.5">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                          <span className="text-xs font-black text-blue-700">
                            {(r.patient || 'A')[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-800">{r.patient}</p>
                          <p className="text-xs text-gray-400">
                            {(() => {
                              const parts = r.date.split('-').map(Number);
                              return new Date(parts[0], parts[1]-1, parts[2])
                                .toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
                            })()}
                          </p>
                        </div>
                      </div>
                      <RatingStars value={r.rating} size="w-3 h-3" />
                    </div>
                    {r.review && (
                      <p className="text-xs text-gray-600 leading-relaxed">{r.review}</p>
                    )}
                  </div>
                ))}
              </div>

              {ratings.reviews.length > 3 && (
                <button
                  onClick={() => setShowAllReviews(p => !p)}
                  className="w-full mt-3 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  {showAllReviews ? 'Show less' : `View all ${ratings.count} reviews`}
                </button>
              )}
            </>
          )}
        </div>

      </div>
    </div>

    {bookingDoctor && (
      <BookingModal
        doctor={bookingDoctor}
        defaultType={bookingDoctor.defaultType}
        onClose={() => setBookingDoctor(null)}
        onBooked={() => setBookingDoctor(null)}
      />
    )}
    </>
  );
}