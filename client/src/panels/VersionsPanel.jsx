// Version history: fetch versions for the active page, restore, snapshot now.
// Server contract: GET/POST /websites/:websiteId/pages/:pageId/versions[...]
import React, { useEffect, useState } from 'react';
import { History, RotateCcw, Camera, Loader2 } from 'lucide-react';
import { useEditorStore } from '../store/editorStore';
import { useUiStore } from '../store/uiStore';
import { getVersions, createVersion, restoreVersion } from '../services/page.service';

export default function VersionsPanel({ websiteId, pageId }) {
  const setTree = useEditorStore((s) => s.setTree);
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
      message: 'This replaces the canvas with the selected snapshot. Your current content is snapshotted first, so this can be undone via history.',
      confirmLabel: 'Restore',
    });
    if (!ok) return;
    setBusy(true);
    try {
      // Snapshot current state first (so the restore itself is undoable), then restore.
      await createVersion(websiteId, pageId);
      const res = await restoreVersion(websiteId, pageId, v.versionNumber ?? v.version_number);
      const content = res?.content || res?.page?.content || res;
      if (content && content.id) setTree(content, { history: true });
      await load();
      pushToast({ message: 'Version restored', type: 'success' });
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
