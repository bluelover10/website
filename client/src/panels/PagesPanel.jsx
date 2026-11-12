// Pages manager: list, create/rename/duplicate/delete/reorder/setHome/slug edit.
import React, { useState } from 'react';
import { Plus, Copy, Trash2, Home, ArrowUp, ArrowDown, FileText } from 'lucide-react';
import { useEditorStore } from '../store/editorStore';
import { useUiStore } from '../store/uiStore';
import * as pagesApi from '../services/page.service';

export default function PagesPanel({ websiteId }) {
  const pages = useEditorStore((s) => s.pages);
  const activePageId = useEditorStore((s) => s.activePageId);
  const setPages = useEditorStore((s) => s.setPages);
  const setActivePage = useEditorStore((s) => s.setActivePage);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState({ title: '', slug: '' });
  const [busy, setBusy] = useState(false);
  const askConfirm = useUiStore((s) => s.askConfirm);
  const pushToast = useUiStore((s) => s.pushToast);

  const refresh = async (selectId) => {
    const list = await pagesApi.getPages(websiteId);
    setPages(Array.isArray(list) ? list : list?.pages || []);
    if (selectId) setActivePage(selectId);
  };

  const fail = (e) => pushToast({ message: e?.message || 'Something went wrong', type: 'error' });

  const create = async () => {
    setBusy(true);
    try {
      const p = await pagesApi.createPage(websiteId, { title: `Page ${(pages || []).length + 1}`, slug: `page-${Date.now().toString(36)}` });
      await refresh(p?._id || p?.id);
      pushToast({ message: 'Page created', type: 'success' });
    } catch (e) { fail(e); } finally { setBusy(false); }
  };

  const saveMeta = async (page) => {
    setBusy(true);
    try {
      const id = page._id || page.id;
      await pagesApi.updatePage(websiteId, id, { title: draft.title, slug: draft.slug });
      await refresh(id);
      setEditing(null);
      pushToast({ message: 'Page updated', type: 'success' });
    } catch (e) { fail(e); } finally { setBusy(false); }
  };

  const duplicate = async (page) => {
    setBusy(true);
    try { await pagesApi.duplicatePage(websiteId, page._id || page.id); await refresh(); pushToast({ message: 'Page duplicated', type: 'success' }); }
    catch (e) { fail(e); } finally { setBusy(false); }
  };

  const remove = async (page) => {
    const ok = await askConfirm({
      title: 'Delete page?',
      message: `"${page.title}" and its version history will be permanently removed.`,
      danger: true,
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    setBusy(true);
    try { await pagesApi.deletePage(websiteId, page._id || page.id); await refresh(); pushToast({ message: 'Page deleted', type: 'success' }); }
    catch (e) { fail(e); } finally { setBusy(false); }
  };

  const reorder = async (idx, dir) => {
    const list = [...(pages || [])];
    const j = idx + dir;
    if (j < 0 || j >= list.length) return;
    const [m] = list.splice(idx, 1);
    list.splice(j, 0, m);
    setPages(list);
    try { await pagesApi.reorderPages(websiteId, list.map((p) => p._id || p.id)); } catch (e) { fail(e); }
  };

  const setHome = async (page) => {
    setBusy(true);
    try { await pagesApi.setHomePage(websiteId, page._id || page.id); await refresh(page._id || page.id); pushToast({ message: `"${page.title}" is now the home page`, type: 'success' }); }
    catch (e) { fail(e); } finally { setBusy(false); }
  };

  return (
    <div className="flex h-full flex-col gap-2 overflow-auto p-3">
      <button
        onClick={create}
        disabled={busy}
        className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-primary-300 py-2 text-xs font-semibold text-primary-600 transition hover:bg-primary-50/60 disabled:opacity-50 dark:border-primary-800 dark:text-primary-300 dark:hover:bg-primary-950/40"
      >
        <Plus size={14} /> New page
      </button>
      {(pages || []).map((pg, i) => {
        const id = pg._id || pg.id;
        const active = id === activePageId;
        const isEditing = editing === id;
        return (
          <div
            key={id}
            onClick={() => !isEditing && setActivePage(id)}
            className={`cursor-pointer rounded-xl border p-2.5 transition-all duration-150 ${active ? 'border-primary-400 bg-primary-50/60 shadow-xs dark:border-primary-700 dark:bg-primary-950/40' : 'border-slate-200 hover:border-slate-300 hover:shadow-xs dark:border-slate-800 dark:hover:border-slate-700'}`}
          >
            {isEditing ? (
              <div className="flex animate-fade-up flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
                <input className="sf-input py-1.5 text-xs" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Title" aria-label="Page title" />
                <input className="sf-input py-1.5 font-mono text-xs" value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} placeholder="slug" aria-label="Page slug" />
                <div className="flex gap-1.5">
                  <button onClick={() => saveMeta(pg)} className="rounded-md bg-primary-600 px-2.5 py-1 text-2xs font-semibold text-white transition hover:bg-primary-500">Save</button>
                  <button onClick={() => setEditing(null)} className="rounded-md border border-slate-200 px-2.5 py-1 text-2xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  <FileText size={13} className={active ? 'text-primary-500' : 'text-slate-400'} />
                  <span className="truncate text-xs font-semibold">{pg.title}</span>
                  {(pg.isHome || i === 0) && <span title="Home page"><Home size={11} className="text-primary-500" /></span>}
                </div>
                <div className="truncate font-mono text-2xs text-slate-400">/{pg.slug}</div>
                <div className="mt-1.5 flex items-center gap-0.5">
                  <button title="Rename / slug" onClick={(e) => { e.stopPropagation(); setEditing(id); setDraft({ title: pg.title || '', slug: pg.slug || '' }); }} className="rounded px-1.5 py-0.5 text-2xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800">Edit</button>
                  <button title="Set as home" onClick={(e) => { e.stopPropagation(); setHome(pg); }} className="rounded p-1 text-slate-400 transition hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-950/50"><Home size={12} /></button>
                  <button title="Duplicate" onClick={(e) => { e.stopPropagation(); duplicate(pg); }} className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"><Copy size={12} /></button>
                  <button title="Delete" onClick={(e) => { e.stopPropagation(); remove(pg); }} className="rounded p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40"><Trash2 size={12} /></button>
                  <span className="flex-1" />
                  <button onClick={(e) => { e.stopPropagation(); reorder(i, -1); }} className="rounded p-1 text-slate-400 transition hover:text-slate-700 dark:hover:text-slate-200" aria-label="Move page up"><ArrowUp size={12} /></button>
                  <button onClick={(e) => { e.stopPropagation(); reorder(i, 1); }} className="rounded p-1 text-slate-400 transition hover:text-slate-700 dark:hover:text-slate-200" aria-label="Move page down"><ArrowDown size={12} /></button>
                </div>
              </>
            )}
          </div>
        );
      })}
      {(!pages || !pages.length) && <p className="py-4 text-center text-xs text-slate-400">No pages yet — create one.</p>}
    </div>
  );
}
