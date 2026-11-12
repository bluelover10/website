import { create } from 'zustand';
import websiteService from '../services/website.service.js';
import publishService from '../services/publish.service.js';

export const useWebsiteStore = create((set, get) => ({
  websites: [],
  currentWebsite: null,
  loading: false,
  saving: false,
  error: null,

  setCurrentWebsite: (site) => set({ currentWebsite: site }),

  fetchWebsites: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const res = await websiteService.list(params);
      const list = Array.isArray(res) ? res : res?.websites || res?.items || [];
      set({ websites: list, loading: false });
      return list;
    } catch (e) {
      set({ loading: false, error: e.message });
      throw e;
    }
  },

  fetchWebsite: async (id) => {
    set({ loading: true, error: null });
    try {
      const site = await websiteService.get(id);
      set({ currentWebsite: site, loading: false });
      // keep list in sync
      const { websites } = get();
      if (websites.some((w) => String(w._id || w.id) === String(id))) {
        set({ websites: websites.map((w) => (String(w._id || w.id) === String(id) ? site : w)) });
      }
      return site;
    } catch (e) {
      set({ loading: false, error: e.message });
      throw e;
    }
  },

  createWebsite: async (payload) => {
    set({ saving: true, error: null });
    try {
      let site;
      if (payload?.templateId) {
        const { templateId, ...rest } = payload;
        site = await websiteService.createFromTemplate(templateId, rest);
      } else {
        site = await websiteService.create(payload);
      }
      set((s) => ({ websites: [site, ...s.websites], currentWebsite: site, saving: false }));
      return site;
    } catch (e) {
      set({ saving: false, error: e.message });
      throw e;
    }
  },

  updateWebsite: async (id, payload) => {
    set({ saving: true });
    try {
      const updated = await websiteService.update(id, payload);
      set((s) => ({
        websites: s.websites.map((w) => (String(w._id || w.id) === String(id) ? updated : w)),
        currentWebsite:
          s.currentWebsite && String(s.currentWebsite._id || s.currentWebsite.id) === String(id)
            ? updated
            : s.currentWebsite,
        saving: false,
      }));
      return updated;
    } catch (e) {
      set({ saving: false, error: e.message });
      throw e;
    }
  },

  deleteWebsite: async (id) => {
    try {
      await websiteService.remove(id);
      set((s) => ({
        websites: s.websites.filter((w) => String(w._id || w.id) !== String(id)),
        currentWebsite:
          s.currentWebsite && String(s.currentWebsite._id || s.currentWebsite.id) === String(id)
            ? null
            : s.currentWebsite,
      }));
      return true;
    } catch (e) {
      set({ error: e.message });
      throw e;
    }
  },

  duplicateWebsite: async (id) => {
    try {
      const copy = await websiteService.duplicate(id);
      set((s) => ({ websites: [copy, ...s.websites] }));
      return copy;
    } catch (e) {
      set({ error: e.message });
      throw e;
    }
  },

  publishWebsite: async (id) => {
    set({ saving: true });
    try {
      const res = await publishService.publish(id);
      const updated = res?.website || res;
      if (updated && (updated._id || updated.id)) {
        set((s) => ({
          websites: s.websites.map((w) =>
            String(w._id || w.id) === String(id) ? { ...w, ...updated } : w
          ),
          currentWebsite:
            s.currentWebsite ? { ...s.currentWebsite, ...updated } : s.currentWebsite,
          saving: false,
        }));
      } else {
        set({ saving: false });
      }
      return res;
    } catch (e) {
      set({ saving: false, error: e.message });
      throw e;
    }
  },

  unpublishWebsite: async (id) => {
    try {
      const res = await publishService.unpublish(id);
      return res;
    } catch (e) {
      set({ error: e.message });
      throw e;
    }
  },

  updateTheme: async (id, theme) => {
    try {
      const updated = await websiteService.updateTheme(id, theme);
      const site = updated?.website || updated;
      if (site && (site._id || site.id)) {
        set((s) => ({
          currentWebsite: s.currentWebsite ? { ...s.currentWebsite, ...site } : site,
        }));
      }
      return site || updated;
    } catch (e) {
      set({ error: e.message });
      throw e;
    }
  },

  updateNavigation: async (id, navigation) => {
    try {
      const updated = await websiteService.updateNavigation(id, navigation);
      const site = updated?.website || updated;
      if (site && (site._id || site.id)) {
        set((s) => ({
          currentWebsite: s.currentWebsite ? { ...s.currentWebsite, ...site } : site,
        }));
      }
      return site || updated;
    } catch (e) {
      set({ error: e.message });
      throw e;
    }
  },
}));

export default useWebsiteStore;
