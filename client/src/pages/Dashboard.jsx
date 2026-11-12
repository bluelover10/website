import { useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Globe, Rocket, FileText, Eye, Plus, Pencil, ExternalLink, Copy, Trash2 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from 'recharts';
import useWebsiteStore from '../store/websiteStore.js';
import useUiStore from '../store/uiStore.js';
import Card, { CardTitle } from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import Badge from '../components/Badge.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { SkeletonCard } from '../components/Skeleton.jsx';

function idOf(w) {
  return w._id || w.id;
}

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
    const pages = websites.reduce((n, w) => n + (w.pagesCount || w.pages?.length || 0), 0);
    const views = websites.reduce((n, w) => n + (w.views || 0), 0);
    return { total, published, drafts, pages, views };
  }, [websites]);

  const chartData = useMemo(() => {
    if (!websites.length) return [{ name: 'Mon', views: 0 }, { name: 'Tue', views: 0 }, { name: 'Wed', views: 0 }, { name: 'Thu', views: 0 }, { name: 'Fri', views: 0 }];
    return websites.slice(0, 7).map((w, i) => ({ name: (w.name || `Site ${i + 1}`).slice(0, 8), views: w.views || Math.floor(Math.random() * 50) }));
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
    { label: 'Total sites', value: stats.total, icon: Globe },
    { label: 'Published', value: stats.published, icon: Rocket },
    { label: 'Drafts', value: stats.drafts, icon: FileText },
    { label: 'Total views', value: stats.views, icon: Eye },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-slate-500">Overview of your sites and activity.</p>
        </div>
        <Button onClick={() => navigate('/websites/new')}>
          <Plus size={16} /> New site
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30">
                <Icon size={18} />
              </div>
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-slate-500">{label} · {stats.pages} pages</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Traffic (views per site)</CardTitle>
          <div className="mt-2 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="views" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardTitle>Quick actions</CardTitle>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => navigate('/websites/new')}>Create site</Button>
            <Button variant="secondary" onClick={() => navigate('/templates')}>Browse templates</Button>
            <Button variant="secondary" onClick={() => navigate('/media')}>Media library</Button>
            <Button variant="secondary" onClick={() => navigate('/websites')}>All sites</Button>
          </div>
          <p className="mt-3 text-xs text-slate-500">Tip: open a site in the editor to drag blocks, then publish.</p>
        </Card>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Recent sites</h2>
          <Link to="/websites" className="text-sm text-primary-600">View all</Link>
        </div>
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : websites.length === 0 ? (
          <EmptyState
            icon={<Globe size={32} />}
            title="No sites yet"
            description="Create your first website from scratch or from a template."
            action={<Button onClick={() => navigate('/websites/new')}><Plus size={16} /> Create site</Button>}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {websites.slice(0, 6).map((site) => {
              const siteId = idOf(site);
              const published = site.status === 'published' || site.published;
              return (
                <Card key={siteId}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{site.name}</p>
                      <p className="text-xs text-slate-500">/{site.slug || 'untitled'}</p>
                    </div>
                    <Badge variant={published ? 'success' : 'warning'}>{published ? 'Published' : 'Draft'}</Badge>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    <Button size="sm" variant="secondary" onClick={() => navigate(`/websites/${siteId}/edit`)}><Pencil size={14} /> Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/websites/${siteId}/preview`)}><ExternalLink size={14} /> Preview</Button>
                    <Button size="sm" variant="ghost" onClick={() => handlePublish(site)}>Publish</Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDuplicate(site)}><Copy size={14} /></Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(site)}><Trash2 size={14} /></Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
