import api from './api.js';

const formService = {
  async listByWebsite(websiteId) {
    const { data } = await api.get('/forms', { params: { websiteId } });
    return data?.data ?? data;
  },
  async create(payload) {
    const { data } = await api.post('/forms', payload);
    return data?.data ?? data;
  },
  async submissions(formId, params = {}) {
    const { data } = await api.get(`/forms/${formId}/submissions`, { params });
    return data?.data ?? data;
  },
  async submissionsByWebsite(websiteId, params = {}) {
    const { data } = await api.get(`/websites/${websiteId}/submissions`, { params });
    return data?.data ?? data;
  },
  async submit(slugOrId, payload) {
    const { data } = await api.post(`/forms/${slugOrId}/submit`, payload);
    return data?.data ?? data;
  },
  async removeSubmission(submissionId) {
    const { data } = await api.delete(`/submissions/${submissionId}`);
    return data?.data ?? data;
  },
};

export default formService;
