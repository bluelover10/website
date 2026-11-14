import { useEffect, useState } from 'react';
import { Image as ImageIcon, Search, Trash2, Upload, Check, Loader2 } from 'lucide-react';
import mediaService from '../services/media.service.js';
import websiteService from '../services/website.service.js';
import useUiStore from '../store/uiStore.js';
import Button from '../components/Button.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Reveal from '../components/Reveal.jsx';

function MediaTile({ m, onSelect, onDelete, selectable, siteName }) {
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
      <div className="p-2.5">
        {/* In "all sites" view, name the site each asset belongs to */}
        {siteName && <p className="mb-1 truncate text-2xs font-medium text-slate-400 dark:text-slate-500">{siteName}</p>}
        <div className="flex items-center justify-between gap-2">
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
    </div>
  );
}

export function MediaLibrary({ onSelect, websiteId }) {
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB — keep in sync with the server limit
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [q, setQ] = useState('');
  // Standalone library: media is stored per website, so keep a site filter and
  // an upload target. 'all' lists every site the user can access (server scopes it).
  const [sites, setSites] = useState([]);
  const [siteId, setSiteId] = useState('all');
  const pushToast = useUiStore((s) => s.pushToast);
  const askConfirm = useUiStore((s) => s.askConfirm);

  // Where new uploads land: an explicitly selected site, the picker's prop, or
  // (in "all" view) the first accessible site.
  const targetSiteId = websiteId || (siteId !== 'all' ? siteId : sites[0]?._id);
  const targetSiteName = sites.find((s) => s._id === targetSiteId)?.name;

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = websiteId ? { websiteId } : siteId !== 'all' ? { websiteId: siteId } : {};
      const res = await mediaService.list(params);
      setItems(Array.isArray(res) ? res : res?.items || res?.media || []);
    } catch (e) {
      setError(e?.message || 'Could not load your media.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [websiteId, siteId]);

  // Site list for the filter/upload picker (standalone page only). Failure here
  // is non-fatal — the grid still renders and reports its own load state.
  useEffect(() => {
    if (websiteId) return undefined;
    let cancelled = false;
    websiteService
      .list()
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res) ? res : res?.websites || [];
        setSites(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [websiteId]);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    // Client-side guards before any POST: images only, <= 5MB each.
    const valid = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        pushToast({ message: `“${file.name}” is not an image.`, type: 'error' });
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        pushToast({ message: `“${file.name}” is larger than 5MB.`, type: 'error' });
        continue;
      }
      valid.push(file);
    }
    if (!valid.length) return;
    // Uploads are stored per website — resolve a concrete target before posting.
    if (!targetSiteId) {
      pushToast({ message: 'Create a website first — uploads are stored per site.', type: 'error' });
      return;
    }
    const autoTargeted = !websiteId && siteId === 'all';
    setUploading(true);
    try {
      // Sequential uploads so each file's progress reads cleanly on the button.
      for (const file of valid) {
        setProgress(0);
        const uploaded = await mediaService.upload(
          file,
          { websiteId: targetSiteId },
          (fraction) => setProgress(Math.round(fraction * 100))
        );
        const entry = uploaded?.file || uploaded;
        if (entry) setItems((s) => [entry, ...s]);
        pushToast({
          message: autoTargeted && targetSiteName ? `Uploaded ${file.name} to “${targetSiteName}”` : `Uploaded ${file.name}`,
          type: 'success',
        });
      }
    } catch (err) {
      pushToast({ message: err.message, type: 'error' });
    } finally {
      setUploading(false);
      setProgress(0);
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

  const siteNameById = new Map(sites.map((s) => [s._id, s.name]));
  const filtered = items.filter((m) => !q || (m.name || m.url || '').toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-5">
      {!onSelect && (
        <Reveal>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Media library</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Upload and manage images for your sites.</p>
        </Reveal>
      )}

      {/* Load failure — an empty grid here would look like "no media" */}
      {error && !loading && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/50 dark:bg-red-950/40"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-red-700 dark:text-red-300">Could not load your media.</p>
            {error !== 'Could not load your media.' && (
              <p className="mt-0.5 truncate text-xs text-red-600/80 dark:text-red-400/80" title={error}>{error}</p>
            )}
          </div>
          <Button size="sm" variant="outline" onClick={load}>Retry</Button>
        </div>
      )}

      <Reveal delay={80} className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search media…" aria-label="Search media" className="sf-input pl-9" />
        </div>
        {!websiteId && sites.length > 0 && (
          <select
            value={siteId}
            onChange={(e) => setSiteId(e.target.value)}
            aria-label="Filter by website"
            className="sf-input w-full cursor-pointer sm:w-52"
          >
            <option value="all">All my sites</option>
            {sites.map((s) => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
        )}
        <label
          className={`
            inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold text-white
            bg-gradient-to-r from-primary-600 to-primary-500 shadow-xs transition-all duration-200
            hover:shadow-glow active:scale-[0.98] h-10
            ${uploading ? 'pointer-events-none opacity-70' : ''}
            ${!targetSiteId ? 'pointer-events-none opacity-50' : ''}
          `}
          title={!targetSiteId ? 'Create a website first — uploads are stored per site' : undefined}
        >
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          {uploading ? `Uploading… ${progress}%` : 'Upload'}
          <input type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} disabled={uploading || !targetSiteId} aria-label="Upload images" />
        </label>
      </Reveal>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="sf-skeleton h-44" />)}
        </div>
      ) : filtered.length === 0 && !error ? (
        <EmptyState
          icon={<ImageIcon size={30} />}
          title="No media yet"
          description={
            !websiteId && sites.length === 0
              ? 'Media is stored per website — create a site, then upload images from here.'
              : 'Upload images to use them across your sites.'
          }
          action={
            targetSiteId ? (
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-primary-300 px-4 py-2 text-sm font-semibold text-primary-600 transition hover:bg-primary-50 dark:text-primary-300 dark:hover:bg-primary-950/40">
                <Upload size={16} /> Choose files
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
              </label>
            ) : null
          }
        />
      ) : filtered.length === 0 ? null : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {filtered.map((m, i) => (
            <Reveal key={m._id || m.id || m.url} delay={i * 40} direction="scale">
              <MediaTile
                m={m}
                onSelect={onSelect}
                onDelete={handleDelete}
                selectable={Boolean(onSelect)}
                siteName={!websiteId && siteId === 'all' ? siteNameById.get(m.websiteId) : undefined}
              />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}

export default MediaLibrary;
