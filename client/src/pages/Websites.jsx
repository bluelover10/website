import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Plus, Search, Pencil, Copy, Trash2, ExternalLink, Settings, Rocket, Inbox, BarChart3, Users } from 'lucide-react';
import useWebsiteStore from '../store/websiteStore.js';
import useUiStore from '../store/uiStore.js';
import { Select } from '../components/Input.jsx';
import Card from '../components/Card.jsx';
import Button, { ButtonLink } from '../components/Button.jsx';
import Badge from '../components/Badge.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Reveal from '../components/Reveal.jsx';
import { SkeletonCard } from '../components/Skeleton.jsx';
import { cn } from '../utils/cn.js';

const filters = [
  { value: 'all', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Drafts' },
];

// Deterministic pastel gradient per site (stable across renders).
function siteTint(seed = '') {
  const palette = [
    'from-primary-400 to-primary-700',
    'from-accent-400 to-accent-600',
    'from-sky-400 to-sky-700',
    'from-emerald-400 to-emerald-700',
    'from-rose-400 to-rose-700',
    'from-violet-400 to-violet-700',
  ];
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

// Per-site feature routes that had no entry point anywhere in the UI.
const siteQuickLinks = [
  { to: 'submissions', label: 'Form submissions', icon: Inbox },
  { to: 'analytics', label: 'Analytics', icon: BarChart3 },
  { to: 'team', label: 'Team', icon: Users },
];

export function Websites() {
  const navigate = useNavigate();
  const websites = useWebsiteStore((s) => s.websites);
  const loading = useWebsiteStore((s) => s.loading);
  const error = useWebsiteStore((s) => s.error);
  const fetchWebsites = useWebsiteStore((s) => s.fetchWebsites);
  const duplicateWebsite = useWebsiteStore((s) => s.duplicateWebsite);
  const deleteWebsite = useWebsiteStore((s) => s.deleteWebsite);
  const publishWebsite = useWebsiteStore((s) => s.publishWebsite);
  const pushToast = useUiStore((s) => s.pushToast);
  const askConfirm = useUiStore((s) => s.askConfirm);

  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');

  const load = () => {
    // Failures land in the store as `error`; caught here to avoid unhandled rejections.
    fetchWebsites().catch(() => {});
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <Reveal className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Websites</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {websites.length} site{websites.length === 1 ? '' : 's'} total.
          </p>
        </div>
        <Button variant="gradient" onClick={() => navigate('/websites/new')}><Plus size={16} /> New site</Button>
      </Reveal>

      {/* Load failure — never render zeros/empty states as if they were real */}
      {error && !loading && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/50 dark:bg-red-950/40"
        >
          <p className="text-sm font-medium text-red-700 dark:text-red-300">Could not load your sites.</p>
          <Button size="sm" variant="outline" onClick={load}>Retry</Button>
        </div>
      )}

      {/* Search + filter */}
      <Reveal delay={80} className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search sites…"
            aria-label="Search sites"
            className="sf-input pl-9"
          />
        </div>
        <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="sm:w-40" aria-label="Filter by status">
          {filters.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </Select>
      </Reveal>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <SkeletonCard key={i} />)}</div>
      ) : filtered.length === 0 && !error ? (
        <EmptyState
          icon={<Globe size={30} />}
          title={websites.length ? 'No matching sites' : 'No sites yet'}
          description={websites.length ? 'Try a different search or filter.' : 'Spin up a blank canvas or pick a template to get going.'}
          action={<Button variant="gradient" onClick={() => navigate('/websites/new')}><Plus size={16} /> Create site</Button>}
        />
      ) : filtered.length === 0 ? null : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((site, i) => {
            const siteId = site._id || site.id;
            const published = site.status === 'published' || site.published;
            return (
              <Reveal key={siteId} delay={i * 60} direction="scale">
                <Card hoverable className="group flex h-full flex-col p-0">
                  {/* Favicon-style header */}
                  <div className={cn('relative flex h-24 items-end overflow-hidden rounded-t-2xl bg-gradient-to-br p-4', siteTint(site.slug || site.name || siteId))}>
                    <div className="pointer-events-none absolute inset-0 opacity-20 sf-canvas-grid" />
                    <p className="relative font-display text-lg font-bold text-white drop-shadow-sm">{site.name || 'Untitled site'}</p>
                    <span className="absolute right-3 top-3">
                      <Badge variant={published ? 'success' : 'warning'} className="shadow-xs">{published ? 'Published' : 'Draft'}</Badge>
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <p className="font-mono text-xs text-slate-400">/{site.slug || 'untitled'}</p>
                    {site.description && <p className="mt-2 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{site.description}</p>}
                    <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-1">
                      <Button size="xs" variant="secondary" onClick={() => navigate(`/websites/${siteId}/edit`)}><Pencil size={12} /> Edit</Button>
                      <Button size="xs" variant="ghost" onClick={() => navigate(`/websites/${siteId}/preview`)}><ExternalLink size={12} /> Preview</Button>
                      <Button size="xs" variant="ghost" onClick={() => navigate(`/websites/${siteId}/settings`)}><Settings size={12} /> Settings</Button>
                      <span className="flex-1" />
                      {siteQuickLinks.map(({ to, label, icon: Icon }) => (
                        <ButtonLink
                          key={to}
                          to={`/websites/${siteId}/${to}`}
                          size="xs"
                          variant="ghost"
                          aria-label={label}
                          title={label}
                        >
                          <Icon size={12} />
                        </ButtonLink>
                      ))}
                      <Button size="xs" variant="ghost" onClick={async () => { try { await duplicateWebsite(siteId); pushToast({ message: 'Duplicated', type: 'success' }); } catch (e) { pushToast({ message: e.message, type: 'error' }); } }} aria-label={`Duplicate ${site.name}`}><Copy size={12} /></Button>
                      <Button size="xs" variant="ghost" onClick={() => askConfirm({ title: 'Delete site?', message: `“${site.name}” will be permanently deleted.`, danger: true, confirmLabel: 'Delete', onConfirm: async () => { try { await deleteWebsite(siteId); pushToast({ message: 'Deleted', type: 'success' }); } catch (e) { pushToast({ message: e.message, type: 'error' }); } } })} aria-label={`Delete ${site.name}`} className="hover:text-red-600"><Trash2 size={12} /></Button>
                    </div>
                    {!published && (
                      <Button size="sm" variant="primary" className="mt-3 w-full" onClick={async () => { try { await publishWebsite(siteId); pushToast({ message: 'Published', type: 'success' }); } catch (e) { pushToast({ message: e.message, type: 'error' }); } }}>
                        <Rocket size={14} /> Publish now
                      </Button>
                    )}
                  </div>
                </Card>
              </Reveal>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Websites;
