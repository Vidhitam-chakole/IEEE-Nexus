import axios from 'axios';

const rawBase = import.meta.env.VITE_API_URL;
const baseURL = rawBase
  ? (rawBase.endsWith('/api/v1') ? rawBase : `${rawBase.replace(/\/$/, '')}/api/v1`)
  : '/api/v1';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token if present in localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Intercept 401 Unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired or invalid
      if (window.location.pathname.startsWith('/portal')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
