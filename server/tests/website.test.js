const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
process.env.JWT_EXPIRES_IN = '7d';

const app = require('../src/app');

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

async function createUser(email, name = 'User') {
  const res = await request(app).post('/api/auth/register').send({ name, email, password: 'password123' });
  return { token: res.body.data.token, user: res.body.data.user };
}

describe('Websites', () => {
  test('creates website with auth and default home page', async () => {
    const { token } = await createUser('owner@example.com');
    const res = await request(app)
      .post('/api/websites')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'My Site', category: 'business' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.website.slug).toBeTruthy();

    const pages = await request(app)
      .get(`/api/websites/${res.body.data.website._id}/pages`)
      .set('Authorization', `Bearer ${token}`);
    expect(pages.status).toBe(200);
    expect(pages.body.data.pages.length).toBeGreaterThanOrEqual(1);
  });

  test('lists websites with page counts and pagination', async () => {
    const { token } = await createUser('owner2@example.com');
    await request(app).post('/api/websites').set('Authorization', `Bearer ${token}`).send({ name: 'Site A' });
    await request(app).post('/api/websites').set('Authorization', `Bearer ${token}`).send({ name: 'Site B' });
    const res = await request(app).get('/api/websites?page=1&limit=10').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(2);
    expect(res.body.data.websites[0].pageCount).toBeDefined();
  });

  test('editor cannot delete website, owner can', async () => {
    const owner = await createUser('owner3@example.com', 'Owner');
    const editor = await createUser('editor@example.com', 'Editor');
    const site = await request(app)
      .post('/api/websites')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ name: 'Protected Site' });
    const websiteId = site.body.data.website._id;

    // Invite editor
    const invite = await request(app)
      .post(`/api/websites/${websiteId}/members/invite`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ email: 'editor@example.com', role: 'editor' });
    expect(invite.status).toBe(201);

    // Editor tries to delete → 403
    const delFail = await request(app)
      .delete(`/api/websites/${websiteId}`)
      .set('Authorization', `Bearer ${editor.token}`);
    expect([403, 404]).toContain(delFail.status);
    expect(delFail.body.success).toBe(false);

    // Owner deletes → 200
    const delOk = await request(app)
      .delete(`/api/websites/${websiteId}`)
      .set('Authorization', `Bearer ${owner.token}`);
    expect(delOk.status).toBe(200);
    expect(delOk.body.success).toBe(true);
  });

  test('updates theme and navigation', async () => {
    const { token } = await createUser('theme@example.com');
    const site = await request(app).post('/api/websites').set('Authorization', `Bearer ${token}`).send({ name: 'Theme Site' });
    const websiteId = site.body.data.website._id;
    const themeRes = await request(app)
      .put(`/api/websites/${websiteId}/theme`)
      .set('Authorization', `Bearer ${token}`)
      .send({ primary: '#ff0000' });
    expect(themeRes.status).toBe(200);
    expect(themeRes.body.data.website.theme.primary).toBe('#ff0000');

    const navRes = await request(app)
      .put(`/api/websites/${websiteId}/navigation`)
      .set('Authorization', `Bearer ${token}`)
      .send({ navigation: [{ label: 'Home', linkType: 'page', href: '/' }] });
    expect(navRes.status).toBe(200);
  });

  test('duplicates website', async () => {
    const { token } = await createUser('dup@example.com');
    const site = await request(app).post('/api/websites').set('Authorization', `Bearer ${token}`).send({ name: 'Orig' });
    const dup = await request(app)
      .post(`/api/websites/${site.body.data.website._id}/duplicate`)
      .set('Authorization', `Bearer ${token}`);
    expect(dup.status).toBe(201);
    expect(dup.body.data.website.name).toMatch(/Copy/);
  });
});
