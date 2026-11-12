// Platform admin overview: server-wide stats + recent users/sites.
// Route guarded by AdminRoute (client) and requireAdmin (server).
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Globe, Rocket, Eye, FileText, ImageIcon, MessageSquare,
  ArrowRight, ShieldCheck, TrendingUp,
} from 'lucide-react';
import adminService from '../../services/admin.service.js';
import useUiStore from '../../store/uiStore.js';
import Card, { CardTitle } from '../../components/Card.jsx';
import Badge from '../../components/Badge.jsx';
import Reveal from '../../components/Reveal.jsx';
import { SkeletonCard, SkeletonText } from '../../components/Skeleton.jsx';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');

export function AdminDashboard() {
  const pushToast = useUiStore((s) => s.pushToast);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    adminService
      .stats()
      .then((res) => alive && setData(res))
      .catch((e) => alive && pushToast({ message: e.message, type: 'error' }))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [pushToast]);

  const stats = data?.stats;

  const cards = [
    { label: 'Users', value: stats?.users, icon: Users, tint: 'from-primary-500 to-primary-700', to: '/admin/users' },
    { label: 'Sites', value: stats?.websites, icon: Globe, tint: 'from-sky-500 to-sky-700', to: '/admin/websites' },
    { label: 'Published', value: stats?.published, icon: Rocket, tint: 'from-emerald-500 to-emerald-700', to: '/admin/websites?status=published' },
    { label: 'Form submissions', value: stats?.submissions, icon: MessageSquare, tint: 'from-accent-400 to-accent-600', to: '/admin/websites' },
  ];

  const miniStats = [
    { label: 'Drafts', value: stats?.drafts, icon: FileText },
    { label: 'Pages', value: stats?.pages, icon: FileText },
    { label: 'Media files', value: stats?.media, icon: ImageIcon },
    { label: 'Total views', value: stats?.views, icon: Eye },
  ];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <Reveal className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Admin
            <Badge variant="primary"><ShieldCheck size={12} /> Platform</Badge>
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Server-wide overview of every account and site.</p>
        </div>
      </Reveal>

      {/* Primary stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, tint, to }, i) => (
          <Reveal key={label} delay={i * 70}>
            <Card hoverable className="relative overflow-hidden">
              <div className={`pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br ${tint} opacity-10 blur-xl`} />
              <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${tint} text-white shadow-xs`}>
                  <Icon size={19} />
                </div>
                <div className="min-w-0">
                  <p className="font-display text-2xl font-bold leading-none tabular-nums">
                    {loading ? '—' : value ?? 0}
                  </p>
                  <p className="mt-1.5 truncate text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
                </div>
              </div>
              <Link to={to} className="sf-link mt-3 inline-flex items-center gap-1 text-xs">
                Manage <ArrowRight size={12} />
              </Link>
            </Card>
          </Reveal>
        ))}
      </div>

      {/* Secondary metrics + recent users */}
      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Reveal delay={120}>
          <Card className="h-full">
            <CardTitle>Platform totals</CardTitle>
            <dl className="mt-3 space-y-2.5">
              {miniStats.map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center justify-between rounded-lg bg-surface-3/60 px-3 py-2 dark:bg-slate-950/40">
                  <dt className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <Icon size={14} className="text-primary-500" /> {label}
                  </dt>
                  <dd className="font-display text-sm font-bold tabular-nums">{loading ? '—' : value ?? 0}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </Reveal>

        <Reveal delay={200}>
          <Card className="h-full">
            <CardTitle>
              <span className="flex items-center justify-between">
                <span className="flex items-center gap-2"><Users size={15} className="text-primary-500" /> Newest accounts</span>
                <Link to="/admin/users" className="sf-link flex items-center gap-1 text-xs">All users <ArrowRight size={12} /></Link>
              </span>
            </CardTitle>
            {loading ? (
              <SkeletonText lines={4} className="mt-4" />
            ) : (
              <ul className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
                {(data?.recentUsers || []).map((u) => (
                  <li key={u._id} className="flex items-center gap-3 py-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-xs font-bold text-white">
                      {(u.name || u.email || '?')[0].toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{u.name || u.email}</p>
                      <p className="truncate text-2xs text-slate-500 dark:text-slate-400">{u.email}</p>
                    </div>
                    <Badge variant={u.role === 'admin' ? 'primary' : 'default'}>{u.role}</Badge>
                    <span className="hidden w-20 text-right text-2xs text-slate-400 sm:block">{fmtDate(u.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </Reveal>
      </div>

      {/* Recent sites */}
      <Reveal delay={260}>
        <Card>
          <CardTitle>
            <span className="flex items-center justify-between">
              <span className="flex items-center gap-2"><TrendingUp size={15} className="text-primary-500" /> Recently updated sites</span>
              <Link to="/admin/websites" className="sf-link flex items-center gap-1 text-xs">All sites <ArrowRight size={12} /></Link>
            </span>
          </CardTitle>
          {loading ? (
            <div className="mt-3"><SkeletonCard /></div>
          ) : (
            <ul className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
              {(data?.recentWebsites || []).map((w) => (
                <li key={w._id} className="flex flex-wrap items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{w.name}</p>
                    <p className="truncate font-mono text-2xs text-slate-400">/{w.slug}</p>
                  </div>
                  <span className="truncate text-2xs text-slate-500 dark:text-slate-400">{w.owner?.name || w.owner?.email || '—'}</span>
                  <Badge variant={w.status === 'published' ? 'success' : 'warning'}>{w.status}</Badge>
                  <span className="hidden w-20 text-right text-2xs text-slate-400 sm:block">{fmtDate(w.updatedAt)}</span>
                </li>
              ))}
              {!loading && !(data?.recentWebsites || []).length && (
                <li className="py-6 text-center text-sm text-slate-400">No sites on the platform yet.</li>
              )}
            </ul>
          )}
        </Card>
      </Reveal>
    </div>
  );
}

export default AdminDashboard;