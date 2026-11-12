import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('siteforge_token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch {
      // ignore storage errors
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      try {
        localStorage.removeItem('siteforge_token');
        localStorage.removeItem('siteforge_user');
      } catch {
        // ignore
      }
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        // avoid hard redirect loops during editor autosave; let ProtectedRoute handle it
      }
    }
    return Promise.reject(normalizeError(error));
  }
);

export function normalizeError(error) {
  const res = error?.response;
  const data = res?.data;
  const message =
    data?.message || data?.error || error?.message || 'Something went wrong. Please try again.';
  const err = new Error(message);
  err.status = res?.status;
  err.data = data;
  err.fields = data?.errors || data?.fields;
  err.original = error;
  return err;
}

export function setAuthToken(token) {
  try {
    if (token) localStorage.setItem('siteforge_token', token);
    else localStorage.removeItem('siteforge_token');
  } catch {
    // ignore
  }
}

export function getAuthToken() {
  try {
    return localStorage.getItem('siteforge_token');
  } catch {
    return null;
  }
}

export default api;
