import api from './api.js';

const analyticsService = {
  async overview(params = {}) {
    const { data } = await api.get('/analytics/overview', { params });
    return data?.data ?? data;
  },
  async byWebsite(websiteId, params = {}) {
    const { data } = await api.get(`/analytics/website/${websiteId}`, { params });
    return data?.data ?? data;
  },
  async track(payload) {
    const { data } = await api.post('/analytics/track', payload);
    return data?.data ?? data;
  },
};

export default analyticsService;
