// Canonical defaults + factory for every editor component type.
// Contract: createNode(type) -> {id,type,props,children}; COMPONENT_META list.
import { generateId } from '../editor/EditorUtils';

export const DEFAULT_PROPS = {
  container: { background: 'transparent', padding: 24, margin: 0, maxWidth: 1200, align: 'center', direction: 'column', gap: 16, radius: 8 },
  section: { background: '#f8fafc', padding: 64, margin: 0, maxWidth: 1200, align: 'center' },
  heading: { content: 'New Heading', level: 'h2', fontSize: 32, fontWeight: 700, align: 'left', color: '#111827', lineHeight: 1.2 },
  text: { content: 'Add some descriptive text here. Click to edit in the right panel.', fontSize: 16, align: 'left', color: '#4b5563', lineHeight: 1.6 },
  image: { src: 'https://picsum.photos/seed/siteforge/800/500', alt: 'Image', width: '100%', height: 'auto', fit: 'cover', radius: 8 },
  button: { text: 'Click me', href: '#', background: '#5b4fd6', color: '#ffffff', radius: 8, paddingX: 24, paddingY: 12, align: 'left' },
  link: { text: 'Learn more', href: '#', color: '#5b4fd6', fontSize: 16, underline: true },
  divider: { color: '#e5e7eb', thickness: 1, margin: 16, style: 'solid' },
  spacer: { height: 32 },
  navbar: {
    logo: 'SiteForge', links: [{ label: 'Home', href: '#' }, { label: 'Features', href: '#' }, { label: 'Pricing', href: '#' }],
    background: '#ffffff', textColor: '#111827', sticky: true, ctaText: 'Get Started', ctaHref: '#',
  },
  hero: {
    title: 'Build something great', subtitle: 'Describe your product in one clear sentence.',
    ctaText: 'Get Started', ctaHref: '#', secondaryText: 'Learn more', secondaryHref: '#',
    background: '#111827', textColor: '#ffffff', image: '', align: 'center', padding: 80,
  },
  card: { title: 'Card title', description: 'Card description goes here.', image: '', background: '#ffffff', radius: 12, padding: 24 },
  featureGrid: {
    title: 'Features', subtitle: '',
    features: [{ title: 'Fast', description: 'Optimized out of the box.' }, { title: 'Simple', description: 'Easy to use editor.' }, { title: 'Secure', description: 'Production ready.' }],
    columns: 3, background: '#ffffff',
  },
  testimonials: {
    title: 'Loved by teams', items: [{ quote: 'SiteForge saved us weeks.', author: 'Ada L.', role: 'Founder' }, { quote: 'The editor is a joy.', author: 'Ben K.', role: 'Designer' }],
    background: '#f8fafc',
  },
  pricing: {
    title: 'Pricing', plans: [{ name: 'Starter', price: '$9', features: ['1 site', 'Basic support'] }, { name: 'Pro', price: '$29', features: ['10 sites', 'Priority support', 'Analytics'] }],
    background: '#ffffff',
  },
  faq: {
    title: 'FAQ', items: [{ q: 'What is SiteForge?', a: 'A visual website builder.' }, { q: 'Can I publish?', a: 'Yes, with one click.' }],
  },
  gallery: { images: ['https://picsum.photos/seed/a/600/400', 'https://picsum.photos/seed/b/600/400', 'https://picsum.photos/seed/c/600/400'], columns: 3, gap: 12, radius: 8 },
  contactForm: { title: 'Contact us', subtitle: 'We reply within 24h.', submitText: 'Send message', background: '#ffffff' },
  footer: {
    logo: 'SiteForge', description: 'Build and publish sites fast.', background: '#111827', textColor: '#e5e7eb',
    columns: [{ title: 'Product', links: ['Features', 'Pricing'] }, { title: 'Company', links: ['About', 'Contact'] }],
    copyright: '© 2026 SiteForge. All rights reserved.',
  },
  video: { src: 'https://www.youtube.com/embed/dQw4w9WgXcQ', autoplay: false, controls: true, radius: 12, aspect: '16/9' },
  socialLinks: { links: [{ network: 'twitter', href: '#' }, { network: 'github', href: '#' }, { network: 'linkedin', href: '#' }], iconSize: 20, color: '#4b5563', align: 'left' },
};

