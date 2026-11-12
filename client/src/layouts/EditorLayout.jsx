import { Link, Outlet, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Undo2, Redo2, Eye, Rocket, Monitor, Tablet, Smartphone } from 'lucide-react';
import useEditorStore from '../store/editorStore.js';
import useWebsiteStore from '../store/websiteStore.js';
import useUiStore from '../store/uiStore.js';
import { cn } from '../utils/cn.js';

const viewports = [
  { id: 'desktop', icon: Monitor, label: 'Desktop' },
  { id: 'tablet', icon: Tablet, label: 'Tablet' },
  { id: 'mobile', icon: Smartphone, label: 'Mobile' },
];

export function EditorLayout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const viewport = useEditorStore((s) => s.viewport);
  const setViewport = useEditorStore((s) => s.setViewport);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const isSaving = useEditorStore((s) => s.isSaving);
  const lastSaved = useEditorStore((s) => s.lastSaved);
  const dirty = useEditorStore((s) => s.dirty);
  const publishWebsite = useWebsiteStore((s) => s.publishWebsite);
  const pushToast = useUiStore((s) => s.pushToast);

  const handlePublish = async () => {
    try {
      await publishWebsite(id);
      pushToast({ message: 'Site published successfully', type: 'success' });
    } catch (e) {
      pushToast({ message: e.message || 'Publish failed', type: 'error' });
    }
  };

  return (
    <div className="flex h-screen flex-col bg-slate-100 dark:bg-slate-950">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-white px-3 dark:bg-slate-900 dark:border-slate-800">
        <button onClick={() => navigate('/dashboard')} className="rounded p-2 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Back">
          <ArrowLeft size={18} />
        </button>
        <span className="text-sm font-semibold">Editor</span>
        <span className="hidden text-xs text-slate-400 sm:inline">#{String(id).slice(0, 8)}</span>

        <div className="mx-2 hidden items-center rounded-lg bg-slate-100 p-1 dark:bg-slate-800 md:flex">
          {viewports.map(({ id: v, icon: Icon, label }) => (
            <button
              key={v}
              title={label}
              onClick={() => setViewport(v)}
              className={cn('rounded-md p-1.5', viewport === v ? 'bg-white shadow dark:bg-slate-900' : 'text-slate-500')}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <button onClick={undo} className="rounded p-2 hover:bg-slate-100 dark:hover:bg-slate-800" title="Undo" aria-label="Undo">
            <Undo2 size={16} />
          </button>
          <button onClick={redo} className="rounded p-2 hover:bg-slate-100 dark:hover:bg-slate-800" title="Redo" aria-label="Redo">
            <Redo2 size={16} />
          </button>
        </div>

        <div className="flex-1" />

        <span className="hidden text-xs text-slate-500 sm:inline">
          {isSaving ? 'Saving…' : dirty ? 'Unsaved changes' : lastSaved ? `Saved` : 'Saved'}
        </span>

        <Link to={`/websites/${id}/preview`} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm dark:border-slate-700">
          <Eye size={15} /> Preview
        </Link>
        <button onClick={handlePublish} className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700">
          <Rocket size={15} /> Publish
        </button>
      </header>
      <div className="min-h-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}

export default EditorLayout;
