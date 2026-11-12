// Media: Image, Video, Gallery
import React from 'react';

function px(v) { return typeof v === 'number' ? `${v}px` : v; }

export function Image({ node }) {
  const p = node.props || {};
  return (
    <img
      src={p.src || 'https://picsum.photos/seed/siteforge/800/500'}
      alt={p.alt || ''}
      style={{ width: p.width || '100%', height: p.height || 'auto', objectFit: p.fit || 'cover', borderRadius: px(p.radius ?? 8), display: 'block', maxWidth: '100%' }}
      loading="lazy"
    />
  );
}

function youtubeEmbed(src) {
  if (!src) return '';
  if (src.includes('embed') || src.includes('<iframe')) return src;
  const m = src.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]{6,})/);
  if (m) return `https://www.youtube.com/embed/${m[1]}`;
  return src;
}

export function Video({ node }) {
  const p = node.props || {};
  const src = youtubeEmbed(p.src || '');
  const params = new URLSearchParams();
  if (p.autoplay) params.set('autoplay', '1');
  const url = src.includes('youtube') && params.toString() ? `${src}${src.includes('?') ? '&' : '?'}${params}` : src;
  return (
    <div style={{ borderRadius: px(p.radius ?? 12), overflow: 'hidden', aspectRatio: p.aspect || '16/9', background: '#000' }}>
      {url ? (
        <iframe src={url} title="video" style={{ width: '100%', height: '100%', border: 0 }} allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowFullScreen />
      ) : (
        <div className="flex items-center justify-center h-full text-white text-sm">No video URL</div>
      )}
    </div>
  );
}

export function Gallery({ node }) {
  const p = node.props || {};
  const images = Array.isArray(p.images) ? p.images : [];
  const cols = Math.max(1, Math.min(6, p.columns ?? 3));
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: px(p.gap ?? 12) }}>
      {images.map((src, i) => (
        <img key={i} src={typeof src === 'string' ? src : src.src} alt={`Gallery ${i + 1}`} style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: px(p.radius ?? 8) }} loading="lazy" />
      ))}
      {images.length === 0 && <div className="text-sm text-slate-400 col-span-full text-center py-8">No images yet</div>}
    </div>
  );
}
