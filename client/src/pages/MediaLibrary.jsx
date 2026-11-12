import { useEffect, useState } from 'react';
import { Image as ImageIcon, Search, Trash2, Upload, Check, Loader2 } from 'lucide-react';
import mediaService from '../services/media.service.js';
import useUiStore from '../store/uiStore.js';
import EmptyState from '../components/EmptyState.jsx';
import Reveal from '../components/Reveal.jsx';

function MediaTile({ m, onSelect, onDelete, selectable }) {
  const url = m.url || m.src || m.path;
  const id = m._id || m.id || url;
  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card dark:border-slate-800 dark:bg-slate-900">
      <div className="relative h-32 overflow-hidden bg-surface-3 dark:bg-slate-800">
        {url ? (
          <img src={url} alt={m.name || 'media'} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 ease-swift group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center"><ImageIcon size={22} className="text-slate-400" /></div>
        )}
        {/* hover overlay */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 bg-slate-950/0 opacity-0 transition-all duration-200 group-hover:bg-slate-950/30 group-hover:opacity-100" />
      </div>
      <div className="flex items-center justify-between gap-2 p-2.5">
        <p className="truncate text-xs font-medium text-slate-600 dark:text-slate-300" title={m.name || url}>{m.name || url}</p>
        <div className="flex shrink-0 gap-0.5">
          {selectable && (
            <button onClick={() => onSelect?.(m)} className="rounded-md p-1.5 text-slate-400 transition hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-slate-800" title="Select" aria-label={`Select ${m.name || 'image'}`}>
              <Check size={15} />
            </button>
          )}
          <button onClick={() => onDelete(m)} className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40" title="Delete" aria-label={`Delete ${m.name || 'image'}`}>
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function MediaLibrary({ onSelect, websiteId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [q, setQ] = useState('');
  const pushToast = useUiStore((s) => s.pushToast);
  const askConfirm = useUiStore((s) => s.askConfirm);

  const load = async () => {
    setLoading(true);
    try {
      const res = await mediaService.list(websiteId ? { websiteId } : {});
      setItems(Array.isArray(res) ? res : res?.items || res?.media || []);
    } catch {
      // keep empty
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [websiteId]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await mediaService.upload(file, websiteId ? { websiteId } : {});
      const entry = uploaded?.file || uploaded;
      if (entry) setItems((s) => [entry, ...s]);
      pushToast({ message: 'Uploaded', type: 'success' });
    } catch (err) {
      pushToast({ message: err.message, type: 'error' });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = (item) => {
    const id = item._id || item.id;
    askConfirm({
      title: 'Delete asset?',
      message: 'This media file will be removed.',
      danger: true,
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          await mediaService.remove(id, item.websiteId || websiteId);
          setItems((s) => s.filter((x) => (x._id || x.id) !== id));
          pushToast({ message: 'Deleted', type: 'success' });
        } catch (e) {
          pushToast({ message: e.message, type: 'error' });
        }
      },
    });
  };

  const filtered = items.filter((m) => !q || (m.name || m.url || '').toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-5">
      {!onSelect && (
        <Reveal>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Media library</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Upload and manage images for your sites.</p>
        </Reveal>
      )}

      <Reveal delay={80} className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search media…" aria-label="Search media" className="sf-input pl-9" />
        </div>
        <label
          className={`
            inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold text-white
            bg-gradient-to-r from-primary-600 to-primary-500 shadow-xs transition-all duration-200
            hover:shadow-glow active:scale-[0.98] h-10
            ${uploading ? 'pointer-events-none opacity-70' : ''}
          `}
        >
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          {uploading ? 'Uploading…' : 'Upload'}
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} aria-label="Upload image" />
        </label>
      </Reveal>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="sf-skeleton h-44" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<ImageIcon size={30} />}
          title="No media yet"
          description="Upload images to use them across your sites."
          action={
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-primary-300 px-4 py-2 text-sm font-semibold text-primary-600 transition hover:bg-primary-50 dark:text-primary-300 dark:hover:bg-primary-950/40">
              <Upload size={16} /> Choose a file
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {filtered.map((m, i) => (
            <Reveal key={m._id || m.id || m.url} delay={i * 40} direction="scale">
              <MediaTile m={m} onSelect={onSelect} onDelete={handleDelete} selectable={Boolean(onSelect)} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}

export default MediaLibrary;
