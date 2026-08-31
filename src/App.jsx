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
  Phone,
  Stethoscope,
  Award,
  GraduationCap,
  Briefcase,
  MapPin,
  Building,
  Navigation,
  FileText,
  RotateCcw,
  MessageCircle,
  Sparkles,
  AlertCircle,
  Video,
  ExternalLink
} from 'lucide-react';
import { API_BASE_URL, WHATSAPP_SUPPORT_PHONE } from './config';
import BorderGlow from './components/BorderGlow';
import LiquidButton from './components/LiquidButton';
import AnimatedTabs from './components/AnimatedTabs';

const STEP_INFO = {
  1: { title: 'Personal Details', sub: 'Enter your basic contact information', shortTitle: 'Personal' },
  2: { title: 'Medical Credentials', sub: 'Qualifications & council registration', shortTitle: 'Credentials' },
  3: { title: 'Practice & Services', sub: 'Clinic details & consultation setup', shortTitle: 'Practice' },
  4: { title: 'Review & Submit', sub: 'Confirm your details to get early access', shortTitle: 'Confirm' },
};

export default function App() {
  const [step, setStep] = useState(1);

  // ─── Form State (Preserved exactly as backend expects) ───────
  const [formData, setFormData] = useState({
    // Step 1: Doctor Profile
    fullName: '',
    phone: '',
    email: '',
    gender: '',
    dob: '',
    preferredComm: 'WhatsApp',

    // Step 2: Credentials
    specialty: '',
    experienceYears: '',
    designation: '',
    medicalRegNo: '',
    stateCouncil: '',
    qualification: '',
    collegeName: '',
    languages: '',
    state: '',

    // Step 3: Practice Info
    hospitalName: '',
    city: '',
    clinicAddress: '',
    consultationFee: '',
    consultationTypes: ['In-person', 'Online Video'],
    featuresInterest: [
      'Smart Digital Prescriptions',
      'OPD Queue Token Management',
      'Online Teleconsultations',
      'AI Patient EMR & Health Summaries'
    ],

    // Step 4: Consent
    consent: true
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [registeredData, setRegisteredData] = useState(null);
  const [shakeCount, setShakeCount] = useState(0);

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

    if (!formData.gender) {
      errs.gender = 'Please select gender.';
    }

    if (!formData.preferredComm) {
      errs.preferredComm = 'Please select preferred communication.';
    }

    setErrors(errs);
    if (Object.keys(errs).length > 0) triggerBuzz();
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs = {};
    if (!formData.specialty)
      errs.specialty = 'Select your specialization';
    if (formData.experienceYears === '' || isNaN(formData.experienceYears) || parseInt(formData.experienceYears, 10) < 0)
      errs.experienceYears = 'Enter years of experience';
    if (!formData.medicalRegNo.trim())
      errs.medicalRegNo = 'Medical Council Reg. No. is required';
    if (!formData.qualification.trim())
      errs.qualification = 'Degrees/qualifications required';
    if (!formData.state.trim())
      errs.state = 'State of practice is required';

    setErrors(errs);
    if (Object.keys(errs).length > 0) triggerBuzz();
    return Object.keys(errs).length === 0;
  };

  const validateStep3 = () => {
    const errs = {};
    if (!formData.hospitalName.trim())
      errs.hospitalName = 'Hospital or clinic name is required';
    if (!formData.city.trim())
      errs.city = 'City is required';

    setErrors(errs);
    if (Object.keys(errs).length > 0) triggerBuzz();
    return Object.keys(errs).length === 0;
  };

  const validateStep4 = () => {
    const errs = {};
    if (!formData.consent)
      errs.consent = 'Please accept consent to proceed';

    setErrors(errs);
    if (Object.keys(errs).length > 0) triggerBuzz();
    return Object.keys(errs).length === 0;
  };

  // ─── Step Transitions ────────────────────────────────────────
  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
    else if (step === 3 && validateStep3()) setStep(4);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  // ─── Submit Handler ──────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep1() || !validateStep2() || !validateStep3() || !validateStep4()) return;

    setServerError('');
    setIsSubmitting(true);

    const payload = {
      full_name: formData.fullName.trim(),
      phone: formData.phone.replace(/[^\d]/g, ''),
      email: formData.email.trim().toLowerCase(),
      gender: formData.gender,
      dob: formData.dob.trim() || null,
      medical_reg_no: formData.medicalRegNo.trim(),
      state_medical_council: formData.stateCouncil.trim() || null,
      qualification: formData.qualification.trim(),
      specialty: formData.specialty,
      experience_years: parseInt(formData.experienceYears, 10) || 0,
      current_designation: formData.designation.trim() || null,
      hospital_clinic_name: formData.hospitalName.trim(),
      clinic_address: formData.clinicAddress.trim() || null,
      city: formData.city.trim(),
      state: formData.state.trim(),
      consultation_types: formData.consultationTypes.length ? formData.consultationTypes : ['In-person'],
      consultation_fee: formData.consultationFee ? parseInt(formData.consultationFee, 10) : null,
      languages_spoken: formData.languages ? formData.languages.split(',').map((s) => s.trim()).filter(Boolean) : [],
      interested_features: formData.featuresInterest,
      notes: `Preferred comm: ${formData.preferredComm || 'WhatsApp'}`
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
      const result = await response.json();
      if (response.ok && result.success) {
        setRegisteredData(result);
        triggerConfetti();
      } else {
        setServerError(result.detail || 'Registration failed. Please check your details.');
        triggerBuzz();
      }
    } catch (err) {
      console.error('[Doctor Registry] Network error:', err);
      setServerError('Unable to connect to VORQARD server. Please ensure backend is running.');
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

  const handleReset = () => {
    setFormData({
      fullName: '', phone: '', email: '', gender: '', dob: '', preferredComm: 'WhatsApp',
      specialty: '', experienceYears: '', designation: '',
      medicalRegNo: '', stateCouncil: '', qualification: '', collegeName: '', languages: '', state: '',
      hospitalName: '', city: '', clinicAddress: '', consultationFee: '',
      consultationTypes: ['In-person', 'Online Video'],
      featuresInterest: ['Smart Digital Prescriptions','OPD Queue Token Management','Online Teleconsultations','AI Patient EMR & Health Summaries'],
      consent: true
    });
    setErrors({});
    setRegisteredData(null);
    setServerError('');
    setStep(1);
  };

  return (
    <div className="vq-page-root">
      {/* ══════════════ TOP HEADER BAR ══════════════ */}
      <header className="vq-header">
        <a href="https://www.vorqard.com/" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center' }}>
          <img
            src="/Abhivorn_logo.png"
            alt="Vorqard Logo"
            className="vq-header-logo"
            onError={(e) => {
              e.currentTarget.src = '/logo.png';
            }}
          />
        </a>

        <div className="vq-header-actions">
          {/* Explore Button */}
          <a
            href="https://www.vorqard.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="vq-header-btn-explore"
          >
            <span>Explore</span>
            <ExternalLink size={13} />
          </a>

          {/* Get Started / Sign Up Button */}
          <a
            href="https://app.vorqard.com/signup"
            target="_blank"
            rel="noopener noreferrer"
            className="vq-header-btn-signup"
          >
            <span>Get Started</span>
            <ArrowRight size={14} />
          </a>
        </div>
      </header>

      {/* ══════════════ MAIN HERO PAGE CONTENT ══════════════ */}
      <div className="vq-page-wrapper">
        {/* Softer Premium Light Blue Healthcare Gradient Overlay */}
        <div className="vq-gradient-overlay" />

        {/* Subtle Ambient Glowing Background Accents */}
        <div
          className="animate-pulse-glow hidden sm:block"
          style={{
            position: 'absolute',
            top: '-120px',
            left: '-100px',
            width: '400px',
            height: '400px',
            background: '#38BDF8',
            borderRadius: '50%',
            filter: 'blur(100px)',
            opacity: 0.32,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
        <div
          className="animate-pulse-glow hidden sm:block"
          style={{
            position: 'absolute',
            bottom: '-60px',
            left: '32%',
            width: '360px',
            height: '360px',
            background: '#67E8F9',
            borderRadius: '50%',
            filter: 'blur(90px)',
            opacity: 0.28,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        {/* Responsive 2-Column Split Container */}
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.99 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="vq-container"
        >
          {/* ─────────── LEFT HERO COLUMN: Why Join Vorqard Doctor? ─────────── */}
          <div className="vq-hero-column">
            {/* Headline & Description */}
            <div>
              <div className="vq-hero-badge">
                <Sparkles size={14} className="text-[#0284C7]" />
                <span>Doctor Early Access Program</span>
              </div>
              <h1 className="vq-hero-title">
                Empowering Doctors.<br />
                <span>Advancing Healthcare.</span>
              </h1>
              <p className="vq-hero-desc">
                Why Join Vorqard Doctor? Join thousands of trusted physicians streamlining OPD queues, digital records, and patient teleconsultations.
              </p>
            </div>

            {/* 5 Feature Cards */}
            <div className="vq-features-list">
              {/* Card 1: Grow Your Practice */}
              <div className="vq-feature-card">
                <div className="vq-feature-icon-box">
                  <Users size={19} strokeWidth={2.2} />
                </div>
                <div className="vq-feature-info">
                  <h4>Grow Your Practice</h4>
                  <p>Reach more patients and expand your digital presence across India.</p>
                </div>
              </div>

              {/* Card 2: Smart Digital Practice */}
              <div className="vq-feature-card">
                <div className="vq-feature-icon-box">
                  <FileText size={19} strokeWidth={2.2} />
                </div>
                <div className="vq-feature-info">
                  <h4>Smart Digital Practice</h4>
                  <p>Manage OPD, appointments, prescriptions, and patient records in one place.</p>
                </div>
              </div>

              {/* Card 3: Save Time */}
              <div className="vq-feature-card">
                <div className="vq-feature-icon-box">
                  <Clock size={19} strokeWidth={2.2} />
                </div>
                <div className="vq-feature-info">
                  <h4>Save Time</h4>
                  <p>Simplify daily workflows and spend more time focusing on your patients.</p>
                </div>
              </div>

              {/* Card 4: Connect With Patients */}
              <div className="vq-feature-card">
                <div className="vq-feature-icon-box">
                  <Video size={19} strokeWidth={2.2} />
                </div>
                <div className="vq-feature-info">
                  <h4>Connect With Patients</h4>
                  <p>Offer convenient teleconsultations and stay connected with patients remotely.</p>
                </div>
              </div>

              {/* Card 5: Trusted & Secure */}
              <div className="vq-feature-card">
                <div className="vq-feature-icon-box">
                  <ShieldCheck size={19} strokeWidth={2.2} />
                </div>
                <div className="vq-feature-info">
                  <h4>Trusted & Secure</h4>
                  <p>Secure patient data with a healthcare platform designed for privacy and compliance.</p>
                </div>
              </div>
            </div>

            {/* Explore Platform Link Card */}
            <div style={{ paddingTop: '4px' }}>
              <a
                href="https://www.vorqard.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="vq-explore-card"
              >
                <div>
                  <p style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Learn more
                  </p>
                  <p style={{ fontWeight: 800, color: '#0284C7', fontSize: '14px' }}>
                    Explore Platform
                  </p>
                </div>
                <div className="vq-explore-btn-circle">
                  <ArrowRight size={16} />
                </div>
              </a>
            </div>
          </div>

          {/* ─────────── RIGHT FORM CARD: React Bits BorderGlow ─────────── */}
          <div className="vq-card-column">
            <BorderGlow
              borderRadius="24px"
              glowColor="#0284C7"
              secondaryGlow="#38BDF8"
              glowSize={220}
              borderWidth={1.5}
              className="shadow-[0_20px_50px_rgba(0,0,0,0.07),_0_4px_16px_rgba(0,0,0,0.03)]"
            >
              <div className="vq-form-card-inner">
                {registeredData ? (
                  /* ══ SUCCESS VIEW ══ */
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.35 }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '10px 0' }}
                  >
                    <div style={{
                      width: '60px', height: '60px', borderRadius: '22px', background: '#E0F2FE', color: '#0284C7',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', border: '1px solid #BAE6FD'
                    }}>
                      <CheckCircle2 size={34} className="animate-bounce" />
                    </div>

                    <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', marginBottom: '4px', letterSpacing: '-0.02em' }}>
                      Registration Confirmed! 🎉
                    </h2>
                    <p style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.45', marginBottom: '18px' }}>
                      Thank you, <strong style={{ color: '#0F172A', fontWeight: 700 }}>Dr. {formData.fullName}</strong>. You have secured VIP priority onboarding with Vorqard Doctor App.
                    </p>

                    {/* Reference Code Box */}
                    <div style={{
                      width: '100%', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px',
                      padding: '14px', marginBottom: '18px', textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>
                        Your Reference Code
                      </div>
                      <div style={{ fontSize: '22px', fontWeight: 900, color: '#0284C7', letterSpacing: '0.12em', fontFamily: 'monospace' }}>
                        {registeredData.reg_code}
                      </div>
                    </div>

                    {/* WhatsApp Support Liquid Button */}
                    <a
                      href={`https://wa.me/${WHATSAPP_SUPPORT_PHONE}?text=${encodeURIComponent(`Hi VORQARD Team, I am Dr. ${formData.fullName} (${registeredData.reg_code}). I registered for Doctor App Early Access.`)}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ width: '100%', marginBottom: '10px', display: 'block', textDecoration: 'none' }}
                    >
                      <LiquidButton
                        variant="whatsapp"
                        icon={<MessageCircle size={18} />}
                        className="w-full py-3.5 text-sm font-bold"
                      >
                        Chat with Onboarding Team
                      </LiquidButton>
                    </a>

                    {/* Reset Link */}
                    <button
                      type="button"
                      onClick={handleReset}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700,
                        color: '#64748B', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 12px'
                      }}
                    >
                      <RotateCcw size={13} />
                      <span>Register another doctor</span>
                    </button>
                  </motion.div>
                ) : (
                  /* ══ STEP WIZARD FORM ══ */
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {/* Form Content Header */}
                    <h2 style={{ fontSize: '21px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', textAlign: 'center', marginBottom: '2px' }}>
                      {STEP_INFO[step].title}
                    </h2>
                    <p style={{ fontSize: '12.5px', color: '#64748B', fontWeight: 500, textAlign: 'center', marginBottom: '12px' }}>
                      {STEP_INFO[step].sub}
                    </p>

                    {/* Animated Tabs (animate-ui style) */}
                    <AnimatedTabs
                      steps={STEP_INFO}
                      currentStep={step}
                      onStepClick={(s) => setStep(s)}
                      className="mb-3.5"
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

                    {/* Form with Shake Animation on Validation Error */}
                    <motion.form
                      key={shakeCount}
                      animate={shakeCount > 0 ? { x: [0, -8, 8, -5, 5, -2, 2, 0] } : {}}
                      transition={{ duration: 0.35, ease: 'easeInOut' }}
                      onSubmit={handleSubmit}
                      noValidate
                      style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}
                    >
                      {/* ─── STEP 1: Personal Details ─── */}
                      {step === 1 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {/* Full Name */}
                          <div>
                            <label className="vq-field-label">
                              FULL NAME <span className="req">*</span>
                            </label>
                            <div className="vq-input-wrapper">
                              <span className="vq-input-icon">
                                <User size={16} />
                              </span>
                              <input
                                type="text"
                                id="fullName"
                                placeholder="e.g. Dr. John Doe"
                                value={formData.fullName}
                                onChange={handleChange}
                                className={`vq-input ${errors.fullName ? 'err' : ''}`}
                              />
                            </div>
                            {errors.fullName && (
                              <span className="vq-error-text">{errors.fullName}</span>
                            )}
                          </div>

                          {/* Mobile Number */}
                          <div>
                            <label className="vq-field-label">
                              MOBILE NUMBER <span className="req">*</span>
                            </label>
                            <div className="vq-input-wrapper">
                              <div style={{
                                position: 'absolute', left: '12px', display: 'flex', alignItems: 'center', gap: '5px',
                                color: '#64748B', fontWeight: 600, fontSize: '13px', userSelect: 'none', borderRight: '1px solid #CBD5E1', paddingRight: '8px'
                              }}>
                                <span>🇮🇳</span>
                                <span>+91</span>
                              </div>
                              <input
                                type="tel"
                                id="phone"
                                maxLength={10}
                                placeholder="10-digit mobile number"
                                value={formData.phone}
                                onChange={handleChange}
                                style={{ paddingLeft: '80px' }}
                                className={`vq-input ${errors.phone ? 'err' : ''}`}
                              />
                            </div>
                            {errors.phone && (
                              <span className="vq-error-text">{errors.phone}</span>
                            )}
                          </div>

                          {/* Work Email */}
                          <div>
                            <label className="vq-field-label">
                              WORK EMAIL <span className="req">*</span>
                            </label>
                            <div className="vq-input-wrapper">
                              <span className="vq-input-icon">
                                <Mail size={16} />
                              </span>
                              <input
                                type="email"
                                id="email"
                                placeholder="doctor@hospital.com"
                                value={formData.email}
                                onChange={handleChange}
                                className={`vq-input ${errors.email ? 'err' : ''}`}
                              />
                            </div>
                            {errors.email && (
                              <span className="vq-error-text">{errors.email}</span>
                            )}
                          </div>

                          {/* Gender & Preferred Comm. */}
                          <div className="vq-grid-2">
                            {/* Gender */}
                            <div>
                              <label className="vq-field-label">
                                GENDER <span className="req">*</span>
                              </label>
                              <div className="vq-input-wrapper">
                                <select
                                  id="gender"
                                  value={formData.gender}
                                  onChange={handleChange}
                                  className={`vq-select ${errors.gender ? 'err' : ''}`}
                                  style={{ color: formData.gender ? '#0F172A' : '#94A3B8' }}
                                >
                                  <option value="" disabled>Select</option>
                                  <option value="Male">Male</option>
                                  <option value="Female">Female</option>
                                  <option value="Other">Other</option>
                                </select>
                                <ChevronDown size={14} className="vq-select-chevron" />
                              </div>
                              {errors.gender && (
                                <span className="vq-error-text">{errors.gender}</span>
                              )}
                            </div>

                            {/* Preferred Comm */}
                            <div>
                              <label className="vq-field-label">
                                PREFERRED COMM.
                              </label>
                              <div className="vq-input-wrapper">
                                <select
                                  id="preferredComm"
                                  value={formData.preferredComm}
                                  onChange={handleChange}
                                  className="vq-select"
                                >
                                  <option value="WhatsApp">WhatsApp</option>
                                  <option value="Phone Call">Phone Call</option>
                                  <option value="Email">Email</option>
                                </select>
                                <ChevronDown size={14} className="vq-select-chevron" />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ─── STEP 2: Medical Credentials ─── */}
                      {step === 2 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div className="vq-grid-2">
                            {/* Specialty */}
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
                                  <option value="" disabled>Select</option>
                                  <option value="General Medicine">General Medicine</option>
                                  <option value="Cardiology">Cardiology</option>
                                  <option value="Orthopedics">Orthopedics</option>
                                  <option value="Dermatology">Dermatology</option>
                                  <option value="Pediatrics">Pediatrics</option>
                                  <option value="Gynecology & Obstetrics">Gynecology</option>
                                  <option value="Neurology">Neurology</option>
                                  <option value="ENT">ENT</option>
                                  <option value="Ophthalmology">Ophthalmology</option>
                                  <option value="Other">Other</option>
                                </select>
                                <ChevronDown size={14} className="vq-select-chevron" />
                              </div>
                              {errors.specialty && (
                                <span className="vq-error-text">{errors.specialty}</span>
                              )}
                            </div>

                            {/* Experience Years */}
                            <div>
                              <label className="vq-field-label">
                                EXPERIENCE (YRS) <span className="req">*</span>
                              </label>
                              <div className="vq-input-wrapper">
                                <span className="vq-input-icon">
                                  <Briefcase size={16} />
                                </span>
                                <input
                                  type="number"
                                  id="experienceYears"
                                  min="0"
                                  placeholder="e.g. 8"
                                  value={formData.experienceYears}
                                  onChange={handleChange}
                                  className={`vq-input ${errors.experienceYears ? 'err' : ''}`}
                                />
                              </div>
                              {errors.experienceYears && (
                                <span className="vq-error-text">{errors.experienceYears}</span>
                              )}
                            </div>
                          </div>

                          {/* Medical Reg No */}
                          <div>
                            <label className="vq-field-label">
                              MEDICAL COUNCIL REG. NO. <span className="req">*</span>
                            </label>
                            <div className="vq-input-wrapper">
                              <span className="vq-input-icon">
                                <Award size={16} />
                              </span>
                              <input
                                type="text"
                                id="medicalRegNo"
                                placeholder="e.g. MCI-12345 / State Council ID"
                                value={formData.medicalRegNo}
                                onChange={handleChange}
                                className={`vq-input ${errors.medicalRegNo ? 'err' : ''}`}
                              />
                            </div>
                            {errors.medicalRegNo && (
                              <span className="vq-error-text">{errors.medicalRegNo}</span>
                            )}
                          </div>

                          {/* Qualifications & State */}
                          <div className="vq-grid-2">
                            {/* Qualifications */}
                            <div>
                              <label className="vq-field-label">
                                QUALIFICATIONS <span className="req">*</span>
                              </label>
                              <div className="vq-input-wrapper">
                                <span className="vq-input-icon">
                                  <GraduationCap size={16} />
                                </span>
                                <input
                                  type="text"
                                  id="qualification"
                                  placeholder="e.g. MBBS, MD"
                                  value={formData.qualification}
                                  onChange={handleChange}
                                  className={`vq-input ${errors.qualification ? 'err' : ''}`}
                                />
                              </div>
                              {errors.qualification && (
                                <span className="vq-error-text">{errors.qualification}</span>
                              )}
                            </div>

                            {/* State */}
                            <div>
                              <label className="vq-field-label">
                                STATE <span className="req">*</span>
                              </label>
                              <div className="vq-input-wrapper">
                                <span className="vq-input-icon">
                                  <MapPin size={16} />
                                </span>
                                <input
                                  type="text"
                                  id="state"
                                  placeholder="e.g. Karnataka"
                                  value={formData.state}
                                  onChange={handleChange}
                                  className={`vq-input ${errors.state ? 'err' : ''}`}
                                />
                              </div>
                              {errors.state && (
                                <span className="vq-error-text">{errors.state}</span>
                              )}
                            </div>
                          </div>

                          {/* Current Designation */}
                          <div>
                            <label className="vq-field-label">
                              CURRENT DESIGNATION
                            </label>
                            <div className="vq-input-wrapper">
                              <span className="vq-input-icon">
                                <Building size={16} />
                              </span>
                              <input
                                type="text"
                                id="designation"
                                placeholder="e.g. Senior Consultant / Specialist"
                                value={formData.designation}
                                onChange={handleChange}
                                className="vq-input"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ─── STEP 3: Practice & Services ─── */}
                      {step === 3 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div className="vq-grid-2">
                            {/* Hospital / Clinic */}
                            <div>
                              <label className="vq-field-label">
                                HOSPITAL / CLINIC <span className="req">*</span>
                              </label>
                              <div className="vq-input-wrapper">
                                <span className="vq-input-icon">
                                  <Building2 size={16} />
                                </span>
                                <input
                                  type="text"
                                  id="hospitalName"
                                  placeholder="Hospital or Clinic Name"
                                  value={formData.hospitalName}
                                  onChange={handleChange}
                                  className={`vq-input ${errors.hospitalName ? 'err' : ''}`}
                                />
                              </div>
                              {errors.hospitalName && (
                                <span className="vq-error-text">{errors.hospitalName}</span>
                              )}
                            </div>

                            {/* City */}
                            <div>
                              <label className="vq-field-label">
                                CITY <span className="req">*</span>
                              </label>
                              <div className="vq-input-wrapper">
                                <span className="vq-input-icon">
                                  <MapPin size={16} />
                                </span>
                                <input
                                  type="text"
                                  id="city"
                                  placeholder="e.g. Bangalore"
                                  value={formData.city}
                                  onChange={handleChange}
                                  className={`vq-input ${errors.city ? 'err' : ''}`}
                                />
                              </div>
                              {errors.city && (
                                <span className="vq-error-text">{errors.city}</span>
                              )}
                            </div>
                          </div>

                          {/* Clinic Address */}
                          <div>
                            <label className="vq-field-label">
                              CLINIC ADDRESS
                            </label>
                            <div className="vq-input-wrapper">
                              <span className="vq-input-icon">
                                <Navigation size={16} />
                              </span>
                              <input
                                type="text"
                                id="clinicAddress"
                                placeholder="Full address / locality"
                                value={formData.clinicAddress}
                                onChange={handleChange}
                                className="vq-input"
                              />
                            </div>
                          </div>

                          {/* Consultation Fee */}
                          <div>
                            <label className="vq-field-label">
                              APPROX. CONSULTATION FEE
                            </label>
                            <div className="vq-input-wrapper">
                              <span style={{ position: 'absolute', left: '14px', color: '#64748B', fontWeight: 700, fontSize: '14px' }}>
                                ₹
                              </span>
                              <input
                                type="number"
                                id="consultationFee"
                                min="0"
                                placeholder="e.g. 500"
                                value={formData.consultationFee}
                                onChange={handleChange}
                                className="vq-input"
                                style={{ paddingLeft: '34px' }}
                              />
                            </div>
                          </div>

                          {/* Consultation Modes */}
                          <div>
                            <label className="vq-field-label">
                              CONSULTATION MODES
                            </label>
                            <div className="vq-grid-2">
                              <label
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
                                  borderRadius: '10px', border: formData.consultationTypes.includes('In-person') ? '1.5px solid #0284C7' : '1px solid #CBD5E1',
                                  background: formData.consultationTypes.includes('In-person') ? '#F0F9FF' : '#FFFFFF',
                                  color: formData.consultationTypes.includes('In-person') ? '#0284C7' : '#475569',
                                  fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', userSelect: 'none', transition: 'all 0.2s ease'
                                }}
                              >
                                <input
                                  type="checkbox"
                                  name="consultationTypes"
                                  value="In-person"
                                  checked={formData.consultationTypes.includes('In-person')}
                                  onChange={handleChange}
                                  style={{ accentColor: '#0284C7', width: '15px', height: '15px' }}
                                />
                                <span>In-Person OPD</span>
                              </label>

                              <label
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
                                  borderRadius: '10px', border: formData.consultationTypes.includes('Online Video') ? '1.5px solid #0284C7' : '1px solid #CBD5E1',
                                  background: formData.consultationTypes.includes('Online Video') ? '#F0F9FF' : '#FFFFFF',
                                  color: formData.consultationTypes.includes('Online Video') ? '#0284C7' : '#475569',
                                  fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', userSelect: 'none', transition: 'all 0.2s ease'
                                }}
                              >
                                <input
                                  type="checkbox"
                                  name="consultationTypes"
                                  value="Online Video"
                                  checked={formData.consultationTypes.includes('Online Video')}
                                  onChange={handleChange}
                                  style={{ accentColor: '#0284C7', width: '15px', height: '15px' }}
                                />
                                <span>Video Consult</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ─── STEP 4: Review & Confirm ─── */}
                      {step === 4 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {/* Summary Card */}
                          <div style={{
                            background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '12px',
                            padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '5px', borderBottom: '1px solid #E0F2FE' }}>
                              <span style={{ color: '#64748B', fontWeight: 600 }}>Doctor Name:</span>
                              <span style={{ color: '#0F172A', fontWeight: 700 }}>Dr. {formData.fullName || '—'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '5px', borderBottom: '1px solid #E0F2FE' }}>
                              <span style={{ color: '#64748B', fontWeight: 600 }}>Mobile:</span>
                              <span style={{ color: '#0F172A', fontWeight: 700 }}>+91 {formData.phone || '—'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '5px', borderBottom: '1px solid #E0F2FE' }}>
                              <span style={{ color: '#64748B', fontWeight: 600 }}>Specialty:</span>
                              <span style={{ color: '#0F172A', fontWeight: 700 }}>{formData.specialty || '—'} ({formData.experienceYears || '0'} Yrs)</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '5px', borderBottom: '1px solid #E0F2FE' }}>
                              <span style={{ color: '#64748B', fontWeight: 600 }}>Reg No:</span>
                              <span style={{ color: '#0F172A', fontWeight: 700, fontFamily: 'monospace' }}>{formData.medicalRegNo || '—'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ color: '#64748B', fontWeight: 600 }}>Clinic / City:</span>
                              <span style={{ color: '#0F172A', fontWeight: 700 }}>{formData.hospitalName || '—'}, {formData.city || '—'}</span>
                            </div>
                          </div>

                          {/* Consent Checkbox */}
                          <label style={{
                            display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 12px',
                            borderRadius: '10px', background: '#FFFFFF', border: '1px solid #CBD5E1', cursor: 'pointer', userSelect: 'none'
                          }}>
                            <input
                              type="checkbox"
                              id="consent"
                              checked={formData.consent}
                              onChange={handleChange}
                              style={{ accentColor: '#0284C7', width: '15px', height: '15px', marginTop: '1px' }}
                            />
                            <span style={{ fontSize: '11.5px', color: '#475569', lineHeight: '1.4' }}>
                              I confirm that the details provided are accurate and agree to receive onboarding updates from Vorqard.
                            </span>
                          </label>
                          {errors.consent && (
                            <span className="vq-error-text">{errors.consent}</span>
                          )}
                        </div>
                      )}

                      {/* Elevated Blue Action Buttons (Liquid Button from animate-ui) */}
                      <div style={{ paddingTop: '4px' }}>
                        {step < 4 ? (
                          <LiquidButton
                            type="button"
                            onClick={handleNext}
                            variant="primary"
                            icon={<ArrowRight size={15} />}
                            className="w-full py-3 text-sm font-bold"
                          >
                            Continue to Step {step + 1}
                          </LiquidButton>
                        ) : (
                          <LiquidButton
                            type="submit"
                            disabled={isSubmitting}
                            loading={isSubmitting}
                            variant="primary"
                            icon={<CheckCircle2 size={15} />}
                            className="w-full py-3 text-sm font-bold"
                          >
                            Submit Registration
                          </LiquidButton>
                        )}

                        {/* Back Button */}
                        {step > 1 && (
                          <button
                            type="button"
                            onClick={handleBack}
                            style={{
                              width: '100%', padding: '6px', fontSize: '12px', fontWeight: 700,
                              color: '#64748B', background: 'none', border: 'none', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', marginTop: '3px'
                            }}
                          >
                            <ArrowLeft size={13} />
                            <span>Back to previous step</span>
                          </button>
                        )}

                        {/* Security Footer Note */}
                        <div style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                          fontSize: '11px', color: '#94A3B8', marginTop: '8px', userSelect: 'none'
                        }}>
                          <ShieldCheck size={13} style={{ color: '#0284C7' }} />
                          <span>Our team will contact you within 24 hours</span>
                        </div>
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
