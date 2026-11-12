import api from './api.js';

// Server contract (server/src/routes/forms.routes.js):
//   POST   /websites/:websiteId/forms/submit            {formId, pageId?, data}   (public)
//   GET    /websites/:websiteId/forms                    (owner/editor) — all submissions
//   DELETE /websites/:websiteId/forms/:submissionId      (owner/editor; websiteId from body/query)
//   DELETE /forms/:submissionId                          (owner/editor; websiteId resolved from the submission)
const formService = {
  async listByWebsite(websiteId) {
    const { data } = await api.get('/forms', { params: { websiteId } });
    return data?.data ?? data;
  },
  async submissionsByWebsite(websiteId, params = {}) {
    const { data } = await api.get(`/websites/${websiteId}/forms`, { params });
    return data?.data ?? data;
  },
  async removeSubmission(websiteId, submissionId) {
    const { data } = await api.delete(`/websites/${websiteId}/forms/${submissionId}`);
    return data?.data ?? data;
  },
  async submit(websiteId, payload) {
    const { data } = await api.post(`/websites/${websiteId}/forms/submit`, payload);
    return data?.data ?? data;
  },
};

export default formService;
