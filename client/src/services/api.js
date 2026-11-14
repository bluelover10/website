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
      let hadToken = false;
      try {
        hadToken = Boolean(localStorage.getItem('siteforge_token'));
        localStorage.removeItem('siteforge_token');
        localStorage.removeItem('siteforge_user');
      } catch {
        // ignore
      }
      // Tell the auth store to drop its in-memory session (it listens for this
      // event exactly once); ProtectedRoute then redirects because
      // isAuthenticated flips false. Guards:
      //  - never on /login (avoids loops when the login call itself 401s)
      //  - only when a token was actually present (the unauthenticated
      //    authService.logout() ping must not re-trigger the event)
      if (
        typeof window !== 'undefined' &&
        hadToken &&
        !window.location.pathname.startsWith('/login')
      ) {
        window.dispatchEvent(new CustomEvent('siteforge:unauthorized'));
      }
    }
    return Promise.reject(normalizeError(error));
  }
);

export function normalizeError(error) {
  const res = error?.response;
  const data = res?.data;
  // Friendly copy for timeouts / unreachable servers — these never have a
  // server-provided message, so they win outright.
  const networkMessage =
    error?.code === 'ECONNABORTED'
      ? 'The request timed out. Please check your connection and try again.'
      : error?.code === 'ERR_NETWORK'
        ? 'Network error — could not reach the server.'
        : null;
  const message =
    networkMessage ||
    data?.message ||
    data?.error ||
    error?.message ||
    'Something went wrong. Please try again.';
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
