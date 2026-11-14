// Marketing sections: Navbar, Hero, Card, FeatureGrid, Testimonials, Pricing, Footer, SocialLinks
import React, { useState } from 'react';
import { Twitter, Github, Linkedin, Facebook, Instagram, Youtube, Share2, Menu, X } from 'lucide-react';

function px(v) { return typeof v === 'number' ? `${v}px` : v; }

// Theme-aware style constants. Hardcoded light values (white cards, slate text)
// break dark-themed published sites, so muted surfaces/text derive from the
// site's own --sf-text/--sf-background via color-mix. --sf-* vars are always
// set by the Renderer wrapper, and unsupported browsers simply ignore these
// declarations (text falls back to the inherited color).
const MUTED = 'color-mix(in srgb, var(--sf-text) 60%, transparent)';
const CARD_BG = 'color-mix(in srgb, var(--sf-text) 4%, transparent)';
const CARD_BORDER = '1px solid color-mix(in srgb, var(--sf-text) 10%, transparent)';
const PAGE_BG = 'var(--sf-background, #ffffff)';
const TEXT = 'var(--sf-text, #111827)';

const NET_ICONS = { twitter: Twitter, x: Twitter, github: Github, linkedin: Linkedin, facebook: Facebook, instagram: Instagram, youtube: Youtube };

// ---------------------------------------------------------------------------
// Internal page navigation, shared by every anchor emitter below (and by the
// Button/Link primitives in Interactive.jsx / Typography.jsx).
//
// `navigate` is the handler the host page provides: both Preview.jsx and
// PublicSite.jsx pass a function that takes a page SLUG (PublicSite.goPage
// builds the /site/:slug[/:pageSlug] path itself), so we resolve the link
// target against `pages` — case-insensitive on slug or title, mirroring
// PublicSite's lookup — and hand over the canonical page slug. External or
// unknown targets return null so the caller keeps a normal anchor and the
// legacy `?page=` search-param fallback in PublicSite still works.
// ---------------------------------------------------------------------------
function matchPage(pages, ref) {
  const list = Array.isArray(pages) ? pages : [];
  if (!ref) return null;
  const r = String(ref).trim().toLowerCase().replace(/^\/+|\/+$/g, '');
  return list.find((pg) => String(pg.slug || '').toLowerCase() === r || String(pg.title || '').toLowerCase() === r) || null;
}

