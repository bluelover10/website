// Editor page: Left (Blocks/Pages/Theme/History tabs) + Canvas + Right (Properties).
// Mounted inside shell EditorLayout (which provides the top chrome), route /websites/:id/edit.
// Loads website + pages on mount; saving is handled by shell useAutosave (dirty/isSaving/markSaved).
// Keyboard: Ctrl+Z / Ctrl+Shift+Z / Ctrl+C / Ctrl+V / Ctrl+D / Delete.
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { LayoutGrid, Files, Palette, History } from 'lucide-react';
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

export default function Editor() {
  // shell route param is :id
  const { id: websiteId } = useParams();
  const [tab, setTab] = useState('components');
  const [loading, setLoading] = useState(true);

  const pages = useEditorStore((s) => s.pages);
  const activePageId = useEditorStore((s) => s.activePageId);
  const fetchWebsite = useWebsiteStore((s) => s.fetchWebsite);
  const pushToast = useUiStore((s) => s.pushToast);
  const theme = useWebsiteStore((s) => s.currentWebsite?.theme) || {};
  const website = useWebsiteStore((s) => s.currentWebsite);

  useAutosave(1500);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        await fetchWebsite(websiteId).catch(() => null);
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
      const mod = e.ctrlKey || e.metaKey;
      const st = useEditorStore.getState();
      const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '') || document.activeElement?.isContentEditable;
      if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); st.undo(); }
      else if ((mod && e.key.toLowerCase() === 'y') || (mod && e.shiftKey && e.key.toLowerCase() === 'z')) { e.preventDefault(); st.redo(); }
      else if (typing) return;
      else if (mod && e.key.toLowerCase() === 'c') { if (st.selectedId) { e.preventDefault(); st.copyNode(st.selectedId); } }
      else if (mod && e.key.toLowerCase() === 'v') { e.preventDefault(); st.pasteNode(); }
      else if (mod && e.key.toLowerCase() === 'd') { if (st.selectedId) { e.preventDefault(); st.duplicateNode(st.selectedId); } }
      else if ((e.key === 'Delete' || e.key === 'Backspace') && st.selectedId) { e.preventDefault(); st.removeNode(st.selectedId); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const activePage = (pages || []).find((p) => (p._id || p.id) === activePageId);

  if (loading) return <div className="flex h-full items-center justify-center text-sm text-slate-500">Loading editor…</div>;

  return (
    <div className="flex h-full min-h-0" onClick={() => useEditorStore.getState().select(null)}>
      {/* left rail */}
      <aside className="flex w-72 shrink-0 flex-col border-r bg-white dark:bg-slate-900 dark:border-slate-800 min-h-0" onClick={(e) => e.stopPropagation()}>
        <div className="flex border-b dark:border-slate-800 shrink-0">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} title={t.label}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${tab === t.id ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
              <t.icon size={15} />{t.label}
            </button>
          ))}
        </div>
        <div className="flex-1 min-h-0">
          {tab === 'components' && <LeftPanel />}
          {tab === 'pages' && <PagesPanel websiteId={websiteId} />}
          {tab === 'theme' && <ThemePanel websiteId={websiteId} theme={theme} />}
          {tab === 'versions' && <VersionsPanel pageId={activePageId} />}
        </div>
        {activePage && (
          <div className="px-3 py-1.5 border-t dark:border-slate-800 text-[11px] text-slate-500 truncate">
            Editing: <b>{activePage.title}</b> <span className="font-mono">/{activePage.slug}</span>
          </div>
        )}
      </aside>

      {/* canvas */}
      <div className="flex min-w-0 flex-1 flex-col" onClick={(e) => e.stopPropagation()}>
        <EditorCanvas website={website} pages={pages} theme={theme} />
      </div>

      {/* right inspector */}
      <aside className="hidden w-72 shrink-0 flex-col border-l bg-white dark:bg-slate-900 dark:border-slate-800 min-h-0 lg:flex" onClick={(e) => e.stopPropagation()}>
        <div className="px-3 py-2 border-b dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">Properties</div>
        <div className="flex-1 min-h-0"><RightPanel /></div>
      </aside>
    </div>
  );
}
