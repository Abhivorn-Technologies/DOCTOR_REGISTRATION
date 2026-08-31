import React, { useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Building2,
  User,
  Mail,
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Users,
  ChevronDown,
  Stethoscope,
  Award,
  GraduationCap,
  Briefcase,
  MapPin,
  Building,
  Navigation,
  FileText,
  Sparkles,
  AlertCircle,
  Video,
  Calendar,
  Languages,
  Check
} from 'lucide-react';
import { API_BASE_URL, MAIN_WEBSITE_URL, PINCODE_API_URL } from './config';
import BorderGlow from './components/BorderGlow';
import LiquidButton from './components/LiquidButton';
import AnimatedTabs from './components/AnimatedTabs';

const STEP_INFO = {
  1: { title: 'Doctor Information', sub: 'Personal details & contact preferences', shortTitle: 'Personal' },
  2: { title: 'Professional Credentials', sub: 'Qualification, registration & specialty', shortTitle: 'Credentials' },
  3: { title: 'Practice & Preferences', sub: 'Clinic details & Vorqard service preferences', shortTitle: 'Practice' },
  4: { title: 'Review & Declaration', sub: 'Confirm details and consent for onboarding', shortTitle: 'Confirm' },
};

const VORQARD_FEATURES_OPTIONS = [
  'Appointment management',
  'Online consultations',
  'Patient communication',
  'Digital prescriptions / consultation notes',
  'Reports / document management',
  'AI-assisted booking and reminders'
];

