// Seed service: template library (v2 — shapes match the client Renderer exactly)
// + public demo account / demo website so visitors can try the app instantly.
//
// IMPORTANT: demo credentials here are INTENTIONALLY public (used on the login
// page of the public demo). They are not secrets and must never be real
// production credentials.
const bcrypt = require('bcryptjs');
const Template = require('../models/Template');
const User = require('../models/User');
const Website = require('../models/Website');
const WebsiteMember = require('../models/WebsiteMember');
const Page = require('../models/Page');
const FormSubmission = require('../models/FormSubmission');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const { publishWebsite } = require('./publish.service');
const { generateUniqueSlug } = require('../utils/slugify');

const SEED_VERSION = 2;

// Public demo account (mirrored in client/src/config/demo.js for the login UI).
const DEMO_EMAIL = 'demo@siteforge.app';
const DEMO_PASSWORD = 'demo1234';
const DEMO_NAME = 'Demo User';

// Platform admin account — NOT public demo credentials. Override via env in any
// real deployment (ADMIN_EMAIL / ADMIN_PASSWORD) and change the password before
// exposing the server. Seeded idempotently so boot always ends with exactly one
// working admin account.
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@siteforge.app').toLowerCase();
const ADMIN_NAME = process.env.ADMIN_NAME || 'SiteForge Admin';

// Resolved inside seedAdminUser() so an invalid config throws at boot-time
// (through runSeeds), not at module require time.
const ADMIN_PASSWORD_PLACEHOLDERS = new Set([
  'admin1234',
  'change-me-before-deploying',
  'change-me',
  'password',
  '123456',
  'admin',
]);

// ---------------------------------------------------------------------------
// Node helpers — shapes consumed by client/src/editor/Renderer.jsx
// ---------------------------------------------------------------------------
const n = (id, type, props = {}, children = []) => ({ id, type, props, children });
const page = (title, children) => ({ id: 'root', type: 'root', props: { title }, children });

function navbar(brand, links = []) {
  return n('navbar', 'navbar', {
    logo: brand,
    links: links.length ? links : [{ label: 'Home', href: '#top' }, { label: 'About', href: '#about' }],
    background: '#ffffff',
    textColor: '#0f172a',
    sticky: true,
    ctaText: 'Get in touch',
    ctaHref: '#contact',
  });
}

function footer(brand) {
  return n('footer', 'footer', {
    logo: brand,
    description: 'Made with SiteForge — the fastest way to launch a beautiful website.',
    columns: [
      { title: 'Explore', links: ['Home', 'About'] },
      { title: 'Follow', links: ['Twitter', 'Instagram'] },
    ],
    background: '#0f172a',
    textColor: '#e2e8f0',
    copyright: `© 2026 ${brand}. All rights reserved.`,
  });
}

// ---------------------------------------------------------------------------
// Template library v2
// ---------------------------------------------------------------------------
function businessTemplate() {
  return {
    name: 'Business Studio',
    category: 'business',
    description: 'Confident business site with hero, feature grid, testimonials, pricing and contact form.',
    thumbnail: '',
    isPublic: true,
    seedVersion: SEED_VERSION,
    pages: [
      {
        title: 'Home',
        slug: 'home',
        theme: null,
        content: page('Home', [
          navbar('Northwind', [
            { label: 'Home', href: '#top' },
            { label: 'Features', href: '#features' },
            { label: 'Pricing', href: '#pricing' },
            { label: 'Contact', href: '#contact' },
          ]),
          n('hero', 'hero', {
            title: 'Grow your business with confidence',
            subtitle: 'Northwind helps teams launch faster, sell smarter and scale without friction.',
            ctaText: 'Start free',
            ctaHref: '#contact',
            secondaryText: 'See pricing',
            secondaryHref: '#pricing',
            background: '#0f172a',
            textColor: '#ffffff',
            align: 'center',
            padding: 96,
          }),
          n('features', 'featureGrid', {
            title: 'Everything you need',
            subtitle: 'One platform for your whole operation.',
            columns: 3,
            background: '#ffffff',
            features: [
              { title: 'Ship faster', description: 'Launch campaigns and pages in hours, not weeks.' },
              { title: 'Stay in sync', description: 'Real-time collaboration across your whole team.' },
              { title: 'Scale easily', description: 'From first customer to enterprise, no re-platforming.' },
            ],
          }),
          n('testimonials', 'testimonials', {
            title: 'Loved by teams worldwide',
            background: '#f8fafc',
            items: [
              { quote: 'We replaced three tools with Northwind and never looked back.', author: 'Maya Chen', role: 'COO, Brightloop' },
              { quote: 'Onboarding took an afternoon. Results showed up in a week.', author: 'Tomás Rivera', role: 'Founder, Kite Labs' },
            ],
          }),
          n('pricing', 'pricing', {
            title: 'Simple pricing',
            background: '#ffffff',
            plans: [
              { name: 'Starter', price: '$9/mo', features: ['3 projects', 'Community support', 'Basic analytics'] },
              { name: 'Growth', price: '$29/mo', features: ['Unlimited projects', 'Priority support', 'Advanced analytics'] },
            ],
          }),
          n('contact', 'contactForm', {
            title: 'Talk to us',
            subtitle: 'Tell us about your project — we reply within one business day.',
            submitText: 'Send message',
            background: '#ffffff',
          }),
          footer('Northwind'),
        ]),
      },
      {
        title: 'About',
        slug: 'about',
        theme: null,
        content: page('About', [
          navbar('Northwind', [{ label: 'Home', href: '#top' }, { label: 'Contact', href: '#contact' }]),
          n('sec', 'section', { background: '#ffffff', padding: 80, maxWidth: 900 }, [
            n('h', 'heading', { content: 'Built by operators, for operators', level: 'h1', fontSize: 40, fontWeight: 800, align: 'center', color: '#0f172a' }),
            n('t', 'text', {
              content: 'We started Northwind after a decade of running teams and watching great ideas drown in tooling. Our mission is simple: give every team a fast, beautiful home on the internet.',
              fontSize: 17,
              align: 'center',
              color: '#475569',
              lineHeight: 1.7,
            }),
            n('spacer', 'spacer', { height: 24 }),
            n('btn', 'button', { text: 'Meet the team', href: '#contact', align: 'center' }),
          ]),
          footer('Northwind'),
        ]),
      },
    ],
  };
}

