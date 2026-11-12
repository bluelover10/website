import { useEffect, useRef } from 'react';
import pageService from '../services/page.service.js';
import useEditorStore from '../store/editorStore.js';
import useWebsiteStore from '../store/websiteStore.js';
import useUiStore from '../store/uiStore.js';

export function useAutosave(delay = 1200) {
  const tree = useEditorStore((s) => s.tree);
  const activePageId = useEditorStore((s) => s.activePageId);
  const dirty = useEditorStore((s) => s.dirty);
  const timer = useRef(null);

  useEffect(() => {
    if (!dirty || !activePageId) return;
    if (timer.current) clearTimeout(timer.current);
    try {
      useEditorStore.getState().setSaving(true);
    } catch {
      // ignore
    }

    timer.current = setTimeout(async () => {
      try {
        const st = useEditorStore.getState();
        const currentTree = st.tree;
        const websiteId =
          useWebsiteStore.getState().currentWebsite?._id ||
          useWebsiteStore.getState().currentWebsite?.id ||
          null;
        if (typeof pageService.update === 'function') {
          await pageService.update(activePageId, { content: currentTree }, websiteId);
        } else if (typeof pageService.updatePage === 'function' && websiteId) {
          await pageService.updatePage(websiteId, activePageId, { content: currentTree });
        }
        if (typeof st.markSaved === 'function') st.markSaved();
        else st.setSaving(false, new Date().toISOString());
      } catch (e) {
        try {
          useEditorStore.getState().setSaving(false);
        } catch {
          // ignore
        }
        useUiStore.getState().pushToast({ message: e.message || 'Autosave failed', type: 'error' });
      }
    }, delay);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [tree, dirty, activePageId, delay]);

  return {
    isSaving: useEditorStore((s) => s.isSaving),
    lastSaved: useEditorStore((s) => s.lastSaved),
    dirty,
  };
}

export default useAutosave;
