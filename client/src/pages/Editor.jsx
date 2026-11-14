// Editor page: Left (Blocks/Pages/Theme/History tabs) + Canvas + Right (Properties).
// Mounted inside shell EditorLayout (which provides the top chrome), route /websites/:id/edit.
// Loads website + pages on mount; saving is handled by shell useAutosave (dirty/isSaving/markSaved).
// Keyboard: Ctrl+Z / Ctrl+Shift+Z / Ctrl+C / Ctrl+V / Ctrl+D / Delete.
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { LayoutGrid, Files, Palette, History, SlidersHorizontal } from 'lucide-react';
import { useEditorStore } from '../store/editorStore';
import { useWebsiteStore } from '../store/websiteStore';
import { useUiStore } from '../store/uiStore';
import { useAutosave } from '../hooks/useAutosave';
import pageService from '../services/page.service';
import LeftPanel from '../panels/LeftPanel';
import RightPanel from '../panels/RightPanel';
import PagesPanel from '../panels/PagesPanel';
import ThemePanel from '../panels/ThemePanel';
import VersionsPanel from '../panels/VersionsPanel';
import EditorCanvas from '../editor/EditorCanvas';

const TABS = [
  { id: 'components', label: 'Blocks', icon: LayoutGrid },
  { id: 'pages', label: 'Pages', icon: Files },
  { id: 'theme', label: 'Theme', icon: Palette },
  { id: 'versions', label: 'History', icon: History },
];

// Stable fallback while the website (and its theme) is still loading — a fresh
// `{}` per render would break Renderer's memo and re-render the whole canvas.
const EMPTY_THEME = {};

