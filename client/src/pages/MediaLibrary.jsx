import { useEffect, useState } from 'react';
import { Image as ImageIcon, Search, Trash2, Upload, Check } from 'lucide-react';
import mediaService from '../services/media.service.js';
import useUiStore from '../store/uiStore.js';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import EmptyState from '../components/EmptyState.jsx';

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
          await mediaService.remove(id);
          setItems((s) => s.filter((x) => (x._id || x.id) !== id));
          pushToast({ message: 'Deleted', type: 'success' });
        } catch (e) {
          pushToast({ message: e.message, type: 'error' });
        }
      },
    });
  };

  const filtered = items.filter((m) => !q || (m.name || m.url || '').toLowerCase().includes(q.toLowerCase()));
  const urlOf = (m) => m.url || m.src || m.path;

  return (
    <div className="space-y-5">
      {!onSelect && (
        <div>
          <h1 className="text-2xl font-bold">Media library</h1>
          <p className="text-sm text-slate-500">Upload and manage images for your sites.</p>
        </div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search media…" className="sf-input pl-9" />
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
          <Upload size={16} /> {uploading ? 'Uploading…' : 'Upload'}
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading media…</p>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<ImageIcon size={32} />} title="No media yet" description="Upload images to use them across your sites." />
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {filtered.map((m) => {
            const id = m._id || m.id || m.url;
            return (
              <Card key={id} className="group overflow-hidden p-0">
                <img src={urlOf(m)} alt={m.name || 'media'} className="h-32 w-full object-cover" loading="lazy" />
                <div className="flex items-center justify-between p-2">
                  <p className="truncate text-xs text-slate-500">{m.name || urlOf(m)}</p>
                  <div className="flex gap-1">
                    {onSelect && (
                      <button onClick={() => onSelect(m)} className="rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-800" title="Select">
                        <Check size={15} />
                      </button>
                    )}
                    <button onClick={() => handleDelete(m)} className="rounded p-1 hover:bg-red-50 hover:text-red-600" title="Delete">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MediaLibrary;
