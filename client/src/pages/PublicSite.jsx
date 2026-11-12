// Public site: /site/:slug (and /site/:slug/:pageSlug).
// Published content via websiteService.getBySlug (fallback: /api/publish + /api/websites/published),
// analytics via analyticsService.track, SEO meta, page routing (?page= or sub-route), 404/loading states.
import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import websiteService from '../services/website.service';
import analyticsService from '../services/analytics.service';
import { Renderer } from '../editor/Renderer';

async function fetchPublished(slug) {
  try {
    const res = await websiteService.getBySlug(slug);
    if (res) return res;
  } catch { /* fall through */ }
  const tries = [`/api/publish/${slug}`, `/api/websites/published/${slug}`, `/api/sites/${slug}`];
  let lastErr = null;
  for (const t of tries) {
    try {
      const res = await fetch(t);
      if (!res.ok) { lastErr = new Error(`HTTP ${res.status}`); continue; }
      const data = await res.json();
      return data?.data ?? data;
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error('Site not found');
}

function toRoot(content) {
  if (content && content.id) return content;
  if (content && Array.isArray(content.children)) return { id: 'root', type: 'root', props: {}, children: content.children };
  if (Array.isArray(content)) return { id: 'root', type: 'root', props: {}, children: content };
  return { id: 'root', type: 'root', props: {}, children: [] };
}

function applySeo(site, page) {
  const title = page?.seoTitle || page?.title || site?.name || 'SiteForge site';
  document.title = title;
  const setMeta = (name, content, attr = 'name') => {
    if (!content) return;
    let el = document.querySelector(`meta[${attr}="${name}"]`);
    if (!el) { el = document.createElement('meta'); el.setAttribute(attr, name); document.head.appendChild(el); }
    el.setAttribute('content', content);
  };
  setMeta('description', page?.seoDescription || site?.description || '');
  setMeta('og:title', title, 'property');
  setMeta('og:description', page?.seoDescription || site?.description || '', 'property');
  if (site?.favicon) {
    let link = document.querySelector('link[rel="icon"]');
    if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
    link.href = site.favicon;
  }
}

export default function PublicSite() {
  const { slug, pageSlug: pageSlugParam } = useParams();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const [site, setSite] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | 404 | error

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStatus('loading');
      try {
        const data = await fetchPublished(slug);
        if (cancelled) return;
        const website = data?.website || data?.site || data;
        if (!website) { setStatus('404'); return; }
        setSite({ ...website, pages: data?.pages || website?.pages || [] });
        setStatus('ready');
      } catch (e) {
        if (!cancelled) setStatus(e?.status === 404 || /not found/i.test(e.message || '') ? '404' : 'error');
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  const pages = site?.pages || [];
  const pageSlug = pageSlugParam || search.get('page') || pages.find((p) => p.isHome)?.slug || pages[0]?.slug;
  const page = pages.find((p) => p.slug === pageSlug) || pages[0];
  const websiteId = site?._id || site?.id;

  useEffect(() => {
    if (site) applySeo(site, page);
  }, [site, page?.slug]); // eslint-disable-line

  useEffect(() => {
    if (!websiteId || !page) return;
    const payload = { websiteId, pageId: page._id || page.id, slug: page.slug, path: window.location.pathname + window.location.search, referrer: document.referrer, type: 'view' };
    try {
      const r = analyticsService.track(payload);
      if (r && typeof r.catch === 'function') r.catch(() => {});
    } catch {
      fetch('/api/analytics/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).catch(() => {});
    }
  }, [websiteId, page?._id || page?.id]); // eslint-disable-line

  const goPage = (targetSlug) => {
    const pg = pages.find((p) => p.slug === targetSlug || p.title === targetSlug);
    const s = pg ? pg.slug : targetSlug;
    if (pageSlugParam !== undefined) navigate(`/site/${slug}/${s}`);
    else navigate(`/site/${slug}?page=${s}`);
    window.scrollTo(0, 0);
  };

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center text-sm text-slate-500"><span className="animate-pulse">Loading site…</span></div>;
  }
  if (status === '404' || (status === 'ready' && !page && !site?.content)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-2 text-center px-6">
        <div className="text-5xl font-extrabold text-slate-200">404</div>
        <p className="text-slate-600 font-medium">This site or page could not be found.</p>
        <Link to="/" className="text-sm text-indigo-600 hover:underline">Go home</Link>
      </div>
    );
  }
  if (status === 'error') {
    return <div className="min-h-screen flex items-center justify-center text-sm text-red-600">Something went wrong loading this site.</div>;
  }

  const raw = page?.content || site?.content || { id: 'root', type: 'root', props: {}, children: [] };
  const tree = toRoot(raw);
  const theme = site?.theme || {};

  return (
    <div className="min-h-screen bg-white" style={{ fontSize: theme.baseSize || 16 }}>
      <Renderer tree={tree} mode="live" theme={theme} website={site} pages={pages} navigate={goPage} />
    </div>
  );
}