export default function App() {
  const [step, setStep] = useState(1);

  // ─── Form State (Checkboxes empty by default, Consent false by default) ───
  const [formData, setFormData] = useState({
    // Section 1 & 7: Doctor Information & Communication
    fullName: '',
    phone: '',
    email: '',
    dob: '',
    gender: '',
    preferredComm: 'WhatsApp',
    contactBeforeLaunch: 'Yes',

    // Section 2 & 6: Professional Information & Profile
    qualification: '',
    medicalRegNo: '',
    stateCouncil: '',
    specialty: '',
    subSpecialty: '',
    experienceYears: '',
    designation: '',
    languages: '',

    // Section 3, 4 & 5: Practice, Services & Availability (Unchecked by default)
    hospitalName: '',
    pincode: '',
    city: '',
    state: '',
    clinicAddress: '',
    consultationTypes: [],
    featuresInterest: [],
    dailyConsultations: '',
    additionalComments: '',

    // Section 8: Declaration & Consent (Unchecked by default)
    consent: false
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [registeredData, setRegisteredData] = useState(null);
  const [shakeCount, setShakeCount] = useState(0);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeStatus, setPincodeStatus] = useState('');

  const triggerBuzz = () => {
    setShakeCount((prev) => prev + 1);
  };

  // ─── Handle Input Changes ────────────────────────────────────
  const handleChange = (e) => {
    const { id, name, value, type, checked } = e.target;
    const key = id || name;

    if (type === 'checkbox' && name === 'consultationTypes') {
      const current = [...formData.consultationTypes];
      if (checked) {
        if (!current.includes(value)) current.push(value);
      } else {
        const idx = current.indexOf(value);
        if (idx > -1) current.splice(idx, 1);
      }
      setFormData((prev) => ({ ...prev, consultationTypes: current }));
      return;
    }

    if (type === 'checkbox' && name === 'featuresInterest') {
      const current = [...formData.featuresInterest];
      if (checked) {
        if (!current.includes(value)) current.push(value);
      } else {
        const idx = current.indexOf(value);
        if (idx > -1) current.splice(idx, 1);
      }
      setFormData((prev) => ({ ...prev, featuresInterest: current }));
      return;
    }

    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [key]: checked }));
      if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
      return;
    }

    if (key === 'phone') {
      const cleanDigits = value.replace(/\D/g, '').slice(0, 10);
      setFormData((prev) => ({ ...prev, phone: cleanDigits }));
      if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
      return;
    }

    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  // ─── Auto-fill Location via Postal / PIN Code ─────────────────
  const handlePincodeChange = async (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setFormData((prev) => ({ ...prev, pincode: val }));

    if (val.length === 6) {
      setPincodeLoading(true);
      setPincodeStatus('Fetching location...');
      try {
        const res = await fetch(`${PINCODE_API_URL}/${val}`);
        const data = await res.json();
        if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
          const po = data[0].PostOffice[0];
          const fetchedCity = po.District || po.Block || po.Circle || '';
          const fetchedState = po.State || '';
          const fetchedArea = po.Name || '';

          setFormData((prev) => ({
            ...prev,
            city: fetchedCity || prev.city,
            state: fetchedState || prev.state,
            clinicAddress: prev.clinicAddress ? prev.clinicAddress : fetchedArea
          }));
          setPincodeStatus(`✓ ${fetchedCity}, ${fetchedState}`);
          setErrors((prev) => {
            const next = { ...prev };
            delete next.city;
            delete next.state;
            return next;
          });
        } else {
          setPincodeStatus('PIN code not found, enter manually');
        }
      } catch (err) {
        console.warn('PIN code lookup error:', err);
        setPincodeStatus('');
      } finally {
        setPincodeLoading(false);
      }
    } else {
      setPincodeStatus('');
    }
  };

  // ─── Step 1 Validation ──────────────────────────────────────
  const validateStep1 = () => {
    const errs = {};
    const name = formData.fullName.trim();
    const phone = formData.phone.trim().replace(/\D/g, '');
    const email = formData.email.trim();

    if (!name) {
      errs.fullName = 'Please enter your full name.';
    } else if (name.length < 2 || name.length > 100 || !/^[a-zA-Z\s\.\'\-]+$/.test(name)) {
      errs.fullName = 'Please enter a valid name.';
    }

    const isRepeatedFake = /^(\d)\1{9}$/.test(phone);
    if (!phone) {
      errs.phone = 'Please enter your mobile number.';
    } else if (!/^[6-9]\d{9}$/.test(phone) || isRepeatedFake || phone === '1234567890') {
      errs.phone = 'Enter a valid 10-digit mobile number.';
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email) {
      errs.email = 'Please enter your work email.';
    } else if (email.length > 254 || !emailRegex.test(email)) {
      errs.email = 'Enter a valid email address.';
    }

    if (!formData.preferredComm) {
      errs.preferredComm = 'Please select preferred contact method.';
    }

    setErrors(errs);
    if (Object.keys(errs).length > 0) triggerBuzz();
    return Object.keys(errs).length === 0;
  };

  // ─── Step 2 Validation (Medical Reg No is NOT mandatory) ─────
  const validateStep2 = () => {
    const errs = {};
    if (!formData.qualification.trim())
      errs.qualification = 'Highest medical qualification is required (e.g. MBBS, MD)';
    if (!formData.specialty)
      errs.specialty = 'Please select your specialization';
    if (formData.experienceYears === '' || isNaN(formData.experienceYears) || parseInt(formData.experienceYears, 10) < 0)
      errs.experienceYears = 'Enter total years of professional experience';

    setErrors(errs);
    if (Object.keys(errs).length > 0) triggerBuzz();
    return Object.keys(errs).length === 0;
  };

  // ─── Step 3 Validation ──────────────────────────────────────
  const validateStep3 = () => {
    const errs = {};
    if (!formData.hospitalName.trim())
      errs.hospitalName = 'Hospital or clinic name is required';

    const pin = formData.pincode.trim();
    if (!pin) {
      errs.pincode = 'Postal / PIN code is required.';
    } else if (!/^\d{6}$/.test(pin)) {
      errs.pincode = 'Enter a valid 6-digit PIN code.';
    }

    if (!formData.city.trim())
      errs.city = 'City is required';
    if (!formData.state.trim())
      errs.state = 'State is required';

    setErrors(errs);
    if (Object.keys(errs).length > 0) triggerBuzz();
    return Object.keys(errs).length === 0;
  };

  // ─── Step 4 Validation (Consent MUST be checked) ─────────────
  const validateStep4 = () => {
    const errs = {};
    if (!formData.consent) {
      errs.consent = 'Please tick the declaration and consent box to complete your registration.';
    }

    setErrors(errs);
    if (Object.keys(errs).length > 0) triggerBuzz();
    return Object.keys(errs).length === 0;
  };

  // ─── Step Navigation ────────────────────────────────────────
  const handleNext = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
    else if (step === 3 && validateStep3()) setStep(4);
  };

  const handleBack = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (step > 1) setStep(step - 1);
  };

  // ─── Submit Handler (Only executed on Step 4) ─────────────────
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    // If user presses enter on steps 1-3, advance step rather than submitting
    if (step < 4) {
      handleNext(e);
      return;
    }

    if (!validateStep1() || !validateStep2() || !validateStep3() || !validateStep4()) {
      return;
    }

    setServerError('');
    setIsSubmitting(true);

    const payload = {
      full_name: formData.fullName.trim(),
      phone: formData.phone.replace(/[^\d]/g, ''),
      email: formData.email.trim().toLowerCase(),
      gender: formData.gender || null,
      dob: formData.dob ? formData.dob.trim() : null,
      medical_reg_no: formData.medicalRegNo ? formData.medicalRegNo.trim() : null,
      state_medical_council: formData.stateCouncil.trim() || null,
      qualification: formData.qualification.trim(),
      specialty: formData.subSpecialty.trim()
        ? `${formData.specialty} (${formData.subSpecialty.trim()})`
        : formData.specialty,
      experience_years: parseInt(formData.experienceYears, 10) || 0,
      current_designation: formData.designation.trim() || null,
      hospital_clinic_name: formData.hospitalName.trim(),
      clinic_address: formData.clinicAddress.trim() || null,
      city: formData.city.trim(),
      state: formData.state.trim(),
      pincode: formData.pincode.trim() || null,
      consultation_types: formData.consultationTypes.length ? formData.consultationTypes : ['In-person consultation', 'Online consultation'],
      consultation_fee: null,
      languages_spoken: formData.languages ? formData.languages.split(',').map((s) => s.trim()).filter(Boolean) : [],
      interested_features: formData.featuresInterest,
      notes: [
        `Contact before launch: ${formData.contactBeforeLaunch || 'Yes'}`,
        `Preferred contact: ${formData.preferredComm || 'WhatsApp'}`,
        formData.subSpecialty ? `Sub-specialty: ${formData.subSpecialty.trim()}` : '',
        formData.stateCouncil ? `Council: ${formData.stateCouncil.trim()}` : '',
        formData.dailyConsultations ? `Daily capacity: ${formData.dailyConsultations} consultations/day` : '',
        formData.additionalComments ? `Comments: ${formData.additionalComments.trim()}` : ''
      ].filter(Boolean).join(' | ')
    };

    try {
      let response = await fetch(`${API_BASE_URL}/api/doctor-registry/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok && response.status === 404) {
        response = await fetch(`${API_BASE_URL}/doctor-registry/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      let result;
      try {
        result = await response.json();
      } catch (parseErr) {
        result = { detail: `Server error (Status: ${response.status})` };
      }

      if (response.ok && result.success) {
        setRegisteredData(result);
        triggerConfetti();
      } else {
        const errMsg = result.detail || result.message || 'Registration failed. Please check your details and try again.';
        setServerError(errMsg);
        triggerBuzz();
      }
    } catch (err) {
      console.error('[Doctor Registry] Network error:', err);
      setServerError(err.message || 'Unable to connect to VORQARD server. Please ensure backend is running.');
      triggerBuzz();
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#0284C7', '#38BDF8', '#0369A1', '#00D2FF', '#BAE6FD']
      });
    } catch (e) { /* silent */ }
  };

  return (
    <div className="vq-page-root">

      {/* ══════════════ HEADER ══════════════ */}
      <header className="vq-header">
        <a href={MAIN_WEBSITE_URL} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img src="/logo.png" alt="Vorqard" className="vq-logo-img" />
        </a>

        <a
          href={MAIN_WEBSITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="vq-header-btn"
        >
          <span>Explore More</span>
          <ArrowRight size={13} />
        </a>
      </header>

      {/* ══════════════ MAIN HERO PAGE CONTENT ══════════════ */}
      <div className="vq-page-wrapper">
        <div className="vq-gradient-overlay" />

        {/* Ambient Glowing Background Accents */}
        <div
          className="animate-pulse-glow"
          style={{
            position: 'absolute', top: '-120px', left: '-100px', width: '420px', height: '420px',
            background: '#38BDF8', borderRadius: '50%', filter: 'blur(100px)', opacity: 0.32, pointerEvents: 'none', zIndex: 0
          }}
        />
        <div
          className="animate-pulse-glow"
          style={{
            position: 'absolute', bottom: '-60px', left: '32%', width: '380px', height: '380px',
            background: '#67E8F9', borderRadius: '50%', filter: 'blur(90px)', opacity: 0.28, pointerEvents: 'none', zIndex: 0
          }}
        />

        {/* Responsive Container (2-Column on Desktop / Vertical Stack on Tablet & Mobile) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="vq-container"
        >
          {/* ─────────── LEFT HERO COLUMN: Why Join Vorqard Doctor? (Vertical White Cards) ─────────── */}
          <div className="vq-hero-column">
            <div className="vq-hero-header-wrap">
              <div className="vq-hero-badge">
                <Sparkles size={14} className="text-[#0284C7]" />
                <span>Doctor Pre-Launch Registration</span>
              </div>
              <h1 className="vq-hero-title">
                Why Join <span>Vorqard Doctor</span>?
              </h1>
              <p className="vq-hero-desc">
                Thank you for your interest in joining Vorqard. This pre-launch form helps us understand doctor availability, specialties, and preferred services before launch.
              </p>
            </div>

            {/* Benefit White Cards - Aligned Vertically */}
            <div className="vq-features-list">
              <div className="vq-feature-card">
                <div className="vq-feature-icon-box">
                  <Users size={18} strokeWidth={2.2} />
                </div>
                <div className="vq-feature-info">
                  <h4>Grow Your Practice</h4>
                  <p>Reach more patients and expand your digital presence across India.</p>
                </div>
              </div>

              <div className="vq-feature-card">
                <div className="vq-feature-icon-box">
                  <FileText size={18} strokeWidth={2.2} />
                </div>
                <div className="vq-feature-info">
                  <h4>Smart Digital Practice</h4>
                  <p>Manage OPD, appointments, prescriptions, and patient records in one place.</p>
                </div>
              </div>

              <div className="vq-feature-card">
                <div className="vq-feature-icon-box">
                  <Clock size={18} strokeWidth={2.2} />
                </div>
                <div className="vq-feature-info">
                  <h4>Save Time</h4>
                  <p>Simplify daily workflows and spend more time focusing on your patients.</p>
                </div>
              </div>

              <div className="vq-feature-card">
                <div className="vq-feature-icon-box">
                  <Video size={18} strokeWidth={2.2} />
                </div>
                <div className="vq-feature-info">
                  <h4>Connect With Patients</h4>
                  <p>Offer convenient teleconsultations and stay connected with patients remotely.</p>
                </div>
              </div>

              <div className="vq-feature-card">
                <div className="vq-feature-icon-box">
                  <ShieldCheck size={18} strokeWidth={2.2} />
                </div>
                <div className="vq-feature-info">
                  <h4>Trusted & Secure</h4>
                  <p>Secure patient data with a healthcare platform designed for privacy and compliance.</p>
                </div>
              </div>
            </div>
          </div>

          {/* ─────────── RIGHT FORM CARD COLUMN ─────────── */}
          <div className="vq-card-column">
            <BorderGlow glowColor="#0284C7" secondaryGlow="#38BDF8" borderRadius="20px">
              <div className="vq-card-inner">

                {registeredData ? (
                  /* ══ SUCCESS VIEW ══ */
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ textAlign: 'center', padding: '16px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                  >
                    <div style={{
                      width: '64px', height: '64px', borderRadius: '50%',
                      background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                      color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: '16px', boxShadow: '0 8px 24px rgba(2, 132, 199, 0.35)'
                    }}>
                      <CheckCircle2 size={34} />
                    </div>

                    <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                      Pre-Launch Registration Confirmed! 🎉
                    </h2>
                    <p style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.5', marginBottom: '20px' }}>
                      Thank you, <strong style={{ color: '#0F172A', fontWeight: 700 }}>Dr. {formData.fullName}</strong>. You have secured VIP priority early access with the Vorqard Doctor Network.
                    </p>

                    <div style={{
                      width: '100%', background: '#F0F9FF', border: '1.5px dashed #0284C7', borderRadius: '12px',
                      padding: '14px', textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#0369A1', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>
                        Your Reference Code
                      </div>
                      <div style={{ fontSize: '22px', fontWeight: 900, color: '#0284C7', letterSpacing: '0.1em' }}>
                        {registeredData.reg_code}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  /* ══ STEP WIZARD FORM ══ */
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>

                    {/* Step Title Header */}
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                          {STEP_INFO[step].title}
                        </h2>
                        <span style={{
                          fontSize: '11px', fontWeight: 700, color: '#0284C7', background: '#E0F2FE',
                          padding: '3px 9px', borderRadius: '9999px', border: '1px solid #BAE6FD', flexShrink: 0
                        }}>
                          Step {step} of 4
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>
                        {STEP_INFO[step].sub}
                      </p>
                    </div>

                    {/* Animated Tabs */}
                    <AnimatedTabs
                      steps={STEP_INFO}
                      currentStep={step}
                      onStepClick={(s) => setStep(s)}
                      className="mb-3"
                    />

                    {/* Server Error Alert */}
                    {serverError && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
                          background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: '10px', marginBottom: '10px',
                          color: '#E11D48', fontSize: '12px', fontWeight: 600
                        }}
                      >
                        <AlertCircle size={15} style={{ flexShrink: 0 }} />
                        <span>{serverError}</span>
                      </motion.div>
                    )}

                    {/* Form Fields with Shake on Error */}
                    <motion.form
                      key={shakeCount}
                      animate={shakeCount > 0 ? { x: [0, -8, 8, -5, 5, -2, 2, 0] } : {}}
                      transition={{ duration: 0.35, ease: 'easeInOut' }}
                      onSubmit={handleSubmit}
                      noValidate
                      style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}
                    >

                      {/* ─── STEP 1: Doctor Information (Section 1 & 7) ─── */}
                      {step === 1 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                          {/* Full Name */}
                          <div>
                            <label className="vq-field-label">
                              FULL NAME <span className="req">*</span>
                            </label>
                            <div className="vq-input-wrapper">
                              <span className="vq-input-icon">
                                <User size={15} />
                              </span>
                              <input
                                type="text"
                                id="fullName"
                                placeholder="e.g., Dr. Abhivorn"
                                value={formData.fullName}
                                onChange={handleChange}
                                className={`vq-input ${errors.fullName ? 'err' : ''}`}
                              />
                            </div>
                            {errors.fullName && <span className="vq-error-text">{errors.fullName}</span>}
                          </div>

                          {/* Mobile Number with Vector Indian Flag */}
                          <div>
                            <label className="vq-field-label">
                              MOBILE NUMBER <span className="req">*</span>
                            </label>
                            <div className="vq-input-wrapper">
                              <div style={{
                                position: 'absolute', left: '10px', display: 'flex', alignItems: 'center', gap: '6px',
                                background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '3px 7px',
                                userSelect: 'none', zIndex: 2
                              }}>
                                <svg width="18" height="12" viewBox="0 0 24 16" fill="none" style={{ borderRadius: '2px', display: 'block' }}>
                                  <rect width="24" height="5.33" fill="#FF9933" />
                                  <rect y="5.33" width="24" height="5.33" fill="#FFFFFF" />
                                  <rect y="10.66" width="24" height="5.33" fill="#138808" />
                                  <circle cx="12" cy="8" r="2.2" fill="#000080" />
                                </svg>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155', lineHeight: 1 }}>+91</span>
                              </div>
                              <input
                                type="tel"
                                id="phone"
                                maxLength={10}
                                placeholder="Enter your mobile number"
                                value={formData.phone}
                                onChange={handleChange}
                                style={{ paddingLeft: '84px' }}
                                className={`vq-input ${errors.phone ? 'err' : ''}`}
                              />
                            </div>
                            {errors.phone && <span className="vq-error-text">{errors.phone}</span>}
                          </div>

                          {/* Work Email */}
                          <div>
                            <label className="vq-field-label">
                              EMAIL ADDRESS <span className="req">*</span>
                            </label>
                            <div className="vq-input-wrapper">
                              <span className="vq-input-icon">
                                <Mail size={15} />
                              </span>
                              <input
                                type="email"
                                id="email"
                                placeholder="e.g., abhivorn@gmail.com"
                                value={formData.email}
                                onChange={handleChange}
                                className={`vq-input ${errors.email ? 'err' : ''}`}
                              />
                            </div>
                            {errors.email && <span className="vq-error-text">{errors.email}</span>}
                          </div>

                          {/* Date of Birth & Gender (Responsive 2-Col / Vertical 1-Col) */}
                          <div className="vq-form-grid-2">
                            <div>
                              <label className="vq-field-label">
                                DATE OF BIRTH
                              </label>
                              <div className="vq-input-wrapper">
                                <span className="vq-input-icon">
                                  <Calendar size={15} />
                                </span>
                                <input
                                  type="date"
                                  id="dob"
                                  value={formData.dob}
                                  onChange={handleChange}
                                  className="vq-input"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="vq-field-label">
                                GENDER
                              </label>
                              <div className="vq-input-wrapper">
                                <select
                                  id="gender"
                                  value={formData.gender}
                                  onChange={handleChange}
                                  className="vq-select"
                                  style={{ color: formData.gender ? '#0F172A' : '#94A3B8' }}
                                >
                                  <option value="">Select Gender</option>
                                  <option value="Male">Male</option>
                                  <option value="Female">Female</option>
                                  <option value="Other">Other</option>
                                </select>
                                <ChevronDown size={14} className="vq-select-chevron" />
                              </div>
                            </div>
                          </div>

                          {/* Preferred Contact Method & Contact Before Launch (Responsive 2-Col / Vertical 1-Col) */}
                          <div className="vq-form-grid-contact">
                            <div>
                              <label className="vq-field-label">
                                PREFERRED CONTACT <span className="req">*</span>
                              </label>
                              <div className="vq-input-wrapper">
                                <select
                                  id="preferredComm"
                                  value={formData.preferredComm}
                                  onChange={handleChange}
                                  className="vq-select"
                                >
                                  <option value="WhatsApp">WhatsApp</option>
                                  <option value="Phone call">Phone call</option>
                                  <option value="Email">Email</option>
                                </select>
                                <ChevronDown size={14} className="vq-select-chevron" />
                              </div>
                            </div>

                            <div>
                              <label className="vq-field-label">
                                CONTACT BEFORE LAUNCH?
                              </label>
                              <div className="vq-input-wrapper">
                                <select
                                  id="contactBeforeLaunch"
                                  value={formData.contactBeforeLaunch}
                                  onChange={handleChange}
                                  className="vq-select"
                                >
                                  <option value="Yes">Yes</option>
                                  <option value="No">No</option>
                                </select>
                                <ChevronDown size={14} className="vq-select-chevron" />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ─── STEP 2: Professional Information (Section 2 & 6) ─── */}
                      {step === 2 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                          <div className="vq-form-grid-2">
                            {/* Highest Qualification */}
                            <div>
                              <label className="vq-field-label">
                                HIGHEST QUALIFICATION <span className="req">*</span>
                              </label>
                              <div className="vq-input-wrapper">
                                <span className="vq-input-icon">
                                  <GraduationCap size={15} />
                                </span>
                                <input
                                  type="text"
                                  id="qualification"
                                  placeholder="e.g., MBBS, MD, MS"
                                  value={formData.qualification}
                                  onChange={handleChange}
                                  className={`vq-input ${errors.qualification ? 'err' : ''}`}
                                />
                              </div>
                              {errors.qualification && <span className="vq-error-text">{errors.qualification}</span>}
                            </div>

                            {/* Medical Reg No (Optional) */}
                            <div>
                              <label className="vq-field-label">
                                MEDICAL COUNCIL REG. NO.
                              </label>
                              <div className="vq-input-wrapper">
                                <span className="vq-input-icon">
                                  <Award size={15} />
                                </span>
                                <input
                                  type="text"
                                  id="medicalRegNo"
                                  placeholder="e.g., KMC/2020/123456"
                                  value={formData.medicalRegNo}
                                  onChange={handleChange}
                                  className="vq-input"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="vq-form-grid-2">
                            {/* Specialization */}
                            <div>
                              <label className="vq-field-label">
                                SPECIALIZATION <span className="req">*</span>
                              </label>
                              <div className="vq-input-wrapper">
                                <select
                                  id="specialty"
                                  value={formData.specialty}
                                  onChange={handleChange}
                                  className={`vq-select ${errors.specialty ? 'err' : ''}`}
                                  style={{ color: formData.specialty ? '#0F172A' : '#94A3B8' }}
                                >
                                  <option value="" disabled>Select Specialty</option>
                                  <option value="General Medicine">General Medicine</option>
                                  <option value="Cardiology">Cardiology</option>
                                  <option value="Orthopedics">Orthopedics</option>
                                  <option value="Dermatology">Dermatology</option>
                                  <option value="Pediatrics">Pediatrics</option>
                                  <option value="Gynecology & Obstetrics">Gynecology & Obstetrics</option>
                                  <option value="Neurology">Neurology</option>
                                  <option value="ENT">ENT</option>
                                  <option value="Ophthalmology">Ophthalmology</option>
                                  <option value="Psychiatry">Psychiatry</option>
                                  <option value="Gastroenterology">Gastroenterology</option>
                                  <option value="Pulmonology">Pulmonology</option>
                                  <option value="Oncology">Oncology</option>
                                  <option value="Urology">Urology</option>
                                  <option value="Dentistry">Dentistry</option>
                                  <option value="Ayurveda / Homeopathy">Ayurveda / Homeopathy</option>
                                  <option value="Other">Other</option>
                                </select>
                                <ChevronDown size={14} className="vq-select-chevron" />
                              </div>
                              {errors.specialty && <span className="vq-error-text">{errors.specialty}</span>}
                            </div>

                            {/* Years of Experience */}
                            <div>
                              <label className="vq-field-label">
                                YEARS OF EXPERIENCE <span className="req">*</span>
                              </label>
                              <div className="vq-input-wrapper">
                                <span className="vq-input-icon">
                                  <Briefcase size={15} />
                                </span>
                                <input
                                  type="number"
                                  id="experienceYears"
                                  min="0"
                                  placeholder="e.g., 8"
                                  value={formData.experienceYears}
                                  onChange={handleChange}
                                  className={`vq-input ${errors.experienceYears ? 'err' : ''}`}
                                />
                              </div>
                              {errors.experienceYears && <span className="vq-error-text">{errors.experienceYears}</span>}
                            </div>
                          </div>

                          <div className="vq-form-grid-2">
                            {/* Sub-specialization */}
                            <div>
                              <label className="vq-field-label">
                                SUB-SPECIALIZATION
                              </label>
                              <div className="vq-input-wrapper">
                                <span className="vq-input-icon">
                                  <Stethoscope size={15} />
                                </span>
                                <input
                                  type="text"
                                  id="subSpecialty"
                                  placeholder="e.g., Interventional Cardiology"
                                  value={formData.subSpecialty}
                                  onChange={handleChange}
                                  className="vq-input"
                                />
                              </div>
                            </div>

                            {/* State Council of Registration */}
                            <div>
                              <label className="vq-field-label">
                                STATE / MEDICAL COUNCIL
                              </label>
                              <div className="vq-input-wrapper">
                                <span className="vq-input-icon">
                                  <Building size={15} />
                                </span>
                                <input
                                  type="text"
                                  id="stateCouncil"
                                  placeholder="e.g., Karnataka Medical Council"
                                  value={formData.stateCouncil}
                                  onChange={handleChange}
                                  className="vq-input"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="vq-form-grid-2">
                            {/* Designation */}
                            <div>
                              <label className="vq-field-label">
                                CURRENT DESIGNATION
                              </label>
                              <div className="vq-input-wrapper">
                                <span className="vq-input-icon">
                                  <Briefcase size={15} />
                                </span>
                                <input
                                  type="text"
                                  id="designation"
                                  placeholder="e.g., Consultant Cardiologist"
                                  value={formData.designation}
                                  onChange={handleChange}
                                  className="vq-input"
                                />
                              </div>
                            </div>

                            {/* Languages Spoken Dropdown */}
                            <div>
                              <label className="vq-field-label">
                                LANGUAGES SPOKEN
                              </label>
                              <div className="vq-input-wrapper">
                                <select
                                  id="languages"
                                  value={formData.languages}
                                  onChange={handleChange}
                                  className="vq-select"
                                  style={{ color: formData.languages ? '#0F172A' : '#94A3B8' }}
                                >
                                  <option value="">Select Languages</option>
                                  <option value="English, Hindi, Telugu">English, Hindi, Telugu</option>
                                  <option value="English, Telugu">English, Telugu</option>
                                  <option value="English, Hindi">English, Hindi</option>
                                  <option value="Telugu">Telugu</option>
                                  <option value="Hindi">Hindi</option>
                                  <option value="English">English</option>
                                  <option value="English, Hindi, Kannada">English, Hindi, Kannada</option>
                                  <option value="English, Tamil">English, Tamil</option>
                                  <option value="English, Malayalam">English, Malayalam</option>
                                  <option value="Other">Other</option>
                                </select>
                                <ChevronDown size={14} className="vq-select-chevron" />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ─── STEP 3: Practice & Service Preferences (Section 3, 4 & 5) ─── */}
                      {step === 3 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                          {/* Hospital / Clinic Name */}
                          <div>
                            <label className="vq-field-label">
                              HOSPITAL / CLINIC NAME <span className="req">*</span>
                            </label>
                            <div className="vq-input-wrapper">
                              <span className="vq-input-icon">
                                <Building2 size={15} />
                              </span>
                              <input
                                type="text"
                                id="hospitalName"
                                placeholder="e.g., Vorqard Medicare"
                                value={formData.hospitalName}
                                onChange={handleChange}
                                className={`vq-input ${errors.hospitalName ? 'err' : ''}`}
                              />
                            </div>
                            {errors.hospitalName && <span className="vq-error-text">{errors.hospitalName}</span>}
                          </div>

                          {/* Postal / PIN Code (Auto-fill) & City */}
                          <div className="vq-form-grid-2">
                            <div>
                              <label className="vq-field-label">
                                POSTAL / PIN CODE <span className="req">*</span>
                              </label>
                              <div className="vq-input-wrapper">
                                <span className="vq-input-icon">
                                  <Navigation size={15} />
                                </span>
                                <input
                                  type="text"
                                  id="pincode"
                                  maxLength={6}
                                  placeholder="Enter your PIN code"
                                  value={formData.pincode}
                                  onChange={handlePincodeChange}
                                  className={`vq-input ${errors.pincode ? 'err' : ''}`}
                                />
                              </div>
                              {errors.pincode && <span className="vq-error-text">{errors.pincode}</span>}
                              {pincodeStatus && !errors.pincode && (
                                <span style={{
                                  fontSize: '11px', fontWeight: 600, marginTop: '2px', display: 'block',
                                  color: pincodeStatus.startsWith('✓') ? '#10B981' : pincodeLoading ? '#0284C7' : '#EF4444'
                                }}>
                                  {pincodeStatus}
                                </span>
                              )}
                            </div>

                            <div>
                              <label className="vq-field-label">
                                CITY <span className="req">*</span>
                              </label>
                              <div className="vq-input-wrapper">
                                <span className="vq-input-icon">
                                  <MapPin size={15} />
                                </span>
                                <input
                                  type="text"
                                  id="city"
                                  placeholder="e.g., Hyderabad"
                                  value={formData.city}
                                  onChange={handleChange}
                                  className={`vq-input ${errors.city ? 'err' : ''}`}
                                />
                              </div>
                              {errors.city && <span className="vq-error-text">{errors.city}</span>}
                            </div>
                          </div>

                          <div className="vq-form-grid-2">
                            {/* State */}
                            <div>
                              <label className="vq-field-label">
                                STATE <span className="req">*</span>
                              </label>
                              <div className="vq-input-wrapper">
                                <span className="vq-input-icon">
                                  <MapPin size={15} />
                                </span>
                                <input
                                  type="text"
                                  id="state"
                                  placeholder="e.g., Telangana"
                                  value={formData.state}
                                  onChange={handleChange}
                                  className={`vq-input ${errors.state ? 'err' : ''}`}
                                />
                              </div>
                              {errors.state && <span className="vq-error-text">{errors.state}</span>}
                            </div>

                            {/* Practice Location / Area */}
                            <div>
                              <label className="vq-field-label">
                                PRACTICE LOCATION / AREA
                              </label>
                              <div className="vq-input-wrapper">
                                <span className="vq-input-icon">
                                  <Navigation size={15} />
                                </span>
                                <input
                                  type="text"
                                  id="clinicAddress"
                                  placeholder="e.g., Banjara Hills, Jubilee Hills"
                                  value={formData.clinicAddress}
                                  onChange={handleChange}
                                  className="vq-input"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Preferred Consultation Mode (White boxes - Vertical on Tablet & Mobile) */}
                          <div>
                            <label className="vq-field-label">
                              PREFERRED CONSULTATION MODE
                            </label>
                            <div className="vq-consult-options-grid">
                              <label
                                className={`vq-consult-card ${formData.consultationTypes.includes('In-person consultation') ? 'active' : ''}`}
                              >
                                <input
                                  type="checkbox"
                                  name="consultationTypes"
                                  value="In-person consultation"
                                  checked={formData.consultationTypes.includes('In-person consultation')}
                                  onChange={handleChange}
                                  style={{ accentColor: '#0284C7', width: '15px', height: '15px' }}
                                />
                                <span>In-person Consultation</span>
                              </label>

                              <label
                                className={`vq-consult-card ${formData.consultationTypes.includes('Online consultation') ? 'active' : ''}`}
                              >
                                <input
                                  type="checkbox"
                                  name="consultationTypes"
                                  value="Online consultation"
                                  checked={formData.consultationTypes.includes('Online consultation')}
                                  onChange={handleChange}
                                  style={{ accentColor: '#0284C7', width: '15px', height: '15px' }}
                                />
                                <span>Online Consultation</span>
                              </label>
                            </div>
                          </div>

                          {/* 6 Vorqard Features Checkboxes (White boxes - Vertical on Tablet & Mobile) */}
                          <div>
                            <label className="vq-field-label">
                              FEATURES / SERVICES OF INTEREST
                            </label>
                            <div className="vq-features-interest-grid">
                              {VORQARD_FEATURES_OPTIONS.map((feat) => (
                                <label
                                  key={feat}
                                  className={`vq-feature-check-card ${formData.featuresInterest.includes(feat) ? 'active' : ''}`}
                                >
                                  <input
                                    type="checkbox"
                                    name="featuresInterest"
                                    value={feat}
                                    checked={formData.featuresInterest.includes(feat)}
                                    onChange={handleChange}
                                    style={{ accentColor: '#0284C7', width: '14px', height: '14px', flexShrink: 0 }}
                                  />
                                  <span style={{ lineHeight: 1.25 }}>{feat}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ─── STEP 4: Review, Verification & Declaration (Section 8 & Consent) ─── */}
                      {step === 4 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {/* Verification Notice Banner */}
                          <div style={{
                            background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '10px',
                            padding: '9px 12px', fontSize: '11.5px', color: '#1E40AF', lineHeight: '1.4',
                            display: 'flex', gap: '8px'
                          }}>
                            <ShieldCheck size={16} style={{ color: '#2563EB', flexShrink: 0, marginTop: '2px' }} />
                            <div>
                              <strong>Verification during onboarding:</strong> Professional verification documents (Medical registration, Qualification, Identity) will be securely collected during platform onboarding.
                            </div>
                          </div>

                          {/* Summary Card */}
                          <div style={{
                            background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '12px',
                            padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '4px', borderBottom: '1px solid #E0F2FE', flexWrap: 'wrap', gap: '4px' }}>
                              <span style={{ color: '#64748B' }}>Doctor Name:</span>
                              <strong style={{ color: '#0F172A' }}>Dr. {formData.fullName}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '4px', borderBottom: '1px solid #E0F2FE', flexWrap: 'wrap', gap: '4px' }}>
                              <span style={{ color: '#64748B' }}>Mobile & Email:</span>
                              <span style={{ color: '#0F172A', fontWeight: 600 }}>+91 {formData.phone} | {formData.email}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '4px', borderBottom: '1px solid #E0F2FE', flexWrap: 'wrap', gap: '4px' }}>
                              <span style={{ color: '#64748B' }}>Qualification & Reg:</span>
                              <span style={{ color: '#0F172A', fontWeight: 600 }}>{formData.qualification} {formData.medicalRegNo ? `(${formData.medicalRegNo})` : ''}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '4px', borderBottom: '1px solid #E0F2FE', flexWrap: 'wrap', gap: '4px' }}>
                              <span style={{ color: '#64748B' }}>Specialization:</span>
                              <span style={{ color: '#0F172A', fontWeight: 600 }}>{formData.specialty} ({formData.experienceYears} Yrs Exp)</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                              <span style={{ color: '#64748B' }}>Workplace:</span>
                              <span style={{ color: '#0F172A', fontWeight: 600 }}>{formData.hospitalName}, {formData.city}, {formData.state}</span>
                            </div>
                          </div>

                          {/* Declaration & Consent Checkbox */}
                          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '11.5px', color: '#475569', lineHeight: '1.4' }}>
                            <input
                              type="checkbox"
                              id="consent"
                              checked={formData.consent}
                              onChange={handleChange}
                              style={{ accentColor: '#0284C7', width: '15px', height: '15px', marginTop: '2px', flexShrink: 0 }}
                            />
                            <span>I confirm that the information provided is accurate to the best of my knowledge. I agree that Vorqard / Abhivorn Technologies may contact me regarding doctor onboarding, platform launch information, and related professional services.</span>
                          </label>
                          {errors.consent && <span className="vq-error-text">{errors.consent}</span>}
                        </div>
                      )}

                      {/* Card Action Buttons */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                        {step < 4 ? (
                          <LiquidButton
                            type="button"
                            onClick={handleNext}
                            icon={<ArrowRight size={15} />}
                            className="w-full py-3 text-sm font-bold"
                          >
                            Continue to Step {step + 1}
                          </LiquidButton>
                        ) : (
                          <LiquidButton
                            type="submit"
                            loading={isSubmitting}
                            icon={<Check size={16} />}
                            className="w-full py-3.5 text-sm font-bold"
                          >
                            Submit Pre-Launch Registration
                          </LiquidButton>
                        )}

                        {step > 1 && (
                          <button
                            type="button"
                            onClick={handleBack}
                            style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                              fontSize: '12px', fontWeight: 700, color: '#64748B', background: 'none', border: 'none',
                              cursor: 'pointer', padding: '4px'
                            }}
                          >
                            <ArrowLeft size={13} />
                            <span>Back to previous step</span>
                          </button>
                        )}
                      </div>

                    </motion.form>
                  </div>
                )}

              </div>
            </BorderGlow>
          </div>
        </motion.div>
      </div>
    </div>
  );
}


