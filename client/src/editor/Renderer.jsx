// Dynamic renderer used by canvas (edit), preview, and public site. No hardcoded pages.
import React, { memo } from 'react';
import SortableItem from './SortableItem';
import { Container, Section, Divider, Spacer } from '../editor-components/Layout';
import { Heading, Text, Link } from '../editor-components/Typography';
import { Image, Video, Gallery } from '../editor-components/Media';
import { Button, ContactForm, FAQ } from '../editor-components/Interactive';
import { Navbar, Hero, Card, FeatureGrid, Testimonials, Pricing, Footer, SocialLinks } from '../editor-components/Sections';

const CONTAINERS = new Set(['root', 'container', 'section', 'card']);

export function renderNode(node, ctx) {
  if (!node) return null;
  const { mode = 'preview', theme = {}, website = null, pages = [], navigate = () => {}, onSelect, selectedId } = ctx || {};
  const common = { node, mode, theme, website, pages, navigate, isSelected: selectedId === node.id, onSelect };
  const kids = (node.children || []).map((c) => renderNode(c, ctx));

  let el = null;
  switch (node.type) {
    // 'page' is the legacy root type written by older server seeds/content —
    // treat it exactly like 'root' so published pages don't render blank.
    case 'root':
    case 'page':
      el = <>{kids}</>;
      break;
    case 'container': el = <Container {...common}>{kids}</Container>; break;
    case 'section': el = <Section {...common}>{kids}</Section>; break;
    case 'divider': el = <Divider {...common} />; break;
    case 'spacer': el = <Spacer {...common} />; break;
    case 'heading': el = <Heading {...common} />; break;
    case 'text': el = <Text {...common} />; break;
    case 'link': el = <Link {...common} />; break;
    case 'image': el = <Image {...common} />; break;
    case 'video': el = <Video {...common} />; break;
    case 'gallery': el = <Gallery {...common} />; break;
    case 'button': el = <Button {...common} />; break;
    case 'contactForm': el = <ContactForm {...common} />; break;
    case 'faq': el = <FAQ {...common} />; break;
    case 'navbar': el = <Navbar {...common} />; break;
    case 'hero': el = <Hero {...common}>{kids?.length ? kids : null}</Hero>; break;
    case 'card': el = <Card {...common}>{kids}</Card>; break;
    case 'featureGrid': el = <FeatureGrid {...common} />; break;
    case 'testimonials': el = <Testimonials {...common} />; break;
    case 'pricing': el = <Pricing {...common} />; break;
    case 'footer': el = <Footer {...common} />; break;
    case 'socialLinks': el = <SocialLinks {...common} />; break;
    default:
      el = mode === 'edit'
        ? <div className="border border-dashed border-red-300 rounded p-2 text-xs text-red-500">Unknown: {node.type}</div>
        : null;
  }
  if (el == null) return null;

  // In edit mode every non-root node gets sortable + selection wrapper.
  if (mode === 'edit' && node.type !== 'root' && node.type !== 'page') {
    return (
      <SortableItem key={node.id} node={node} selected={selectedId === node.id} onSelect={onSelect}>
        {el}
      </SortableItem>
    );
  }
  if (node.type === 'root' || node.type === 'page') return <React.Fragment key="root">{el}</React.Fragment>;
  return <React.Fragment key={node.id}>{el}</React.Fragment>;
}

function RendererBase({ tree, mode = 'preview', theme = {}, website = null, pages = [], navigate, onSelect, selectedId }) {
  const vars = {
    '--sf-primary': theme.primary || '#5b4fd6',
    '--sf-secondary': theme.secondary || '#0ea5e9',
    '--sf-background': theme.background || '#ffffff',
    '--sf-text': theme.text || '#111827',
    '--sf-accent': theme.accent || '#f59e0b',
    '--sf-heading-font': theme.headingFont || 'inherit',
    '--sf-body-font': theme.bodyFont || 'inherit',
  };
  const ctx = { mode, theme, website, pages, navigate, onSelect, selectedId };
  return (
    <div style={{ ...vars, background: mode === 'live' || mode === 'preview' ? (theme.background || '#fff') : undefined, minHeight: '100%' }}>
      {renderNode(tree || { id: 'root', type: 'root', props: {}, children: [] }, ctx)}
    </div>
  );
}

export const Renderer = memo(RendererBase);
export default Renderer;
