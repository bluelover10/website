import { useCallback } from 'react';
import useWebsiteStore from '../store/websiteStore.js';

export function useWebsites() {
  const websites = useWebsiteStore((s) => s.websites);
  const currentWebsite = useWebsiteStore((s) => s.currentWebsite);
  const loading = useWebsiteStore((s) => s.loading);
  const saving = useWebsiteStore((s) => s.saving);

  const refresh = useCallback(() => useWebsiteStore.getState().fetchWebsites(), []);

  return {
    websites,
    currentWebsite,
    loading,
    saving,
    refresh,
    fetchWebsites: useWebsiteStore.getState().fetchWebsites,
    createWebsite: useWebsiteStore.getState().createWebsite,
    updateWebsite: useWebsiteStore.getState().updateWebsite,
    deleteWebsite: useWebsiteStore.getState().deleteWebsite,
    duplicateWebsite: useWebsiteStore.getState().duplicateWebsite,
    publishWebsite: useWebsiteStore.getState().publishWebsite,
  };
}

export default useWebsites;
