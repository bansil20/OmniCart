// OmniCart Centralized Production API Configuration
const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  }
  return 'http://localhost:5000/api';
};

const getBackendUrl = () => {
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL.replace(/\/$/, '');
  }
  return 'http://localhost:5000';
};

export const API_BASE_URL = getApiUrl();
export const BACKEND_URL = getBackendUrl();

export default API_BASE_URL;
