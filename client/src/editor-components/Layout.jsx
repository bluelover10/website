// Layout primitives: Container, Section, Divider, Spacer (+ Root passthrough)
import React from 'react';

function px(v) { return typeof v === 'number' ? `${v}px` : v; }

export function Container({ node, mode, children, isSelected, onSelect }) {
  const p = node.props || {};
  const edit = mode === 'edit';
  return (
    <div
      onClick={edit ? (e) => { e.stopPropagation(); onSelect && onSelect(node.id); } : undefined}
      style={{
        background: p.background || 'transparent',
        padding: px(p.padding ?? 24),
        margin: p.margin != null ? (typeof p.margin === 'number' ? `${p.margin}px auto` : p.margin) : '0 auto',
        maxWidth: p.maxWidth ? px(p.maxWidth) : undefined,
        borderRadius: px(p.radius ?? 0),
        display: 'flex',
        flexDirection: p.direction || 'column',
        gap: px(p.gap ?? 16),
        alignItems: p.direction === 'row' ? 'flex-start' : undefined,
        border: edit && (!children || React.Children.count(children) === 0) ? '1px dashed #cdc6f7' : undefined,
        minHeight: edit && (!children || React.Children.count(children) === 0) ? 60 : undefined,
      }}
      className={edit ? 'relative' : undefined}
    >
      {children}
      {edit && (!children || React.Children.count(children) === 0) && (
        <div className="absolute inset-0 flex items-center justify-center text-[11px] text-primary-400 pointer-events-none">Drop components here</div>
      )}
    </div>
  );
}

export function Section({ node, mode, children, isSelected, onSelect }) {
  const p = node.props || {};
  const edit = mode === 'edit';
  return (
    <div
      onClick={edit ? (e) => { e.stopPropagation(); onSelect && onSelect(node.id); } : undefined}
      style={{ background: p.background || '#f8fafc', padding: `${px(p.padding ?? 64)} 16px`, margin: px(p.margin ?? 0) }}
    >
      <div style={{ maxWidth: px(p.maxWidth ?? 1200), margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {children}
        {edit && (!children || React.Children.count(children) === 0) && (
          <div className="rounded-lg border border-dashed border-primary-300 py-10 text-center text-xs text-primary-400">Empty section — drag blocks here</div>
        )}
      </div>
    </div>
  );
}

export function Divider({ node }) {
  const p = node.props || {};
  return <hr style={{ border: 'none', borderTop: `${p.thickness ?? 1}px ${p.style || 'solid'} ${p.color || '#e5e7eb'}`, margin: `${px(p.margin ?? 16)} 0` }} />;
}

export function Spacer({ node }) {
  const p = node.props || {};
  return <div style={{ height: px(p.height ?? 32) }} />;
}

export function Root({ children }) {
  return <>{children}</>;
}
