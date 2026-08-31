/**
 * VORQARD Doctor Registration Environment Config
 * Reads dynamically from Vite .env environment variables with defaults.
 */

const isLocalhost = 
  typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const API_BASE_URL = 
  import.meta.env.VITE_API_BASE_URL || 
  import.meta.env.VITE_DOCTOR_API_BASE_URL || 
  (isLocalhost ? 'http://127.0.0.1:8000' : 'https://api.vorqard.com');

export const MAIN_WEBSITE_URL = 
  import.meta.env.VITE_MAIN_WEBSITE_URL || 
  'https://www.vorqard.com/';

export const PINCODE_API_URL = 
  import.meta.env.VITE_PINCODE_API_URL || 
  'https://api.postalpincode.in/pincode';
