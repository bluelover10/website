import api from './api.js';

const memberService = {
  async listByWebsite(websiteId) {
    const { data } = await api.get(`/websites/${websiteId}/members`);
    return data?.data ?? data;
  },
  async invite(websiteId, payload) {
    const { data } = await api.post(`/websites/${websiteId}/members/invite`, payload);
    return data?.data ?? data;
  },
  async updateRole(memberId, role) {
    const { data } = await api.put(`/members/${memberId}`, { role });
    return data?.data ?? data;
  },
  async remove(memberId) {
    const { data } = await api.delete(`/members/${memberId}`);
    return data?.data ?? data;
  },
};

export default memberService;
