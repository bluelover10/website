import api from './api.js';

const websiteService = {
  async list(params = {}) {
    const { data } = await api.get('/websites', { params });
    return data?.data ?? data;
  },
  async get(id) {
    const { data } = await api.get(`/websites/${id}`);
    return data?.data ?? data;
  },
  async getBySlug(slug) {
    const { data } = await api.get(`/websites/slug/${slug}`);
    return data?.data ?? data;
  },
  async create(payload) {
    const { data } = await api.post('/websites', payload);
    return data?.data ?? data;
  },
  async createFromTemplate(templateId, payload = {}) {
    const { data } = await api.post(`/websites/from-template/${templateId}`, payload);
    return data?.data ?? data;
  },
  async update(id, payload) {
    const { data } = await api.put(`/websites/${id}`, payload);
    return data?.data ?? data;
  },
  async remove(id) {
    const { data } = await api.delete(`/websites/${id}`);
    return data?.data ?? data;
  },
  async duplicate(id, payload = {}) {
    const { data } = await api.post(`/websites/${id}/duplicate`, payload);
    return data?.data ?? data;
  },
  async updateTheme(id, theme) {
    const { data } = await api.put(`/websites/${id}/theme`, { theme });
    return data?.data ?? data;
  },
  async updateNavigation(id, navigation) {
    const { data } = await api.put(`/websites/${id}/navigation`, { navigation });
    return data?.data ?? data;
  },
  async listVersions(id) {
    const { data } = await api.get(`/websites/${id}/versions`);
    return data?.data ?? data;
  },
  async restoreVersion(id, versionId) {
    const { data } = await api.post(`/websites/${id}/versions/${versionId}/restore`);
    return data?.data ?? data;
  },
};

export default websiteService;
