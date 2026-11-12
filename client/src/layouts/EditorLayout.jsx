import { Outlet, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Undo2, Redo2, Eye, Rocket, Monitor, Tablet, Smartphone, Loader2 } from 'lucide-react';
import useEditorStore from '../store/editorStore.js';
import useWebsiteStore from '../store/websiteStore.js';
import useUiStore from '../store/uiStore.js';
import Button, { ButtonLink } from '../components/Button.jsx';
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
    <div className="flex h-screen flex-col bg-surface-2 dark:bg-surface-inv1">
      <header className="glass z-30 flex h-14 shrink-0 items-center gap-2 border-b border-slate-200/80 px-3 dark:border-slate-800">
        <button
          onClick={() => navigate('/dashboard')}
          className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          aria-label="Back to dashboard"
        >
          <ArrowLeft size={17} />
        </button>
        <span className="truncate text-sm font-semibold">Editor</span>
        <span className="hidden font-mono text-2xs text-slate-400 sm:inline">#{String(id).slice(0, 8)}</span>

        {/* Viewport switcher */}
        <div className="mx-auto hidden items-center gap-0.5 rounded-xl border border-slate-200 bg-white p-1 shadow-xs dark:border-slate-800 dark:bg-slate-900 md:flex" role="group" aria-label="Preview viewport">
          {viewports.map(({ id: v, icon: Icon, label }) => (
            <button
              key={v}
              title={label}
              aria-pressed={viewport === v}
              onClick={() => setViewport(v)}
              className={cn(
                'rounded-lg p-1.5 transition-all duration-200',
                viewport === v
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100'
              )}
            >
              <Icon size={15} />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-0.5">
          <button onClick={undo} className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100" title="Undo" aria-label="Undo">
            <Undo2 size={15} />
          </button>
          <button onClick={redo} className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100" title="Redo" aria-label="Redo">
            <Redo2 size={15} />
          </button>
        </div>

        <div className="flex-1" />

        {/* Save status */}
        <span className="hidden items-center gap-1.5 text-2xs font-medium text-slate-500 sm:flex dark:text-slate-400" aria-live="polite">
          {isSaving ? (
            <><Loader2 size={12} className="animate-spin text-primary-500" /> Saving…</>
          ) : (
            <span className="flex items-center gap-1.5">
              <span className={cn('h-1.5 w-1.5 rounded-full', lastSaved ? 'bg-emerald-500' : 'bg-amber-400')} />
              {lastSaved ? `Saved ${new Date(lastSaved).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Unsaved'}
            </span>
          )}
        </span>

        <ButtonLink to={`/websites/${id}/preview`} size="sm" variant="outline"><Eye size={14} /> Preview</ButtonLink>
        <Button size="sm" variant="gradient" onClick={handlePublish}><Rocket size={14} /> Publish</Button>
      </header>
      <div className="min-h-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}

export default EditorLayout;
