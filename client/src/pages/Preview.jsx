// Preview mode: draft tree via Renderer, viewport switcher, page switcher.
// Route: /websites/:id/preview (shell). No editor chrome.
import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Monitor, Tablet, Smartphone, Pencil } from 'lucide-react';
import { Renderer } from '../editor/Renderer';
import { useEditorStore } from '../store/editorStore';
import websiteService from '../services/website.service';
import pageService from '../services/page.service';

// min(100%, X) keeps phones/tablets from horizontally overflowing when the
// simulated viewport is wider than the real screen.
const WIDTHS = { desktop: '100%', tablet: 'min(100%, 768px)', mobile: 'min(100%, 375px)' };

function toRoot(content) {
  if (content && content.id) return content;
  if (content && Array.isArray(content.children)) return { id: 'root', type: 'root', props: {}, children: content.children };
  if (Array.isArray(content)) return { id: 'root', type: 'root', props: {}, children: content };
  return { id: 'root', type: 'root', props: {}, children: [] };
}

export default function Preview() {
  const { id: websiteId } = useParams();
  const draftTree = useEditorStore((s) => s.tree);
  const activePageId = useEditorStore((s) => s.activePageId);
  const [vp, setVp] = useState('desktop');
  const [website, setWebsite] = useState(null);
  const [pages, setPages] = useState([]);
  const [pageId, setPageId] = useState(activePageId);
  const [tree, setTree] = useState(draftTree?.children?.length ? draftTree : toRoot(null));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await websiteService.get(websiteId).catch(() => null);
        const list = await pageService.listByWebsite(websiteId).catch(() => []);
        if (cancelled) return;
        const site = s?.website || s || null;
        if (site) setWebsite(site);
        const arr = Array.isArray(list) ? list : [];
        setPages(arr);
        // prefer store draft; otherwise load first page content
        const hasDraft = draftTree?.children && draftTree.children.length;
        if (!hasDraft && arr.length) {
          const first = arr[0];
          const pid = first._id || first.id;
          setPageId(pid);
          const detail = await pageService.get(pid, websiteId).catch(() => first);
          if (!cancelled) setTree(toRoot(detail?.content || detail?.page?.content || first.content));
        } else if (hasDraft) {
          setTree(draftTree);
        }
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [websiteId]); // eslint-disable-line

  const theme = website?.theme || {};
  // The scroll container is the inner overflow-auto div (not window) — reset its
  // scrollTop on page/viewport change so switching pages starts at the top.
  const scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [pageId, vp]);

  const switchPage = async (pid) => {
    setPageId(pid);
    const pg = pages.find((p) => (p._id || p.id) === pid);
    if (!pg) return;
    if (pg.content) { setTree(toRoot(pg.content)); return; }
    const detail = await pageService.get(pid, websiteId).catch(() => pg);
    setTree(toRoot(detail?.content || detail?.page?.content || pg.content));
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface-2 dark:bg-surface-inv1">
      <div className="glass sticky top-0 z-40 flex h-12 flex-wrap items-center gap-2 border-b border-slate-200/80 px-3 dark:border-slate-800">
        <span className="rounded-md border border-accent-200 bg-accent-50 px-2 py-0.5 text-2xs font-bold uppercase tracking-wider text-accent-700 dark:border-accent-800/60 dark:bg-accent-900/30 dark:text-accent-300">
          Preview · draft
        </span>
        <span className="truncate text-xs font-medium text-slate-600 dark:text-slate-300">{website?.name || ''}</span>
        <div className="mx-auto flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5 shadow-xs dark:border-slate-800 dark:bg-slate-900" role="group" aria-label="Viewport">
          {[{ v: 'desktop', I: Monitor }, { v: 'tablet', I: Tablet }, { v: 'mobile', I: Smartphone }].map(({ v, I }) => (
            <button
              key={v}
              onClick={() => setVp(v)}
              aria-pressed={vp === v}
              className={`rounded-md p-1.5 transition-all duration-200 ${vp === v ? 'bg-primary-600 text-white shadow-xs' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              <I size={14} />
            </button>
          ))}
        </div>
        {pages.length > 1 && (
          <select
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs shadow-xs dark:border-slate-800 dark:bg-slate-900"
            value={pageId || ''}
            onChange={(e) => switchPage(e.target.value)}
            aria-label="Switch page"
          >
            {pages.map((p) => <option key={p._id || p.id} value={p._id || p.id}>{p.title}</option>)}
          </select>
        )}
        <Link
          to={`/websites/${websiteId}/edit`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-primary-300 hover:bg-primary-50/50 dark:border-slate-700 dark:text-slate-200 dark:hover:border-primary-700 dark:hover:bg-primary-950/40"
        >
          <Pencil size={13} /> Back to editor
        </Link>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-auto p-4 sf-canvas sf-canvas-grid">
        <div className="mx-auto overflow-hidden rounded-xl bg-white shadow-card ring-1 ring-black/[0.03] transition-all duration-300 ease-swift dark:bg-surface-inv2" style={{ width: WIDTHS[vp], maxWidth: '100%' }}>
          <Renderer tree={tree} mode="preview" theme={theme} website={website} pages={pages} navigate={(slug) => { const pg = pages.find((p) => p.slug === slug); if (pg) switchPage(pg._id || pg.id); }} />
        </div>
      </div>
    </div>
  );
}
