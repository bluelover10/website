// Demo-account + new-endpoint test suite:
//  - demo credentials login (seeded demo user)
//  - public published-site endpoint /api/websites/slug/:slug
//  - template library v2 seeding + POST /api/websites/from-template/:templateId
//  - PUT /theme with wrapped {theme} body + client keys (baseSize/radius/buttonStyle)
//  - PUT /websites/:id with slug + seo
//  - analytics summary window fields (today/week/month)
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
process.env.JWT_EXPIRES_IN = '7d';

const app = require('../src/app');
const { seedTemplates, seedDemoSite, DEMO_EMAIL, DEMO_PASSWORD } = require('../src/services/seed.service');

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    // eslint-disable-next-line no-await-in-loop
    await collections[key].deleteMany({});
  }
});

async function registerUser(email = 'owner@example.com', name = 'Owner') {
  const res = await request(app).post('/api/auth/register').send({ name, email, password: 'password123' });
  return res.body.data;
}

describe('Demo account', () => {
  test('seedDemoSite creates a published demo site and its credentials log in', async () => {
    const result = await seedDemoSite();
    expect(result.created).toBe(true);
    expect(result.demoWebsite.status).toBe('published');

    // Demo login via public endpoint
    const login = await request(app).post('/api/auth/login').send({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
    expect(login.status).toBe(200);
    expect(login.body.data.user.email).toBe(DEMO_EMAIL);
    expect(login.body.data.token).toBeTruthy();

    // Idempotent: a second run must not duplicate
    const again = await seedDemoSite();
    expect(again.created).toBe(false);
  });

  test('GET /api/websites/slug/:slug returns the published demo site without auth', async () => {
    const { demoWebsite } = await seedDemoSite();
    const res = await request(app).get(`/api/websites/slug/${demoWebsite.slug}`);
    expect(res.status).toBe(200);
    expect(res.body.data.website.status).toBe('published');
    expect(Array.isArray(res.body.data.pages)).toBe(true);
    expect(res.body.data.pages.length).toBeGreaterThan(0);
    const home = res.body.data.pages.find((p) => p.isHome);
    expect(home).toBeTruthy();
    expect(home.content?.type).toBe('root');
    expect(home.content?.children?.length).toBeGreaterThan(0);
  });

  test('GET /api/websites/slug/:slug 404s for unknown or unpublished sites', async () => {
    const { demoWebsite } = await seedDemoSite();
    const unknown = await request(app).get('/api/websites/slug/does-not-exist');
    expect(unknown.status).toBe(404);

    // Draft site must not be publicly visible
    const user = await registerUser();
    const site = await request(app)
      .post('/api/websites')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ name: 'Hidden Draft' });
    expect(site.status).toBe(201);
    const draftRes = await request(app).get(`/api/websites/slug/${site.body.data.website.slug}`);
    expect(draftRes.status).toBe(404);
    expect(demoWebsite.status).toBe('published'); // unchanged
  });
});

describe('Template library v2 + from-template', () => {
  test('seedTemplates inserts renderer-correct public templates exactly once', async () => {
    const first = await seedTemplates();
    expect(first.templatesSeeded).toBe(true);
    const second = await seedTemplates();
    expect(second.templatesSeeded).toBe(false);
  });

  test('POST /api/websites/from-template/:templateId creates a site with template pages', async () => {
    await seedTemplates();
    const templates = await request(app).get('/api/templates');
    expect(templates.status).toBe(200);
    const template = templates.body.data.templates.find((t) => t.category === 'business');
    expect(template).toBeTruthy();

    const user = await registerUser();
    const res = await request(app)
      .post(`/api/websites/from-template/${template._id}`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({ name: 'My Business' });
    expect(res.status).toBe(201);
    const websiteId = res.body.data.website._id;

    // Owner membership created
    const members = await request(app)
      .get(`/api/websites/${websiteId}/members`)
      .set('Authorization', `Bearer ${user.token}`);
    expect(members.status).toBe(200);
    expect(members.body.data.members.some((m) => m.role === 'owner')).toBe(true);

    // Template pages copied with renderer-correct root + children
    const pages = await request(app)
      .get(`/api/websites/${websiteId}/pages`)
      .set('Authorization', `Bearer ${user.token}`);
    expect(pages.status).toBe(200);
    const pageList = pages.body.data.pages;
    expect(pageList.length).toBe(template.pages.length);
    const home = pageList.find((p) => p.slug === 'home');
    expect(home.isHome).toBe(true);
    expect(home.content.type).toBe('root');
    const hero = home.content.children.find((c) => c.type === 'hero');
    expect(hero).toBeTruthy();
    expect(hero.props.title).toBeTruthy();
  });

  test('from-template 404s for unknown template ids', async () => {
    const user = await registerUser();
    const res = await request(app)
      .post('/api/websites/from-template/000000000000000000000000')
      .set('Authorization', `Bearer ${user.token}`)
      .send({});
    expect(res.status).toBe(404);
  });
});

describe('Theme + website update contracts', () => {
  test('PUT /theme accepts wrapped {theme} body with client keys', async () => {
    const user = await registerUser();
    const site = await request(app)
      .post('/api/websites')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ name: 'Theme Test' });
    const id = site.body.data.website._id;

    const res = await request(app)
      .put(`/api/websites/${id}/theme`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({ theme: { primary: '#7c3aed', baseSize: 18, radius: 12, buttonStyle: 'solid' } });
    expect(res.status).toBe(200);

    const fetched = await request(app)
      .get(`/api/websites/${id}`)
      .set('Authorization', `Bearer ${user.token}`);
    const theme = fetched.body.data.website.theme;
    expect(theme.primary).toBe('#7c3aed');
    expect(theme.baseSize).toBe(18);
    expect(theme.radius).toBe(12);
    expect(theme.buttonStyle).toBe('solid');
  });

  test('PUT /websites/:id persists slug and seo changes', async () => {
    const user = await registerUser();
    const site = await request(app)
      .post('/api/websites')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ name: 'SEO Test' });
    const id = site.body.data.website._id;

    const res = await request(app)
      .put(`/api/websites/${id}`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({ slug: 'seo-test-site', seo: { title: 'My Site Title', description: 'Best site ever' } });
    expect(res.status).toBe(200);
    expect(res.body.data.website.slug).toBe('seo-test-site');
    expect(res.body.data.website.seo.title).toBe('My Site Title');

    // Duplicate slug is rejected
    const other = await request(app)
      .post('/api/websites')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ name: 'Second Site' });
    const clash = await request(app)
      .put(`/api/websites/${other.body.data.website._id}`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({ slug: 'seo-test-site' });
    expect(clash.status).toBe(409);
  });
});

describe('Analytics summary windows', () => {
  test('GET /:websiteId/summary returns today/week/month fields', async () => {
    const user = await registerUser();
    const site = await request(app)
      .post('/api/websites')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ name: 'Analytics Test' });
    const id = site.body.data.website._id;

    await request(app).post('/api/analytics/track').send({ websiteId: id, pagePath: '/' });

    const res = await request(app)
      .get(`/api/analytics/${id}/summary`)
      .set('Authorization', `Bearer ${user.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.views).toBe(1);
    expect(res.body.data.today).toBe(1);
    expect(res.body.data.week).toBe(1);
    expect(res.body.data.month).toBe(1);
    expect(Array.isArray(res.body.data.byPage)).toBe(true);
    expect(Array.isArray(res.body.data.byDay)).toBe(true);
  });
});
