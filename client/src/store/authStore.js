import { create } from 'zustand';
import authService from '../services/auth.service.js';
import { setAuthToken } from '../services/api.js';

function readStored() {
  try {
    const token = localStorage.getItem('siteforge_token');
    const raw = localStorage.getItem('siteforge_user');
    return { token: token || null, user: raw ? JSON.parse(raw) : null };
  } catch {
    return { token: null, user: null };
  }
}

function persist(token, user) {
  try {
    if (token) localStorage.setItem('siteforge_token', token);
    else localStorage.removeItem('siteforge_token');
    if (user) localStorage.setItem('siteforge_user', JSON.stringify(user));
    else localStorage.removeItem('siteforge_user');
  } catch {
    // ignore
  }
}

const stored = typeof window !== 'undefined' ? readStored() : { token: null, user: null };

export const useAuthStore = create((set, get) => ({
  user: stored.user,
  token: stored.token,
  loading: false,
  error: null,
  isAuthenticated: Boolean(stored.token),

  setUser: (user) => {
    persist(get().token, user);
    set({ user });
  },

  login: async (payload) => {
    set({ loading: true, error: null });
    try {
      const res = await authService.login(payload);
      const token = res?.token || res?.accessToken;
      const user = res?.user || res;
      setAuthToken(token);
      persist(token, user);
      set({ user, token, isAuthenticated: true, loading: false });
      return { user, token };
    } catch (e) {
      set({ loading: false, error: e.message });
      throw e;
    }
  },

  register: async (payload) => {
    set({ loading: true, error: null });
    try {
      const res = await authService.register(payload);
      const token = res?.token || res?.accessToken;
      const user = res?.user || res;
      if (token) {
        setAuthToken(token);
        persist(token, user);
        set({ user, token, isAuthenticated: true, loading: false });
      } else {
        set({ loading: false });
      }
      return { user, token };
    } catch (e) {
      set({ loading: false, error: e.message });
      throw e;
    }
  },

  fetchMe: async () => {
    const { token } = get();
    if (!token) return null;
    set({ loading: true });
    try {
      const user = await authService.fetchMe();
      const normalized = user?.user || user;
      persist(token, normalized);
      set({ user: normalized, isAuthenticated: true, loading: false });
      return normalized;
    } catch (e) {
      // token invalid -> logout silently
      if (e?.status === 401) get().logout();
      else set({ loading: false });
      return null;
    }
  },

  logout: () => {
    setAuthToken(null);
    persist(null, null);
    set({ user: null, token: null, isAuthenticated: false, error: null });
    try {
      authService.logout();
    } catch {
      // ignore
    }
  },
}));

export default useAuthStore;
