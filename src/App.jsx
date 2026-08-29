import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { API_BASE_URL, WHATSAPP_SUPPORT_PHONE } from './config';

const STEP_INFO = {
  1: { title: 'Personal Details', sub: 'Enter your basic contact information' },
  2: { title: 'Medical Credentials', sub: 'Qualifications & council registration' },
  3: { title: 'Practice & Services', sub: 'Clinic details & consultation setup' },
  4: { title: 'Review & Submit', sub: 'Confirm your details to get early access' },
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

  // ─── Handle Input Changes ────────────────────────────────────
  const handleChange = (e) => {
    const { id, name, value, type, checked } = e.target;
    const key = id || name;

    if (type === 'checkbox' && name === 'consultationTypes') {
      const current = [...formData.consultationTypes];
      if (checked) { if (!current.includes(value)) current.push(value); }
      else { const idx = current.indexOf(value); if (idx > -1) current.splice(idx, 1); }
      setFormData((prev) => ({ ...prev, consultationTypes: current }));
      return;
    }
    if (type === 'checkbox' && name === 'featuresInterest') {
      const current = [...formData.featuresInterest];
      if (checked) { if (!current.includes(value)) current.push(value); }
      else { const idx = current.indexOf(value); if (idx > -1) current.splice(idx, 1); }
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

    // 1. Full Name: 2-100 characters, letters + spaces + . / ' / -
    if (!name) {
      errs.fullName = 'Please enter your full name.';
    } else if (name.length < 2 || name.length > 100 || !/^[a-zA-Z\s\.\'\-]+$/.test(name)) {
      errs.fullName = 'Please enter a valid name.';
    }

    // 2. Mobile Number: exactly 10 digits, starts with 6-9, no fake repetitions
    const isRepeatedFake = /^(\d)\1{9}$/.test(phone);
    if (!phone) {
      errs.phone = 'Please enter your mobile number.';
    } else if (!/^[6-9]\d{9}$/.test(phone) || isRepeatedFake || phone === '1234567890') {
      errs.phone = 'Enter a valid 10-digit mobile number.';
    }

    // 3. Work Email: valid email format, max 254 chars (gmail/yahoo etc. allowed)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email) {
      errs.email = 'Please enter your work email.';
    } else if (email.length > 254 || !emailRegex.test(email)) {
      errs.email = 'Enter a valid email address.';
    }

    // 4. Gender: required
    if (!formData.gender) {
      errs.gender = 'Please select gender.';
    }

    // 5. Preferred Communication: required
    if (!formData.preferredComm) {
      errs.preferredComm = 'Please select preferred communication.';
    }

    setErrors(errs);
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
    return Object.keys(errs).length === 0;
  };

  const validateStep3 = () => {
    const errs = {};
    if (!formData.hospitalName.trim())
      errs.hospitalName = 'Hospital or clinic name is required';
    if (!formData.city.trim())
      errs.city = 'City is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep4 = () => {
    const errs = {};
    if (!formData.consent)
      errs.consent = 'Please accept consent to proceed';

    setErrors(errs);
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
      }
    } catch (err) {
      console.error('[Doctor Registry] Network error:', err);
      setServerError('Unable to connect to VORQARD server. Please ensure backend is running.');
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
        colors: ['#0891B2', '#16A34A', '#F97316', '#06B6D4', '#22C55E']
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
    setErrors({}); setRegisteredData(null); setServerError(''); setStep(1);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      {/* ══════════════ HEADER ══════════════ */}
      <header className="vq-header">
        <div className="vq-header-inner">
          <a className="vq-brand" href="https://www.vorqard.com/">
            <img src="/logo.png" alt="Vorqard" className="vq-brand-logo" />
          </a>
          <a
            href="https://www.vorqard.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="vq-explore-btn"
          >
            <span>Explore More</span>
            <i className="fa-solid fa-arrow-right"></i>
          </a>
        </div>
      </header>

      {/* ══════════════ MAIN HERO SECTION (Split Layout) ══════════════ */}
      <main className="vq-hero-section" style={{ flex: 1 }}>
        <div className="vq-hero-container">

          {/* ─────────── LEFT COLUMN: Why Join Vorqard Doctor? ─────────── */}
          <div className="vq-left-content">
            <h1 className="vq-hero-title">
              Why Join <span>Vorqard Doctor</span>?
            </h1>

            <div className="vq-benefits-list">
              <div className="vq-benefit-card">
                <div className="vq-benefit-icon">👥</div>
                <div className="vq-benefit-body">
                  <h3>Grow Your Practice</h3>
                  <p>Reach more patients and expand your digital presence across India.</p>
                </div>
              </div>

              <div className="vq-benefit-card">
                <div className="vq-benefit-icon">📋</div>
                <div className="vq-benefit-body">
                  <h3>Smart Digital Practice</h3>
                  <p>Manage OPD, appointments, prescriptions, and patient records in one place.</p>
                </div>
              </div>

              <div className="vq-benefit-card">
                <div className="vq-benefit-icon">⏱️</div>
                <div className="vq-benefit-body">
                  <h3>Save Time</h3>
                  <p>Simplify daily workflows and spend more time focusing on your patients.</p>
                </div>
              </div>

              <div className="vq-benefit-card">
                <div className="vq-benefit-icon">📹</div>
                <div className="vq-benefit-body">
                  <h3>Connect With Patients</h3>
                  <p>Offer convenient teleconsultations and stay connected with patients remotely.</p>
                </div>
              </div>

              <div className="vq-benefit-card">
                <div className="vq-benefit-icon">🛡️</div>
                <div className="vq-benefit-body">
                  <h3>Trusted & Secure</h3>
                  <p>Secure patient data with a healthcare platform designed for privacy and compliance.</p>
                </div>
              </div>
            </div>
          </div>

          {/* ─────────── RIGHT COLUMN: Compact Focused Card ─────────── */}
          <div className="vq-right-container">
            <div className="vq-form-card">

              {registeredData ? (
                /* ══ SUCCESS VIEW ══ */
                <div className="vq-success-view">
                  <div className="vq-success-badge"><i className="fa-solid fa-check"></i></div>
                  <h3>Registration Confirmed! 🎉</h3>
                  <p>Thank you, <strong>Dr. {formData.fullName}</strong>. You have secured VIP priority onboarding with Vorqard Doctor App.</p>

                  <div className="vq-reg-code-box">
                    <div className="code-lbl">Your Reference Code</div>
                    <div className="code-val">{registeredData.reg_code}</div>
                  </div>

                  <a
                    href={`https://wa.me/${WHATSAPP_SUPPORT_PHONE}?text=${encodeURIComponent(`Hi VORQARD Team, I am Dr. ${formData.fullName} (${registeredData.reg_code}). I registered for Doctor App Early Access.`)}`}
                    target="_blank" rel="noreferrer"
                    className="vq-btn-whatsapp-full"
                  >
                    <i className="fa-brands fa-whatsapp"></i> Chat with Onboarding Team
                  </a>

                  <button type="button" className="vq-btn-back-link" onClick={handleReset}>
                    <i className="fa-solid fa-rotate-left"></i> Register another doctor
                  </button>
                </div>

              ) : (
                /* ══ COMPACT STEP WIZARD FORM ══ */
                <form onSubmit={handleSubmit} noValidate>

                  {/* Card Header & Stepper */}
                  <div className="vq-card-header">
                    <div className="vq-card-title-row">
                      <h2 className="vq-card-title">{STEP_INFO[step].title}</h2>
                      <span className="vq-step-pill">Step {step} of 4</span>
                    </div>
                    <p className="vq-card-subtitle">{STEP_INFO[step].sub}</p>

                    {/* Progress Bar */}
                    <div className="vq-stepper-bar">
                      {[1, 2, 3, 4].map((s) => (
                        <div
                          key={s}
                          className={`vq-bar-segment ${step === s ? 'active' : ''} ${step > s ? 'done' : ''}`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Server Alert */}
                  {serverError && (
                    <div className="vq-server-alert">
                      <i className="fa-solid fa-circle-exclamation"></i>
                      <span>{serverError}</span>
                    </div>
                  )}

                  {/* ─── STEP 1: Personal Details ─── */}
                  {step === 1 && (
                    <div className="vq-form-fields">
                      <div className="vq-control">
                        <label className="vq-label" htmlFor="fullName">Full Name <span className="vq-req">*</span></label>
                        <input
                          type="text" id="fullName"
                          className={`vq-text-input ${errors.fullName ? 'err' : ''}`}
                          value={formData.fullName} onChange={handleChange}
                        />
                        <span className="vq-error-msg">{errors.fullName}</span>
                      </div>

                      <div className="vq-control">
                        <label className="vq-label" htmlFor="phone">Mobile Number <span className="vq-req">*</span></label>
                        <div className="vq-input-box">
                          <span className="vq-phone-flag">🇮🇳 +91</span>
                          <input
                            type="tel" id="phone"
                            className={`vq-text-input has-prefix ${errors.phone ? 'err' : ''}`}
                            maxLength={10}
                            value={formData.phone} onChange={handleChange}
                          />
                        </div>
                        <span className="vq-error-msg">{errors.phone}</span>
                      </div>

                      <div className="vq-control">
                        <label className="vq-label" htmlFor="email">Work Email <span className="vq-req">*</span></label>
                        <input
                          type="email" id="email"
                          className={`vq-text-input ${errors.email ? 'err' : ''}`}
                          value={formData.email} onChange={handleChange}
                        />
                        <span className="vq-error-msg">{errors.email}</span>
                      </div>

                      <div className="vq-grid-2">
                        <div className="vq-control">
                          <label className="vq-label" htmlFor="gender">Gender <span className="vq-req">*</span></label>
                          <div className="vq-select-box">
                            <select id="gender" className={`vq-select-input ${errors.gender ? 'err' : ''}`} value={formData.gender} onChange={handleChange}>
                              <option value="" disabled>Select</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                            <i className="fa-solid fa-chevron-down vq-select-chevron"></i>
                          </div>
                          <span className="vq-error-msg">{errors.gender}</span>
                        </div>

                        <div className="vq-control">
                          <label className="vq-label" htmlFor="preferredComm">Preferred Comm.</label>
                          <div className="vq-select-box">
                            <select id="preferredComm" className="vq-select-input" value={formData.preferredComm} onChange={handleChange}>
                              <option value="WhatsApp">WhatsApp</option>
                              <option value="Phone Call">Phone Call</option>
                              <option value="Email">Email</option>
                            </select>
                            <i className="fa-solid fa-chevron-down vq-select-chevron"></i>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ─── STEP 2: Medical Credentials ─── */}
                  {step === 2 && (
                    <div className="vq-form-fields">
                      <div className="vq-grid-2">
                        <div className="vq-control">
                          <label className="vq-label" htmlFor="specialty">Specialization <span className="vq-req">*</span></label>
                          <div className="vq-select-box">
                            <select id="specialty" className={`vq-select-input ${errors.specialty ? 'err' : ''}`} value={formData.specialty} onChange={handleChange}>
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
                            <i className="fa-solid fa-chevron-down vq-select-chevron"></i>
                          </div>
                          <span className="vq-error-msg">{errors.specialty}</span>
                        </div>

                        <div className="vq-control">
                          <label className="vq-label" htmlFor="experienceYears">Experience (Years) <span className="vq-req">*</span></label>
                          <input
                            type="number" id="experienceYears"
                            className={`vq-text-input ${errors.experienceYears ? 'err' : ''}`}
                            min="0"
                            value={formData.experienceYears} onChange={handleChange}
                          />
                          <span className="vq-error-msg">{errors.experienceYears}</span>
                        </div>
                      </div>

                      <div className="vq-control">
                        <label className="vq-label" htmlFor="medicalRegNo">Medical Council Reg. No. <span className="vq-req">*</span></label>
                        <input
                          type="text" id="medicalRegNo"
                          className={`vq-text-input ${errors.medicalRegNo ? 'err' : ''}`}
                          value={formData.medicalRegNo} onChange={handleChange}
                        />
                        <span className="vq-error-msg">{errors.medicalRegNo}</span>
                      </div>

                      <div className="vq-grid-2">
                        <div className="vq-control">
                          <label className="vq-label" htmlFor="qualification">Qualifications <span className="vq-req">*</span></label>
                          <input
                            type="text" id="qualification"
                            className={`vq-text-input ${errors.qualification ? 'err' : ''}`}
                            value={formData.qualification} onChange={handleChange}
                          />
                          <span className="vq-error-msg">{errors.qualification}</span>
                        </div>

                        <div className="vq-control">
                          <label className="vq-label" htmlFor="state">State <span className="vq-req">*</span></label>
                          <input
                            type="text" id="state"
                            className={`vq-text-input ${errors.state ? 'err' : ''}`}
                            value={formData.state} onChange={handleChange}
                          />
                          <span className="vq-error-msg">{errors.state}</span>
                        </div>
                      </div>

                      <div className="vq-control">
                        <label className="vq-label" htmlFor="designation">Current Designation</label>
                        <input
                          type="text" id="designation"
                          className="vq-text-input"
                          value={formData.designation} onChange={handleChange}
                        />
                      </div>
                    </div>
                  )}

                  {/* ─── STEP 3: Practice & Services ─── */}
                  {step === 3 && (
                    <div className="vq-form-fields">
                      <div className="vq-grid-2">
                        <div className="vq-control">
                          <label className="vq-label" htmlFor="hospitalName">Hospital / Clinic <span className="vq-req">*</span></label>
                          <input
                            type="text" id="hospitalName"
                            className={`vq-text-input ${errors.hospitalName ? 'err' : ''}`}
                            value={formData.hospitalName} onChange={handleChange}
                          />
                          <span className="vq-error-msg">{errors.hospitalName}</span>
                        </div>

                        <div className="vq-control">
                          <label className="vq-label" htmlFor="city">City <span className="vq-req">*</span></label>
                          <input
                            type="text" id="city"
                            className={`vq-text-input ${errors.city ? 'err' : ''}`}
                            value={formData.city} onChange={handleChange}
                          />
                          <span className="vq-error-msg">{errors.city}</span>
                        </div>
                      </div>

                      <div className="vq-control">
                        <label className="vq-label" htmlFor="clinicAddress">Clinic Address</label>
                        <input
                          type="text" id="clinicAddress"
                          className="vq-text-input"
                          value={formData.clinicAddress} onChange={handleChange}
                        />
                      </div>

                      <div className="vq-control">
                        <label className="vq-label" htmlFor="consultationFee">Approx. Consultation Fee</label>
                        <div className="vq-input-box">
                          <span className="vq-currency-rs">₹</span>
                          <input
                            type="number" id="consultationFee"
                            className="vq-text-input has-rs"
                            min="0"
                            value={formData.consultationFee} onChange={handleChange}
                          />
                        </div>
                      </div>

                      <div className="vq-control">
                        <label className="vq-label">Consultation Modes</label>
                        <div className="vq-mode-pills">
                          <label className="vq-mode-pill">
                            <input
                              type="checkbox" name="consultationTypes" value="In-person"
                              checked={formData.consultationTypes.includes('In-person')} onChange={handleChange}
                            />
                            <span>In-Person OPD</span>
                          </label>
                          <label className="vq-mode-pill">
                            <input
                              type="checkbox" name="consultationTypes" value="Online Video"
                              checked={formData.consultationTypes.includes('Online Video')} onChange={handleChange}
                            />
                            <span>Video Consult</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ─── STEP 4: Review & Confirm ─── */}
                  {step === 4 && (
                    <div className="vq-form-fields">
                      <div className="vq-review-card">
                        <div className="vq-review-row">
                          <span className="lbl">Doctor Name:</span>
                          <span className="val">Dr. {formData.fullName}</span>
                        </div>
                        <div className="vq-review-row">
                          <span className="lbl">Mobile:</span>
                          <span className="val">+91 {formData.phone}</span>
                        </div>
                        <div className="vq-review-row">
                          <span className="lbl">Specialty:</span>
                          <span className="val">{formData.specialty} ({formData.experienceYears} Yrs)</span>
                        </div>
                        <div className="vq-review-row">
                          <span className="lbl">Reg No:</span>
                          <span className="val">{formData.medicalRegNo}</span>
                        </div>
                        <div className="vq-review-row">
                          <span className="lbl">Clinic / City:</span>
                          <span className="val">{formData.hospitalName}, {formData.city}</span>
                        </div>
                      </div>

                      <label className="vq-consent-box">
                        <input type="checkbox" id="consent" checked={formData.consent} onChange={handleChange} />
                        <span>I confirm that the details provided are accurate and agree to receive onboarding updates from Vorqard.</span>
                      </label>
                      <span className="vq-error-msg">{errors.consent}</span>
                    </div>
                  )}

                  {/* Card Actions / Buttons */}
                  <div className="vq-card-actions">
                    {step < 4 ? (
                      <button type="button" className="vq-btn-cta" onClick={handleNext}>
                        <span>Continue to Step {step + 1}</span>
                        <i className="fa-solid fa-arrow-right"></i>
                      </button>
                    ) : (
                      <button type="submit" className="vq-btn-cta" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <span>Submitting Registration...</span>
                        ) : (
                          <>
                            <span>Submit Registration</span>
                            <i className="fa-solid fa-circle-check"></i>
                          </>
                        )}
                      </button>
                    )}

                    {step > 1 && (
                      <button type="button" className="vq-btn-back-link" onClick={handleBack}>
                        <i className="fa-solid fa-arrow-left"></i>
                        <span>Back to previous step</span>
                      </button>
                    )}

                    <div className="vq-card-footer-note">
                      <i className="fa-solid fa-shield-halved"></i>
                      <span>Our team will contact you within 24 hours</span>
                    </div>
                  </div>

                </form>
              )}

            </div>
          </div>

        </div>
      </main>

    </div>
  );
}
