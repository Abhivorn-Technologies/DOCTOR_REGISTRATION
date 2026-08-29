/**
 * VORQARD Doctor Registration Environment Config
 * Reads from Vite .env environment variables (VITE_API_BASE_URL)
 */

export const API_BASE_URL = 
  import.meta.env.VITE_DOCTOR_API_BASE_URL ||
  import.meta.env.DOCTOR_API_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL || 
  import.meta.env.API_BASE_URL || 
  (typeof window !== 'undefined' && window.location.origin.includes(':8000') ? window.location.origin : 'http://127.0.0.1:8000');

export const WHATSAPP_SUPPORT_PHONE = 
  import.meta.env.VITE_DOCTOR_WHATSAPP_PHONE ||
  import.meta.env.DOCTOR_WHATSAPP_PHONE ||
  import.meta.env.VITE_WHATSAPP_PHONE || 
  '919999999999';

export const WHATSAPP_DEFAULT_MESSAGE = 
  import.meta.env.VITE_DOCTOR_WHATSAPP_MESSAGE ||
  import.meta.env.DOCTOR_WHATSAPP_MESSAGE ||
  'Hi VORQARD Team, I have registered for the Doctor App Early Access.';
