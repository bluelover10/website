// Preview mode: draft tree via Renderer, viewport switcher, page switcher.
// Route: /websites/:id/preview (shell). No editor chrome.
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Monitor, Tablet, Smartphone, Pencil } from 'lucide-react';
import { Renderer } from '../editor/Renderer';
import { useEditorStore } from '../store/editorStore';
import websiteService from '../services/website.service';
import pageService from '../services/page.service';

const WIDTHS = { desktop: '100%', tablet: '768px', mobile: '375px' };

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
  const switchPage = async (pid) => {
    setPageId(pid);
    const pg = pages.find((p) => (p._id || p.id) === pid);
    if (!pg) return;
    if (pg.content) { setTree(toRoot(pg.content)); return; }
    const detail = await pageService.get(pid, websiteId).catch(() => pg);
    setTree(toRoot(detail?.content || detail?.page?.content || pg.content));
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen bg-slate-200 flex flex-col">
      <div className="h-11 bg-white border-b flex items-center gap-2 px-3 sticky top-0 z-40">
        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">Preview · draft</span>
        <span className="text-xs text-slate-500 truncate">{website?.name || ''}</span>
        <div className="mx-auto flex items-center gap-0.5 border rounded-lg px-1 py-0.5">
          {[{ v: 'desktop', I: Monitor }, { v: 'tablet', I: Tablet }, { v: 'mobile', I: Smartphone }].map(({ v, I }) => (
            <button key={v} onClick={() => setVp(v)} className={`p-1.5 rounded ${vp === v ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`}><I size={15} /></button>
          ))}
        </div>
        {pages.length > 1 && (
          <select className="text-xs border rounded px-1.5 py-1" value={pageId || ''} onChange={(e) => switchPage(e.target.value)}>
            {pages.map((p) => <option key={p._id || p.id} value={p._id || p.id}>{p.title}</option>)}
          </select>
        )}
        <Link to={`/websites/${websiteId}/edit`} className="flex items-center gap-1 text-xs font-medium border rounded-md px-2.5 py-1.5 hover:bg-slate-50">
          <Pencil size={13} /> Back to editor
        </Link>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <div className="mx-auto bg-white rounded-lg shadow-sm overflow-hidden transition-all" style={{ maxWidth: WIDTHS[vp] }}>
          <Renderer tree={tree} mode="preview" theme={theme} website={website} pages={pages} navigate={(slug) => { const pg = pages.find((p) => p.slug === slug); if (pg) switchPage(pg._id || pg.id); }} />
        </div>
      </div>
    </div>
  );
}