export const ALLOW_CHILDREN = {
  container: true, section: true, card: true,
  heading: false, text: false, image: false, button: false, link: false,
  divider: false, spacer: false, navbar: false, hero: false,
  featureGrid: false, testimonials: false, pricing: false, faq: false,
  gallery: false, contactForm: false, footer: false, video: false, socialLinks: false,
};

export const COMPONENT_META = [
  { type: 'container', label: 'Container', category: 'Layout' },
  { type: 'section', label: 'Section', category: 'Layout' },
  { type: 'divider', label: 'Divider', category: 'Layout' },
  { type: 'spacer', label: 'Spacer', category: 'Layout' },
  { type: 'heading', label: 'Heading', category: 'Typography' },
  { type: 'text', label: 'Text', category: 'Typography' },
  { type: 'link', label: 'Link', category: 'Typography' },
  { type: 'image', label: 'Image', category: 'Media' },
  { type: 'video', label: 'Video', category: 'Media' },
  { type: 'gallery', label: 'Gallery', category: 'Media' },
  { type: 'button', label: 'Button', category: 'Interactive' },
  { type: 'faq', label: 'FAQ', category: 'Interactive' },
  { type: 'contactForm', label: 'Contact Form', category: 'Interactive' },
  { type: 'navbar', label: 'Navbar', category: 'Sections' },
  { type: 'hero', label: 'Hero', category: 'Sections' },
  { type: 'card', label: 'Card', category: 'Sections' },
  { type: 'featureGrid', label: 'Feature Grid', category: 'Sections' },
  { type: 'testimonials', label: 'Testimonials', category: 'Sections' },
  { type: 'pricing', label: 'Pricing', category: 'Sections' },
  { type: 'footer', label: 'Footer', category: 'Sections' },
  { type: 'socialLinks', label: 'Social Links', category: 'Sections' },
].map((m) => ({ ...m, allowChildren: !!ALLOW_CHILDREN[m.type] }));

export function createNode(type, overrides = {}) {
  const props = JSON.parse(JSON.stringify(DEFAULT_PROPS[type] || {}));
  const extraProps = overrides.props || overrides || {};
  const merged = { ...props, ...(overrides.props || {}) };
  // allow flat overrides passed directly (shell compat)
  if (overrides && !overrides.props && !overrides.children && !overrides.meta) {
    Object.assign(merged, overrides);
  }
  const node = { id: generateId(type), type, props: merged, children: ALLOW_CHILDREN[type] ? [] : [] };
  if (Array.isArray(overrides.children)) node.children = overrides.children;
  if (overrides.id) node.id = overrides.id;
  return node;
}

// ---- Shell-compat aliases (used by client shell pages/hooks) ----
export const COMPONENT_TYPES = [
  'section',
  'container',
  'heading',
  'text',
  'button',
  'image',
  'hero',
  'features',
  'gallery',
  'testimonial',
  'pricing',
  'cta',
  'navbar',
  'footer',
  'form',
  'video',
  'divider',
  'spacer',
  'columns',
  'card',
  'link',
  'faq',
  'contactForm',
  'featureGrid',
  'testimonials',
  'socialLinks',
];

export function defaultPropsFor(type) {
  return JSON.parse(JSON.stringify(DEFAULT_PROPS[type] || {}));
}

export function defaultTreeForNewPage() {
  return [
    createNode('navbar'),
    createNode('hero'),
    createNode('features' in DEFAULT_PROPS ? 'features' : 'featureGrid'),
    createNode('cta' in DEFAULT_PROPS ? 'cta' : 'button'),
    createNode('footer'),
  ];
}

export default { DEFAULT_PROPS, ALLOW_CHILDREN, COMPONENT_META, createNode };
