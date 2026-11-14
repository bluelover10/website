import api from './api.js';

const authService = {
  async register(payload) {
    const { data } = await api.post('/auth/register', payload);
    return data?.data ?? data;
  },
  async login(payload) {
    const { data } = await api.post('/auth/login', payload);
    return data?.data ?? data;
  },
  async fetchMe() {
    const { data } = await api.get('/auth/me');
    return data?.data ?? data;
  },
  async updateProfile(payload) {
    // Server: PATCH /api/auth/me (updateMeSchema: {name?, avatar?})
    const { data } = await api.patch('/auth/me', payload);
    return data?.data ?? data;
  },
  async changePassword(payload) {
    // Server: PATCH /api/auth/password (updatePasswordSchema: {currentPassword, newPassword})
    const { data } = await api.patch('/auth/password', payload);
    return data?.data ?? data;
  },
  async logout() {
    try {
      await api.post('/auth/logout');
    } catch {
      // best effort
    }
    return true;
  },
};

export default authService;
