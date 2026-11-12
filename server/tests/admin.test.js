// Admin system test suite:
//  - seeded admin account (seedAdminUser) logs in with role 'admin'
//  - non-admins and anonymous users are blocked from every /api/admin route
//  - GET /api/admin/stats returns platform-wide counts
//  - GET /api/admin/users + PATCH role change (self-change blocked, invalid role rejected)
//  - GET /api/admin/websites (owner populated) + admin force-delete + unpublish
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
process.env.JWT_EXPIRES_IN = '7d';

const app = require('../src/app');
const {
  seedDemoSite,
  seedAdminUser,
  DEMO_EMAIL,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
} = require('../src/services/seed.service');

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

async function adminLogin() {
  const res = await request(app).post('/api/auth/login').send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  return res.body.data;
}

describe('Admin account seeding', () => {
  test('seedAdminUser creates a working admin whose credentials log in with role admin', async () => {
    const seeded = await seedAdminUser();
    expect(seeded.adminCreated).toBe(true);
    expect(seeded.adminUser.role).toBe('admin');

    // Idempotent: a second run must not duplicate
    const again = await seedAdminUser();
    expect(again.adminCreated).toBe(false);

    const login = await request(app).post('/api/auth/login').send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
    expect(login.status).toBe(200);
    expect(login.body.data.user.email).toBe(ADMIN_EMAIL);
    expect(login.body.data.user.role).toBe('admin');
    expect(login.body.data.token).toBeTruthy();
  });

  test('an existing user with the admin email is promoted to admin on seed', async () => {
    await registerUser(ADMIN_EMAIL, 'Legacy Admin');
    const seeded = await seedAdminUser();
    expect(seeded.adminCreated).toBe(false);
    expect(seeded.adminUser.role).toBe('admin');
  });
});

describe('Admin route authorization', () => {
  test('anonymous users get 401 and regular users get 403 on admin routes', async () => {
    const anonymous = await request(app).get('/api/admin/stats');
    expect(anonymous.status).toBe(401);

    const user = await registerUser('regular@example.com', 'Regular');
    const forbidden = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${user.token}`);
    expect(forbidden.status).toBe(403);
    expect(forbidden.body.success).toBe(false);
  });

  test('a regular site owner cannot use admin website management', async () => {
    const user = await registerUser();
    const site = await request(app)
      .post('/api/websites')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ name: 'Owner Site' });
    expect(site.status).toBe(201);
    const id = site.body.data.website._id;

    const del = await request(app)
      .delete(`/api/admin/websites/${id}`)
      .set('Authorization', `Bearer ${user.token}`);
    expect(del.status).toBe(403);
  });
});

describe('Admin stats + users', () => {
  test('GET /api/admin/stats returns platform-wide counts and recent lists', async () => {
    await seedAdminUser();
    await seedDemoSite();
    const { token } = await adminLogin();

    const res = await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    const { stats, recentUsers, recentWebsites } = res.body.data;
    expect(stats.users).toBeGreaterThanOrEqual(2); // admin + demo
    expect(stats.websites).toBeGreaterThanOrEqual(1);
    expect(stats.published).toBeGreaterThanOrEqual(1);
    expect(stats.drafts).toBe(stats.websites - stats.published);
    expect(Array.isArray(recentUsers)).toBe(true);
    expect(Array.isArray(recentWebsites)).toBe(true);
  });

  test('GET /api/admin/users lists users with site counts and supports search', async () => {
    await seedAdminUser();
    await seedDemoSite(); // demo user owns 1 site
    await registerUser('plain@example.com', 'Plain User');
    const { token } = await adminLogin();

    const all = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${token}`);
    expect(all.status).toBe(200);
    expect(all.body.data.total).toBe(3);

    const demoRow = all.body.data.users.find((u) => u.email === DEMO_EMAIL);
    expect(demoRow.sitesOwned).toBe(1);
    expect(demoRow.role).toBe('user');

    const searched = await request(app)
      .get('/api/admin/users?search=demo')
      .set('Authorization', `Bearer ${token}`);
    expect(searched.status).toBe(200);
    expect(searched.body.data.total).toBe(1);
    expect(searched.body.data.users[0].email).toBe(DEMO_EMAIL);
  });

  test('PATCH /api/admin/users/:id/role promotes a user, rejects invalid role and self-change', async () => {
    await seedAdminUser();
    const { token, user: admin } = await adminLogin();
    const target = await registerUser('victim@example.com', 'Victim');

    const promote = await request(app)
      .patch(`/api/admin/users/${target.user._id}/role`)
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'admin' });
    expect(promote.status).toBe(200);
    expect(promote.body.data.user.role).toBe('admin');

    // New admin can use admin routes now
    const nowAdmin = await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${target.token}`);
    expect(nowAdmin.status).toBe(200);

    const invalid = await request(app)
      .patch(`/api/admin/users/${target.user._id}/role`)
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'superadmin' });
    expect(invalid.status).toBe(400);

    const selfChange = await request(app)
      .patch(`/api/admin/users/${admin._id}/role`)
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'user' });
    expect(selfChange.status).toBe(400);
    expect(selfChange.body.message).toMatch(/own role/i);
  });
});

describe('Admin website management', () => {
  test('GET /api/admin/websites lists all sites with owner populated + page counts', async () => {
    await seedAdminUser();
    await seedDemoSite();
    await registerUser('other@example.com', 'Other');
    const { token } = await adminLogin();

    const res = await request(app).get('/api/admin/websites').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBeGreaterThanOrEqual(1);
    const demo = res.body.data.websites.find((w) => w.slug.includes('nova'));
    expect(demo).toBeTruthy();
    expect(demo.owner.email).toBe(DEMO_EMAIL);
    expect(demo.pageCount).toBeGreaterThan(0);

    // Status filter works
    const drafts = await request(app)
      .get('/api/admin/websites?status=draft')
      .set('Authorization', `Bearer ${token}`);
    expect(drafts.body.data.websites.every((w) => w.status === 'draft')).toBe(true);
  });

  test('POST /api/admin/websites/:id/unpublish takes a live site offline', async () => {
    await seedAdminUser();
    const { demoWebsite } = await seedDemoSite();
    const { token } = await adminLogin();

    const publicBefore = await request(app).get(`/api/websites/slug/${demoWebsite.slug}`);
    expect(publicBefore.status).toBe(200);

    const res = await request(app)
      .post(`/api/admin/websites/${demoWebsite._id}/unpublish`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.website.status).toBe('draft');

    const publicAfter = await request(app).get(`/api/websites/slug/${demoWebsite.slug}`);
    expect(publicAfter.status).toBe(404);
  });

  test('DELETE /api/admin/websites/:id force-deletes any site with full cleanup', async () => {
    await seedAdminUser();
    const user = await registerUser('owner2@example.com', 'Owner2');
    const site = await request(app)
      .post('/api/websites')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ name: 'Doomed Site' });
    const id = site.body.data.website._id;

    const { token } = await adminLogin();
    const res = await request(app).delete(`/api/admin/websites/${id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.deleted).toBe(true);

    // Gone from the platform-wide list
    const list = await request(app).get('/api/admin/websites?search=doomed').set('Authorization', `Bearer ${token}`);
    expect(list.body.data.total).toBe(0);

    // Owner membership was cleaned up: the (former) owner sees no sites
    const mine = await request(app)
      .get('/api/websites')
      .set('Authorization', `Bearer ${user.token}`);
    expect(mine.body.data.websites.length).toBe(0);

    const missing = await request(app).delete(`/api/admin/websites/${id}`).set('Authorization', `Bearer ${token}`);
    expect(missing.status).toBe(404);
  });
});