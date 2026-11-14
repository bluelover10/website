import api from './api.js';

const mediaService = {
  async list(params = {}) {
    const { data } = await api.get('/media', { params });
    return data?.data ?? data;
  },
  async upload(file, extra = {}, onProgress) {
    const form = new FormData();
    form.append('file', file);
    Object.entries(extra).forEach(([k, v]) => {
      if (v !== undefined && v !== null) form.append(k, v);
    });
    const { data } = await api.post('/media', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      // 0..1 progress passthrough for upload UIs; per-request timeout override
      // so large uploads are not killed by the global 15s default.
      onUploadProgress: (e) => onProgress?.(e.loaded / (e.total || 1)),
      timeout: 120000,
    });
    return data?.data ?? data;
  },
  async remove(id, websiteId) {
    const { data } = await api.delete(`/media/${id}`, { params: websiteId ? { websiteId } : {} });
    return data?.data ?? data;
  },
};

export default mediaService;
