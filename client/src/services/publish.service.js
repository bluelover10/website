import api from './api.js';

const publishService = {
  async publish(websiteId) {
    const { data } = await api.post(`/websites/${websiteId}/publish`);
    return data?.data ?? data;
  },
  async unpublish(websiteId) {
    const { data } = await api.post(`/websites/${websiteId}/unpublish`);
    return data?.data ?? data;
  },
  async status(websiteId) {
    const { data } = await api.get(`/websites/${websiteId}/publish-status`);
    return data?.data ?? data;
  },
};

export default publishService;
