const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
process.env.JWT_EXPIRES_IN = '7d';
process.env.CLIENT_URL = 'http://localhost:5173';

const app = require('../src/app');

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  await mongoose.connect(uri);
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

async function registerUser(name = 'Alice', email = 'alice@example.com', password = 'password123') {
  const res = await request(app).post('/api/auth/register').send({ name, email, password });
  return res;
}

describe('Auth', () => {
  test('registers a new user', async () => {
    const res = await registerUser();
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('alice@example.com');
    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  test('rejects duplicate email', async () => {
    await registerUser();
    const res = await registerUser('Alice2', 'alice@example.com', 'password123');
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  test('logs in with valid credentials', async () => {
    await registerUser();
    const res = await request(app).post('/api/auth/login').send({ email: 'alice@example.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeTruthy();
  });

  test('rejects invalid login', async () => {
    await registerUser();
    const res = await request(app).post('/api/auth/login').send({ email: 'alice@example.com', password: 'wrongpass' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('fetches me with token', async () => {
    const reg = await registerUser();
    const token = reg.body.data.token;
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('alice@example.com');
  });

  test('rejects me without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('rejects website creation without auth', async () => {
    const res = await request(app).post('/api/websites').send({ name: 'NoAuth Site' });
    expect(res.status).toBe(401);
  });

  test('changes password and old password stops working', async () => {
    const reg = await registerUser('Bob', 'bob@example.com', 'password123');
    const token = reg.body.data.token;

    const change = await request(app)
      .patch('/api/auth/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'password123', newPassword: 'brand-new-pass' });
    expect(change.status).toBe(200);
    expect(change.body.success).toBe(true);

    const oldLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bob@example.com', password: 'password123' });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bob@example.com', password: 'brand-new-pass' });
    expect(newLogin.status).toBe(200);
  });

  test('rejects password change with wrong current password', async () => {
    const reg = await registerUser('Cara', 'cara@example.com', 'password123');
    const res = await request(app)
      .patch('/api/auth/password')
      .set('Authorization', `Bearer ${reg.body.data.token}`)
      .send({ currentPassword: 'wrong-pass-1', newPassword: 'brand-new-pass' });
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe('WRONG_PASSWORD');
  });

  test('rejects password change with short new password', async () => {
    const reg = await registerUser('Dan', 'dan@example.com', 'password123');
    const res = await request(app)
      .patch('/api/auth/password')
      .set('Authorization', `Bearer ${reg.body.data.token}`)
      .send({ currentPassword: 'password123', newPassword: 'short' });
    expect(res.status).toBe(400);
  });

  test('rejects password change without auth', async () => {
    const res = await request(app)
      .patch('/api/auth/password')
      .send({ currentPassword: 'password123', newPassword: 'brand-new-pass' });
    expect(res.status).toBe(401);
  });
});
