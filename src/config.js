/**
 * VORQARD Doctor Registration Environment Config
 * Reads dynamically from Vite .env environment variables with defaults.
 */

export const API_BASE_URL = 
  import.meta.env.VITE_API_BASE_URL || 
  import.meta.env.VITE_DOCTOR_API_BASE_URL || 
  (typeof window !== 'undefined' && window.location.origin.includes(':8000') ? window.location.origin : 'http://127.0.0.1:8000');

export const MAIN_WEBSITE_URL = 
  import.meta.env.VITE_MAIN_WEBSITE_URL || 
  'https://www.vorqard.com/';

export const PINCODE_API_URL = 
  import.meta.env.VITE_PINCODE_API_URL || 
  'https://api.postalpincode.in/pincode';
