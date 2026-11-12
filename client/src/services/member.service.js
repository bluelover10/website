import api from './api.js';

// Server contract (server/src/routes/members.routes.js):
//   GET    /websites/:websiteId/members
//   POST   /websites/:websiteId/members/invite          {email, role}
//   PATCH  /websites/:websiteId/members/:memberId       {role: editor|viewer}
//   DELETE /websites/:websiteId/members/:memberId
// Roles are editor/viewer only — the owner is implicit and cannot be assigned.
const memberService = {
  async listByWebsite(websiteId) {
    const { data } = await api.get(`/websites/${websiteId}/members`);
    return data?.data ?? data;
  },
  async invite(websiteId, payload) {
    const { data } = await api.post(`/websites/${websiteId}/members/invite`, payload);
    return data?.data ?? data;
  },
  async updateRole(websiteId, memberId, role) {
    const { data } = await api.patch(`/websites/${websiteId}/members/${memberId}`, { role });
    return data?.data ?? data;
  },
  async remove(websiteId, memberId) {
    const { data } = await api.delete(`/websites/${websiteId}/members/${memberId}`);
    return data?.data ?? data;
  },
};

export default memberService;
