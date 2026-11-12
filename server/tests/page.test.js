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

async function setup() {
  const reg = await request(app).post('/api/auth/register').send({ name: 'Dev', email: 'dev@example.com', password: 'password123' });
  const token = reg.body.data.token;
  const site = await request(app).post('/api/websites').set('Authorization', `Bearer ${token}`).send({ name: 'Page Site' });
  return { token, websiteId: site.body.data.website._id };
}

describe('Pages', () => {
  test('creates, updates and fetches pages', async () => {
    const { token, websiteId } = await setup();
    const create = await request(app)
      .post(`/api/websites/${websiteId}/pages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'About', content: { id: 'root', type: 'page', props: {}, children: [] } });
    expect(create.status).toBe(201);
    const pageId = create.body.data.page._id;

    const update = await request(app)
      .put(`/api/websites/${websiteId}/pages/${pageId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'About Us',
        content: { id: 'root', type: 'page', props: {}, children: [{ id: 'h1', type: 'heading', props: { text: 'Hi' }, children: [] }] },
        createVersion: true,
      });
    expect(update.status).toBe(200);
    expect(update.body.data.page.title).toBe('About Us');

    const list = await request(app).get(`/api/websites/${websiteId}/pages`).set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body.data.pages.length).toBeGreaterThanOrEqual(2);
  });

  test('rejects duplicate slug', async () => {
    const { token, websiteId } = await setup();
    await request(app).post(`/api/websites/${websiteId}/pages`).set('Authorization', `Bearer ${token}`).send({ title: 'Contact', slug: 'contact' });
    const dup = await request(app).post(`/api/websites/${websiteId}/pages`).set('Authorization', `Bearer ${token}`).send({ title: 'Other', slug: 'contact' });
    expect(dup.status).toBe(409);
  });

  test('duplicates, reorders and sets home', async () => {
    const { token, websiteId } = await setup();
    const p1 = await request(app).post(`/api/websites/${websiteId}/pages`).set('Authorization', `Bearer ${token}`).send({ title: 'Services' });
    const pageId = p1.body.data.page._id;

    const dup = await request(app).post(`/api/websites/${websiteId}/pages/${pageId}/duplicate`).set('Authorization', `Bearer ${token}`);
    expect(dup.status).toBe(201);

    const list = await request(app).get(`/api/websites/${websiteId}/pages`).set('Authorization', `Bearer ${token}`);
    const ids = list.body.data.pages.map((p) => p._id);
    const reorder = await request(app)
      .post(`/api/websites/${websiteId}/pages/reorder`)
      .set('Authorization', `Bearer ${token}`)
      .send({ orderedIds: [...ids].reverse() });
    expect(reorder.status).toBe(200);

    const setHome = await request(app).post(`/api/websites/${websiteId}/pages/${pageId}/set-home`).set('Authorization', `Bearer ${token}`);
    expect(setHome.status).toBe(200);
    expect(setHome.body.data.page.isHome).toBe(true);
  });

  test('creates versions and restores', async () => {
    const { token, websiteId } = await setup();
    const p = await request(app).post(`/api/websites/${websiteId}/pages`).set('Authorization', `Bearer ${token}`).send({ title: 'Versioned' });
    const pageId = p.body.data.page._id;

    // Force a snapshot
    const snap = await request(app).post(`/api/websites/${websiteId}/pages/${pageId}/versions/snapshot`).set('Authorization', `Bearer ${token}`);
    expect(snap.status).toBe(201);

    const versions = await request(app).get(`/api/websites/${websiteId}/pages/${pageId}/versions`).set('Authorization', `Bearer ${token}`);
    expect(versions.status).toBe(200);
    expect(versions.body.data.versions.length).toBeGreaterThanOrEqual(1);

    const vNum = versions.body.data.versions[0].versionNumber;
    const restore = await request(app).post(`/api/websites/${websiteId}/pages/${pageId}/versions/${vNum}/restore`).set('Authorization', `Bearer ${token}`);
    expect(restore.status).toBe(200);
  });
});
