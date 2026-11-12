// Pages manager: list, create/rename/duplicate/delete/reorder/setHome/slug edit.
import React, { useState } from 'react';
import { Plus, Copy, Trash2, Home, ArrowUp, ArrowDown, FileText } from 'lucide-react';
import { useEditorStore } from '../store/editorStore';
import * as pagesApi from '../services/page.service';

export default function PagesPanel({ websiteId }) {
  const pages = useEditorStore((s) => s.pages);
  const activePageId = useEditorStore((s) => s.activePageId);
  const setPages = useEditorStore((s) => s.setPages);
  const setActivePage = useEditorStore((s) => s.setActivePage);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState({ title: '', slug: '' });
  const [busy, setBusy] = useState(false);

  const refresh = async (selectId) => {
    const list = await pagesApi.getPages(websiteId);
    setPages(Array.isArray(list) ? list : list?.pages || []);
    if (selectId) setActivePage(selectId);
  };

  const create = async () => {
    setBusy(true);
    try {
      const p = await pagesApi.createPage(websiteId, { title: `Page ${(pages || []).length + 1}`, slug: `page-${Date.now().toString(36)}` });
      await refresh(p?._id || p?.id);
    } catch (e) { alert(e.message); } finally { setBusy(false); }
  };

  const saveMeta = async (page) => {
    setBusy(true);
    try {
      const id = page._id || page.id;
      await pagesApi.updatePage(websiteId, id, { title: draft.title, slug: draft.slug });
      await refresh(id);
      setEditing(null);
    } catch (e) { alert(e.message); } finally { setBusy(false); }
  };

  const duplicate = async (page) => {
    setBusy(true);
    try { await pagesApi.duplicatePage(websiteId, page._id || page.id); await refresh(); }
    catch (e) { alert(e.message); } finally { setBusy(false); }
  };

  const remove = async (page) => {
    if (!confirm(`Delete "${page.title}"?`)) return;
    setBusy(true);
    try { await pagesApi.deletePage(websiteId, page._id || page.id); await refresh(); }
    catch (e) { alert(e.message); } finally { setBusy(false); }
  };

  const reorder = async (idx, dir) => {
    const list = [...(pages || [])];
    const j = idx + dir;
    if (j < 0 || j >= list.length) return;
    const [m] = list.splice(idx, 1);
    list.splice(j, 0, m);
    setPages(list);
    try { await pagesApi.reorderPages(websiteId, list.map((p) => p._id || p.id)); } catch {}
  };

  const setHome = async (page) => {
    setBusy(true);
    try { await pagesApi.setHomePage(websiteId, page._id || page.id); await refresh(page._id || page.id); }
    catch (e) { alert(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="p-3 flex flex-col gap-2 h-full overflow-auto">
      <button onClick={create} disabled={busy} className="flex items-center justify-center gap-1.5 text-xs font-semibold border border-dashed rounded-md py-2 hover:bg-slate-50">
        <Plus size={14} /> New page
      </button>
      {(pages || []).map((pg, i) => {
        const id = pg._id || pg.id;
        const active = id === activePageId;
        const isEditing = editing === id;
        return (
          <div key={id} onClick={() => !isEditing && setActivePage(id)} className={`border rounded-md p-2 cursor-pointer ${active ? 'border-indigo-500 bg-indigo-50/50' : 'hover:border-slate-300'}`}>
            {isEditing ? (
              <div className="flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
                <input className="border rounded px-2 py-1 text-xs" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Title" />
                <input className="border rounded px-2 py-1 text-xs font-mono" value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} placeholder="slug" />
                <div className="flex gap-1.5">
                  <button onClick={() => saveMeta(pg)} className="text-[11px] font-semibold bg-indigo-600 text-white rounded px-2 py-1">Save</button>
                  <button onClick={() => setEditing(null)} className="text-[11px] border rounded px-2 py-1">Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  <FileText size={13} className="text-slate-400" />
                  <span className="text-xs font-semibold truncate">{pg.title}</span>
                  {(pg.isHome || i === 0) && <Home size={11} className="text-indigo-500" />}
                </div>
                <div className="font-mono text-[10px] text-slate-400 truncate">/{pg.slug}</div>
                <div className="flex items-center gap-0.5 mt-1.5">
                  <button title="Rename / slug" onClick={(e) => { e.stopPropagation(); setEditing(id); setDraft({ title: pg.title || '', slug: pg.slug || '' }); }} className="text-[10px] border rounded px-1.5 py-0.5 hover:bg-white">Edit</button>
                  <button title="Set as home" onClick={(e) => { e.stopPropagation(); setHome(pg); }} className="p-1 rounded hover:bg-white text-slate-500"><Home size={12} /></button>
                  <button title="Duplicate" onClick={(e) => { e.stopPropagation(); duplicate(pg); }} className="p-1 rounded hover:bg-white text-slate-500"><Copy size={12} /></button>
                  <button title="Delete" onClick={(e) => { e.stopPropagation(); remove(pg); }} className="p-1 rounded hover:bg-red-50 text-red-500"><Trash2 size={12} /></button>
                  <span className="flex-1" />
                  <button onClick={(e) => { e.stopPropagation(); reorder(i, -1); }} className="p-1 text-slate-400 hover:text-slate-700"><ArrowUp size={12} /></button>
                  <button onClick={(e) => { e.stopPropagation(); reorder(i, 1); }} className="p-1 text-slate-400 hover:text-slate-700"><ArrowDown size={12} /></button>
                </div>
              </>
            )}
          </div>
        );
      })}
      {(!pages || !pages.length) && <p className="text-[11px] text-slate-400 text-center py-4">No pages yet — create one.</p>}
    </div>
  );
}
