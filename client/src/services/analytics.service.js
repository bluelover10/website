import api from './api.js';

// Server contract (server/src/routes/analytics.routes.js):
//   POST /analytics/track                                  (public)
//   GET  /analytics/:websiteId/summary?from&to             (owner/editor/viewer)
//   GET  /analytics/:websiteId/by-page?page&limit
// Summary shape: { views, uniqueVisitors, today, week, month, byPage[{pagePath,views}], byDay[{date,views}] }
const analyticsService = {
  async summary(websiteId, params = {}) {
    const { data } = await api.get(`/analytics/${websiteId}/summary`, { params });
    return data?.data ?? data;
  },
  async byPage(websiteId, params = {}) {
    const { data } = await api.get(`/analytics/${websiteId}/by-page`, { params });
    return data?.data ?? data;
  },
  async track(payload) {
    const { data } = await api.post('/analytics/track', payload);
    return data?.data ?? data;
  },
};

export default analyticsService;
