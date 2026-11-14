// Media: Image, Video, Gallery
import React, { useState } from 'react';
import { ImageIcon } from 'lucide-react';

function px(v) { return typeof v === 'number' ? `${v}px` : v; }

// Broken URLs fall back to a neutral placeholder tile instead of the browser's
// broken-image icon (visitors see it on every published site).
function useImageFallback() {
  const [failed, setFailed] = useState(false);
  const onError = React.useCallback(() => setFailed(true), []);
  // Reset when the source changes so a fixed URL renders again.
  const reset = React.useCallback(() => setFailed(false), []);
  return { failed, onError, reset };
}

function PlaceholderTile({ label }) {
  return (
    <div className="flex items-center justify-center bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500" style={{ width: '100%', height: '100%' }}>
      <div className="flex flex-col items-center gap-1">
        <ImageIcon size={20} />
        {label && <span className="text-2xs">{label}</span>}
      </div>
    </div>
  );
}

export function Image({ node }) {
  const p = node.props || {};
  const src = p.src || 'https://picsum.photos/seed/siteforge/800/500';
  const { failed, onError, reset } = useImageFallback();
  // Aspect-ratio wrapper reserves layout space before the image loads (CLS).
  const ratio = p.aspectRatio || (p.width && p.height ? `${p.width} / ${p.height}` : '4 / 3');
  return (
    <div
      className="overflow-hidden bg-slate-100 dark:bg-slate-800"
      style={{ width: p.width || '100%', aspectRatio: ratio, borderRadius: px(p.radius ?? 8) }}
    >
      {failed ? (
        <PlaceholderTile label="Image unavailable" />
      ) : (
        <img
          src={src}
          alt={p.alt || ''}
          onError={onError}
          onLoad={reset}
          style={{ width: '100%', height: '100%', objectFit: p.fit || 'cover', display: 'block' }}
          loading="lazy"
          decoding="async"
        />
      )}
    </div>
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
        <iframe
          src={url}
          title="video"
          loading="lazy"
          style={{ width: '100%', height: '100%', border: 0 }}
          allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-1 text-white/70 text-sm">
          <ImageIcon size={22} />
          No video URL
        </div>
      )}
    </div>
  );
}

export function Gallery({ node }) {
  const p = node.props || {};
  const images = Array.isArray(p.images) ? p.images : [];
  const cols = Math.max(1, Math.min(6, p.columns ?? 3));
  return (
    <div
      style={{
        display: 'grid',
        // N columns on desktop, collapses to 1–2 readable columns on phones.
        gridTemplateColumns: `repeat(auto-fit, minmax(max(160px, calc(100% / ${cols})), 1fr))`,
        gap: px(p.gap ?? 12),
      }}
    >
      {images.map((img, i) => {
        const src = typeof img === 'string' ? img : img?.src;
        const alt = (typeof img === 'object' && img?.alt) || `Gallery image ${i + 1}`;
        return (
          <GalleryItem key={i} src={src} alt={alt} radius={px(p.radius ?? 8)} />
        );
      })}
      {images.length === 0 && <div className="col-span-full py-8 text-center text-sm text-slate-400">No images yet</div>}
    </div>
  );
}

function GalleryItem({ src, alt, radius }) {
  const { failed, onError, reset } = useImageFallback();
  return (
    <div className="overflow-hidden bg-slate-100 dark:bg-slate-800" style={{ aspectRatio: '4 / 3', borderRadius: radius }}>
      {failed || !src ? (
        <PlaceholderTile label="Image unavailable" />
      ) : (
        <img
          src={src}
          alt={alt}
          onError={onError}
          onLoad={reset}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          loading="lazy"
          decoding="async"
        />
      )}
    </div>
  );
}
