// Typography: Heading, Text, Link
import React from 'react';

function px(v) { return typeof v === 'number' ? `${v}px` : v; }

export function Heading({ node }) {
  const p = node.props || {};
  const Tag = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(p.level) ? p.level : 'h2';
  return (
    <Tag style={{
      fontSize: px(p.fontSize ?? 32), fontWeight: p.fontWeight ?? 700,
      textAlign: p.align || 'left', color: p.color || 'var(--sf-text, #111827)',
      lineHeight: p.lineHeight ?? 1.2, margin: 0, fontFamily: 'var(--sf-heading-font, inherit)',
    }}>
      {p.content || 'Heading'}
    </Tag>
  );
}

export function Text({ node }) {
  const p = node.props || {};
  return (
    <p style={{
      fontSize: px(p.fontSize ?? 16), textAlign: p.align || 'left',
      color: p.color || 'var(--sf-text, #4b5563)', lineHeight: p.lineHeight ?? 1.6,
      margin: 0, fontFamily: 'var(--sf-body-font, inherit)', whiteSpace: 'pre-wrap',
    }}>
      {p.content || ''}
    </p>
  );
}

export function Link({ node }) {
  const p = node.props || {};
  return (
    <a href={p.href || '#'} style={{
      color: p.color || 'var(--sf-primary, #5b4fd6)', fontSize: px(p.fontSize ?? 16),
      textDecoration: p.underline === false ? 'none' : 'underline',
    }}>
      {p.text || p.content || 'Learn more'}
    </a>
  );
}