export function goToPage(navigate, website, pages, hrefOrPageRef) {
  if (typeof navigate !== 'function') return null;
  const raw = hrefOrPageRef == null ? '' : String(hrefOrPageRef).trim();
  if (!raw || raw === '#') return null;
  if (/^(https?:)?\/\/|^(mailto|tel|sms):/i.test(raw)) return null;
  const list = Array.isArray(pages) ? pages : [];
  // Accept '?page=slug' (legacy), '/site/:slug/:pageSlug', '/site/:slug' (home)
  // or a bare slug/title.
  let ref = raw;
  const q = raw.match(/^\??page=([^&]+)/i);
  if (q) {
    ref = decodeURIComponent(q[1]);
  } else {
    const m = raw.match(/^\/site\/[^/?#]+(?:\/([^/?#]+))?/i);
    if (m) ref = m[1] ? decodeURIComponent(m[1]) : (list.find((pg) => pg.isHome)?.slug || list[0]?.slug || '');
    if (!ref) return null;
  }
  const pg = matchPage(list, ref);
  if (!pg) return null;
  const slug = pg.slug || ref;
  return (e) => {
    e.preventDefault();
    navigate(slug);
  };
}

// Props for an <a> that may target an internal page or an external URL.
// - edit mode: always preventDefault — the SortableItem wrapper stops the click
//   from bubbling, but the anchor's default (# href) would still scroll/navigate.
// - live/preview: known internal pages navigate via the renderer's navigate()
//   (no full page reload); external http(s) URLs open in a new tab.
function linkAttrs({ href, pageSlug, matchRef, edit, navigate, pages, website }) {
  const attrs = { href: href || (pageSlug ? `?page=${pageSlug}` : '#') };
  if (edit) return { ...attrs, onClick: (e) => e.preventDefault() };
  const go = goToPage(navigate, website, pages, matchRef || pageSlug || href);
  if (go) return { ...attrs, onClick: go };
  const target = attrs.href || '';
  if (/^https?:/i.test(target) || target.startsWith('//')) {
    return { ...attrs, target: '_blank', rel: 'noopener noreferrer' };
  }
  return attrs;
}

export function Navbar({ node, pages = [], navigate, mode, website }) {
  const p = node.props || {};
  const edit = mode === 'edit';
  const [open, setOpen] = useState(false);
  const bg = p.background || '#fff';
  const fg = p.textColor || '#111827';
  const links = Array.isArray(p.links) && p.links.length ? p.links : (pages || []).slice(0, 5).map((pg) => ({ label: pg.title, href: `?page=${pg.slug}` }));
  const navBorder = `1px solid color-mix(in srgb, ${fg} 10%, transparent)`;
  const linkProps = (l) => linkAttrs({ href: l.href, pageSlug: l.pageSlug, edit, navigate, pages, website });
  return (
    <nav
      style={{
        background: bg,
        color: fg,
        // 'relative' (instead of static) when not sticky so the mobile dropdown
        // can anchor to the navbar itself.
        position: p.sticky === false ? 'relative' : 'sticky',
        top: 0,
        zIndex: 20,
        borderBottom: navBorder,
      }}
    >
      <div className="flex items-center justify-between px-6 py-3" style={{ maxWidth: 1200, margin: '0 auto' }}>
        <span className="font-bold text-lg">{p.logo || 'Site'}</span>
        <div className="hidden md:flex items-center gap-6 text-sm">
          {links.map((l, i) => (
            <a key={i} {...linkProps(l)} className="hover:opacity-70">{l.label}</a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {p.ctaText && (
            <a {...linkAttrs({ href: p.ctaHref, edit, navigate, pages, website })} className="text-sm font-semibold text-white rounded-lg px-4 py-2 transition hover:brightness-110" style={{ background: 'var(--sf-primary, #5b4fd6)' }}>{p.ctaText}</a>
          )}
          <button
            type="button"
            className="md:hidden rounded-md p-1.5 -mr-1.5"
            aria-label="Menu"
            aria-expanded={open}
            aria-controls="sf-navbar-menu"
            onClick={() => setOpen(!open)}
            style={{ color: fg }}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      {open && (
        <>
          {/* Click-away backdrop closes the menu on outside clicks. */}
          <div className="fixed inset-0 z-30 md:hidden" aria-hidden="true" onClick={() => setOpen(false)} />
          <div
            id="sf-navbar-menu"
            className="absolute left-0 right-0 top-full z-40 border-b md:hidden"
            style={{ background: bg, color: fg, borderColor: navBorder }}
          >
            <div className="flex flex-col px-6 py-3">
              {links.map((l, i) => {
                const attrs = linkProps(l);
                return (
                  <a
                    key={i}
                    {...attrs}
                    className="py-2.5 text-sm hover:opacity-70"
                    onClick={(e) => { if (attrs.onClick) attrs.onClick(e); setOpen(false); }}
                  >
                    {l.label}
                  </a>
                );
              })}
              {p.ctaText && (
                <a
                  {...linkAttrs({ href: p.ctaHref, edit, navigate, pages, website })}
                  className="mt-2 text-center text-sm font-semibold text-white rounded-lg px-4 py-2.5"
                  style={{ background: 'var(--sf-primary, #5b4fd6)' }}
                  onClick={(e) => { if (!edit) setOpen(false); }}
                >
                  {p.ctaText}
                </a>
              )}
            </div>
          </div>
        </>
      )}
    </nav>
  );
}

export function Hero({ node, children, mode, navigate, pages, website }) {
  const p = node.props || {};
  const centered = (p.align || 'center') === 'center';
  const edit = mode === 'edit';
  return (
    <div style={{ background: p.background || '#111827', color: p.textColor || '#fff', padding: `${px(p.padding ?? 80)} 24px`, textAlign: p.align || 'center' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16, alignItems: centered ? 'center' : 'flex-start' }}>
        <h1 style={{ fontSize: 44, fontWeight: 800, lineHeight: 1.1, margin: 0, fontFamily: 'var(--sf-heading-font, inherit)' }}>{p.title || 'Build something great'}</h1>
        {p.subtitle && <p style={{ fontSize: 18, opacity: 0.85, margin: 0 }}>{p.subtitle}</p>}
        <div className="flex gap-3 flex-wrap" style={{ justifyContent: centered ? 'center' : 'flex-start' }}>
          {p.ctaText && <a {...linkAttrs({ href: p.ctaHref, edit, navigate, pages, website })} className="rounded-lg px-6 py-3 font-semibold text-white" style={{ background: 'var(--sf-primary, #5b4fd6)' }}>{p.ctaText}</a>}
          {p.secondaryText && <a {...linkAttrs({ href: p.secondaryHref, edit, navigate, pages, website })} className="rounded-lg px-6 py-3 font-semibold border" style={{ borderColor: 'currentColor' }}>{p.secondaryText}</a>}
        </div>
        {p.image && (
          /* Aspect-ratio wrapper reserves the image's space before it loads (CLS) */
          <div className="overflow-hidden bg-slate-100" style={{ width: '100%', maxWidth: 720, aspectRatio: '16 / 9', borderRadius: 16, marginTop: 16 }}>
            <img
              src={p.image}
              alt={p.alt || p.title || 'Hero image'}
              loading="eager"
              decoding="async"
              /* React 18 passes lowercase unknown attributes through to the DOM */
              {...{ fetchpriority: 'high' }}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function Card({ node, children }) {
  const p = node.props || {};
  return (
    <div style={{ background: p.background || CARD_BG, borderRadius: px(p.radius ?? 12), padding: px(p.padding ?? 24), border: CARD_BORDER, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {p.image && (
        <div className="overflow-hidden bg-slate-100" style={{ aspectRatio: '4 / 3', borderRadius: px((p.radius ?? 12) - 4) }}>
          <img src={p.image} alt={p.title || 'Card image'} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      )}
      {p.title && <h4 className="font-bold" style={{ color: TEXT }}>{p.title}</h4>}
      {p.description && <p className="text-sm" style={{ color: MUTED }}>{p.description}</p>}
      {children}
    </div>
  );
}

export function FeatureGrid({ node }) {
  const p = node.props || {};
  const feats = Array.isArray(p.features) ? p.features : [];
  const cols = Math.max(1, Math.min(4, p.columns ?? 3));
  return (
    <div style={{ background: p.background || PAGE_BG, padding: '48px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {p.title && <h3 className="text-2xl font-bold text-center mb-2" style={{ color: TEXT }}>{p.title}</h3>}
        {p.subtitle && <p className="text-center mb-8" style={{ color: MUTED }}>{p.subtitle}</p>}
        {/* auto-fit + max() inside minmax(): N columns on desktop, collapses to
            1–2 readable columns on phones instead of ~100px cards. */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(max(220px, calc(100% / ${cols})), 1fr))`, gap: 20 }}>
          {feats.map((f, i) => (
            <div key={i} className="rounded-xl p-5" style={{ border: CARD_BORDER, background: CARD_BG }}>
              <h4 className="font-semibold mb-1" style={{ color: TEXT }}>{f.title}</h4>
              <p className="text-sm" style={{ color: MUTED }}>{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Testimonials({ node }) {
  const p = node.props || {};
  const items = Array.isArray(p.items) ? p.items : [];
  return (
    <div style={{ background: p.background || 'var(--sf-background, #f8fafc)', padding: '48px 24px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {p.title && <h3 className="text-2xl font-bold text-center mb-8" style={{ color: TEXT }}>{p.title}</h3>}
        <div className="grid md:grid-cols-2 gap-4">
          {items.map((t, i) => (
            <figure key={i} className="rounded-xl p-5" style={{ border: CARD_BORDER, background: CARD_BG }}>
              <blockquote className="text-sm mb-3" style={{ color: TEXT }}>“{t.quote}”</blockquote>
              <figcaption className="text-xs font-semibold" style={{ color: TEXT }}>{t.author} <span className="font-normal" style={{ color: MUTED }}>· {t.role}</span></figcaption>
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Pricing({ node }) {
  const p = node.props || {};
  const plans = Array.isArray(p.plans) ? p.plans : [];
  return (
    <div style={{ background: p.background || PAGE_BG, padding: '48px 24px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {p.title && <h3 className="text-2xl font-bold text-center mb-8" style={{ color: TEXT }}>{p.title}</h3>}
        <div className="grid md:grid-cols-2 gap-4">
          {plans.map((pl, i) => (
            <div key={i} className="rounded-xl p-6 text-center" style={{ border: CARD_BORDER, background: CARD_BG }}>
              <h4 className="font-semibold" style={{ color: TEXT }}>{pl.name}</h4>
              <div className="text-3xl font-extrabold my-2" style={{ color: 'var(--sf-primary, #5b4fd6)' }}>{pl.price}</div>
              <ul className="text-sm flex flex-col gap-1" style={{ color: MUTED }}>{(pl.features || []).map((f, j) => <li key={j}>✓ {f}</li>)}</ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Footer({ node, mode, navigate, pages, website }) {
  const p = node.props || {};
  const cols = Array.isArray(p.columns) ? p.columns : [];
  const edit = mode === 'edit';
  return (
    <footer style={{ background: p.background || '#111827', color: p.textColor || '#e5e7eb', padding: '48px 24px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="font-bold text-lg mb-2">{p.logo}</div>
            <p className="text-sm opacity-70">{p.description}</p>
          </div>
          {cols.map((c, i) => (
            <div key={i}>
              <div className="text-sm font-semibold mb-2">{c.title}</div>
              <ul className="text-sm opacity-70 flex flex-col gap-1">
                {(c.links || []).map((l, j) => {
                  const isObj = typeof l !== 'string';
                  // String links may name a page (title/slug) — try to resolve
                  // them so they navigate instead of dead '#'-jumping.
                  const attrs = linkAttrs({
                    href: isObj ? l.href : undefined,
                    pageSlug: isObj ? l.pageSlug : undefined,
                    matchRef: isObj ? undefined : l,
                    edit,
                    navigate,
                    pages,
                    website,
                  });
                  return <li key={j}><a {...attrs} className="hover:opacity-100">{isObj ? l.label : l}</a></li>;
                })}
              </ul>
            </div>
          ))}
        </div>
        <div className="text-xs opacity-60 border-t pt-4" style={{ borderColor: 'color-mix(in srgb, currentColor 15%, transparent)' }}>{p.copyright}</div>
      </div>
    </footer>
  );
}

export function SocialLinks({ node, mode }) {
  const p = node.props || {};
  const links = Array.isArray(p.links) ? p.links : [];
  const align = { left: 'flex-start', center: 'center', right: 'flex-end' }[p.align] || 'flex-start';
  const edit = mode === 'edit';
  return (
    <div className="flex gap-3" style={{ justifyContent: align }}>
      {links.map((l, i) => {
        const Icon = NET_ICONS[(l.network || '').toLowerCase()] || Share2;
        const href = l.href || '#';
        const external = /^https?:/i.test(href) || href.startsWith('//');
        return (
          <a
            key={i}
            href={href}
            title={l.network}
            onClick={edit ? (e) => e.preventDefault() : undefined}
            {...(external && !edit ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            style={{ color: p.color || '#4b5563' }}
          >
            <Icon size={p.iconSize || 20} />
          </a>
        );
      })}
    </div>
  );
}
