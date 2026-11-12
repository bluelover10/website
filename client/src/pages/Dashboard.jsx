import { useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Globe, Rocket, FileText, Eye, Plus, Pencil, ExternalLink, Copy, Trash2, LayoutTemplate, Image as ImageIcon, TrendingUp, ArrowRight } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from 'recharts';
import useWebsiteStore from '../store/websiteStore.js';
import useUiStore from '../store/uiStore.js';
import Card, { CardTitle } from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import Badge from '../components/Badge.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Reveal from '../components/Reveal.jsx';
import { SkeletonCard } from '../components/Skeleton.jsx';

function idOf(w) {
  return w._id || w.id;
}

const chartTooltipStyle = {
  borderRadius: '0.75rem',
  border: '1px solid rgba(91,79,214,0.15)',
  boxShadow: '0 8px 24px -8px rgba(28,23,71,0.25)',
  fontSize: '12px',
};

export function Dashboard() {
  const navigate = useNavigate();
  const websites = useWebsiteStore((s) => s.websites);
  const loading = useWebsiteStore((s) => s.loading);
  const fetchWebsites = useWebsiteStore((s) => s.fetchWebsites);
  const duplicateWebsite = useWebsiteStore((s) => s.duplicateWebsite);
  const deleteWebsite = useWebsiteStore((s) => s.deleteWebsite);
  const publishWebsite = useWebsiteStore((s) => s.publishWebsite);
  const pushToast = useUiStore((s) => s.pushToast);
  const askConfirm = useUiStore((s) => s.askConfirm);

  useEffect(() => {
    fetchWebsites().catch(() => {});
  }, [fetchWebsites]);

  const stats = useMemo(() => {
    const total = websites.length;
    const published = websites.filter((w) => w.status === 'published' || w.published).length;
    const drafts = total - published;
    // Server listWebsites returns pageCount (not pagesCount) and viewsCount.
    const pages = websites.reduce((n, w) => n + (w.pageCount ?? w.pagesCount ?? w.pages?.length ?? 0), 0);
    const views = websites.reduce((n, w) => n + (w.viewsCount ?? w.views ?? 0), 0);
    return { total, published, drafts, pages, views };
  }, [websites]);

  // Real data only — never fabricate numbers. Sorted so the chart reads naturally.
  const chartData = useMemo(() => {
    if (!websites.length) return [];
    return websites
      .slice(0, 7)
      .map((w) => ({ name: (w.name || 'Site').slice(0, 10), views: w.viewsCount ?? w.views ?? 0 }));
  }, [websites]);

  const handleDuplicate = async (site) => {
    try {
      await duplicateWebsite(idOf(site));
      pushToast({ message: 'Site duplicated', type: 'success' });
    } catch (e) {
      pushToast({ message: e.message, type: 'error' });
    }
  };

  const handleDelete = (site) => {
    askConfirm({
      title: 'Delete site?',
      message: `“${site.name}” will be permanently deleted. This cannot be undone.`,
      danger: true,
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          await deleteWebsite(idOf(site));
          pushToast({ message: 'Site deleted', type: 'success' });
        } catch (e) {
          pushToast({ message: e.message, type: 'error' });
        }
      },
    });
  };

  const handlePublish = async (site) => {
    try {
      await publishWebsite(idOf(site));
      pushToast({ message: 'Site published', type: 'success' });
    } catch (e) {
      pushToast({ message: e.message, type: 'error' });
    }
  };

  const cards = [
    { label: 'Total sites', value: stats.total, icon: Globe, tint: 'from-primary-500 to-primary-700' },
    { label: 'Published', value: stats.published, icon: Rocket, tint: 'from-emerald-500 to-emerald-700' },
    { label: 'Drafts', value: stats.drafts, icon: FileText, tint: 'from-accent-400 to-accent-600' },
    { label: 'Total views', value: stats.views, icon: Eye, tint: 'from-sky-500 to-sky-700' },
  ];

  const quickActions = [
    { label: 'Create site', icon: Plus, onClick: () => navigate('/websites/new') },
    { label: 'Browse templates', icon: LayoutTemplate, onClick: () => navigate('/templates') },
    { label: 'Media library', icon: ImageIcon, onClick: () => navigate('/media') },
    { label: 'All sites', icon: Globe, onClick: () => navigate('/websites') },
  ];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <Reveal className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Overview of your sites and activity.</p>
        </div>
        <Button variant="gradient" onClick={() => navigate('/websites/new')}>
          <Plus size={16} /> New site
        </Button>
      </Reveal>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, tint }, i) => (
          <Reveal key={label} delay={i * 70}>
            <Card hoverable className="relative overflow-hidden">
              <div className={`pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br ${tint} opacity-10 blur-xl`} />
              <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${tint} text-white shadow-xs`}>
                  <Icon size={19} />
                </div>
                <div className="min-w-0">
                  <p className="font-display text-2xl font-bold leading-none tabular-nums">{value}</p>
                  <p className="mt-1.5 truncate text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
                </div>
              </div>
            </Card>
          </Reveal>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        {/* Traffic chart */}
        <Reveal delay={120}>
          <Card className="h-full">
            <CardTitle>
              <span className="flex items-center gap-2">
                <TrendingUp size={16} className="text-primary-500" /> Traffic (views per site)
              </span>
            </CardTitle>
            <div className="mt-3 h-52">
              {chartData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="dashViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#5b4fd6" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#5b4fd6" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#9d99b5' }} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Area type="monotone" dataKey="views" stroke="#5b4fd6" strokeWidth={2.5} fill="url(#dashViews)" animationDuration={800} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                  <TrendingUp size={28} className="text-slate-300 dark:text-slate-600" />
                  <p className="text-sm text-slate-400">Publish a site to start collecting views.</p>
                </div>
              )}
            </div>
            <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
              {stats.pages} page{stats.pages === 1 ? '' : 's'} across {stats.total} site{stats.total === 1 ? '' : 's'} · {stats.views} total views
            </p>
          </Card>
        </Reveal>

        {/* Quick actions */}
        <Reveal delay={200} direction="right">
          <Card className="flex h-full flex-col">
            <CardTitle>Quick actions</CardTitle>
            <div className="mt-3 grid flex-1 grid-cols-2 content-start gap-2">
              {quickActions.map(({ label, icon: Icon, onClick }) => (
                <Button key={label} variant="outline" onClick={onClick} className="justify-start">
                  <Icon size={15} /> {label}
                </Button>
              ))}
            </div>
            <p className="mt-3 rounded-xl bg-surface-3/70 p-3 text-xs leading-relaxed text-slate-500 dark:bg-slate-950/40 dark:text-slate-400">
              <span className="font-semibold text-primary-600 dark:text-primary-300">Tip:</span> open a site in the editor to drag blocks onto the canvas, then hit publish to share it live.
            </p>
          </Card>
        </Reveal>
      </div>

      {/* Recent sites */}
      <Reveal delay={260}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Recent sites</h2>
          <Link to="/websites" className="sf-link flex items-center gap-1 text-sm">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : websites.length === 0 ? (
          <EmptyState
            icon={<Globe size={30} />}
            title="No sites yet"
            description="Create your first website from scratch or start from a polished template."
            action={<Button variant="gradient" onClick={() => navigate('/websites/new')}><Plus size={16} /> Create site</Button>}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {websites.slice(0, 6).map((site, i) => {
              const siteId = idOf(site);
              const published = site.status === 'published' || site.published;
              return (
                <Reveal key={siteId} delay={i * 60} direction="scale">
                  <Card hoverable className="group h-full">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link to={`/websites/${siteId}/edit`} className="block truncate font-display text-base font-bold tracking-tight transition-colors group-hover:text-primary-600 dark:group-hover:text-primary-300">
                          {site.name || 'Untitled site'}
                        </Link>
                        <p className="mt-0.5 truncate font-mono text-xs text-slate-400">/{site.slug || 'untitled'}</p>
                      </div>
                      <Badge variant={published ? 'success' : 'warning'}>{published ? 'Published' : 'Draft'}</Badge>
                    </div>
                    {site.description && <p className="mt-2 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{site.description}</p>}
                    <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3 dark:border-slate-800">
                      <Button size="xs" variant="secondary" onClick={() => navigate(`/websites/${siteId}/edit`)}><Pencil size={12} /> Edit</Button>
                      <Button size="xs" variant="ghost" onClick={() => navigate(`/websites/${siteId}/preview`)}><ExternalLink size={12} /> Preview</Button>
                      {!published && (
                        <Button size="xs" variant="ghost" onClick={() => handlePublish(site)}>Publish</Button>
                      )}
                      <span className="flex-1" />
                      <Button size="xs" variant="ghost" onClick={() => handleDuplicate(site)} aria-label={`Duplicate ${site.name}`}><Copy size={12} /></Button>
                      <Button size="xs" variant="ghost" onClick={() => handleDelete(site)} aria-label={`Delete ${site.name}`} className="hover:text-red-600"><Trash2 size={12} /></Button>
                    </div>
                  </Card>
                </Reveal>
              );
            })}
          </div>
        )}
      </Reveal>
    </div>
  );
}

export default Dashboard;
