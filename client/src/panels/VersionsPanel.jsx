// Version history: fetch /api/pages/:id/versions, restore, snapshot now.
import React, { useEffect, useState } from 'react';
import { History, RotateCcw, Camera, Loader2 } from 'lucide-react';
import { useEditorStore } from '../store/editorStore';
import { getVersions, createVersion, restoreVersion } from '../services/page.service';

export default function VersionsPanel({ pageId }) {
  const setTree = useEditorStore((s) => s.setTree);
  const tree = useEditorStore((s) => s.tree);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const load = async () => {
    if (!pageId) return;
    setLoading(true); setErr(null);
    try {
      const v = await getVersions(pageId);
      setVersions(Array.isArray(v) ? v : v?.versions || []);
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [pageId]); // eslint-disable-line

  const snapshot = async () => {
    if (!pageId) return;
    setBusy(true);
    try { await createVersion(pageId, tree); await load(); }
    catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  const restore = async (v) => {
    if (!confirm('Restore this version? Current content will be snapshotted first.')) return;
    setBusy(true);
    try {
      await createVersion(pageId, tree);
      const res = await restoreVersion(pageId, v._id || v.id);
      const content = res?.content || res?.page?.content || res;
      if (content && content.id) setTree(content, { history: true });
      await load();
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="p-3 h-full overflow-auto flex flex-col gap-2">
      <button onClick={snapshot} disabled={busy || !pageId} className="flex items-center justify-center gap-1.5 text-xs font-semibold border rounded-md py-2 hover:bg-slate-50 disabled:opacity-50">
        {busy ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />} Snapshot now
      </button>
      {loading && <div className="text-[11px] text-slate-400 flex items-center gap-1.5"><Loader2 size={12} className="animate-spin" /> Loading…</div>}
      {err && <div className="text-[11px] text-red-600">{err}</div>}
      {!loading && !versions.length && !err && <div className="text-[11px] text-slate-400 text-center py-6">No snapshots yet.</div>}
      {versions.map((v) => (
        <div key={v._id || v.id} className="border rounded-md p-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold">
            <History size={12} className="text-slate-400" />
            {v.createdAt ? new Date(v.createdAt).toLocaleString() : (v.label || 'Snapshot')}
          </div>
          {v.note && <div className="text-[11px] text-slate-500 truncate">{v.note}</div>}
          <button onClick={() => restore(v)} disabled={busy} className="mt-1.5 flex items-center gap-1 text-[11px] border rounded px-1.5 py-0.5 hover:bg-slate-50">
            <RotateCcw size={11} /> Restore
          </button>
        </div>
      ))}
    </div>
  );
}
