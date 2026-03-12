import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Bell, Camera, Edit3, Save, X, CheckCircle,
  User, Stethoscope, MapPin, CreditCard,
  Star, Users, Calendar,
  Shield, AlertCircle, Eye, EyeOff
} from 'lucide-react';

// ─── Axios instance ───────────────────────────────────────────────────────────
const BASE_URL = 'https://nhbackend.onrender.com';
const api = axios.create({ baseURL: `${BASE_URL}/api` });

const getId = () => localStorage.getItem('doctorId');

// ─── Empty state (filled from MongoDB on load) ────────────────────────────────
const EMPTY = {
  personal: {
    name: '', email: '', phone: '', dob: '', gender: '', initials: '', photo: null,
  },
  professional: {
    specialty: '', subSpecialty: '', experience: '', degree: '',
    registrationNo: '', hospital: '', department: '', languages: [],
  },
  clinic: {
    name: '', address: '', city: '', state: '', pincode: '', phone: '', fee: '', videoFee: '',
  },
  bank: {
    accountName: '', accountNumber: '', ifsc: '', bankName: '', branch: '',
  },
};

const GENDER_OPTIONS   = ['Male', 'Female', 'Other', 'Prefer not to say'];
const LANGUAGE_OPTIONS = ['English', 'Tamil', 'Hindi', 'Telugu', 'Kannada', 'Malayalam', 'Marathi'];

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, onClose }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-gray-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl">
      <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
      <p className="text-sm font-semibold">{message}</p>
      <button onClick={onClose}><X className="w-4 h-4 text-gray-400 hover:text-white" /></button>
    </div>
  );
}