export default function Editor() {
  // shell route param is :id
  const { id: websiteId } = useParams();
  const [tab, setTab] = useState('components');
  const [loading, setLoading] = useState(true);
  // Mobile (< lg) panel drawers: 'left' | 'right' | null. On small screens the
  // canvas takes the full width; the rail/inspector slide over it.
  const [mobilePanel, setMobilePanel] = useState(null);

  const pages = useEditorStore((s) => s.pages);
  const activePageId = useEditorStore((s) => s.activePageId);
  const fetchWebsite = useWebsiteStore((s) => s.fetchWebsite);
  const pushToast = useUiStore((s) => s.pushToast);
  const theme = useWebsiteStore((s) => s.currentWebsite?.theme) || EMPTY_THEME;
  const website = useWebsiteStore((s) => s.currentWebsite);

  useAutosave(1500);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const site = await fetchWebsite(websiteId).catch(() => null);
        if (!site && mounted) {
          pushToast({ message: 'Could not load this website', type: 'error' });
        }
        const list = await pageService.listByWebsite(websiteId);
        if (!mounted) return;
        const arr = Array.isArray(list) ? list : [];
        useEditorStore.getState().setPages(arr);
        const first = arr[0];
        if (first) {
          const pid = first._id || first.id;
          const detail = await pageService.get(pid, websiteId).catch(() => first);
          if (!mounted) return;
          const content = detail?.content || detail?.page?.content || first.content || { id: 'root', type: 'root', props: {}, children: [] };
          useEditorStore.getState().loadPageContent(pid, content);
        }
      } catch (e) {
        if (mounted) pushToast({ message: e.message || 'Failed to load editor', type: 'error' });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [websiteId]); // eslint-disable-line

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      // Escape closes the mobile panel drawers (checked before anything else).
      if (e.key === 'Escape') { setMobilePanel(null); return; }
      const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '') || document.activeElement?.isContentEditable;
      // MUST come before the mod+z / mod+y branches: inside inputs/textareas the
      // browser's native undo/redo must stay untouched (previously Ctrl+Z here
      // hijacked text undo in the properties panel).
      if (typing) return;
      const mod = e.ctrlKey || e.metaKey;
      const st = useEditorStore.getState();
      if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); st.undo(); }
      else if ((mod && e.key.toLowerCase() === 'y') || (mod && e.shiftKey && e.key.toLowerCase() === 'z')) { e.preventDefault(); st.redo(); }
      else if (mod && e.key.toLowerCase() === 'c') { if (st.selectedId) { e.preventDefault(); st.copyNode(st.selectedId); } }
      else if (mod && e.key.toLowerCase() === 'v') { e.preventDefault(); st.pasteNode(); }
      else if (mod && e.key.toLowerCase() === 'd') { if (st.selectedId) { e.preventDefault(); st.duplicateNode(st.selectedId); } }
      else if ((e.key === 'Delete' || e.key === 'Backspace') && st.selectedId) { e.preventDefault(); st.removeNode(st.selectedId); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const activePage = (pages || []).find((p) => (p._id || p.id) === activePageId);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center gap-2.5 text-sm text-slate-500 dark:text-slate-400">
          <span className="h-2 w-2 animate-pulse-soft rounded-full bg-primary-500" />
          Loading editor…
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-0" onClick={() => useEditorStore.getState().select(null)}>
      {/* mobile backdrop for the panel drawers */}
      {mobilePanel && (
        <div
          className="absolute inset-0 z-30 bg-slate-900/40 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMobilePanel(null)}
          aria-hidden="true"
        />
      )}

      {/* left rail — overlay drawer below lg, static column on lg+ */}
      <aside
        className={`flex w-72 min-h-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-surface-inv2 ${
          mobilePanel === 'left'
            ? 'absolute inset-y-0 left-0 z-40 shadow-2xl'
            : 'hidden lg:flex lg:shrink-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 gap-1 border-b border-slate-200 p-1.5 dark:border-slate-800" role="tablist" aria-label="Editor panels">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                title={t.label}
                role="tab"
                aria-selected={active}
                className={`flex flex-1 flex-col items-center gap-1 rounded-lg py-2 text-2xs font-semibold transition-all duration-200 ${
                  active
                    ? 'bg-primary-50 text-primary-700 shadow-xs dark:bg-primary-950/50 dark:text-primary-200'
                    : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <t.icon size={15} className={active ? 'text-primary-600 dark:text-primary-300' : ''} />
                {t.label}
              </button>
            );
          })}
        </div>
        <div className="min-h-0 flex-1">
          {tab === 'components' && <LeftPanel />}
          {tab === 'pages' && <PagesPanel websiteId={websiteId} />}
          {tab === 'theme' && <ThemePanel websiteId={websiteId} theme={theme} />}
          {tab === 'versions' && <VersionsPanel websiteId={websiteId} pageId={activePageId} />}
        </div>
        {activePage && (
          <div className="truncate border-t border-slate-100 px-3 py-2 text-2xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            Editing: <b className="font-semibold text-slate-700 dark:text-slate-200">{activePage.title}</b>{' '}
            <span className="font-mono text-slate-400">/{activePage.slug}</span>
          </div>
        )}
      </aside>

      {/* canvas */}
      <div className="flex min-w-0 flex-1 flex-col" onClick={(e) => e.stopPropagation()}>
        <EditorCanvas website={website} pages={pages} theme={theme} />
      </div>

      {/* right inspector — overlay drawer below lg, static column on lg+ */}
      <aside
        className={`w-72 min-h-0 flex-col border-l border-slate-200 bg-white dark:border-slate-800 dark:bg-surface-inv2 ${
          mobilePanel === 'right'
            ? 'absolute inset-y-0 right-0 z-40 flex shadow-2xl'
            : 'hidden lg:flex lg:shrink-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-slate-100 px-3 py-2.5 text-2xs font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800">Properties</div>
        <div className="min-h-0 flex-1"><RightPanel /></div>
      </aside>

      {/* mobile panel toggles (bottom corners, thumb-reachable, ≥44px targets) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex items-end justify-between px-4 lg:hidden">
        <button
          onClick={(e) => { e.stopPropagation(); setMobilePanel(mobilePanel === 'left' ? null : 'left'); }}
          aria-label="Open blocks, pages and theme panel"
          aria-expanded={mobilePanel === 'left'}
          className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-lg transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <LayoutGrid size={18} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setMobilePanel(mobilePanel === 'right' ? null : 'right'); }}
          aria-label="Open properties panel"
          aria-expanded={mobilePanel === 'right'}
          className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-lg transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <SlidersHorizontal size={18} />
        </button>
      </div>
    </div>
  );
}
