import { create } from 'zustand';
import { createId } from '../utils/ids.js';

let confirmResolver = null;

export const useUiStore = create((set, get) => ({
  toasts: [],
  modals: {},
  sidebarOpen: true,
  mobileNavOpen: false,
  darkMode: false,
  confirmDialog: null,

  pushToast: (toast) => {
    const id = toast.id || createId('toast');
    const entry = { id, type: 'info', duration: 3500, ...toast };
    set((s) => ({ toasts: [...s.toasts, entry] }));
    if (entry.duration > 0) {
      setTimeout(() => get().dismissToast(id), entry.duration);
    }
    return id;
  },
  toast: (message, type = 'info') => get().pushToast({ message, type }),
  success: (message) => get().pushToast({ message, type: 'success' }),
  error: (message) => get().pushToast({ message, type: 'error' }),

  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  clearToasts: () => set({ toasts: [] }),

  toggleMobileNav: () => set((s) => ({ mobileNavOpen: !s.mobileNavOpen })),
  setMobileNav: (open) => set({ mobileNavOpen: Boolean(open) }),

  openModal: (name, props = {}) =>
    set((s) => ({ modals: { ...s.modals, [name]: { open: true, props } } })),
  closeModal: (name) =>
    set((s) => ({ modals: { ...s.modals, [name]: { open: false, props: {} } } })),
  isModalOpen: (name) => Boolean(get().modals[name]?.open),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  setDarkMode: (dark) => {
    set({ darkMode: dark });
    try {
      document.documentElement.classList.toggle('dark', Boolean(dark));
      localStorage.setItem('siteforge_theme', dark ? 'dark' : 'light');
    } catch {
      // ignore
    }
  },
  toggleDarkMode: () => get().setDarkMode(!get().darkMode),
  initTheme: () => {
    try {
      const saved = localStorage.getItem('siteforge_theme');
      const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
      const dark = saved ? saved === 'dark' : Boolean(prefersDark);
      document.documentElement.classList.toggle('dark', dark);
      set({ darkMode: dark });
    } catch {
      // ignore
    }
  },

  // Promise-based confirm. Resolves true only when the confirm button is used;
  // resolves false for cancel/dismiss. Legacy onConfirm callbacks still work.
  askConfirm: (opts) =>
    new Promise((resolve) => {
      confirmResolver = resolve;
      set({
        confirmDialog: {
          id: createId('confirm'),
          title: 'Are you sure?',
          message: '',
          confirmLabel: 'Confirm',
          cancelLabel: 'Cancel',
          danger: false,
          ...opts,
        },
      });
    }),
  closeConfirm: (result = false) => {
    if (confirmResolver) {
      confirmResolver(result === true);
      confirmResolver = null;
    }
    set({ confirmDialog: null });
  },
}));

export default useUiStore;
