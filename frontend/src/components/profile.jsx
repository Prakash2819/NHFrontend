import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Bell, Camera, Edit3, Save, X, CheckCircle,
  User, MapPin, Shield, AlertCircle, Phone,
  Heart, Plus, Trash2, Eye, EyeOff
} from 'lucide-react';

// ─── Axios ────────────────────────────────────────────────────────────────────
const BASE_URL = 'https://nhbackend.onrender.com';
const api = axios.create({ baseURL: `${BASE_URL}/api` });
const getId = () => localStorage.getItem('patientId');

// ─── Empty state ──────────────────────────────────────────────────────────────
const EMPTY = {
  personal: {
    name: '', email: '', phone: '', dob: '', gender: '',
    photo: null, bloodGroup: '', height: '', weight: '',
  },
  address: { line1: '', city: '', state: '', pincode: '' },
  emergency: { name: '', relationship: '', phone: '' },
  medical: { allergies: [], conditions: [] },
};

const GENDER_OPTIONS      = ['Male', 'Female', 'Other', 'Prefer not to say'];
const BLOOD_GROUP_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const ALLERGY_OPTIONS     = ['Penicillin', 'Aspirin', 'Sulfa drugs', 'Latex', 'Peanuts', 'Shellfish', 'Dust', 'Pollen'];
const CONDITION_OPTIONS   = ['Diabetes', 'Hypertension', 'Asthma', 'Heart Disease', 'Thyroid', 'Arthritis'];

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
          <button onClick={onEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-50 rounded-xl transition-colors">
            <Edit3 className="w-3.5 h-3.5" /> Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={onCancel}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
            <button onClick={onSave} disabled={saving}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl transition-colors disabled:opacity-70 min-w-[70px] justify-center">
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
          <select value={value} onChange={e => onChange(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white transition">
            <option value="">Select...</option>
            {options.map(o => <option key={o}>{o}</option>)}
          </select>
        ) : (
          <input type={type} value={value} onChange={e => onChange(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition" />
        )
      ) : (
        <p className="text-sm font-semibold text-gray-900">
          {value || <span className="text-gray-400 font-normal">—</span>}
        </p>
      )}
    </div>
  );
}

