import api from './api.js';

const templateService = {
  async list(params = {}) {
    const { data } = await api.get('/templates', { params });
    return data?.data ?? data;
  },
  async get(id) {
    const { data } = await api.get(`/templates/${id}`);
    return data?.data ?? data;
  },
};

export default templateService;
