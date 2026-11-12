require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const Template = require('./models/Template');

const PORT = process.env.PORT || 5000;

function n(id, type, props = {}, children = []) {
  return { id, type, props, children };
}

function navbarNode(brand = 'SiteForge') {
  return n('navbar-1', 'navbar', { brand, links: [{ label: 'Home', href: '/' }] }, []);
}

function footerNode() {
  return n('footer-1', 'footer', { text: '© 2026 Powered by SiteForge' }, []);
}

function heroNode(title, subtitle, cta = 'Get Started') {
  return n('hero-1', 'hero', { title, subtitle, ctaText: cta, ctaHref: '#contact' }, []);
}

async function seedTemplatesIfEmpty() {
  const count = await Template.countDocuments();
  if (count > 0) return;

  const businessHome = n('root', 'page', { title: 'Home' }, [
    navbarNode('Acme Co'),
    heroNode('Grow your business', 'We help teams ship faster with a beautiful website.', 'Contact Us'),
    n('features-1', 'featureGrid', { columns: 3 }, [
      n('card-1', 'card', { title: 'Fast', text: 'Blazing fast pages optimized for conversion.' }, []),
      n('card-2', 'card', { title: 'Reliable', text: '99.9% uptime with global CDN.' }, []),
      n('card-3', 'card', { title: 'Secure', text: 'Enterprise-grade security built in.' }, []),
    ]),
    n('testimonials-1', 'testimonials', {}, [
      n('t-1', 'card', { title: 'Jane D.', text: 'Acme doubled our leads in a month!' }, []),
    ]),
    n('contact-1', 'contactForm', { formId: 'contact', title: 'Contact us' }, []),
    footerNode(),
  ]);

  const businessAbout = n('root', 'page', { title: 'About' }, [
    navbarNode('Acme Co'),
    n('sec-1', 'section', { padding: 'large' }, [
      n('h-1', 'heading', { level: 1, text: 'About Acme Co' }, []),
      n('t-1', 'text', { text: 'We are a team of builders helping businesses grow online since 2015.' }, []),
      n('div-1', 'divider', {}, []),
      n('btn-1', 'button', { label: 'Our Work', href: '/' }, []),
    ]),
    footerNode(),
  ]);

  const portfolioHome = n('root', 'page', { title: 'Home' }, [
    navbarNode('Jane Portfolio'),
    heroNode('Hi, I am Jane — Designer', 'I craft delightful brand and web experiences.', 'View Work'),
    n('gal-1', 'gallery', { columns: 3 }, [
      n('img-1', 'image', { src: '', alt: 'Project 1' }, []),
      n('img-2', 'image', { src: '', alt: 'Project 2' }, []),
      n('img-3', 'image', { src: '', alt: 'Project 3' }, []),
    ]),
    n('sp-1', 'spacer', { height: 32 }, []),
    footerNode(),
  ]);

  const restaurantHome = n('root', 'page', { title: 'Home' }, [
    navbarNode('La Trattoria'),
    heroNode('Authentic Italian Cuisine', 'Wood-fired pizza, handmade pasta, fine wine.', 'Reserve a Table'),
    n('sec-menu', 'section', { title: 'Popular dishes' }, [
      n('card-m1', 'card', { title: 'Margherita', text: 'San Marzano tomato, fior di latte, basil.' }, []),
      n('card-m2', 'card', { title: 'Tagliatelle', text: 'Slow-braised ragu, parmigiano.' }, []),
    ]),
    n('contact-1', 'contactForm', { formId: 'reservation', title: 'Book a table' }, []),
    footerNode(),
  ]);

  const restaurantMenu = n('root', 'page', { title: 'Menu' }, [
    navbarNode('La Trattoria'),
    n('sec-1', 'section', {}, [
      n('h-1', 'heading', { level: 1, text: 'Our Menu' }, []),
      n('t-1', 'text', { text: 'Starters, mains and desserts made fresh daily.' }, []),
    ]),
    footerNode(),
  ]);

  const saasHome = n('root', 'page', { title: 'Home' }, [
    navbarNode('Cloudly'),
    heroNode('Ship software faster', 'Cloudly is the all-in-one platform for modern teams.', 'Start Free'),
    n('pricing-1', 'pricing', {}, [
      n('plan-1', 'card', { title: 'Starter', text: '$9/mo — 3 sites' }, []),
      n('plan-2', 'card', { title: 'Pro', text: '$29/mo — unlimited sites' }, []),
    ]),
    n('faq-1', 'faq', {}, [
      n('q-1', 'card', { title: 'Is there a free trial?', text: 'Yes, 14 days free.' }, []),
    ]),
    footerNode(),
  ]);

  const saasFeatures = n('root', 'page', { title: 'Features' }, [
    navbarNode('Cloudly'),
    n('feat-1', 'featureGrid', { columns: 2 }, [
      n('c-1', 'card', { title: 'Analytics', text: 'Real-time insights.' }, []),
      n('c-2', 'card', { title: 'Automations', text: 'Workflows that save hours.' }, []),
    ]),
    footerNode(),
  ]);

  const blogHome = n('root', 'page', { title: 'Home' }, [
    navbarNode('My Blog'),
    n('sec-1', 'section', {}, [
      n('h-1', 'heading', { level: 1, text: 'Latest posts' }, []),
      n('card-p1', 'card', { title: 'Hello world', text: 'My first post about building in public.' }, []),
      n('card-p2', 'card', { title: 'Design tips', text: 'Five tips for cleaner layouts.' }, []),
    ]),
    footerNode(),
  ]);

  const templates = [
    {
      name: 'Business Starter',
      category: 'business',
      description: 'Clean business site with hero, features, testimonials and contact form.',
      thumbnail: '',
      pages: [
        { title: 'Home', slug: 'home', content: businessHome, theme: null },
        { title: 'About', slug: 'about', content: businessAbout, theme: null },
      ],
      isPublic: true,
    },
    {
      name: 'Portfolio Minimal',
      category: 'portfolio',
      description: 'Minimal portfolio with hero and gallery.',
      thumbnail: '',
      pages: [{ title: 'Home', slug: 'home', content: portfolioHome, theme: null }],
      isPublic: true,
    },
    {
      name: 'Restaurant Classic',
      category: 'restaurant',
      description: 'Warm restaurant site with menu and reservation form.',
      thumbnail: '',
      pages: [
        { title: 'Home', slug: 'home', content: restaurantHome, theme: null },
        { title: 'Menu', slug: 'menu', content: restaurantMenu, theme: null },
      ],
      isPublic: true,
    },
    {
      name: 'SaaS Launch',
      category: 'saas',
      description: 'SaaS landing with hero, pricing and FAQ.',
      thumbnail: '',
      pages: [
        { title: 'Home', slug: 'home', content: saasHome, theme: null },
        { title: 'Features', slug: 'features', content: saasFeatures, theme: null },
      ],
      isPublic: true,
    },
    {
      name: 'Blog Simple',
      category: 'blog',
      description: 'Simple blog homepage with post cards.',
      thumbnail: '',
      pages: [{ title: 'Home', slug: 'home', content: blogHome, theme: null }],
      isPublic: true,
    },
  ];

  await Template.insertMany(templates);
  // eslint-disable-next-line no-console
  console.log(`Seeded ${templates.length} templates`);
}

async function start() {
  await connectDB();
  // eslint-disable-next-line no-console
  console.log('MongoDB connected');
  await seedTemplatesIfEmpty();
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`SiteForge server running on port ${PORT}`);
  });
}

if (require.main === module) {
  start().catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

module.exports = { app, seedTemplatesIfEmpty };
