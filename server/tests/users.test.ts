import request from 'supertest';
import { getDb, close } from '../src/database';
import { app } from '../server';

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret-key';
  await getDb();
});

afterAll(() => close());

describe('User Endpoints', () => {
  let token: string;
  let userId: string;
  let secondToken: string;
  let secondUserId: string;

  beforeAll(async () => {
    // Register primary test user
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'usertest_' + Date.now(),
        email: `user_${Date.now()}@test.com`,
        password: 'password123',
        displayName: 'User Test',
      });
    token = res.body.token;
    userId = res.body.user.id;

    // Register second user
    const res2 = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'usertest2_' + Date.now(),
        email: `user2_${Date.now()}@test.com`,
        password: 'password123',
        displayName: 'User Test 2',
      });
    secondToken = res2.body.token;
    secondUserId = res2.body.user.id;
  });

  describe('GET /api/users', () => {
    it('should require authentication', async () => {
      const res = await request(app).get('/api/users');
      expect(res.status).toBe(401);
    });

    it('should return users list (excluding self)', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      // Should not include self
      const ids = res.body.map((u: any) => u.id);
      expect(ids).not.toContain(userId);
      // All returned users should be public (no passwords)
      res.body.forEach((u: any) => {
        expect(u).not.toHaveProperty('password');
      });
    });

    it('should search users by query', async () => {
      const res = await request(app)
        .get('/api/users?search=User')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('should return empty array for no matches', async () => {
      const res = await request(app)
        .get('/api/users?search=zzzznonexistent')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get a user by ID', async () => {
      const res = await request(app)
        .get(`/api/users/${secondUserId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(secondUserId);
      expect(res.body).not.toHaveProperty('password');
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .get('/api/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it('should reject invalid UUID format', async () => {
      const res = await request(app)
        .get('/api/users/not-a-uuid')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should update display name', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ displayName: 'Updated Name' });

      expect(res.status).toBe(200);
      expect(res.body.displayName).toBe('Updated Name');
    });

    it('should update bio', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ bio: 'Hello world!' });

      expect(res.status).toBe(200);
      expect(res.body.bio).toBe('Hello world!');
    });

    it('should update multiple fields at once', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ displayName: 'Multi Update', bio: 'Testing multiple fields' });

      expect(res.status).toBe(200);
      expect(res.body.displayName).toBe('Multi Update');
      expect(res.body.bio).toBe('Testing multiple fields');
    });

    it('should reject empty display name', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ displayName: '' });

      expect(res.status).toBe(400);
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .send({ displayName: 'No Auth' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/users/online', () => {
    it('should return online users list', async () => {
      const res = await request(app)
        .get('/api/users/online')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should require authentication', async () => {
      const res = await request(app).get('/api/users/online');
      expect(res.status).toBe(401);
    });
  });
});
