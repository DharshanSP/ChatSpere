import request from 'supertest';
import { getDb, close } from '../src/database';
import { app } from '../server';

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret-key';
  await getDb();
});

afterAll(() => close());

describe('Input Validation', () => {
  let token: string;
  let userId: string;

  beforeAll(async () => {
    const timestamp = Date.now();
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'valtest_' + timestamp,
        email: `val_${timestamp}@test.com`,
        password: 'password123',
        displayName: 'Validation Test',
      });
    token = res.body.token;
    userId = res.body.user.id;
  });

  describe('Auth validation', () => {
    it('should reject username with special characters', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'user@name!',
          email: 'valid@test.com',
          password: 'password123',
          displayName: 'Test',
        });
      expect(res.status).toBe(400);
    });

    it('should reject password shorter than 6 chars', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'validuser123',
          email: 'valid123@test.com',
          password: '12345',
          displayName: 'Test',
        });
      expect(res.status).toBe(400);
    });

    it('should reject empty display name', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'validuser456',
          email: 'valid456@test.com',
          password: 'password123',
          displayName: '',
        });
      expect(res.status).toBe(400);
    });
  });

  describe('Chat validation', () => {
    it('should reject non-UUID participantId', async () => {
      const res = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${token}`)
        .send({ participantId: 'not-a-uuid' });
      expect(res.status).toBe(400);
    });

    it('should reject empty message content', async () => {
      const res = await request(app)
        .post('/api/chats/message')
        .set('Authorization', `Bearer ${token}`)
        .send({ chatId: '00000000-0000-0000-0000-000000000000', content: '' });
      expect(res.status).toBe(400);
    });

    it('should reject invalid messageType', async () => {
      const res = await request(app)
        .post('/api/chats/message')
        .set('Authorization', `Bearer ${token}`)
        .send({ chatId: '00000000-0000-0000-0000-000000000000', content: 'Hi', messageType: 'invalid' });
      expect(res.status).toBe(400);
    });
  });

  describe('Group validation', () => {
    it('should reject group name longer than 100 chars', async () => {
      const res = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'a'.repeat(101), members: [userId, userId] });
      expect(res.status).toBe(400);
    });

    it('should reject description longer than 500 chars', async () => {
      const res = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Valid Name', description: 'a'.repeat(501), members: [userId, userId] });
      expect(res.status).toBe(400);
    });
  });

  describe('User validation', () => {
    it('should reject bio longer than 500 chars', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ bio: 'a'.repeat(501) });
      expect(res.status).toBe(400);
    });

    it('should reject non-UUID user ID param', async () => {
      const res = await request(app)
        .get('/api/users/not-a-uuid')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
    });
  });

  describe('Error response format', () => {
    it('should return structured validation errors', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'ab' }); // too short + missing fields

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toBe('Validation error');
      expect(res.body).toHaveProperty('errors');
      expect(Array.isArray(res.body.errors)).toBe(true);
    });
  });
});
