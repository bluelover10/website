import { useEffect } from 'react';
import pageService from '../services/page.service.js';
import useEditorStore from '../store/editorStore.js';
import useWebsiteStore from '../store/websiteStore.js';
import useUiStore from '../store/uiStore.js';

// Module-scoped singleton save machinery: every useAutosave() instance shares one
// serialized promise chain, one debounce timer and one retry timer, so two PUTs
// can never overlap no matter how many components mount the hook.
let saveChain = Promise.resolve();
let pendingTimer = null;
let retryTimer = null;
let lastErrorToast = { message: null, at: 0 };

// Latest flush published by the mounted hook, for imperative callers such as the
// EditorLayout publish/back/preview buttons. Live ESM binding — always read the
// current value at call time (`flushAutosave?.()`).
export let flushAutosave = null;

const RETRY_DELAY_MS = 4000;
const ERROR_TOAST_WINDOW_MS = 10000;

function resolveWebsiteId() {
  const site = useWebsiteStore.getState().currentWebsite;
  return site?._id || site?.id || null;
}

function toastSaveError(message) {
  const now = Date.now();
  // Dedupe: never stack more than 1 identical error toast within 10 seconds.
  if (lastErrorToast.message === message && now - lastErrorToast.at < ERROR_TOAST_WINDOW_MS) return;
  lastErrorToast = { message, at: now };
  try {
    useUiStore.getState().pushToast({ message, type: 'error' });
  } catch { /* ignore */ }
}

// Serialized save run. Snapshots the tree at fire time; after the PUT resolves,
// markSaved() is called ONLY if the tree reference is untouched — otherwise
// dirty stays true and the effect re-schedules a fresh save.
function doSave(pageId) {
  const run = async () => {
    const st = useEditorStore.getState();
    // Re-check at execution time: a queued save may already be superseded.
    if (!st.dirty || !pageId || st.activePageId !== pageId) return;
    const snapshotTree = st.tree; // reference snapshot at fire time
    const websiteId = resolveWebsiteId();
    try {
      if (typeof pageService.update === 'function') {
        await pageService.update(pageId, { content: snapshotTree }, websiteId);
      } else if (typeof pageService.updatePage === 'function' && websiteId) {
        await pageService.updatePage(websiteId, pageId, { content: snapshotTree });
      }
      const now = useEditorStore.getState();
      if (now.tree === snapshotTree && now.activePageId === pageId) {
        // Tree unchanged while saving — safe to clear the dirty flag.
        if (typeof now.markSaved === 'function') now.markSaved();
        else now.setSaving(false, new Date().toISOString());
      } else {
        // Tree changed mid-save: keep dirty=true so the effect re-schedules.
        now.setSaving(false);
      }
    } catch (e) {
      try {
        useEditorStore.getState().setSaving(false);
      } catch { /* ignore */ }
      toastSaveError(e?.message || 'Autosave failed');
      scheduleRetry(pageId);
    }
  };
  // Queue behind the previous save (success or failure) — never overlap PUTs.
  saveChain = saveChain.then(run, run);
  return saveChain;
}

// Single 4s retry after a failed save; re-checks dirty + page at fire time.
function scheduleRetry(pageId) {
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = setTimeout(() => {
    retryTimer = null;
    const st = useEditorStore.getState();
    if (!st.dirty || st.activePageId !== pageId) return;
    doSave(pageId);
  }, RETRY_DELAY_MS);
}

export function useAutosave(delay = 1200) {
  const tree = useEditorStore((s) => s.tree);
  const activePageId = useEditorStore((s) => s.activePageId);
  const dirty = useEditorStore((s) => s.dirty);

  const flush = () => {
    // Drop pending debounce/retry timers and save right now (serialized).
    if (pendingTimer) { clearTimeout(pendingTimer); pendingTimer = null; }
    if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }
    const st = useEditorStore.getState();
    if (!st.dirty || !st.activePageId) return Promise.resolve();
    return doSave(st.activePageId);
  };

  // Publish the latest flush for imperative callers (publish/back/preview).
  flushAutosave = flush;

  useEffect(() => {
    if (!dirty || !activePageId) return;
    if (pendingTimer) { clearTimeout(pendingTimer); pendingTimer = null; }
    try {
      useEditorStore.getState().setSaving(true);
    } catch {
      // ignore
    }

    pendingTimer = setTimeout(() => {
      pendingTimer = null;
      doSave(activePageId);
    }, delay);

    return () => {
      if (pendingTimer) { clearTimeout(pendingTimer); pendingTimer = null; }
    };
  }, [tree, dirty, activePageId, delay]);

  // Best-effort flush on unmount of the editor — fire-and-forget so navigation
  // is never blocked (the request continues past the route change).
  useEffect(() => {
    return () => {
      try { flush(); } catch { /* ignore */ }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    isSaving: useEditorStore((s) => s.isSaving),
    lastSaved: useEditorStore((s) => s.lastSaved),
    dirty,
    flush,
  };
}

export default useAutosave;
