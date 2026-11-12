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
  const reg = await request(app).post('/api/auth/register').send({ name: 'Pub', email: 'pub@example.com', password: 'password123' });
  const token = reg.body.data.token;
  const site = await request(app).post('/api/websites').set('Authorization', `Bearer ${token}`).send({ name: 'Publish Site' });
  return { token, websiteId: site.body.data.website._id };
}

describe('Publish flow', () => {
  test('publishes and unpublishes website', async () => {
    const { token, websiteId } = await setup();
    const pub = await request(app).post(`/api/websites/${websiteId}/publish`).set('Authorization', `Bearer ${token}`);
    expect(pub.status).toBe(200);
    expect(pub.body.data.website.status).toBe('published');
    expect(pub.body.data.publishVersion).toBeTruthy();

    const unpub = await request(app).post(`/api/websites/${websiteId}/unpublish`).set('Authorization', `Bearer ${token}`);
    expect(unpub.status).toBe(200);
    expect(unpub.body.data.website.status).toBe('draft');
  });

  test('accepts public form submission and lists as owner', async () => {
    const { token, websiteId } = await setup();
    const submit = await request(app).post(`/api/websites/${websiteId}/forms/submit`).send({ formId: 'contact', data: { name: 'Bob', email: 'bob@test.com' } });
    expect(submit.status).toBe(201);
    expect(submit.body.success).toBe(true);

    const list = await request(app).get(`/api/websites/${websiteId}/forms`).set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body.data.total).toBe(1);
  });

  test('tracks analytics view publicly and summarizes as owner', async () => {
    const { token, websiteId } = await setup();
    const track = await request(app).post('/api/analytics/track').send({ websiteId, pagePath: '/', visitorId: 'v-1' });
    expect(track.status).toBe(201);

    const summary = await request(app).get(`/api/analytics/${websiteId}/summary`).set('Authorization', `Bearer ${token}`);
    expect(summary.status).toBe(200);
    expect(summary.body.data.views).toBeGreaterThanOrEqual(1);
  });

  test('version restore via page versions after publish', async () => {
    const { token, websiteId } = await setup();
    const created = await request(app)
      .post(`/api/websites/${websiteId}/pages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Landing', content: { id: 'root', type: 'page', props: { v: 1 }, children: [] } });
    const pageId = created.body.data.page._id;

    await request(app)
      .put(`/api/websites/${websiteId}/pages/${pageId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: { id: 'root', type: 'page', props: { v: 2 }, children: [] }, createVersion: true });

    const versions = await request(app).get(`/api/websites/${websiteId}/pages/${pageId}/versions`).set('Authorization', `Bearer ${token}`);
    expect(versions.body.data.total || versions.body.data.versions.length).toBeTruthy();
    const vNum = versions.body.data.versions[0].versionNumber;

    const pub = await request(app).post(`/api/websites/${websiteId}/publish`).set('Authorization', `Bearer ${token}`);
    expect(pub.status).toBe(200);

    const restore = await request(app)
      .post(`/api/websites/${websiteId}/pages/${pageId}/versions/${vNum}/restore`)
      .set('Authorization', `Bearer ${token}`);
    expect(restore.status).toBe(200);
  });
});
