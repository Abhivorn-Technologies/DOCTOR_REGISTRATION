import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { API_BASE_URL, MAIN_WEBSITE_URL, PINCODE_API_URL } from './config';

const STEP_INFO = {
  1: { title: 'Doctor Information', sub: 'Personal details & contact preferences' },
  2: { title: 'Professional Credentials', sub: 'Medical qualification, registration & specialty' },
  3: { title: 'Practice & Service Preferences', sub: 'Hospital/clinic details & Vorqard features' },
  4: { title: 'Review & Declaration', sub: 'Confirm details and consent for onboarding' },
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

  // ─── Form State ───────────────────────────────────────────────
  const [formData, setFormData] = useState({
    // Section 1 & 7: Doctor Information & Communication
    fullName: '',
    phone: '',
    email: '',
    gender: '',
    dob: '',
    preferredComm: 'WhatsApp',
    contactBeforeLaunch: true,

    // Section 2 & 6: Professional Information
    qualification: '',
    medicalRegNo: '',
    stateCouncil: '',
    specialty: '',
    subSpecialty: '',
    experienceYears: '',
    designation: '',
    languages: '',

    // Section 3, 4 & 5: Practice & Preferences
    hospitalName: '',
    pincode: '',
    city: '',
    state: '',
    clinicAddress: '',
    consultationTypes: ['In-person consultation', 'Online consultation'],
    featuresInterest: [
      'Appointment management',
      'Online consultations',
      'Patient communication',
      'Digital prescriptions / consultation notes',
      'Reports / document management',
      'AI-assisted booking and reminders'
    ],
    dailyConsultations: '',
    additionalComments: '',

    // Section 8: Declaration & Consent
    consent: true
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [registeredData, setRegisteredData] = useState(null);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeStatus, setPincodeStatus] = useState('');

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
          setPincodeStatus('PIN code not found, enter location manually');
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

    // 4. Preferred Communication: required
    if (!formData.preferredComm) {
      errs.preferredComm = 'Please select preferred communication.';
    }

    setErrors(errs);
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
    return Object.keys(errs).length === 0;
  };

  // ─── Step 3 Validation ──────────────────────────────────────
  const validateStep3 = () => {
    const errs = {};
    if (!formData.hospitalName.trim())
      errs.hospitalName = 'Hospital or clinic name is required';
    if (!formData.city.trim())
      errs.city = 'City is required';
    if (!formData.state.trim())
      errs.state = 'State is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ─── Step 4 Validation ──────────────────────────────────────
  const validateStep4 = () => {
    const errs = {};
    if (!formData.consent)
      errs.consent = 'Please confirm the declaration & consent to proceed.';

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
        `Contact before launch: ${formData.contactBeforeLaunch ? 'Yes' : 'No'}`,
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
      const result = await response.json();
      if (response.ok && result.success) {
        setRegisteredData(result);
        triggerConfetti();
      } else {
        setServerError(result.detail || 'Registration failed. Please check your details and try again.');
      }
    } catch (err) {
      console.error('[Doctor Registry] Network error:', err);
      setServerError('Unable to connect to VORQARD server. Please ensure the backend is running.');
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
      fullName: '', phone: '', email: '', gender: '', dob: '', preferredComm: 'WhatsApp', contactBeforeLaunch: true,
      qualification: '', medicalRegNo: '', stateCouncil: '', specialty: '', subSpecialty: '', experienceYears: '', designation: '', languages: '',
      hospitalName: '', pincode: '', city: '', state: '', clinicAddress: '',
      consultationTypes: ['In-person consultation', 'Online consultation'],
      featuresInterest: [
        'Appointment management',
        'Online consultations',
        'Patient communication',
        'Digital prescriptions / consultation notes',
        'Reports / document management',
        'AI-assisted booking and reminders'
      ],
      dailyConsultations: '', additionalComments: '',
      consent: true
    });
    setErrors({}); setRegisteredData(null); setServerError(''); setStep(1); setPincodeStatus('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      {/* ══════════════ HEADER ══════════════ */}
      <header className="vq-header">
        <div className="vq-header-inner">
          <a className="vq-brand" href={MAIN_WEBSITE_URL}>
            <img src="/logo.png" alt="Vorqard" className="vq-brand-logo" />
          </a>
          <a
            href={MAIN_WEBSITE_URL}
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

          {/* ─────────── RIGHT COLUMN: Pre-Launch Form Card ─────────── */}
          <div className="vq-right-container">
            <div className="vq-form-card">

              {registeredData ? (
                /* ══ SUCCESS VIEW ══ */
                <div className="vq-success-view">
                  <div className="vq-success-badge"><i className="fa-solid fa-check"></i></div>
                  <h3>Pre-Launch Registration Confirmed! 🎉</h3>
                  <p>Thank you, <strong>Dr. {formData.fullName}</strong>. You have secured VIP priority early access with the Vorqard Doctor Network.</p>

                  <div className="vq-reg-code-box">
                    <div className="code-lbl">Your Reference Code</div>
                    <div className="code-val">{registeredData.reg_code}</div>
                  </div>
                </div>

              ) : (
                /* ══ 4-STEP WIZARD FORM ══ */
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

                  {/* ─── STEP 1: Doctor Information (Section 1 & 7) ─── */}
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
                          <div className="vq-phone-flag-box">
                            <svg className="vq-flag-svg" viewBox="0 0 24 16" fill="none">
                              <rect width="24" height="5.33" fill="#FF9933"/>
                              <rect y="5.33" width="24" height="5.33" fill="#FFFFFF"/>
                              <rect y="10.66" width="24" height="5.33" fill="#138808"/>
                              <circle cx="12" cy="8" r="2.2" fill="#000080"/>
                            </svg>
                            <span className="vq-phone-code">+91</span>
                          </div>
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
                          <label className="vq-label" htmlFor="gender">Gender</label>
                          <div className="vq-select-box">
                            <select id="gender" className="vq-select-input" value={formData.gender} onChange={handleChange}>
                              <option value="">Select Gender</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                            <i className="fa-solid fa-chevron-down vq-select-chevron"></i>
                          </div>
                        </div>

                        <div className="vq-control">
                          <label className="vq-label" htmlFor="preferredComm">Preferred Contact <span className="vq-req">*</span></label>
                          <div className="vq-select-box">
                            <select id="preferredComm" className="vq-select-input" value={formData.preferredComm} onChange={handleChange}>
                              <option value="WhatsApp">WhatsApp</option>
                              <option value="Phone call">Phone call</option>
                              <option value="Email">Email</option>
                            </select>
                            <i className="fa-solid fa-chevron-down vq-select-chevron"></i>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ─── STEP 2: Professional Information (Section 2 & 6) ─── */}
                  {step === 2 && (
                    <div className="vq-form-fields">
                      <div className="vq-grid-2">
                        <div className="vq-control">
                          <label className="vq-label" htmlFor="qualification">Highest Medical Qualification <span className="vq-req">*</span></label>
                          <input
                            type="text" id="qualification"
                            className={`vq-text-input ${errors.qualification ? 'err' : ''}`}
                            value={formData.qualification} onChange={handleChange}
                          />
                          <span className="vq-error-msg">{errors.qualification}</span>
                        </div>

                        <div className="vq-control">
                          <label className="vq-label" htmlFor="medicalRegNo">Medical Registration Number</label>
                          <input
                            type="text" id="medicalRegNo"
                            className="vq-text-input"
                            value={formData.medicalRegNo} onChange={handleChange}
                          />
                        </div>
                      </div>

                      <div className="vq-grid-2">
                        <div className="vq-control">
                          <label className="vq-label" htmlFor="specialty">Specialization <span className="vq-req">*</span></label>
                          <div className="vq-select-box">
                            <select id="specialty" className={`vq-select-input ${errors.specialty ? 'err' : ''}`} value={formData.specialty} onChange={handleChange}>
                              <option value="" disabled>Select Specialization</option>
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
                              <option value="Endocrinology">Endocrinology</option>
                              <option value="Dentistry">Dentistry</option>
                              <option value="Ayurveda / Homeopathy">Ayurveda / Homeopathy</option>
                              <option value="Other">Other</option>
                            </select>
                            <i className="fa-solid fa-chevron-down vq-select-chevron"></i>
                          </div>
                          <span className="vq-error-msg">{errors.specialty}</span>
                        </div>

                        <div className="vq-control">
                          <label className="vq-label" htmlFor="experienceYears">Years of Experience <span className="vq-req">*</span></label>
                          <input
                            type="number" id="experienceYears"
                            className={`vq-text-input ${errors.experienceYears ? 'err' : ''}`}
                            min="0"
                            value={formData.experienceYears} onChange={handleChange}
                          />
                          <span className="vq-error-msg">{errors.experienceYears}</span>
                        </div>
                      </div>

                      <div className="vq-grid-2">
                        <div className="vq-control">
                          <label className="vq-label" htmlFor="subSpecialty">Sub-specialization (if applicable)</label>
                          <input
                            type="text" id="subSpecialty"
                            className="vq-text-input"
                            value={formData.subSpecialty} onChange={handleChange}
                          />
                        </div>

                        <div className="vq-control">
                          <label className="vq-label" htmlFor="stateCouncil">State / Medical Council</label>
                          <input
                            type="text" id="stateCouncil"
                            className="vq-text-input"
                            value={formData.stateCouncil} onChange={handleChange}
                          />
                        </div>
                      </div>

                      <div className="vq-grid-2">
                        <div className="vq-control">
                          <label className="vq-label" htmlFor="designation">Designation</label>
                          <input
                            type="text" id="designation"
                            className="vq-text-input"
                            value={formData.designation} onChange={handleChange}
                          />
                        </div>

                        <div className="vq-control">
                          <label className="vq-label" htmlFor="languages">Languages Spoken</label>
                          <input
                            type="text" id="languages"
                            className="vq-text-input"
                            value={formData.languages} onChange={handleChange}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ─── STEP 3: Practice & Service Preferences (Section 3, 4 & 5) ─── */}
                  {step === 3 && (
                    <div className="vq-form-fields">
                      <div className="vq-control">
                        <label className="vq-label" htmlFor="hospitalName">Hospital / Clinic Name <span className="vq-req">*</span></label>
                        <input
                          type="text" id="hospitalName"
                          className={`vq-text-input ${errors.hospitalName ? 'err' : ''}`}
                          value={formData.hospitalName} onChange={handleChange}
                        />
                        <span className="vq-error-msg">{errors.hospitalName}</span>
                      </div>

                      <div className="vq-grid-2">
                        <div className="vq-control">
                          <label className="vq-label" htmlFor="pincode">Postal / PIN Code</label>
                          <input
                            type="text" id="pincode"
                            className="vq-text-input"
                            maxLength={6}
                            value={formData.pincode}
                            onChange={handlePincodeChange}
                          />
                          {pincodeStatus && (
                            <span className={`vq-pincode-status ${pincodeStatus.startsWith('✓') ? 'success' : pincodeLoading ? 'loading' : 'error'}`}>
                              {pincodeStatus}
                            </span>
                          )}
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

                      <div className="vq-grid-2">
                        <div className="vq-control">
                          <label className="vq-label" htmlFor="state">State <span className="vq-req">*</span></label>
                          <input
                            type="text" id="state"
                            className={`vq-text-input ${errors.state ? 'err' : ''}`}
                            value={formData.state} onChange={handleChange}
                          />
                          <span className="vq-error-msg">{errors.state}</span>
                        </div>

                        <div className="vq-control">
                          <label className="vq-label" htmlFor="clinicAddress">Practice Location / Area</label>
                          <input
                            type="text" id="clinicAddress"
                            className="vq-text-input"
                            value={formData.clinicAddress} onChange={handleChange}
                          />
                        </div>
                      </div>

                      <div className="vq-control">
                        <label className="vq-label">Preferred Consultation Mode</label>
                        <div className="vq-mode-pills">
                          <label className="vq-mode-pill">
                            <input
                              type="checkbox" name="consultationTypes" value="In-person consultation"
                              checked={formData.consultationTypes.includes('In-person consultation')} onChange={handleChange}
                            />
                            <span>In-person</span>
                          </label>
                          <label className="vq-mode-pill">
                            <input
                              type="checkbox" name="consultationTypes" value="Online consultation"
                              checked={formData.consultationTypes.includes('Online consultation')} onChange={handleChange}
                            />
                            <span>Online</span>
                          </label>
                        </div>
                      </div>

                      <div className="vq-control">
                        <label className="vq-label">Features / Services You Are Interested In</label>
                        <div className="vq-feat-grid-compact">
                          {VORQARD_FEATURES_OPTIONS.map((feat) => (
                            <label key={feat} className="vq-check-card">
                              <input
                                type="checkbox" name="featuresInterest" value={feat}
                                checked={formData.featuresInterest.includes(feat)} onChange={handleChange}
                              />
                              <span>{feat}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ─── STEP 4: Review, Verification & Declaration (Section 8 & Consent) ─── */}
                  {step === 4 && (
                    <div className="vq-form-fields">
                      {/* Verification Notice Banner */}
                      <div style={{
                        background: '#EFF6FF',
                        border: '1px solid #BFDBFE',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        fontSize: '11.5px',
                        color: '#1E40AF',
                        lineHeight: '1.4',
                        display: 'flex',
                        gap: '8px'
                      }}>
                        <i className="fa-solid fa-shield-halved" style={{ fontSize: '14px', marginTop: '2px', color: '#2563EB' }}></i>
                        <div>
                          <strong>Verification during onboarding:</strong> Professional verification documents (Medical registration & Qualifications) will be verified securely during platform onboarding.
                        </div>
                      </div>

                      {/* Doctor Profile Summary Card */}
                      <div className="vq-review-card">
                        <div className="vq-review-row">
                          <span className="lbl">Doctor Name:</span>
                          <span className="val">Dr. {formData.fullName}</span>
                        </div>
                        <div className="vq-review-row">
                          <span className="lbl">Mobile & Email:</span>
                          <span className="val">+91 {formData.phone} | {formData.email}</span>
                        </div>
                        <div className="vq-review-row">
                          <span className="lbl">Qualification:</span>
                          <span className="val">{formData.qualification} {formData.medicalRegNo ? `(${formData.medicalRegNo})` : ''}</span>
                        </div>
                        <div className="vq-review-row">
                          <span className="lbl">Specialization:</span>
                          <span className="val">{formData.specialty} ({formData.experienceYears} Yrs Exp)</span>
                        </div>
                        <div className="vq-review-row">
                          <span className="lbl">Workplace:</span>
                          <span className="val">{formData.hospitalName}, {formData.city}, {formData.state}</span>
                        </div>
                      </div>

                      {/* Declaration & Consent Checkbox */}
                      <label className="vq-consent-box">
                        <input type="checkbox" id="consent" checked={formData.consent} onChange={handleChange} />
                        <span>I confirm that the information provided is accurate to the best of my knowledge. I agree that Vorqard / Abhivorn Technologies may contact me regarding doctor onboarding and platform launch information.</span>
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
                            <span>Submit Pre-Launch Registration</span>
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
