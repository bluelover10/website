// Analytics dashboard: summary cards + recharts charts from /api/analytics/:websiteId/summary.
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Eye, CalendarDays, TrendingUp, FileText, ArrowLeft } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import analyticsService from '../services/analytics.service';

function Card({ icon: Icon, label, value, sub }) {
  return (
    <div className="bg-white border rounded-xl p-4 flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center"><Icon size={17} /></div>
      <div>
        <div className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">{label}</div>
        <div className="text-2xl font-extrabold">{value}</div>
        {sub && <div className="text-[11px] text-slate-500">{sub}</div>}
      </div>
    </div>
  );
}

export default function Analytics() {
  const { websiteId: websiteIdParam, id: idParam } = useParams();
  const websiteId = websiteIdParam || idParam;
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading');
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStatus('loading');
      try {
        // Primary: shell analyticsService GET /analytics/website/:websiteId
        let data = null;
        try {
          data = await analyticsService.byWebsite(websiteId);
        } catch {
          // Fallback: summary-style endpoints
          const token = (() => { try { return localStorage.getItem('siteforge_token') || localStorage.getItem('sf_token') || localStorage.getItem('token'); } catch { return null; } })();
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          let res = await fetch(`/api/analytics/website/${websiteId}`, { headers });
          if (!res.ok) res = await fetch(`/api/analytics/${websiteId}/summary`, { headers });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = await res.json();
          data = json?.data ?? json;
        }
        if (!cancelled) { setData(data); setStatus('ready'); }
      } catch (e) {
        if (!cancelled) { setErr(e.message); setStatus('error'); }
      }
    })();
    return () => { cancelled = true; };
  }, [websiteId]);

  const viewsByDay = data?.viewsByDay || data?.daily || [];
  const viewsByPage = data?.viewsByPage || data?.popularPages || [];
  const today = data?.today ?? data?.summary?.today ?? 0;
  const week = data?.week ?? data?.summary?.week ?? data?.last7Days ?? 0;
  const month = data?.month ?? data?.summary?.month ?? data?.last30Days ?? 0;
  const total = data?.totalViews ?? data?.total ?? viewsByDay.reduce((a, d) => a + (d.views || d.count || 0), 0);

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-4">
          <Link to={`/websites/${websiteId}/edit`} className="p-1.5 rounded hover:bg-white text-slate-500"><ArrowLeft size={16} /></Link>
          <h1 className="text-lg font-bold">Analytics</h1>
          <span className="font-mono text-[11px] text-slate-400">{websiteId?.slice(0, 8)}</span>
        </div>

        {status === 'loading' && <div className="text-sm text-slate-500 animate-pulse">Loading analytics…</div>}
        {status === 'error' && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{err}</div>}

        {status === 'ready' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <Card icon={Eye} label="Today" value={today} />
              <Card icon={CalendarDays} label="Last 7 days" value={week} />
              <Card icon={TrendingUp} label="Last 30 days" value={month} />
              <Card icon={FileText} label="Total views" value={total} sub={`${viewsByPage.length} pages tracked`} />
            </div>

            <div className="bg-white border rounded-xl p-4 mb-3">
              <div className="text-sm font-semibold mb-2">Views over time</div>
              {viewsByDay.length ? (
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={viewsByDay}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="views" stroke="#4f46e5" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : <div className="text-xs text-slate-400 py-8 text-center">No traffic yet — publish and share your link.</div>}
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div className="bg-white border rounded-xl p-4">
                <div className="text-sm font-semibold mb-2">Views by page</div>
                {viewsByPage.length ? (
                  <div style={{ height: 240 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={viewsByPage} layout="vertical">
                        <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                        <YAxis type="category" dataKey="slug" tick={{ fontSize: 11 }} width={110} />
                        <Tooltip />
                        <Bar dataKey="views" fill="#0ea5e9" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : <div className="text-xs text-slate-400 py-8 text-center">No page data yet.</div>}
              </div>
              <div className="bg-white border rounded-xl p-4">
                <div className="text-sm font-semibold mb-2">Popular pages</div>
                <div className="flex flex-col">
                  {(viewsByPage || []).slice(0, 8).map((p, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b last:border-0 text-sm">
                      <span className="font-mono text-xs truncate">/{p.slug || p.title}</span>
                      <span className="text-xs font-bold">{p.views ?? p.count ?? 0} views</span>
                    </div>
                  ))}
                  {!viewsByPage.length && <div className="text-xs text-slate-400">Nothing here yet.</div>}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
