import request from 'supertest';
import { getDb, close } from '../src/database';
import { app } from '../server';

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret-key';
  process.env.PORT = '3001';
  // Initialize DB connection
  await getDb();
});

afterAll(async () => {
  close();
});

describe('Auth Endpoints', () => {
  const testUser = {
    username: 'testuser_' + Date.now(),
    email: `test_${Date.now()}@test.com`,
    password: 'password123',
    displayName: 'Test User',
  };

  let token: string;
  let userId: string;

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.username).toBe(testUser.username);
      expect(res.body.user.email).toBe(testUser.email);
      expect(res.body.user.displayName).toBe(testUser.displayName);
      expect(res.body.user).not.toHaveProperty('password');

      token = res.body.token;
      userId = res.body.user.id;
    });

    it('should reject registration with missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'incomplete' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('should reject registration with short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'shortpass',
          email: 'short@test.com',
          password: '123',
          displayName: 'Short',
        });

      expect(res.status).toBe(400);
    });

    it('should reject registration with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'bademail',
          email: 'not-an-email',
          password: 'password123',
          displayName: 'Bad Email',
        });

      expect(res.status).toBe(400);
    });

    it('should reject registration with short username', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'ab',
          email: 'ab@test.com',
          password: 'password123',
          displayName: 'AB',
        });

      expect(res.status).toBe(400);
    });

    it('should reject duplicate email registration', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'different_user',
          email: testUser.email,
          password: 'password123',
          displayName: 'Different',
        });

      expect(res.status).toBe(409);
    });

    it('should reject duplicate username registration', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: testUser.username,
          email: 'different@test.com',
          password: 'password123',
          displayName: 'Different',
        });

      expect(res.status).toBe(409);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(testUser.email);
    });

    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        });

      expect(res.status).toBe(401);
    });

    it('should reject login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'password123',
        });

      expect(res.status).toBe(401);
    });

    it('should reject login with missing email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'password123' });

      expect(res.status).toBe(400);
    });

    it('should reject login with missing password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email });

      expect(res.status).toBe(400);
    });
  });
});
