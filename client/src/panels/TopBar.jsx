// Top bar: back, site name, viewport switch, undo/redo, save status, preview, publish.
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Monitor, Tablet, Smartphone, Undo2, Redo2, Eye, Rocket, Check, Loader2 } from 'lucide-react';
import { useEditorStore } from '../store/editorStore';
import { publishWebsite } from '../services/page.service';

export default function TopBar({ website, websiteId }) {
  const navigate = useNavigate();
  const viewport = useEditorStore((s) => s.viewport);
  const setViewport = useEditorStore((s) => s.setViewport);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const past = useEditorStore((s) => s.past);
  const future = useEditorStore((s) => s.future);
  const isSaving = useEditorStore((s) => s.isSaving);
  const lastSaved = useEditorStore((s) => s.lastSaved);
  const [toast, setToast] = useState(null);
  const [publishing, setPublishing] = useState(false);

  const flash = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 2600); };
  const savedLabel = lastSaved ? new Date(lastSaved).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;

  const publish = async () => {
    if (!websiteId) return;
    setPublishing(true);
    try {
      await publishWebsite(websiteId);
      flash('Published successfully');
    } catch (e) {
      flash(e.message || 'Publish failed', false);
    } finally {
      setPublishing(false);
    }
  };

  const vpBtn = (v, Icon, title) => (
    <button key={v} title={title} onClick={() => setViewport(v)} className={`p-1.5 rounded ${viewport === v ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`}>
      <Icon size={16} />
    </button>
  );

  return (
    <div className="relative h-12 flex items-center gap-2 px-3 border-b bg-white shrink-0">
      <button onClick={() => navigate('/dashboard')} className="p-1.5 rounded hover:bg-slate-100 text-slate-600" title="Back to dashboard">
        <ArrowLeft size={16} />
      </button>
      <span className="text-sm font-semibold truncate max-w-[220px]">{website?.name || website?.title || 'Untitled site'}</span>
      <span className="text-[11px] text-slate-400 hidden sm:inline">/ editor</span>

      <div className="mx-auto flex items-center gap-0.5 border rounded-lg px-1 py-0.5">
        {vpBtn('desktop', Monitor, 'Desktop')}
        {vpBtn('tablet', Tablet, 'Tablet (768px)')}
        {vpBtn('mobile', Smartphone, 'Mobile (375px)')}
      </div>

      <button onClick={undo} disabled={!past.length} title="Undo (Ctrl+Z)" className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30"><Undo2 size={16} /></button>
      <button onClick={redo} disabled={!future.length} title="Redo (Ctrl+Shift+Z)" className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30"><Redo2 size={16} /></button>

      <span className="text-[11px] text-slate-500 w-24 text-right hidden md:flex items-center justify-end gap-1">
        {isSaving ? <><Loader2 size={12} className="animate-spin" /> Saving…</> : savedLabel ? <><Check size={12} className="text-green-600" /> Saved {savedLabel}</> : <span className="text-slate-300">Unsaved</span>}
      </span>

      <button onClick={() => websiteId && navigate(`/websites/${websiteId}/preview`)} className="flex items-center gap-1.5 text-xs font-medium border rounded-md px-2.5 py-1.5 hover:bg-slate-50">
        <Eye size={14} /> Preview
      </button>
      <button onClick={publish} disabled={publishing} className="flex items-center gap-1.5 text-xs font-semibold text-white rounded-md px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60">
        {publishing ? <Loader2 size={14} className="animate-spin" /> : <Rocket size={14} />} Publish
      </button>

      {toast && (
        <div className={`absolute top-13 right-3 mt-1 z-50 text-xs px-3 py-2 rounded-md shadow-lg border ${toast.ok ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-700'}`} style={{ top: '100%' }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