function portfolioTemplate() {
  return {
    name: 'Portfolio Minim',
    category: 'portfolio',
    description: 'Minimal designer portfolio with bold hero, project gallery and social links.',
    thumbnail: '',
    isPublic: true,
    seedVersion: SEED_VERSION,
    pages: [
      {
        title: 'Home',
        slug: 'home',
        theme: null,
        content: page('Home', [
          navbar('Jane Okafor', [{ label: 'Work', href: '#work' }, { label: 'Contact', href: '#contact' }]),
          n('hero', 'hero', {
            title: 'Designer & art director',
            subtitle: 'I craft brand identities and digital experiences people remember.',
            ctaText: 'View work',
            ctaHref: '#work',
            background: '#111827',
            textColor: '#ffffff',
            align: 'left',
            padding: 96,
          }),
          n('work', 'gallery', {
            images: [
              'https://images.unsplash.com/photo-1541462608143-67571c6738dd?w=800&q=70',
              'https://images.unsplash.com/photo-1493421419110-74f4e85ba126?w=800&q=70',
              'https://images.unsplash.com/photo-1523874191030-3a9d3cb3fa8b?w=800&q=70',
              'https://images.unsplash.com/photo-1507003211169-0a2dd7228f2d?w=800&q=70',
              'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&q=70',
              'https://images.unsplash.com/photo-1515886657678-4f162013414d?w=800&q=70',
            ],
            columns: 3,
            gap: 14,
            radius: 12,
          }),
          n('social', 'socialLinks', {
            links: [
              { network: 'instagram', href: '#' },
              { network: 'linkedin', href: '#' },
              { network: 'twitter', href: '#' },
            ],
            iconSize: 22,
            color: '#64748b',
            align: 'center',
          }),
          footer('Jane Okafor'),
        ]),
      },
    ],
  };
}