// ─── Section Wrapper ──────────────────────────────────────────────────────────
function Section({ title, icon: Icon, children, editing, saving, onEdit, onSave, onCancel }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
          <Icon className="w-4 h-4 text-blue-600" />
          {title}
        </h3>
        {!editing ? (
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-50 rounded-xl transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl transition-colors disabled:opacity-70 min-w-[70px] justify-center"
            >
              {saving
                ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Save className="w-3.5 h-3.5" />
              }
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────
function Field({ label, value, editing, onChange, type = 'text', options }) {
  return (
    <div>
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">{label}</p>
      {editing ? (
        options ? (
          <select
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white transition"
          >
            {options.map(o => <option key={o}>{o}</option>)}
          </select>
        ) : (
          <input
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
          />
        )
      ) : (
        <p className="text-sm font-semibold text-gray-900">
          {value || <span className="text-gray-400 font-normal">—</span>}
        </p>
      )}
    </div>
  );
}

// ─── Password Modal ───────────────────────────────────────────────────────────
function PasswordModal({ onClose }) {
  const [form, setForm]     = useState({ current: '', newPass: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, newPass: false, confirm: false });
  const [error, setError]   = useState('');
  const [saving, setSaving] = useState(false);

  const toggle = key => setShowPw(p => ({ ...p, [key]: !p[key] }));

  const handleUpdate = async () => {
    if (!form.current || !form.newPass || !form.confirm) {
      setError('All fields are required'); return;
    }
    if (form.newPass !== form.confirm) {
      setError('New passwords do not match'); return;
    }
    if (form.newPass.length < 8) {
      setError('Password must be at least 8 characters'); return;
    }
    setSaving(true);
    try {
      await api.put(`/doctor/profile/${getId()}/password`, {
        currentPassword: form.current,
        newPassword:     form.newPass,
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Change Password</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {[
            { key: 'current', label: 'Current Password' },
            { key: 'newPass', label: 'New Password'     },
            { key: 'confirm', label: 'Confirm Password' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">{label}</label>
              <div className="relative">
                <input
                  type={showPw[key] ? 'text' : 'password'}
                  value={form[key]}
                  onChange={e => { setForm(p => ({ ...p, [key]: e.target.value })); setError(''); }}
                  className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
                />
                <button onClick={() => toggle(key)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={saving}
            className="flex-1 py-2.5 bg-blue-700 text-white rounded-xl text-sm font-bold hover:bg-blue-800 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {saving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {saving ? 'Updating...' : 'Update'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function DoctorProfile() {
  const [data, setData]       = useState(EMPTY);
  const [draft, setDraft]     = useState(EMPTY);
  const [editing, setEditing] = useState({ personal: false, professional: false, clinic: false, bank: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(null);
  const [toast, setToast]     = useState(null);
  const [showPwModal, setShowPwModal] = useState(false);
  const [langInput, setLangInput]    = useState('');

  // ── 1. Load profile from MongoDB on mount ─────────────────────────────────
  useEffect(() => {
    const doctorId = getId();
    if (!doctorId) {
      showToast('Not logged in');
      setLoading(false);
      return;
    }
    api.get(`/doctor/profile/${doctorId}`)
      .then(res => {
        setData(res.data);
        setDraft(res.data);
      })
      .catch(() => showToast('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  // ── 2. Save section to MongoDB ────────────────────────────────────────────
  const saveEdit = async (section) => {
    setSaving(section);
    try {
      const res = await api.put(`/doctor/profile/${getId()}/${section}`, draft[section]);
      setData(res.data);
      setEditing(p => ({ ...p, [section]: false }));
      showToast(`${section.charAt(0).toUpperCase() + section.slice(1)} saved successfully!`);
    } catch (err) {
      showToast(err.response?.data?.error || 'Save failed. Try again.');
    } finally {
      setSaving(null);
    }
  };

  // ── 3. Photo upload → base64 → MongoDB ───────────────────────────────────
  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      // Show preview instantly
      setData(p => ({ ...p, personal: { ...p.personal, photo: base64 } }));
      // Save to MongoDB
      try {
        await api.put(`/doctor/profile/${getId()}/photo`, { photo: base64 });
        showToast('Photo updated!');
      } catch {
        showToast('Photo upload failed');
      }
    };
    reader.readAsDataURL(file);
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const showToast   = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3500); };
  const startEdit   = (s) => { setDraft(p => ({ ...p, [s]: { ...data[s] } })); setEditing(p => ({ ...p, [s]: true })); };
  const cancelEdit  = (s) => setEditing(p => ({ ...p, [s]: false }));
  const updateDraft = (s, f, v) => setDraft(p => ({ ...p, [s]: { ...p[s], [f]: v } }));

  const addLanguage = (lang) => {
    if (lang && !draft.professional.languages.includes(lang)) {
      updateDraft('professional', 'languages', [...draft.professional.languages, lang]);
    }
    setLangInput('');
  };
  const removeLanguage = (lang) =>
    updateDraft('professional', 'languages', draft.professional.languages.filter(l => l !== lang));

  const e = editing;

  // ── Loading screen ─────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-700 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-500 font-medium">Loading profile...</p>
      </div>
    </div>
  );

  return (
    <>
    <div className="flex-1 overflow-auto bg-gray-50">

      {/* ── Top Bar ── */}
      <header className="bg-white border-b border-gray-200 px-8 py-[15px] flex items-center justify-between sticky top-0 z-10">
        <div>
          <p className="text-gray-500 text-sm">Manage your professional information</p>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Profile</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
          </button>
          <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
            <div className="w-9 h-9 bg-blue-700 rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden">
              {data.personal.photo
                ? <img src={data.personal.photo} alt="" className="w-full h-full object-cover" />
                : (data.personal.initials || 'DR')
              }
            </div>
            <span className="font-semibold text-gray-800 text-sm">
              {data.personal.name ? data.personal.name.split(' ').slice(0, 2).join(' ') : 'Doctor'}
            </span>
          </div>
        </div>
      </header>

      <div className="p-8 space-y-6">

        {/* ── Profile Hero ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-blue-700 to-blue-500 relative">
            <div
              className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }}
            />
          </div>

          <div className="px-8 pt-4 pb-6 flex items-start gap-6">

            {/* Avatar */}
            <div className="relative shrink-0 -mt-14">
              <div className="w-24 h-24 bg-blue-700 rounded-full border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
                {data.personal.photo
                  ? <img src={data.personal.photo} alt="Profile" className="w-full h-full object-cover" />
                  : <span className="text-white font-bold text-2xl">{data.personal.initials || 'DR'}</span>
                }
              </div>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
              <label
                htmlFor="photo-upload"
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center border-2 border-white hover:bg-blue-800 transition-colors cursor-pointer shadow-md"
                title="Upload photo"
              >
                <Camera className="w-3.5 h-3.5 text-white" />
              </label>
            </div>

            {/* Name + badges */}
            <div className="flex-1 min-w-0 pt-1">
              <h2 className="text-xl font-bold text-gray-900 truncate">{data.personal.name || '—'}</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {data.professional.specialty || 'Specialty not set'} · {data.professional.hospital || 'Hospital not set'}
              </p>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> 4.9 Rating
                </span>
                <span className="flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                  <Users className="w-3 h-3" /> 528 Patients
                </span>
                {data.professional.experience && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                    <Calendar className="w-3 h-3" /> {data.professional.experience} yrs exp
                  </span>
                )}
              </div>
            </div>

            {/* Reg No */}
            <div className="shrink-0 text-right pt-1">
              <p className="text-xs text-gray-400 font-medium">Reg. Number</p>
              <p className="text-sm font-bold text-gray-700 mt-0.5">{data.professional.registrationNo || '—'}</p>
              {data.professional.registrationNo && (
                <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200 mt-2">
                  <CheckCircle className="w-3 h-3" /> Verified
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Two Column Layout ── */}
        <div className="grid grid-cols-3 gap-6">

          {/* Left: Personal + Clinic + Bank */}
          <div className="col-span-2 space-y-5">

            <Section title="Personal Information" icon={User}
              editing={e.personal} saving={saving === 'personal'}
              onEdit={() => startEdit('personal')} onSave={() => saveEdit('personal')} onCancel={() => cancelEdit('personal')}
            >
              <div className="grid grid-cols-2 gap-4">
                <Field label="Full Name"     value={e.personal ? draft.personal.name   : data.personal.name}   editing={e.personal} onChange={v => updateDraft('personal', 'name', v)} />
                <Field label="Email"         value={e.personal ? draft.personal.email  : data.personal.email}  editing={e.personal} onChange={v => updateDraft('personal', 'email', v)} type="email" />
                <Field label="Phone"         value={e.personal ? draft.personal.phone  : data.personal.phone}  editing={e.personal} onChange={v => updateDraft('personal', 'phone', v)} type="tel" />
                <Field label="Date of Birth" value={e.personal ? draft.personal.dob    : data.personal.dob}    editing={e.personal} onChange={v => updateDraft('personal', 'dob', v)} type="date" />
                <Field label="Gender"        value={e.personal ? draft.personal.gender : data.personal.gender} editing={e.personal} onChange={v => updateDraft('personal', 'gender', v)} options={GENDER_OPTIONS} />
              </div>
            </Section>

            <Section title="Clinic & Consultation" icon={MapPin}
              editing={e.clinic} saving={saving === 'clinic'}
              onEdit={() => startEdit('clinic')} onSave={() => saveEdit('clinic')} onCancel={() => cancelEdit('clinic')}
            >
              <div className="grid grid-cols-2 gap-4">
                <Field label="Clinic Name"       value={e.clinic ? draft.clinic.name     : data.clinic.name}     editing={e.clinic} onChange={v => updateDraft('clinic', 'name', v)} />
                <Field label="Clinic Phone"      value={e.clinic ? draft.clinic.phone    : data.clinic.phone}    editing={e.clinic} onChange={v => updateDraft('clinic', 'phone', v)} type="tel" />
                <Field label="Address"           value={e.clinic ? draft.clinic.address  : data.clinic.address}  editing={e.clinic} onChange={v => updateDraft('clinic', 'address', v)} />
                <Field label="City"              value={e.clinic ? draft.clinic.city     : data.clinic.city}     editing={e.clinic} onChange={v => updateDraft('clinic', 'city', v)} />
                <Field label="State"             value={e.clinic ? draft.clinic.state    : data.clinic.state}    editing={e.clinic} onChange={v => updateDraft('clinic', 'state', v)} />
                <Field label="Pincode"           value={e.clinic ? draft.clinic.pincode  : data.clinic.pincode}  editing={e.clinic} onChange={v => updateDraft('clinic', 'pincode', v)} />
                <Field label="In-Person Fee (₹)" value={e.clinic ? draft.clinic.fee      : data.clinic.fee}      editing={e.clinic} onChange={v => updateDraft('clinic', 'fee', v)} type="number" />
                <Field label="Video Fee (₹)"     value={e.clinic ? draft.clinic.videoFee : data.clinic.videoFee} editing={e.clinic} onChange={v => updateDraft('clinic', 'videoFee', v)} type="number" />
              </div>
            </Section>

            <Section title="Bank & Payout" icon={CreditCard}
              editing={e.bank} saving={saving === 'bank'}
              onEdit={() => startEdit('bank')} onSave={() => saveEdit('bank')} onCancel={() => cancelEdit('bank')}
            >
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex gap-2 mb-4">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">Bank details are used for monthly payouts. Changes are reviewed within 2 business days.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Account Name"   value={e.bank ? draft.bank.accountName   : data.bank.accountName}   editing={e.bank} onChange={v => updateDraft('bank', 'accountName', v)} />
                <Field label="Account Number" value={e.bank ? draft.bank.accountNumber : data.bank.accountNumber} editing={e.bank} onChange={v => updateDraft('bank', 'accountNumber', v)} />
                <Field label="IFSC Code"      value={e.bank ? draft.bank.ifsc          : data.bank.ifsc}           editing={e.bank} onChange={v => updateDraft('bank', 'ifsc', v)} />
                <Field label="Bank Name"      value={e.bank ? draft.bank.bankName      : data.bank.bankName}       editing={e.bank} onChange={v => updateDraft('bank', 'bankName', v)} />
                <Field label="Branch"         value={e.bank ? draft.bank.branch        : data.bank.branch}         editing={e.bank} onChange={v => updateDraft('bank', 'branch', v)} />
              </div>
            </Section>
          </div>

          {/* Right: Professional + Account */}
          <div className="space-y-5">

            <Section title="Professional" icon={Stethoscope}
              editing={e.professional} saving={saving === 'professional'}
              onEdit={() => startEdit('professional')} onSave={() => saveEdit('professional')} onCancel={() => cancelEdit('professional')}
            >
              <div className="space-y-4">
                <Field label="Specialty"        value={e.professional ? draft.professional.specialty      : data.professional.specialty}      editing={e.professional} onChange={v => updateDraft('professional', 'specialty', v)} />
                <Field label="Sub-specialty"    value={e.professional ? draft.professional.subSpecialty   : data.professional.subSpecialty}   editing={e.professional} onChange={v => updateDraft('professional', 'subSpecialty', v)} />
                <Field label="Experience (yrs)" value={e.professional ? draft.professional.experience     : data.professional.experience}     editing={e.professional} onChange={v => updateDraft('professional', 'experience', v)} type="number" />
                <Field label="Degree"           value={e.professional ? draft.professional.degree         : data.professional.degree}         editing={e.professional} onChange={v => updateDraft('professional', 'degree', v)} />
                <Field label="Reg. Number"      value={e.professional ? draft.professional.registrationNo : data.professional.registrationNo} editing={e.professional} onChange={v => updateDraft('professional', 'registrationNo', v)} />
                <Field label="Hospital"         value={e.professional ? draft.professional.hospital       : data.professional.hospital}       editing={e.professional} onChange={v => updateDraft('professional', 'hospital', v)} />
                <Field label="Department"       value={e.professional ? draft.professional.department     : data.professional.department}     editing={e.professional} onChange={v => updateDraft('professional', 'department', v)} />
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Languages</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(e.professional ? draft.professional.languages : data.professional.languages).map(lang => (
                      <span key={lang} className="flex items-center gap-1 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full">
                        {lang}
                        {e.professional && (
                          <button onClick={() => removeLanguage(lang)} className="text-blue-400 hover:text-red-500 transition-colors">
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    ))}
                    {e.professional && (
                      <select value={langInput} onChange={e => addLanguage(e.target.value)}
                        className="text-xs font-semibold bg-gray-50 border border-gray-200 text-gray-600 px-2 py-1 rounded-full outline-none cursor-pointer">
                        <option value="">+ Add</option>
                        {LANGUAGE_OPTIONS.filter(l => !draft.professional.languages.includes(l)).map(l => (
                          <option key={l}>{l}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>
            </Section>

            {/* Account Settings */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 mb-4">
                <Shield className="w-4 h-4 text-blue-600" /> Account Settings
              </h3>
              <div className="space-y-2.5">
                <button onClick={() => setShowPwModal(true)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors text-left">
                  <div>
                    <p className="text-sm font-bold text-gray-900">Change Password</p>
                    <p className="text-xs text-gray-400">Update your login password</p>
                  </div>
                  <Shield className="w-4 h-4 text-gray-400" />
                </button>
                <button className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors text-left">
                  <div>
                    <p className="text-sm font-bold text-gray-900">Notification Preferences</p>
                    <p className="text-xs text-gray-400">Email, SMS, in-app alerts</p>
                  </div>
                  <Bell className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <div className="mt-5 pt-4 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2.5">Danger Zone</p>
                <button className="w-full py-2.5 border border-red-200 text-red-600 text-sm font-bold rounded-xl hover:bg-red-50 transition-colors">
                  Deactivate Account
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      {showPwModal && <PasswordModal onClose={() => setShowPwModal(false)} />}
    </div>
    </>
  );
}