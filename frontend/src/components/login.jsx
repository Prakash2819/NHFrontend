import logo from '../assets/logo.png'
import promo from '../assets/promo.gif'
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { auth } from "../firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { X, User, Mail, Calendar, ChevronRight, CheckCircle } from 'lucide-react';

// ─── Onboarding Popup ─────────────────────────────────────────────────────────
function OnboardingPopup({ patientId, onComplete }) {
  const [step, setStep] = useState(1); // 1 = name/email, 2 = dob/gender
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', email: '', dob: '', gender: '',
  });

  const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say'];

  const update = (field, value) => {
    setForm(p => ({ ...p, [field]: value }));
    setError('');
  };

  const handleNext = () => {
    if (!form.name.trim()) { setError('Please enter your name'); return; }
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!form.dob) { setError('Please enter your date of birth'); return; }
    if (!form.gender) { setError('Please select your gender'); return; }

    setSaving(true);
    try {
      const res = await axios.post(
        `https://nhbackend.onrender.com/api/patient/onboard/${patientId}`,
        form
      );
      // Save name to localStorage for display
      localStorage.setItem('patientName', res.data.personal.name);
      onComplete(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-500 px-8 pt-8 pb-6 text-white">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
            <User className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold">Welcome to Namma Hospitals!</h2>
          <p className="text-blue-100 text-sm mt-1">Tell us a little about yourself to get started</p>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-5">
            <div className={`w-8 h-1.5 rounded-full transition-colors ${step >= 1 ? 'bg-white' : 'bg-white/30'}`} />
            <div className={`w-8 h-1.5 rounded-full transition-colors ${step >= 2 ? 'bg-white' : 'bg-white/30'}`} />
          </div>
        </div>

        {/* Body */}
        <div className="px-8 py-6">

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">Step 1 of 2 — Basic Info</p>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => update('name', e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">
                  Email Address <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => update('email', e.target.value)}
                    placeholder="your@email.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>
              </div>

              {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

              <button
                onClick={handleNext}
                className="w-full py-3 bg-blue-700 text-white rounded-xl font-bold text-sm hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 mt-2"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">Step 2 of 2 — Health Info</p>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={form.dob}
                    onChange={e => update('dob', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">
                  Gender <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {GENDER_OPTIONS.map(g => (
                    <button
                      key={g}
                      onClick={() => update('gender', g)}
                      className={`py-2.5 px-3 rounded-xl text-sm font-semibold border transition-colors ${form.gender === g
                          ? 'bg-blue-700 text-white border-blue-700'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                        }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => { setStep(1); setError(''); }}
                  className="flex-1 py-3 border border-gray-200 rounded-xl font-semibold text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="flex-1 py-3 bg-blue-700 text-white rounded-xl font-bold text-sm hover:bg-blue-800 disabled:opacity-70 transition-colors flex items-center justify-center gap-2"
                >
                  {saving
                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <CheckCircle className="w-4 h-4" />
                  }
                  {saving ? 'Saving...' : 'Get Started'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400 pb-5">
          You can update your details anytime in your profile
        </p>
      </div>
    </div>
  );
}

// ─── Main LoginPage ───────────────────────────────────────────────────────────
export function LoginPage({ onLogin, onSignup }) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [userRole, setUserRole] = useState("patient");
  const [doctorAuthMode, setDoctorAuthMode] = useState("login");
  const [loading, setLoading] = useState(false);

  // ── Onboarding popup state ──
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [pendingPatientId, setPendingPatientId] = useState(null);

  const [passwordRules, setPasswordRules] = useState({
    length: false, uppercase: false, lowercase: false, number: false, special: false
  });
  const isPasswordValid = Object.values(passwordRules).every(Boolean);

  const [doctorData, setDoctorData] = useState({
    name: "", email: "", password: "", specialization: "", registrationNo: ""
  });
  const [doctorError, setDoctorError] = useState("");

  const handleDoctorChange = (e) => {
    const { name, value } = e.target;
    setDoctorData({ ...doctorData, [name]: value });
    if (name === "password") {
      setPasswordRules({
        length: value.length >= 8,
        uppercase: /[A-Z]/.test(value),
        lowercase: /[a-z]/.test(value),
        number: /\d/.test(value),
        special: /[@$!%*?&]/.test(value)
      });
    }
    setDoctorError("");
  };

  const handleDoctorSignup = async () => {
    const { name, email, password, specialization, registrationNo } = doctorData;

    if (!name || !email || !password || !specialization || !registrationNo) {
      setDoctorError("All fields are required");
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      setDoctorError("Please enter a valid email address");
      return;
    }

    const regNoRegex = /^[A-Za-z0-9\/\-\s]{5,25}$/;
    if (!regNoRegex.test(registrationNo.trim())) {
      setDoctorError("Invalid medical registration number");
      return;
    }

    if (!isPasswordValid) {
      setDoctorError("Password does not meet all requirements");
      return;
    }

    try {
      await axios.post("https://nhbackend.onrender.com/api/doctor-signup", doctorData);
      alert("Signup successful. Waiting for admin approval.");
      setDoctorAuthMode("login");
    } catch (error) {
      setDoctorError(error.response?.data?.message || "Signup failed");
    }
  };

  const handleDoctorLogin = async () => {
    const { email, password } = doctorData;
    if (!email || !password) { setDoctorError("Email and password required"); return; }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(email)) { setDoctorError("Please enter a valid email address"); return; }
    try {
      const res = await axios.post("https://nhbackend.onrender.com/api/doctor-login", { email, password });
      const doctor = res.data.doctor;
      localStorage.setItem("role", doctor.role);
      localStorage.setItem("userId", doctor._id);
      localStorage.setItem("doctorId", doctor._id);
      localStorage.setItem("doctorName", doctor.name);
      onLogin("doctor");
    } catch (error) {
      setDoctorError(error.response?.data?.message || "Login failed");
    }
  };

  const recaptchaRef = useRef(null);
  const handleSubmit = (e) => e.preventDefault();

  const setupRecaptcha = async () => {
    if (recaptchaRef.current) return;
    recaptchaRef.current = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
    await recaptchaRef.current.render();
  };

  const resetRecaptcha = () => {
    if (recaptchaRef.current) { recaptchaRef.current.clear(); recaptchaRef.current = null; }
  };

  useEffect(() => { setupRecaptcha(); }, []);

  const sendOTP = async () => {
    if (!phone || phone.length !== 10) { setPhoneError("Enter valid 10-digit mobile number"); return; }
    setPhoneError(""); setOtp(""); setOtpError("");
    try {
      setLoading(true);
      if (!recaptchaRef.current) await setupRecaptcha();
      const result = await signInWithPhoneNumber(auth, "+91" + phone, recaptchaRef.current);
      setConfirmationResult(result);
    } catch (error) {
      setPhoneError(error.message);
      resetRecaptcha();
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp || otp.length !== 6) { setOtpError("Enter valid 6-digit OTP"); return; }
    setOtpError("");
    try {
      setLoading(true);
      const userCredential = await confirmationResult.confirm(otp);
      const verifiedPhone = userCredential.user.phoneNumber;

      const res = await axios.post("https://nhbackend.onrender.com/api/mobile-login", { phone: verifiedPhone });
      const user = res.data.user;

      localStorage.setItem("role", user.role);
      localStorage.setItem("userId", user._id);
      localStorage.setItem("patientId", user._id); // ← save patientId

      setOtp(""); setOtpError("");

      // ── If first time → show onboarding popup ──
      if (!user.isOnboarded) {
        setPendingPatientId(user._id);
        setShowOnboarding(true);
      } else {
        // Already onboarded → go straight to dashboard
        localStorage.setItem("patientName", user.name || '');
        onLogin(user.role);
      }

    } catch (error) {
      setOtpError("Invalid OTP");
      setLoading(false);
    }
  };

  // Called when onboarding popup is completed
  const handleOnboardingComplete = (profileData) => {
    setShowOnboarding(false);
    onLogin("patient");
  };

  return (
    <>
      <div className="min-h-screen flex">

        {/* LEFT SIDE */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-700 to-blue-600 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center p-12">
            <div className="text-center text-white">
              <h1 className="text-4xl font-bold mb-6">Welcome Back</h1>
              <p className="text-xl mb-8">Continue your healthcare journey with us</p>
              <img src={promo} alt="Doctor consulting patient" className="rounded-2xl shadow-2xl" />
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex-1 flex items-center justify-center p-8 bg-white">
          <div className="w-full max-w-md">

            <div className="mb-5">
              <img src={logo} alt="Namma Hospitals Logo" className="w-1/2 h-1/4 mb-4" />
              <h2 className="text-3xl font-bold mb-2">Sign In</h2>
              <p className="text-gray-600">Welcome back! Please enter your details.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* ROLE SELECTION */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">Login As</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button"
                    onClick={() => { setUserRole("patient"); setConfirmationResult(null); resetRecaptcha(); setupRecaptcha(); }}
                    className={`py-3 px-4 border-2 rounded-lg font-medium transition-all ${userRole === "patient" ? "border-blue-700 bg-blue-50 text-blue-700" : "border-gray-200 hover:border-gray-300"}`}>
                    Patient
                  </button>
                  <button type="button"
                    onClick={() => { setUserRole("doctor"); setConfirmationResult(null); resetRecaptcha(); }}
                    className={`py-3 px-4 border-2 rounded-lg font-medium transition-all ${userRole === "doctor" ? "border-blue-700 bg-blue-50 text-blue-700" : "border-gray-200 hover:border-gray-300"}`}>
                    Doctor
                  </button>
                </div>
              </div>

              {/* PATIENT FLOW */}
              {userRole === "patient" && !confirmationResult && (
                <div className='flex gap-1 flex-col'>
                  <input type="tel" value={phone}
                    onChange={(e) => { setPhone(e.target.value); setPhoneError(""); }}
                    placeholder="Enter Mobile Number"
                    className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  <p className="h-5 mb-1 text-red-500 text-sm font-medium">{phoneError}</p>
                  <button type="button" onClick={sendOTP} disabled={loading}
                    className="w-full py-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors font-medium disabled:opacity-50">
                    {loading ? "Sending..." : "Send OTP"}
                  </button>
                </div>
              )}

              {userRole === "patient" && confirmationResult && (
                <>
                  <div className='flex flex-col gap-1'>
                    <input type="text" value={otp}
                      onChange={(e) => { setOtp(e.target.value); setOtpError(""); }}
                      maxLength={6} placeholder="Enter 6-digit OTP"
                      className="w-full text-center tracking-widest text-lg py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    <p className="h-5 mb-1 text-red-500 text-sm font-medium">{otpError}</p>
                    <button type="button" onClick={verifyOTP} disabled={loading}
                      className="w-full py-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors font-medium disabled:opacity-50">
                      {loading ? "Verifying..." : "Verify OTP"}
                    </button>
                  </div>
                  <button type="button"
                    onClick={() => { setConfirmationResult(null); setOtp(""); resetRecaptcha(); setupRecaptcha(); }}
                    className="text-sm text-blue-600">
                    Change Number
                  </button>
                </>
              )}

              {/* DOCTOR FLOW */}
              {userRole === "doctor" && (
                <>
                  {doctorAuthMode === "login" && (
                    <>
                      <input type="email" name="email" value={doctorData.email}
                        onChange={handleDoctorChange} placeholder="Enter Email"
                        className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                      <input type="password" name="password" value={doctorData.password}
                        onChange={handleDoctorChange} placeholder="Enter Password"
                        className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                      <p className="text-red-500 text-sm">{doctorError}</p>
                      <button type="button" onClick={handleDoctorLogin}
                        className="w-full py-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors font-medium">
                        Login
                      </button>
                      <p className="text-center text-sm text-gray-600">
                        Don't have an account?{" "}
                        <button type="button" onClick={() => setDoctorAuthMode("signup")} className="text-blue-600 font-medium">Sign up</button>
                      </p>
                    </>
                  )}
                  {doctorAuthMode === "signup" && (
                    <>
                      <input type="text" name="name" value={doctorData.name}
                        onChange={handleDoctorChange} placeholder="Full Name"
                        className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                      <input type="email" name="email" value={doctorData.email}
                        onChange={handleDoctorChange} placeholder="Email"
                        className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                      <input type="password" name="password" value={doctorData.password}
                        onChange={handleDoctorChange} placeholder="Create Password"
                        className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                      {doctorData.password && !isPasswordValid && (
                        <div className="bg-gray-50 border rounded-lg p-3 text-sm space-y-1">
                          <p className={passwordRules.length ? "text-green-600" : "text-gray-500"}>{passwordRules.length ? "✔" : "✖"} At least 8 characters</p>
                          <p className={passwordRules.uppercase ? "text-green-600" : "text-gray-500"}>{passwordRules.uppercase ? "✔" : "✖"} One uppercase letter</p>
                          <p className={passwordRules.lowercase ? "text-green-600" : "text-gray-500"}>{passwordRules.lowercase ? "✔" : "✖"} One lowercase letter</p>
                          <p className={passwordRules.number ? "text-green-600" : "text-gray-500"}>{passwordRules.number ? "✔" : "✖"} One number</p>
                          <p className={passwordRules.special ? "text-green-600" : "text-gray-500"}>{passwordRules.special ? "✔" : "✖"} One special character (@$!%*?&)</p>
                        </div>
                      )}
                      <input type="text" name="specialization" value={doctorData.specialization}
                        onChange={handleDoctorChange} placeholder="Specialization"
                        className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                      <div>
                        <input type="text" name="registrationNo" value={doctorData.registrationNo}
                          onChange={handleDoctorChange} placeholder="Medical Registration Number"
                          className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                        <p className="text-xs text-gray-400 mt-1 ml-1">e.g. KMC-12345 or MCI-98765 (used for verification)</p>
                      </div>
                      <p className="text-red-500 text-sm">{doctorError}</p>
                      <button type="button" onClick={handleDoctorSignup}
                        className="w-full py-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors font-medium">
                        Sign Up
                      </button>
                      <p className="text-center text-sm text-gray-600">
                        Already have an account?{" "}
                        <button type="button" onClick={() => setDoctorAuthMode("login")} className="text-blue-600 font-medium">Login</button>
                      </p>
                    </>
                  )}
                </>
              )}
            </form>
            <div id="recaptcha-container"></div>
          </div>
        </div>
      </div>

      {/* ── Onboarding Popup — shown after first OTP login ── */}
      {showOnboarding && (
        <OnboardingPopup
          patientId={pendingPatientId}
          onComplete={handleOnboardingComplete}
        />
      )}
    </>
  );
}