function restaurantTemplate() {
  return {
    name: 'Restaurant Tavola',
    category: 'restaurant',
    description: 'Warm restaurant site with hero, popular dishes and a reservation form.',
    thumbnail: '',
    isPublic: true,
    seedVersion: SEED_VERSION,
    pages: [
      {
        title: 'Home',
        slug: 'home',
        theme: null,
        content: page('Home', [
          navbar('Tavola', [{ label: 'Menu', href: '#menu' }, { label: 'Reservations', href: '#contact' }]),
          n('hero', 'hero', {
            title: 'Authentic Italian, wood-fired every night',
            subtitle: 'Handmade pasta, San Marzano pizza and a cellar of small-producer wines.',
            ctaText: 'Reserve a table',
            ctaHref: '#contact',
            background: '#7c2d12',
            textColor: '#fff7ed',
            align: 'center',
            padding: 96,
          }),
          n('menu-sec', 'section', { background: '#fffbeb', padding: 72, maxWidth: 1000 }, [
            n('menu-h', 'heading', { content: 'Popular dishes', level: 'h2', fontSize: 32, fontWeight: 800, align: 'center', color: '#78350f' }),
            n('menu-grid', 'featureGrid', {
              title: '',
              subtitle: '',
              columns: 2,
              background: '#fffbeb',
              features: [
                { title: 'Margherita', description: 'San Marzano tomato, fior di latte, basil, olive oil — $14' },
                { title: 'Tagliatelle al ragù', description: 'Slow-braised beef ragù, parmigiano reggiano — $19' },
                { title: 'Burrata e prosciutto', description: 'Creamy burrata, 24-month prosciutto, grilled sourdough — $16' },
                { title: 'Tiramisù della casa', description: 'Espresso-soaked savoiardi, mascarpone, cocoa — $9' },
              ],
            }),
          ]),
          n('contact', 'contactForm', {
            title: 'Book a table',
            subtitle: 'Reservations confirmed by text within 15 minutes.',
            submitText: 'Request reservation',
            background: '#ffffff',
          }),
          footer('Tavola'),
        ]),
      },
    ],
  };
}

function saasTemplate() {
  return {
    name: 'SaaS Launch',
    category: 'saas',
    description: 'Product landing with gradient hero, feature grid, pricing tiers and FAQ.',
    thumbnail: '',
    isPublic: true,
    seedVersion: SEED_VERSION,
    pages: [
      {
        title: 'Home',
        slug: 'home',
        theme: null,
        content: page('Home', [
          navbar('Cloudly', [{ label: 'Features', href: '#features' }, { label: 'Pricing', href: '#pricing' }, { label: 'FAQ', href: '#faq' }]),
          n('hero', 'hero', {
            title: 'Ship software faster',
            subtitle: 'Cloudly is the all-in-one platform for modern product teams — deploys, flags and analytics in one place.',
            ctaText: 'Start free',
            ctaHref: '#pricing',
            secondaryText: 'See features',
            secondaryHref: '#features',
            background: '#1e1b4b',
            textColor: '#e0e7ff',
            align: 'center',
            padding: 96,
          }),
          n('features', 'featureGrid', {
            title: 'Built for velocity',
            subtitle: 'Everything your team needs between "idea" and "deployed".',
            columns: 3,
            background: '#ffffff',
            features: [
              { title: 'Instant deploys', description: 'Push to main and go live in seconds with zero config.' },
              { title: 'Feature flags', description: 'Roll out gradually, target audiences, kill instantly.' },
              { title: 'Live analytics', description: 'Understand usage the moment it happens.' },
            ],
          }),
          n('pricing', 'pricing', {
            title: 'Pricing that scales with you',
            background: '#f8fafc',
            plans: [
              { name: 'Hobby', price: '$0', features: ['1 project', 'Community support'] },
              { name: 'Team', price: '$29/mo', features: ['Unlimited projects', 'Priority support', 'Feature flags'] },
              { name: 'Enterprise', price: 'Custom', features: ['SSO & SAML', 'Dedicated support', 'SLA 99.99%'] },
            ],
          }),
          n('faq', 'faq', {
            title: 'Frequently asked questions',
            items: [
              { q: 'Is there a free trial?', a: 'Yes — every plan starts with a 14-day free trial, no credit card required.' },
              { q: 'Can I self-host?', a: 'Enterprise customers can deploy Cloudly in their own VPC.' },
              { q: 'Do you offer support?', a: 'All plans include support; Team and Enterprise get priority response.' },
            ],
          }),
          footer('Cloudly'),
        ]),
      },
    ],
  };
}

function blogTemplate() {
  return {
    name: 'Blog Editorial',
    category: 'blog',
    description: 'Clean editorial blog homepage with featured posts and newsletter signup.',
    thumbnail: '',
    isPublic: true,
    seedVersion: SEED_VERSION,
    pages: [
      {
        title: 'Home',
        slug: 'home',
        theme: null,
        content: page('Home', [
          navbar('The Signal', [{ label: 'Latest', href: '#latest' }, { label: 'Subscribe', href: '#contact' }]),
          n('hero', 'hero', {
            title: 'Notes on building in public',
            subtitle: 'Essays on product, design and running a tiny company — every Thursday.',
            ctaText: 'Subscribe',
            ctaHref: '#contact',
            background: '#faf5ff',
            textColor: '#2e1065',
            align: 'left',
            padding: 88,
          }),
          n('posts', 'section', { background: '#ffffff', padding: 72, maxWidth: 1000 }, [
            n('posts-h', 'heading', { content: 'Latest posts', level: 'h2', fontSize: 28, fontWeight: 800, color: '#1e1b4b' }),
            n('cards', 'featureGrid', {
              title: '',
              subtitle: '',
              columns: 2,
              background: '#ffffff',
              features: [
                { title: 'Why we killed our roadmap', description: 'Quarterly plans were making us slower. Here is what replaced them.' },
                { title: 'Designing for the 5% ', description: 'Edge cases are where products earn (or lose) trust.' },
                { title: 'Pricing is a feature', description: 'What three years of experiments taught us about willingness to pay.' },
                { title: 'The one-person R&D lab', description: 'How to run meaningful research without a research team.' },
              ],
            }),
          ]),
          n('contact', 'contactForm', {
            title: 'Join 4,200 readers',
            subtitle: 'One thoughtful email every Thursday. No spam, ever.',
            submitText: 'Subscribe',
            background: '#faf5ff',
          }),
          footer('The Signal'),
        ]),
      },
    ],
  };
}

