// Analytics dashboard: summary cards + recharts charts from /api/analytics/:websiteId/summary.
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Eye, CalendarDays, TrendingUp, FileText, ArrowLeft, BarChart3, ListOrdered } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import analyticsService from '../services/analytics.service';
import useUiStore from '../store/uiStore.js';
import Card, { CardTitle } from '../components/Card.jsx';
import Badge from '../components/Badge.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Reveal from '../components/Reveal.jsx';
import { SkeletonCard } from '../components/Skeleton.jsx';

function StatCard({ icon: Icon, label, value, sub, delay }) {
  return (
    <Reveal delay={delay}>
      <Card hoverable className="h-full">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300">
            <Icon size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-2xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
            <p className="font-display text-2xl font-bold leading-tight tabular-nums">{value}</p>
            {sub && <p className="truncate text-2xs text-slate-500 dark:text-slate-400">{sub}</p>}
          </div>
        </div>
      </Card>
    </Reveal>
  );
}

export default function Analytics() {
  const { websiteId: websiteIdParam, id: idParam } = useParams();
  const websiteId = websiteIdParam || idParam;
  const dark = useUiStore((s) => s.darkMode);
  // Recharts tooltips render as plain divs — theme them manually or the
  // default white panel is unreadable against the dark background.
  const tooltipStyle = {
    borderRadius: '0.75rem',
    border: dark ? '1px solid #312e5f' : '1px solid rgba(91,79,214,0.15)',
    backgroundColor: dark ? '#1b1830' : '#ffffff',
    color: dark ? '#eceaf6' : '#14121f',
    boxShadow: '0 8px 24px -8px rgba(28,23,71,0.25)',
    fontSize: '12px',
  };
  const tooltipItemStyle = { color: dark ? '#eceaf6' : '#14121f' };
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading');
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStatus('loading');
      try {
        // GET /api/analytics/:websiteId/summary
        const summary = await analyticsService.summary(websiteId);
        if (!cancelled) { setData(summary); setStatus('ready'); }
      } catch (e) {
        if (!cancelled) { setErr(e.message); setStatus('error'); }
      }
    })();
    return () => { cancelled = true; };
  }, [websiteId]);

  // Summary shape: { views, uniqueVisitors, today, week, month,
  //                  byPage: [{ pagePath, views }], byDay: [{ date, views }] }
  const viewsByDay = data?.byDay || [];
  const viewsByPage = data?.byPage || [];
  const today = data?.today ?? 0;
  const week = data?.week ?? 0;
  const month = data?.month ?? 0;
  const total = data?.views ?? viewsByDay.reduce((a, d) => a + (d.views || 0), 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <Reveal className="flex flex-wrap items-center gap-3">
        <Link to={`/websites/${websiteId}/edit`} className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800" aria-label="Back to editor">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Analytics</h1>
          <p className="mt-0.5 font-mono text-2xs text-slate-400">site {websiteId?.slice(0, 8)}</p>
        </div>
      </Reveal>

      {status === 'loading' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {status === 'error' && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {err}
        </div>
      )}

      {status === 'ready' && (
        <>
          {/* Window stats */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard icon={Eye} label="Today" value={today} delay={0} />
            <StatCard icon={CalendarDays} label="Last 7 days" value={week} delay={70} />
            <StatCard icon={TrendingUp} label="Last 30 days" value={month} delay={140} />
            <StatCard icon={FileText} label="Total views" value={total} sub={`${viewsByPage.length} page${viewsByPage.length === 1 ? '' : 's'} tracked`} delay={210} />
          </div>

          {/* Views over time */}
          <Reveal delay={160}>
            <Card>
              <CardTitle>
                <span className="flex items-center gap-2">
                  <BarChart3 size={16} className="text-primary-500" /> Views over time
                </span>
              </CardTitle>
              {viewsByDay.length ? (
                <div className="mt-3 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={viewsByDay} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                      <defs>
                        <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#5b4fd6" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#5b4fd6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(91,79,214,0.12)" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9d99b5' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#9d99b5' }} allowDecimals={false} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} />
                      <Line type="monotone" dataKey="views" stroke="#5b4fd6" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} fill="url(#lineFill)" animationDuration={800} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState
                  icon={<TrendingUp size={28} />}
                  title="No traffic yet"
                  description="Publish your site and share the link to start collecting view data."
                  className="mt-3"
                />
              )}
            </Card>
          </Reveal>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Views by page chart */}
            <Reveal delay={200}>
              <Card className="h-full">
                <CardTitle>Views by page</CardTitle>
                {viewsByPage.length ? (
                  <div className="mt-3 h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={viewsByPage} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(91,79,214,0.12)" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11, fill: '#9d99b5' }} allowDecimals={false} tickLine={false} axisLine={false} />
                        <YAxis type="category" dataKey="pagePath" tick={{ fontSize: 11, fill: '#9d99b5' }} width={110} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} />
                        <Bar dataKey="views" fill="#5b4fd6" radius={[0, 6, 6, 0]} animationDuration={800} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyState icon={<BarChart3 size={26} />} title="No page data yet" description="Per-page views appear once visitors browse your site." className="mt-3" />
                )}
              </Card>
            </Reveal>

            {/* Popular pages list */}
            <Reveal delay={240} direction="right">
              <Card className="h-full">
                <CardTitle>
                  <span className="flex items-center gap-2">
                    <ListOrdered size={16} className="text-primary-500" /> Popular pages
                  </span>
                </CardTitle>
                <div className="mt-2 flex flex-col">
                  {viewsByPage.slice(0, 8).map((p, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 border-b border-slate-100 py-2.5 text-sm last:border-0 dark:border-slate-800">
                      <span className="flex min-w-0 items-center gap-2">
                        <Badge variant="primary" className="shrink-0 tabular-nums">#{i + 1}</Badge>
                        <span className="truncate font-mono text-xs text-slate-600 dark:text-slate-300">/{p.pagePath || p.slug || '—'}</span>
                      </span>
                      <span className="shrink-0 text-xs font-bold tabular-nums">{p.views ?? 0} views</span>
                    </div>
                  ))}
                  {!viewsByPage.length && <p className="py-6 text-center text-xs text-slate-400">Nothing here yet.</p>}
                </div>
              </Card>
            </Reveal>
          </div>
        </>
      )}
    </div>
  );
}
