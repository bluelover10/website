import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Plus, Search, Pencil, Copy, Trash2, ExternalLink } from 'lucide-react';
import useWebsiteStore from '../store/websiteStore.js';
import useUiStore from '../store/uiStore.js';
import { Input } from '../components/Input.jsx';
import { Select } from '../components/Input.jsx';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import Badge from '../components/Badge.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { SkeletonCard } from '../components/Skeleton.jsx';

export function Websites() {
  const navigate = useNavigate();
  const websites = useWebsiteStore((s) => s.websites);
  const loading = useWebsiteStore((s) => s.loading);
  const fetchWebsites = useWebsiteStore((s) => s.fetchWebsites);
  const duplicateWebsite = useWebsiteStore((s) => s.duplicateWebsite);
  const deleteWebsite = useWebsiteStore((s) => s.deleteWebsite);
  const publishWebsite = useWebsiteStore((s) => s.publishWebsite);
  const pushToast = useUiStore((s) => s.pushToast);
  const askConfirm = useUiStore((s) => s.askConfirm);

  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchWebsites().catch(() => {});
  }, [fetchWebsites]);

  const filtered = useMemo(() => {
    return websites.filter((w) => {
      const matchesQ = !q || w.name?.toLowerCase().includes(q.toLowerCase()) || w.slug?.includes(q.toLowerCase());
      const published = w.status === 'published' || w.published;
      const matchesF = filter === 'all' || (filter === 'published' && published) || (filter === 'draft' && !published);
      return matchesQ && matchesF;
    });
  }, [websites, q, filter]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Websites</h1>
          <p className="text-sm text-slate-500">{websites.length} site(s) total.</p>
        </div>
        <Button onClick={() => navigate('/websites/new')}><Plus size={16} /> New site</Button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search sites…" className="sf-input pl-9" />
        </div>
        <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="sm:w-44">
          <option value="all">All</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
        </Select>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <SkeletonCard key={i} />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Globe size={32} />} title="No sites found" description="Try a different search or create a new site." action={<Button onClick={() => navigate('/websites/new')}>Create site</Button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((site) => {
            const siteId = site._id || site.id;
            const published = site.status === 'published' || site.published;
            return (
              <Card key={siteId}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{site.name}</p>
                    <p className="text-xs text-slate-500">/{site.slug}</p>
                  </div>
                  <Badge variant={published ? 'success' : 'warning'}>{published ? 'Published' : 'Draft'}</Badge>
                </div>
                {site.description && <p className="mt-2 line-clamp-2 text-sm text-slate-500">{site.description}</p>}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  <Button size="sm" variant="secondary" onClick={() => navigate(`/websites/${siteId}/edit`)}><Pencil size={14} /> Edit</Button>
                  <Button size="sm" variant="ghost" onClick={() => navigate(`/websites/${siteId}/preview`)}><ExternalLink size={14} /> Preview</Button>
                  <Button size="sm" variant="ghost" onClick={() => navigate(`/websites/${siteId}/settings`)}>Settings</Button>
                  <Button size="sm" variant="ghost" onClick={async () => { try { await duplicateWebsite(siteId); pushToast({ message: 'Duplicated', type: 'success' }); } catch (e) { pushToast({ message: e.message, type: 'error' }); } }}><Copy size={14} /></Button>
                  <Button size="sm" variant="ghost" onClick={() => askConfirm({ title: 'Delete site?', message: `Delete “${site.name}”?`, danger: true, confirmLabel: 'Delete', onConfirm: async () => { try { await deleteWebsite(siteId); pushToast({ message: 'Deleted', type: 'success' }); } catch (e) { pushToast({ message: e.message, type: 'error' }); } } })}><Trash2 size={14} /></Button>
                </div>
                {!published && (
                  <Button size="sm" className="mt-2 w-full" onClick={async () => { try { await publishWebsite(siteId); pushToast({ message: 'Published', type: 'success' }); } catch (e) { pushToast({ message: e.message, type: 'error' }); } }}>
                    Publish now
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Websites;
