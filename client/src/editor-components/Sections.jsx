// Marketing sections: Navbar, Hero, Card, FeatureGrid, Testimonials, Pricing, Footer, SocialLinks
import React from 'react';
import { Twitter, Github, Linkedin, Facebook, Instagram, Youtube, Share2 } from 'lucide-react';

function px(v) { return typeof v === 'number' ? `${v}px` : v; }

const NET_ICONS = { twitter: Twitter, x: Twitter, github: Github, linkedin: Linkedin, facebook: Facebook, instagram: Instagram, youtube: Youtube };

export function Navbar({ node, pages = [], navigate }) {
  const p = node.props || {};
  const links = Array.isArray(p.links) && p.links.length ? p.links : (pages || []).slice(0, 5).map((pg) => ({ label: pg.title, href: `?page=${pg.slug}` }));
  return (
    <nav style={{ background: p.background || '#fff', color: p.textColor || '#111827', position: p.sticky === false ? 'static' : 'sticky', top: 0, zIndex: 20, borderBottom: '1px solid #e5e7eb' }}>
      <div className="flex items-center justify-between px-6 py-3" style={{ maxWidth: 1200, margin: '0 auto' }}>
        <span className="font-bold text-lg">{p.logo || 'Site'}</span>
        <div className="hidden md:flex items-center gap-6 text-sm">
          {links.map((l, i) => (
            <a key={i} href={l.href || '#'} onClick={l.pageSlug && navigate ? (e) => { e.preventDefault(); navigate(l.pageSlug); } : undefined} className="hover:opacity-70">{l.label}</a>
          ))}
        </div>
        {p.ctaText && <a href={p.ctaHref || '#'} className="text-sm font-semibold text-white rounded-lg px-4 py-2 transition hover:brightness-110" style={{ background: 'var(--sf-primary, #5b4fd6)' }}>{p.ctaText}</a>}
      </div>
    </nav>
  );
}

export function Hero({ node, children }) {
  const p = node.props || {};
  const centered = (p.align || 'center') === 'center';
  return (
    <div style={{ background: p.background || '#111827', color: p.textColor || '#fff', padding: `${px(p.padding ?? 80)} 24px`, textAlign: p.align || 'center' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16, alignItems: centered ? 'center' : 'flex-start' }}>
        <h1 style={{ fontSize: 44, fontWeight: 800, lineHeight: 1.1, margin: 0, fontFamily: 'var(--sf-heading-font, inherit)' }}>{p.title || 'Build something great'}</h1>
        {p.subtitle && <p style={{ fontSize: 18, opacity: 0.85, margin: 0 }}>{p.subtitle}</p>}
        <div className="flex gap-3 flex-wrap" style={{ justifyContent: centered ? 'center' : 'flex-start' }}>
          {p.ctaText && <a href={p.ctaHref || '#'} className="rounded-lg px-6 py-3 font-semibold text-white" style={{ background: 'var(--sf-primary, #5b4fd6)' }}>{p.ctaText}</a>}
          {p.secondaryText && <a href={p.secondaryHref || '#'} className="rounded-lg px-6 py-3 font-semibold border" style={{ borderColor: 'currentColor' }}>{p.secondaryText}</a>}
        </div>
        {p.image && <img src={p.image} alt="hero" style={{ width: '100%', maxWidth: 720, borderRadius: 16, marginTop: 16 }} />}
        {children}
      </div>
    </div>
  );
}

export function Card({ node, children }) {
  const p = node.props || {};
  return (
    <div style={{ background: p.background || '#fff', borderRadius: px(p.radius ?? 12), padding: px(p.padding ?? 24), border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {p.image && <img src={p.image} alt={p.title || 'card'} style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: px((p.radius ?? 12) - 4) }} />}
      {p.title && <h4 className="font-bold" style={{ color: 'var(--sf-text, #111827)' }}>{p.title}</h4>}
      {p.description && <p className="text-sm text-slate-500">{p.description}</p>}
      {children}
    </div>
  );
}

export function FeatureGrid({ node }) {
  const p = node.props || {};
  const feats = Array.isArray(p.features) ? p.features : [];
  const cols = Math.max(1, Math.min(4, p.columns ?? 3));
  return (
    <div style={{ background: p.background || '#fff', padding: '48px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {p.title && <h3 className="text-2xl font-bold text-center mb-2" style={{ color: 'var(--sf-text, #111827)' }}>{p.title}</h3>}
        {p.subtitle && <p className="text-center text-slate-500 mb-8">{p.subtitle}</p>}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 20 }}>
          {feats.map((f, i) => (
            <div key={i} className="border rounded-xl p-5" style={{ borderColor: '#e5e7eb', background: '#fff' }}>
              <h4 className="font-semibold mb-1">{f.title}</h4>
              <p className="text-sm text-slate-500">{f.description}</p>
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
    <div style={{ background: p.background || '#f8fafc', padding: '48px 24px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {p.title && <h3 className="text-2xl font-bold text-center mb-8" style={{ color: 'var(--sf-text, #111827)' }}>{p.title}</h3>}
        <div className="grid md:grid-cols-2 gap-4">
          {items.map((t, i) => (
            <figure key={i} className="bg-white border rounded-xl p-5" style={{ borderColor: '#e5e7eb' }}>
              <blockquote className="text-sm mb-3">“{t.quote}”</blockquote>
              <figcaption className="text-xs font-semibold">{t.author} <span className="font-normal text-slate-500">· {t.role}</span></figcaption>
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
    <div style={{ background: p.background || '#fff', padding: '48px 24px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {p.title && <h3 className="text-2xl font-bold text-center mb-8" style={{ color: 'var(--sf-text, #111827)' }}>{p.title}</h3>}
        <div className="grid md:grid-cols-2 gap-4">
          {plans.map((pl, i) => (
            <div key={i} className="border rounded-xl p-6 text-center" style={{ borderColor: '#e5e7eb' }}>
              <h4 className="font-semibold">{pl.name}</h4>
              <div className="text-3xl font-extrabold my-2" style={{ color: 'var(--sf-primary, #5b4fd6)' }}>{pl.price}</div>
              <ul className="text-sm text-slate-500 flex flex-col gap-1">{(pl.features || []).map((f, j) => <li key={j}>✓ {f}</li>)}</ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Footer({ node }) {
  const p = node.props || {};
  const cols = Array.isArray(p.columns) ? p.columns : [];
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
              <ul className="text-sm opacity-70 flex flex-col gap-1">{(c.links || []).map((l, j) => <li key={j}><a href="#" className="hover:opacity-100">{typeof l === 'string' ? l : l.label}</a></li>)}</ul>
            </div>
          ))}
        </div>
        <div className="text-xs opacity-60 border-t pt-4" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>{p.copyright}</div>
      </div>
    </footer>
  );
}

export function SocialLinks({ node }) {
  const p = node.props || {};
  const links = Array.isArray(p.links) ? p.links : [];
  const align = { left: 'flex-start', center: 'center', right: 'flex-end' }[p.align] || 'flex-start';
  return (
    <div className="flex gap-3" style={{ justifyContent: align }}>
      {links.map((l, i) => {
        const Icon = NET_ICONS[(l.network || '').toLowerCase()] || Share2;
        return (
          <a key={i} href={l.href || '#'} title={l.network} style={{ color: p.color || '#4b5563' }}>
            <Icon size={p.iconSize || 20} />
          </a>
        );
      })}
    </div>
  );
}