function templateLibrary() {
  return [businessTemplate(), portfolioTemplate(), restaurantTemplate(), saasTemplate(), blogTemplate()];
}

// ---------------------------------------------------------------------------
// Seeding logic
// ---------------------------------------------------------------------------
async function seedTemplates() {
  const v2Exists = await Template.exists({ seedVersion: SEED_VERSION });
  if (v2Exists) return { templatesSeeded: false };
  // Replace stale/legacy SEEDED templates only — the isSeeded marker keeps
  // manually created public templates (user/curator data) out of the wipe.
  await Template.deleteMany({ isSeeded: true });
  await Template.insertMany(templateLibrary().map((t) => ({ ...t, isSeeded: true })));
  return { templatesSeeded: true };
}

async function seedDemoSite() {
  const existing = await User.findOne({ email: DEMO_EMAIL });
  if (existing) return { demoUser: existing, demoWebsite: null, created: false };

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const demoUser = await User.create({
    name: DEMO_NAME,
    email: DEMO_EMAIL,
    passwordHash,
  });

  const slug = await generateUniqueSlug(Website, 'nova-studio-demo');
  const website = await Website.create({
    name: 'Nova Creative Studio',
    slug,
    description: 'Public demo website — explore the editor, publish flow and analytics.',
    category: 'agency',
    owner: demoUser._id,
    theme: {
      primary: '#7c3aed',
      secondary: '#06b6d4',
      background: '#ffffff',
      text: '#0f172a',
      accent: '#f59e0b',
      headingFont: 'Inter',
      bodyFont: 'Inter',
      baseSize: 16,
      radius: 12,
    },
    navigation: [],
  });
  await WebsiteMember.create({
    websiteId: website._id,
    userId: demoUser._id,
    role: 'owner',
    invitedBy: demoUser._id,
  });

  const homeContent = page('Home', [
    navbar('Nova Studio', [{ label: 'Work', href: '#work' }, { label: 'Services', href: '#services' }, { label: 'Contact', href: '#contact' }]),
    n('hero', 'hero', {
      title: 'We design brands that stick',
      subtitle: 'Nova is a compact creative studio for ambitious teams — identity, web and launch campaigns.',
      ctaText: 'Start a project',
      ctaHref: '#contact',
      secondaryText: 'See our work',
      secondaryHref: '#work',
      background: '#0f172a',
      textColor: '#ffffff',
      align: 'center',
      padding: 96,
    }),
    n('services', 'featureGrid', {
      title: 'What we do',
      subtitle: 'Three disciplines, one team.',
      columns: 3,
      background: '#ffffff',
      features: [
        { title: 'Brand identity', description: 'Logos, systems and guidelines that scale.' },
        { title: 'Web design', description: 'Marketing sites that convert and delight.' },
        { title: 'Launch campaigns', description: 'From teaser to launch day, fully produced.' },
      ],
    }),
    n('work', 'gallery', {
      images: [
        'https://images.unsplash.com/photo-1558655146-d09347e92766?w=800&q=70',
        'https://images.unsplash.com/photo-1572044162464-0d5fd7b0f00e?w=800&q=70',
        'https://images.unsplash.com/photo-1581291518857-8e12b1da5d9d?w=800&q=70',
      ],
      columns: 3,
      gap: 14,
      radius: 14,
    }),
    n('contact', 'contactForm', {
      title: 'Start a project',
      subtitle: 'Tell us where you want to go — we will map the way.',
      submitText: 'Send inquiry',
      background: '#ffffff',
    }),
    footer('Nova Studio'),
  ]);

  const aboutContent = page('About', [
    navbar('Nova Studio', [{ label: 'Home', href: '#top' }, { label: 'Contact', href: '#contact' }]),
    n('sec', 'section', { background: '#ffffff', padding: 80, maxWidth: 900 }, [
      n('h', 'heading', { content: 'Small team, outsized work', level: 'h1', fontSize: 40, fontWeight: 800, align: 'center', color: '#0f172a' }),
      n('t', 'text', {
        content: 'We are a four-person studio working with a handful of clients each season. That focus shows up in the details: every deliverable is considered, tested and shipped with care.',
        fontSize: 17,
        align: 'center',
        color: '#475569',
        lineHeight: 1.7,
      }),
    ]),
    footer('Nova Studio'),
  ]);

  const home = await Page.create({
    websiteId: website._id,
    title: 'Home',
    slug: 'home',
    path: '/',
    isHome: true,
    order: 0,
    content: homeContent,
  });
  await Page.create({
    websiteId: website._id,
    title: 'About',
    slug: 'about',
    path: '/about',
    isHome: false,
    order: 1,
    content: aboutContent,
  });

  // Publish so the public demo site is immediately viewable at /site/<slug>.
  await publishWebsite(website._id, demoUser._id);
  // Refetch so the returned document reflects the published status.
  const publishedWebsite = await Website.findById(website._id);

  // Seed a believable submissions inbox + analytics so the dashboard looks alive.
  const names = [
    ['Aria Lambert', 'aria@brightloop.io', 'We need a rebrand before our Series A. Timeline?'],
    ['Diego Fontán', 'diego@kassa.mx', 'Loved your Kassa case study — can you quote a full site redesign?'],
    ['Priya Nair', 'priya@orbit.guru', 'Do you take product-launch campaigns or identity only?'],
  ];
  const now = Date.now();
  await FormSubmission.create(
    names.map(([name, email, message], i) => ({
      websiteId: website._id,
      pageId: home._id,
      formId: 'contact',
      data: { name, email, message },
      ip: '203.0.113.' + (10 + i),
      userAgent: 'Mozilla/5.0 (demo seed)',
      createdAt: new Date(now - (i + 1) * 36 * 3600 * 1000),
    }))
  );

  const paths = ['/', '/', '/', '/about', '/'];
  const events = [];
  for (let day = 13; day >= 0; day -= 1) {
    const base = 2 + Math.round(6 * Math.abs(Math.sin(day * 1.7)));
    for (let k = 0; k < base; k += 1) {
      events.push({
        websiteId: website._id,
        pageId: home._id,
        pagePath: paths[(day + k) % paths.length],
        type: 'view',
        referrer: k % 3 === 0 ? 'https://www.google.com/' : '',
        device: k % 2 === 0 ? 'desktop' : 'mobile',
        browser: k % 2 === 0 ? 'Chrome' : 'Safari',
        visitorId: `visitor-${day}-${k}`,
        createdAt: new Date(now - day * 24 * 3600 * 1000 - k * 900 * 1000),
      });
    }
  }
  await AnalyticsEvent.insertMany(events);
  await Website.updateOne({ _id: website._id }, { $set: { viewsCount: events.length } });

  return { demoUser, demoWebsite: publishedWebsite, created: true };
}

