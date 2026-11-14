const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const os = require('os');
const path = require('path');
const fsp = require('fs').promises;

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
process.env.JWT_EXPIRES_IN = '7d';
// Keep test uploads out of the real uploads directory; removed in afterAll.
const uploadDir = path.join(os.tmpdir(), `siteforge-test-uploads-${process.pid}`);
process.env.UPLOAD_DIR = uploadDir;

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
  await fsp.rm(uploadDir, { recursive: true, force: true }).catch(() => {});
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

async function createSite(token, name) {
  const res = await request(app).post('/api/websites').set('Authorization', `Bearer ${token}`).send({ name });
  return res.body.data.website;
}

// Smallest valid PNG (1x1) — passes the server's magic-byte content sniffing.
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

async function uploadMedia(token, websiteId, filename) {
  const req = request(app).post('/api/media').set('Authorization', `Bearer ${token}`);
  if (websiteId) req.field('websiteId', String(websiteId));
  return req.attach('file', TINY_PNG, { filename, contentType: 'image/png' });
}

describe('Media', () => {
  test('standalone list without websiteId returns only the caller\u2019s accessible media', async () => {
    const a = await createUser('a@example.com', 'Alice');
    const b = await createUser('b@example.com', 'Bob');
    const siteA = await createSite(a.token, 'Site A');
    const siteB = await createSite(b.token, 'Site B');
    await uploadMedia(a.token, siteA._id, 'a.png');
    await uploadMedia(b.token, siteB._id, 'b.png');

    const resA = await request(app).get('/api/media').set('Authorization', `Bearer ${a.token}`);
    expect(resA.status).toBe(200);
    expect(resA.body.data.total).toBe(1);
    expect(resA.body.data.media[0].filename).toBe('a.png');

    const resB = await request(app).get('/api/media').set('Authorization', `Bearer ${b.token}`);
    expect(resB.status).toBe(200);
    expect(resB.body.data.total).toBe(1);
    expect(resB.body.data.media[0].filename).toBe('b.png');
  });

  test('standalone list includes media from sites the caller is a member of', async () => {
    const a = await createUser('owner@example.com', 'Owner');
    const c = await createUser('viewer@example.com', 'Viewer');
    const siteA = await createSite(a.token, 'Site A');
    await uploadMedia(a.token, siteA._id, 'shared.png');
    await request(app)
      .post(`/api/websites/${siteA._id}/members/invite`)
      .set('Authorization', `Bearer ${a.token}`)
      .send({ email: 'viewer@example.com', role: 'viewer' })
      .expect(201);

    const res = await request(app).get('/api/media').set('Authorization', `Bearer ${c.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.media[0].filename).toBe('shared.png');
  });

  test('unscoped upload without websiteId is rejected', async () => {
    const a = await createUser('a2@example.com', 'Alice2');
    const res = await uploadMedia(a.token, null, 'orphan.png');
    expect(res.status).toBe(400);
  });

  test('scoped media access is still role-checked on the standalone alias', async () => {
    const a = await createUser('owner2@example.com', 'Owner');
    const b = await createUser('stranger@example.com', 'Stranger');
    const siteA = await createSite(a.token, 'Site A');
    await uploadMedia(a.token, siteA._id, 'private.png');

    const res = await request(app)
      .get(`/api/media?websiteId=${siteA._id}`)
      .set('Authorization', `Bearer ${b.token}`);
    expect(res.status).toBe(403);
  });

  test('owner deletes media via the standalone alias with websiteId param', async () => {
    const a = await createUser('owner3@example.com', 'Owner');
    const siteA = await createSite(a.token, 'Site A');
    const up = await uploadMedia(a.token, siteA._id, 'gone.png');
    expect(up.status).toBe(201);
    const mediaId = up.body.data.media._id;

    const res = await request(app)
      .delete(`/api/media/${mediaId}?websiteId=${siteA._id}`)
      .set('Authorization', `Bearer ${a.token}`);
    expect(res.status).toBe(200);

    const list = await request(app).get('/api/media').set('Authorization', `Bearer ${a.token}`);
    expect(list.status).toBe(200);
    expect(list.body.data.total).toBe(0);
  });
});