// ─── Tag list (allergies / conditions) ───────────────────────────────────────
function TagField({ label, items, editing, onAdd, onRemove, options }) {
  return (
    <div>
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map(item => (
          <span key={item} className="flex items-center gap-1 text-xs font-semibold bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-full">
            {item}
            {editing && (
              <button onClick={() => onRemove(item)} className="text-red-400 hover:text-red-600 transition-colors">
                <X className="w-3 h-3" />
              </button>
            )}
          </span>
        ))}
        {editing && (
          <select onChange={e => { if (e.target.value) onAdd(e.target.value); e.target.value = ''; }}
            className="text-xs font-semibold bg-gray-50 border border-gray-200 text-gray-600 px-2 py-1 rounded-full outline-none cursor-pointer">
            <option value="">+ Add</option>
            {options.filter(o => !items.includes(o)).map(o => <option key={o}>{o}</option>)}
          </select>
        )}
        {!editing && items.length === 0 && <span className="text-sm text-gray-400 font-normal">None</span>}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function PatientProfile() {
  const [data, setData]       = useState(EMPTY);
  const [draft, setDraft]     = useState(EMPTY);
  const [editing, setEditing] = useState({ personal: false, address: false, emergency: false, medical: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(null);
  const [toast, setToast]     = useState(null);

  // ── 1. Load profile ───────────────────────────────────────────────────────
  useEffect(() => {
    const patientId = getId();
    if (!patientId) { setLoading(false); return; }

    api.get(`/patient/profile/${patientId}`)
      .then(res => { setData(res.data); setDraft(res.data); })
      .catch(() => showToast('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  // ── 2. Save section ───────────────────────────────────────────────────────
  const saveEdit = async (section) => {
    setSaving(section);
    try {
      const res = await api.put(`/patient/profile/${getId()}/${section}`, draft[section]);
      setData(res.data);
      setEditing(p => ({ ...p, [section]: false }));
      showToast('Saved successfully!');
    } catch (err) {
      showToast(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(null);
    }
  };

  // ── 3. Photo upload ───────────────────────────────────────────────────────
  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      setData(p => ({ ...p, personal: { ...p.personal, photo: base64 } }));
      try {
        await api.put(`/patient/profile/${getId()}/photo`, { photo: base64 });
        showToast('Photo updated!');
      } catch { showToast('Photo upload failed'); }
    };
    reader.readAsDataURL(file);
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const showToast   = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3500); };
  const startEdit   = (s) => { setDraft(p => ({ ...p, [s]: { ...data[s] } })); setEditing(p => ({ ...p, [s]: true })); };
  const cancelEdit  = (s) => setEditing(p => ({ ...p, [s]: false }));
  const updateDraft = (s, f, v) => setDraft(p => ({ ...p, [s]: { ...p[s], [f]: v } }));

  const addTag    = (section, field, val) => {
    if (!draft[section][field].includes(val))
      setDraft(p => ({ ...p, [section]: { ...p[section], [field]: [...p[section][field], val] } }));
  };
  const removeTag = (section, field, val) =>
    setDraft(p => ({ ...p, [section]: { ...p[section], [field]: p[section][field].filter(v => v !== val) } }));

  const e = editing;

  // ── Compute age from DOB ──────────────────────────────────────────────────
  const age = data.personal.dob
    ? Math.floor((new Date() - new Date(data.personal.dob)) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
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
          <p className="text-gray-500 text-sm">Manage your health information</p>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">My Profile</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
          </button>
          <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden">
              {data.personal.photo
                ? <img src={data.personal.photo} alt="" className="w-full h-full object-cover" />
                : (data.personal.name?.[0]?.toUpperCase() || 'P')
              }
            </div>
            <span className="font-semibold text-gray-800 text-sm">
              {data.personal.name ? data.personal.name.split(' ')[0] : 'Patient'}
            </span>
          </div>
        </div>
      </header>

      <div className="p-8 space-y-6">

        {/* ── Profile Hero ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-28 bg-gradient-to-r from-blue-600 to-blue-400 relative">
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          </div>

          <div className="px-8 pt-4 pb-6 flex items-start gap-6">
            {/* Avatar */}
            <div className="relative shrink-0 -mt-14">
              <div className="w-24 h-24 bg-blue-600 rounded-full border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
                {data.personal.photo
                  ? <img src={data.personal.photo} alt="Profile" className="w-full h-full object-cover" />
                  : <span className="text-white font-bold text-2xl">{data.personal.name?.[0]?.toUpperCase() || 'P'}</span>
                }
              </div>
              <input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              <label htmlFor="photo-upload"
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white hover:bg-blue-700 transition-colors cursor-pointer shadow-md">
                <Camera className="w-3.5 h-3.5 text-white" />
              </label>
            </div>

            {/* Name + details */}
            <div className="flex-1 min-w-0 pt-1">
              <h2 className="text-xl font-bold text-gray-900">{data.personal.name || '—'}</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {data.personal.gender && `${data.personal.gender}`}
                {age && ` · ${age} years old`}
              </p>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {data.personal.bloodGroup && (
                  <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                    🩸 {data.personal.bloodGroup}
                  </span>
                )}
                {data.personal.phone && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-gray-600 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-200">
                    <Phone className="w-3 h-3" /> {data.personal.phone}
                  </span>
                )}
                {data.medical.allergies.length > 0 && (
                  <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    ⚠️ {data.medical.allergies.length} Allerg{data.medical.allergies.length > 1 ? 'ies' : 'y'}
                  </span>
                )}
              </div>
            </div>

            {/* Health quick stats */}
            {(data.personal.height || data.personal.weight) && (
              <div className="shrink-0 text-right pt-1 space-y-1">
                {data.personal.height && (
                  <div>
                    <p className="text-xs text-gray-400">Height</p>
                    <p className="text-sm font-bold text-gray-700">{data.personal.height} cm</p>
                  </div>
                )}
                {data.personal.weight && (
                  <div>
                    <p className="text-xs text-gray-400">Weight</p>
                    <p className="text-sm font-bold text-gray-700">{data.personal.weight} kg</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Two column layout ── */}
        <div className="grid grid-cols-3 gap-6">

          {/* Left: Personal + Address */}
          <div className="col-span-2 space-y-5">

            {/* Personal Info */}
            <Section title="Personal Information" icon={User}
              editing={e.personal} saving={saving === 'personal'}
              onEdit={() => startEdit('personal')} onSave={() => saveEdit('personal')} onCancel={() => cancelEdit('personal')}
            >
              <div className="grid grid-cols-2 gap-4">
                <Field label="Full Name"     value={e.personal ? draft.personal.name        : data.personal.name}        editing={e.personal} onChange={v => updateDraft('personal', 'name', v)} />
                <Field label="Email"         value={e.personal ? draft.personal.email       : data.personal.email}       editing={e.personal} onChange={v => updateDraft('personal', 'email', v)} type="email" />
                <Field label="Date of Birth" value={e.personal ? draft.personal.dob         : data.personal.dob}         editing={e.personal} onChange={v => updateDraft('personal', 'dob', v)} type="date" />
                <Field label="Gender"        value={e.personal ? draft.personal.gender      : data.personal.gender}      editing={e.personal} onChange={v => updateDraft('personal', 'gender', v)} options={GENDER_OPTIONS} />
                <Field label="Blood Group"   value={e.personal ? draft.personal.bloodGroup  : data.personal.bloodGroup}  editing={e.personal} onChange={v => updateDraft('personal', 'bloodGroup', v)} options={BLOOD_GROUP_OPTIONS} />
                <Field label="Phone"         value={e.personal ? draft.personal.phone       : data.personal.phone}       editing={e.personal} onChange={v => updateDraft('personal', 'phone', v)} type="tel" />
                <Field label="Height (cm)"   value={e.personal ? draft.personal.height      : data.personal.height}      editing={e.personal} onChange={v => updateDraft('personal', 'height', v)} type="number" />
                <Field label="Weight (kg)"   value={e.personal ? draft.personal.weight      : data.personal.weight}      editing={e.personal} onChange={v => updateDraft('personal', 'weight', v)} type="number" />
              </div>
            </Section>

            {/* Address */}
            <Section title="Address" icon={MapPin}
              editing={e.address} saving={saving === 'address'}
              onEdit={() => startEdit('address')} onSave={() => saveEdit('address')} onCancel={() => cancelEdit('address')}
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Field label="Address Line" value={e.address ? draft.address.line1   : data.address.line1}   editing={e.address} onChange={v => updateDraft('address', 'line1', v)} />
                </div>
                <Field label="City"    value={e.address ? draft.address.city    : data.address.city}    editing={e.address} onChange={v => updateDraft('address', 'city', v)} />
                <Field label="State"   value={e.address ? draft.address.state   : data.address.state}   editing={e.address} onChange={v => updateDraft('address', 'state', v)} />
                <Field label="Pincode" value={e.address ? draft.address.pincode : data.address.pincode} editing={e.address} onChange={v => updateDraft('address', 'pincode', v)} />
              </div>
            </Section>
          </div>

          {/* Right: Medical + Emergency */}
          <div className="space-y-5">

            {/* Medical Info */}
            <Section title="Medical Info" icon={Heart}
              editing={e.medical} saving={saving === 'medical'}
              onEdit={() => startEdit('medical')} onSave={() => saveEdit('medical')} onCancel={() => cancelEdit('medical')}
            >
              <div className="space-y-4">
                <TagField
                  label="Allergies"
                  items={e.medical ? draft.medical.allergies : data.medical.allergies}
                  editing={e.medical}
                  options={ALLERGY_OPTIONS}
                  onAdd={v => addTag('medical', 'allergies', v)}
                  onRemove={v => removeTag('medical', 'allergies', v)}
                />
                <TagField
                  label="Chronic Conditions"
                  items={e.medical ? draft.medical.conditions : data.medical.conditions}
                  editing={e.medical}
                  options={CONDITION_OPTIONS}
                  onAdd={v => addTag('medical', 'conditions', v)}
                  onRemove={v => removeTag('medical', 'conditions', v)}
                />
              </div>
            </Section>

            {/* Emergency Contact */}
            <Section title="Emergency Contact" icon={Phone}
              editing={e.emergency} saving={saving === 'emergency'}
              onEdit={() => startEdit('emergency')} onSave={() => saveEdit('emergency')} onCancel={() => cancelEdit('emergency')}
            >
              <div className="space-y-4">
                <Field label="Name"         value={e.emergency ? draft.emergency.name         : data.emergency.name}         editing={e.emergency} onChange={v => updateDraft('emergency', 'name', v)} />
                <Field label="Relationship" value={e.emergency ? draft.emergency.relationship : data.emergency.relationship} editing={e.emergency} onChange={v => updateDraft('emergency', 'relationship', v)} />
                <Field label="Phone"        value={e.emergency ? draft.emergency.phone        : data.emergency.phone}        editing={e.emergency} onChange={v => updateDraft('emergency', 'phone', v)} type="tel" />
              </div>
            </Section>

            {/* Privacy note */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3">
              <Shield className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-blue-800 mb-1">Your data is secure</p>
                <p className="text-xs text-blue-600 leading-relaxed">
                  Your health information is encrypted and only shared with doctors you consult.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
    </>
  );
}