// Platform admin account. Idempotent, and self-healing: if a user with the
// admin email exists but isn't an admin (e.g. created before this role was
// wired up), promote it so boot always ends with a working admin.
async function seedAdminUser() {
  const isProd = process.env.NODE_ENV === 'production';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin1234';
  if (isProd && ADMIN_PASSWORD_PLACEHOLDERS.has(ADMIN_PASSWORD.toLowerCase())) {
    throw new Error(
      'ADMIN_PASSWORD is a known placeholder — set a strong ADMIN_PASSWORD env before running in production'
    );
  }
  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    if (existing.role !== 'admin') {
      existing.role = 'admin';
      await existing.save();
    }
    return { adminUser: existing, adminCreated: false };
  }
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const adminUser = await User.create({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    passwordHash,
    role: 'admin',
  });
  return { adminUser, adminCreated: true };
}

/** Runs once per boot. Idempotent. */
async function runSeeds() {
  const templateResult = await seedTemplates();
  const demoResult = await seedDemoSite();
  const adminResult = await seedAdminUser();
  return { ...templateResult, ...demoResult, ...adminResult };
}

module.exports = {
  runSeeds,
  seedTemplates,
  seedDemoSite,
  seedAdminUser,
  DEMO_EMAIL,
  DEMO_PASSWORD,
  DEMO_NAME,
  ADMIN_EMAIL,
  // Mirrors what seedAdminUser() resolves at runtime (env value or default).
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin1234',
  ADMIN_NAME,
  SEED_VERSION,
};
