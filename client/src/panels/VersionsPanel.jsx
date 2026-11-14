// Version history: fetch versions for the active page, restore, snapshot now.
// Server contract: GET/POST /websites/:websiteId/pages/:pageId/versions[...]
import React, { useEffect, useState } from 'react';
import { History, RotateCcw, Camera, Loader2 } from 'lucide-react';
import { useEditorStore } from '../store/editorStore';
import { useWebsiteStore } from '../store/websiteStore';
import { useUiStore } from '../store/uiStore';
import { getVersions, createVersion, restoreVersion, getPage, updatePage } from '../services/page.service';
import { flushAutosave } from '../hooks/useAutosave';

export default function VersionsPanel({ websiteId, pageId }) {
  const loadPageContent = useEditorStore((s) => s.loadPageContent);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const askConfirm = useUiStore((s) => s.askConfirm);
  const pushToast = useUiStore((s) => s.pushToast);

  const load = async () => {
    if (!websiteId || !pageId) return;
    setLoading(true); setErr(null);
    try {
      const v = await getVersions(websiteId, pageId);
      setVersions(Array.isArray(v) ? v : v?.versions || []);
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [websiteId, pageId]); // eslint-disable-line

  const snapshot = async () => {
    if (!websiteId || !pageId) return;
    setBusy(true);
    try { await createVersion(websiteId, pageId); await load(); pushToast({ message: 'Snapshot saved', type: 'success' }); }
    catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  const restore = async (v) => {
    const ok = await askConfirm({
      title: 'Restore version?',
      message: 'Your current draft is saved first, then the canvas is replaced with the selected snapshot. The pre-restore state is snapshotted, so you can restore back if needed.',
      confirmLabel: 'Restore',
    });
    if (!ok) return;
    setBusy(true);
    try {
      // 1. Persist unsaved canvas edits BEFORE snapshotting, so the pre-restore
      //    snapshot on the server actually contains them (otherwise they'd be
      //    lost the moment the restored content lands).
      await flushAutosave?.();
      const st = useEditorStore.getState();
      if (st.dirty && st.activePageId) {
        const site = useWebsiteStore.getState().currentWebsite;
        const wid = site?._id || site?.id;
        if (wid) {
          try { await updatePage(wid, st.activePageId, { content: st.tree }); } catch { /* snapshot below still protects server state */ }
        }
      }
      // 2. Snapshot current state (so the restore itself is revertible).
      await createVersion(websiteId, pageId);
      // 3. Restore on the server…
      await restoreVersion(websiteId, pageId, v.versionNumber ?? v.version_number);
      // 4. …then re-fetch the page detail so canvas === server regardless of
      //    response shape (the old res?.content guessing was fragile).
      let restoredOk = false;
      try {
        const detail = await getPage(websiteId, pageId);
        const fresh = detail?.page || detail;
        if (fresh?.content && typeof fresh.content === 'object') {
          loadPageContent(pageId, fresh.content);
          restoredOk = true;
        }
      } catch { /* fall through to stale warning */ }
      if (!restoredOk) {
        pushToast({ message: 'Restored on the server, but the canvas could not refresh — reload the editor to see it', type: 'error', duration: 6000 });
      } else {
        pushToast({ message: 'Version restored', type: 'success' });
      }
      await load();
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="flex h-full flex-col gap-2 overflow-auto p-3">
      <button
        onClick={snapshot}
        disabled={busy || !pageId}
        className="flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 py-2 text-xs font-semibold text-white shadow-xs transition-all duration-200 hover:shadow-glow disabled:opacity-50"
      >
        {busy ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />} Snapshot now
      </button>
      {loading && <div className="flex items-center gap-1.5 text-xs text-slate-400"><Loader2 size={12} className="animate-spin" /> Loading…</div>}
      {err && <div className="rounded-lg bg-red-50 px-2.5 py-2 text-xs font-medium text-red-600 dark:bg-red-950/40 dark:text-red-300" role="alert">{err}</div>}
      {!loading && !versions.length && !err && (
        <div className="rounded-xl border border-dashed border-slate-300 py-6 text-center text-xs text-slate-400 dark:border-slate-700">No snapshots yet.</div>
      )}
      {versions.map((v) => (
        <div key={v._id || v.id} className="rounded-xl border border-slate-200 p-2.5 transition hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700">
          <div className="flex items-center gap-1.5 text-2xs font-semibold text-slate-700 dark:text-slate-200">
            <History size={12} className="text-primary-500" />
            {v.createdAt ? new Date(v.createdAt).toLocaleString() : (v.label || 'Snapshot')}
          </div>
          {v.note && <div className="mt-0.5 truncate text-2xs text-slate-500">{v.note}</div>}
          <button onClick={() => restore(v)} disabled={busy} className="mt-2 flex items-center gap-1 rounded-md border border-slate-200 px-2 py-0.5 text-2xs font-semibold text-slate-600 transition hover:border-primary-300 hover:text-primary-600 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300">
            <RotateCcw size={11} /> Restore
          </button>
        </div>
      ))}
    </div>
  );
}
