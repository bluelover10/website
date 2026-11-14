import { Outlet, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Undo2, Redo2, Eye, Rocket, Monitor, Tablet, Smartphone, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import useEditorStore from '../store/editorStore.js';
import useWebsiteStore from '../store/websiteStore.js';
import useUiStore from '../store/uiStore.js';
import Button, { ButtonLink } from '../components/Button.jsx';
import { flushAutosave } from '../hooks/useAutosave.js';
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
  const canUndo = useEditorStore((s) => s.past.length > 0);
  const canRedo = useEditorStore((s) => s.future.length > 0);
  const isSaving = useEditorStore((s) => s.isSaving);
  const lastSaved = useEditorStore((s) => s.lastSaved);
  const publishWebsite = useWebsiteStore((s) => s.publishWebsite);
  const siteSaving = useWebsiteStore((s) => s.saving);
  const pushToast = useUiStore((s) => s.pushToast);
  const [publishing, setPublishing] = useState(false);

  // Leaving the editor (Back) must not drop unsaved edits — fire the shared
  // flush (live binding) before navigating.
  const handleBack = async () => {
    try { await flushAutosave?.(); } catch { /* best effort */ }
    navigate('/dashboard');
  };

  const handlePublish = async () => {
    if (publishing) return;
    setPublishing(true);
    try {
      // Unsaved canvas edits must reach the server BEFORE the publish snapshot
      // runs, or the published site misses the latest changes.
      await flushAutosave?.();
      await publishWebsite(id);
      pushToast({ message: 'Site published successfully', type: 'success' });
    } catch (e) {
      pushToast({ message: e.message || 'Publish failed', type: 'error' });
    } finally {
      setPublishing(false);
    }
  };

  // Warn before closing the tab with unsaved work.
  useEffect(() => {
    const onBeforeUnload = (e) => {
      const st = useEditorStore.getState();
      if (st.dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  return (
    <div className="flex h-screen flex-col bg-surface-2 dark:bg-surface-inv1">
      <header className="glass z-30 flex h-14 shrink-0 items-center gap-1.5 border-b border-slate-200/80 px-2 dark:border-slate-800 sm:gap-2 sm:px-3">
        <button
          onClick={handleBack}
          className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          aria-label="Back to dashboard"
        >
          <ArrowLeft size={17} />
        </button>
        <span className="min-w-0 truncate text-sm font-semibold">Editor</span>
        <span className="hidden font-mono text-2xs text-slate-400 sm:inline">#{String(id).slice(0, 8)}</span>

        {/* Viewport switcher — visible on mobile too (icon-only pills fit 375px) */}
        <div className="mx-auto flex items-center gap-0.5 rounded-xl border border-slate-200 bg-white p-1 shadow-xs dark:border-slate-800 dark:bg-slate-900" role="group" aria-label="Preview viewport">
          {viewports.map(({ id: v, icon: Icon, label }) => (
            <button
              key={v}
              title={label}
              aria-label={`${label} viewport`}
              aria-pressed={viewport === v}
              onClick={() => setViewport(v)}
              className={cn(
                'rounded-lg p-1.5 transition-all duration-200 sm:p-2',
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
          <button
            onClick={undo}
            disabled={!canUndo}
            className={cn(
              'rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100',
              !canUndo && 'cursor-not-allowed opacity-40 hover:bg-transparent dark:hover:bg-transparent'
            )}
            title="Undo"
            aria-label="Undo"
            aria-disabled={!canUndo}
          >
            <Undo2 size={15} />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className={cn(
              'rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100',
              !canRedo && 'cursor-not-allowed opacity-40 hover:bg-transparent dark:hover:bg-transparent'
            )}
            title="Redo"
            aria-label="Redo"
            aria-disabled={!canRedo}
          >
            <Redo2 size={15} />
          </button>
        </div>

        <div className="flex-1" />

        {/* Save status — compact dot on mobile, full text on sm+ */}
        <span className="sm:hidden" aria-live="polite">
          <span
            className={cn('block h-2 w-2 rounded-full', isSaving ? 'animate-pulse bg-primary-500' : lastSaved ? 'bg-emerald-500' : 'bg-amber-400')}
            title={isSaving ? 'Saving…' : lastSaved ? `Saved ${new Date(lastSaved).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Unsaved changes'}
          />
        </span>
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

        <ButtonLink to={`/websites/${id}/preview`} size="sm" variant="outline" aria-label="Preview site">
          <Eye size={14} /> <span className="hidden sm:inline">Preview</span>
        </ButtonLink>
        <Button
          size="sm"
          variant="gradient"
          onClick={handlePublish}
          disabled={publishing || siteSaving}
          aria-label="Publish site"
          className="shrink-0"
        >
          {(publishing || siteSaving) ? <Loader2 size={14} className="animate-spin" /> : <Rocket size={14} />}
          <span className="hidden sm:inline">Publish</span>
        </Button>
      </header>
      <div className="min-h-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}

export default EditorLayout;
