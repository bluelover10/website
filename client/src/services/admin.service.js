// Admin API service — only usable by accounts with role 'admin'
// (server enforces via protect + requireAdmin; see routes/admin.routes.js).
import api from './api.js';

const adminService = {
  async stats() {
    const { data } = await api.get('/admin/stats');
    return data?.data ?? data;
  },
  async users(params = {}) {
    const { data } = await api.get('/admin/users', { params });
    return data?.data ?? data;
  },
  async updateUserRole(id, role) {
    const { data } = await api.patch(`/admin/users/${id}/role`, { role });
    return data?.data ?? data;
  },
  async websites(params = {}) {
    const { data } = await api.get('/admin/websites', { params });
    return data?.data ?? data;
  },
  async unpublishWebsite(id) {
    const { data } = await api.post(`/admin/websites/${id}/unpublish`);
    return data?.data ?? data;
  },
  async removeWebsite(id) {
    const { data } = await api.delete(`/admin/websites/${id}`);
    return data?.data ?? data;
  },
};

export default adminService;