// Public site: /site/:slug (and /site/:slug/:pageSlug).
// Published content via GET /api/websites/slug/:slug; analytics via analyticsService.track,
// SEO meta, page routing (?page= or sub-route), 404/loading states.
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import websiteService from '../services/website.service';
import analyticsService from '../services/analytics.service';
import { Renderer } from '../editor/Renderer';
import { Globe } from 'lucide-react';

// Published content via GET /api/websites/slug/:slug (the only public route).
async function fetchPublished(slug) {
  const res = await websiteService.getBySlug(slug);
  if (!res) throw new Error('Site not found');
  return res;
}

function toRoot(content) {
  if (content && content.id) return content;
  if (content && Array.isArray(content.children)) return { id: 'root', type: 'root', props: {}, children: content.children };
  if (Array.isArray(content)) return { id: 'root', type: 'root', props: {}, children: content };
  return { id: 'root', type: 'root', props: {}, children: [] };
}

// Applies SEO meta for the current page and returns a cleanup that restores
// the app's previous title/favicon (the SPA keeps living after /site/ visits).
function applySeo(site, page) {
  const prevTitle = document.title;
  const prevFaviconEl = document.querySelector('link[rel="icon"]');
  const prevFavicon = prevFaviconEl ? prevFaviconEl.getAttribute('href') : null;

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
  // Social cards need og:image + twitter:card, otherwise link previews render
  // bare text even when the site has imagery configured.
  const ogImage = page?.seoOgImage || site?.seo?.ogImage || site?.ogImage || '';
  if (ogImage) {
    setMeta('og:image', ogImage, 'property');
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:image', ogImage);
  }
  if (site?.favicon) {
    let link = document.querySelector('link[rel="icon"]');
    if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
    link.href = site.favicon;
  }
  return () => {
    document.title = prevTitle;
    try {
      const link = document.querySelector('link[rel="icon"]');
      if (link) {
        if (prevFavicon) link.setAttribute('href', prevFavicon);
        else link.remove();
      }
    } catch { /* ignore */ }
  };
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
    if (!site) return undefined;
    const cleanup = applySeo(site, page);
    return cleanup;
  }, [site, page?.slug]); // eslint-disable-line

  // StrictMode dev double-invoke and re-renders must not double-count views:
  // one track per websiteId+page per visit to this component.
  const trackedRef = useRef(null);
  useEffect(() => {
    if (!websiteId || !page) return;
    const key = `${websiteId}:${page._id || page.id}`;
    if (trackedRef.current === key) return;
    trackedRef.current = key;
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
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-2.5 text-sm text-slate-500">
          <span className="h-2 w-2 animate-pulse-soft rounded-full bg-primary-500" />
          Loading site…
        </div>
      </div>
    );
  }
  if (status === '404' || (status === 'ready' && !page && !site?.content)) {
    return (
      <div className="sf-hero-gradient flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-card">
          <Globe size={24} className="text-primary-500" />
        </div>
        <div className="font-display text-5xl font-bold tracking-tight text-gradient">404</div>
        <p className="font-medium text-slate-600">This site or page could not be found.</p>
        <Link to="/" className="sf-link text-sm">Go home</Link>
      </div>
    );
  }
  if (status === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm font-medium text-red-600">Something went wrong loading this site.</p>
        <button onClick={() => window.location.reload()} className="sf-link text-sm">Try again</button>
      </div>
    );
  }

  const raw = page?.content || site?.content || { id: 'root', type: 'root', props: {}, children: [] };
  const tree = toRoot(raw);
  const theme = site?.theme || {};

  return (
    <div className="min-h-screen" style={{ fontSize: theme.baseSize || 16, background: 'var(--sf-background, #ffffff)', color: 'var(--sf-text, #111827)' }}>
      <Renderer tree={tree} mode="live" theme={theme} website={site} pages={pages} navigate={goPage} />
    </div>
  );
}
