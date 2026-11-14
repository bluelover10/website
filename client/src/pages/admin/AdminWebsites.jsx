// Admin: every site on the platform — search, status filter, force actions.
// Unpublish takes a live site offline; delete is a full server-side cleanup.
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Globe, Search, ChevronLeft, ChevronRight, ShieldCheck,
  ExternalLink, EyeOff, Trash2, Rocket,
} from 'lucide-react';
import adminService from '../../services/admin.service.js';
import useUiStore from '../../store/uiStore.js';
import Card from '../../components/Card.jsx';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Reveal from '../../components/Reveal.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { SkeletonText } from '../../components/Skeleton.jsx';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');

export function AdminWebsites() {
  const pushToast = useUiStore((s) => s.pushToast);
  const askConfirm = useUiStore((s) => s.askConfirm);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);

  const fetchSites = useCallback(
    async (opts = {}) => {
      setLoading(true);
      setError(null);
      try {
        const params = { page: opts.page ?? 1, limit: 20 };
        if ((opts.search ?? search).trim()) params.search = (opts.search ?? search).trim();
        if (opts.status ?? status) params.status = opts.status ?? status;
        const res = await adminService.websites(params);
        setData(res);
      } catch (e) {
        setError(e);
        pushToast({ message: e.message, type: 'error' });
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    fetchSites({ page: 1, search, status });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const onSearchChange = (value) => {
    setSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSites({ search: value, page: 1 }), 300);
  };

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const unpublish = (site) => {
    askConfirm({
      title: 'Unpublish site?',
      message: `“${site.name}” will go offline immediately. Visitors will see a 404 until it is published again.`,
      confirmLabel: 'Unpublish',
      danger: true,
      onConfirm: async () => {
        try {
          await adminService.unpublishWebsite(site._id);
          pushToast({ message: 'Site unpublished', type: 'success' });
          fetchSites({ search, status, page: data?.page ?? 1 });
        } catch (e) {
          pushToast({ message: e.message, type: 'error' });
        }
      },
    });
  };

  const remove = (site) => {
    askConfirm({
      title: `Delete “${site.name}”?`,
      message: 'The site, its pages, media, versions and submissions will be permanently deleted. This cannot be undone.',
      danger: true,
      confirmLabel: 'Delete forever',
      onConfirm: async () => {
        try {
          await adminService.removeWebsite(site._id);
          pushToast({ message: 'Site deleted', type: 'success' });
          fetchSites({ search, status, page: data?.page ?? 1 });
        } catch (e) {
          pushToast({ message: e.message, type: 'error' });
        }
      },
    });
  };

  const sites = data?.websites || [];
  const total = data?.total ?? 0;
  const pageCount = data?.pages ?? 1;

  return (
    <div className="space-y-6">
      <Reveal>
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            All sites
            <Badge variant="primary"><ShieldCheck size={12} /> Admin</Badge>
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {loading ? 'Loading…' : error ? 'Could not load sites.' : `${total} site${total === 1 ? '' : 's'} across every account.`}
          </p>
        </div>
      </Reveal>

      <Reveal delay={80}>
        <Card>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search site name…"
                className="sf-input pl-9"
                aria-label="Search sites"
              />
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="sf-input w-36 py-2"
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          {/* Rows */}
          {loading && !data ? (
            <SkeletonText lines={5} className="mt-4" />
          ) : error ? (
            <div
              role="alert"
              className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
            >
              <span>{error.message}</span>
              <Button size="sm" variant="outline" onClick={() => fetchSites({ search, status, page: data?.page ?? 1 })}>
                Retry
              </Button>
            </div>
          ) : sites.length === 0 ? (
            <EmptyState
              icon={<Globe size={28} />}
              title="No sites found"
              description="Try a different search term or status filter."
            />
          ) : (
            <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
              {sites.map((w, i) => {
                const published = w.status === 'published';
                return (
                  <li
                    key={w._id}
                    className="flex flex-wrap items-center gap-3 py-3 animate-fade-in"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500/15 to-primary-500/5 text-primary-600 ring-1 ring-primary-500/10 dark:text-primary-300">
                      <Globe size={17} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{w.name}</p>
                      <p className="truncate font-mono text-2xs text-slate-400">/{w.slug}</p>
                    </div>
                    <div className="hidden min-w-0 sm:block">
                      <p className="text-2xs font-medium text-slate-400">Owner</p>
                      <p className="truncate text-xs text-slate-600 dark:text-slate-300">
                        {w.owner?.name || w.owner?.email || '—'}
                      </p>
                    </div>
                    <span className="hidden text-xs text-slate-500 dark:text-slate-400 lg:block">
                      {w.pageCount} page{w.pageCount === 1 ? '' : 's'} · {w.viewsCount ?? 0} views
                    </span>
                    <span className="hidden w-24 text-right text-2xs text-slate-400 md:block">{fmtDate(w.updatedAt)}</span>
                    <Badge variant={published ? 'success' : 'warning'}>
                      {published ? <Rocket size={11} /> : null} {w.status}
                    </Badge>
                    <div className="flex items-center gap-1.5">
                      {published && (
                        <Link
                          to={`/site/${w.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-primary-600 dark:hover:bg-slate-800"
                          aria-label={`View ${w.name}`}
                          title="View live site"
                        >
                          <ExternalLink size={15} />
                        </Link>
                      )}
                      {published && (
                        <Button size="xs" variant="ghost" onClick={() => unpublish(w)} className="hover:text-accent-600">
                          <EyeOff size={12} /> Unpublish
                        </Button>
                      )}
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => remove(w)}
                        aria-label={`Delete ${w.name}`}
                        className="hover:text-red-600"
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Pagination */}
          {pageCount > 1 && (
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Page {data?.page ?? 1} of {pageCount}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={(data?.page ?? 1) <= 1 || loading}
                  onClick={() => fetchSites({ page: (data?.page ?? 1) - 1, search, status })}
                >
                  <ChevronLeft size={14} /> Prev
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={(data?.page ?? 1) >= pageCount || loading}
                  onClick={() => fetchSites({ page: (data?.page ?? 1) + 1, search, status })}
                >
                  Next <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </Reveal>
    </div>
  );
}

export default AdminWebsites;