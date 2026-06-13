import request from 'supertest';
import { getDb, close } from '../src/database';
import { app } from '../server';

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret-key';
  await getDb();
});

afterAll(() => close());

describe('Chat Endpoints', () => {
  let aliceToken: string;
  let aliceId: string;
  let bobToken: string;
  let bobId: string;
  let charlieToken: string;
  let charlieId: string;

  beforeAll(async () => {
    const timestamp = Date.now();

    // Register Alice
    const alice = await request(app)
      .post('/api/auth/register')
      .send({ username: 'alice_' + timestamp, email: `alice_${timestamp}@test.com`, password: 'password123', displayName: 'Alice' });
    aliceToken = alice.body.token;
    aliceId = alice.body.user.id;

    // Register Bob
    const bob = await request(app)
      .post('/api/auth/register')
      .send({ username: 'bob_' + timestamp, email: `bob_${timestamp}@test.com`, password: 'password123', displayName: 'Bob' });
    bobToken = bob.body.token;
    bobId = bob.body.user.id;

    // Register Charlie
    const charlie = await request(app)
      .post('/api/auth/register')
      .send({ username: 'charlie_' + timestamp, email: `charlie_${timestamp}@test.com`, password: 'password123', displayName: 'Charlie' });
    charlieToken = charlie.body.token;
    charlieId = charlie.body.user.id;
  });

  describe('POST /api/chats', () => {
    it('should create a new chat between two users', async () => {
      const res = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ participantId: bobId });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.participants).toHaveLength(2);
      const ids = res.body.participants.map((p: any) => p.id);
      expect(ids).toContain(aliceId);
      expect(ids).toContain(bobId);
    });

    it('should return existing chat instead of creating duplicate', async () => {
      // Create the same chat again
      const res = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ participantId: bobId });

      expect(res.status).toBe(200); // Returns existing chat
      expect(res.body).toHaveProperty('id');
    });

    it('should reject chat with self', async () => {
      const res = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ participantId: aliceId });

      expect(res.status).toBe(400);
    });

    it('should reject chat with non-existent user', async () => {
      const res = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ participantId: '00000000-0000-0000-0000-000000000000' });

      expect(res.status).toBe(404);
    });

    it('should reject missing participantId', async () => {
      const res = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('should reject invalid participantId format', async () => {
      const res = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ participantId: 'not-a-uuid' });

      expect(res.status).toBe(400);
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/chats')
        .send({ participantId: bobId });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/chats', () => {
    it('should return user chats', async () => {
      const res = await request(app)
        .get('/api/chats')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('should require authentication', async () => {
      const res = await request(app).get('/api/chats');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/chats/:id', () => {
    let chatId: string;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ participantId: bobId });
      chatId = res.body.id;
    });

    it('should get chat by ID', async () => {
      const res = await request(app)
        .get(`/api/chats/${chatId}`)
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(chatId);
      expect(res.body.participants).toHaveLength(2);
    });

    it('should return 404 for non-existent chat', async () => {
      const res = await request(app)
        .get('/api/chats/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(404);
    });

    it('should return 403 for non-participant', async () => {
      const res = await request(app)
        .get(`/api/chats/${chatId}`)
        .set('Authorization', `Bearer ${charlieToken}`);

      expect(res.status).toBe(403);
    });

    it('should reject invalid chat ID format', async () => {
      const res = await request(app)
        .get('/api/chats/invalid-id')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/chats/message', () => {
    let chatId: string;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ participantId: bobId });
      chatId = res.body.id;
    });

    it('should send a message', async () => {
      const res = await request(app)
        .post('/api/chats/message')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ chatId, content: 'Hello Bob!' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.content).toBe('Hello Bob!');
      expect(res.body.sender.id).toBe(aliceId);
    });

    it('should reject empty content', async () => {
      const res = await request(app)
        .post('/api/chats/message')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ chatId, content: '' });

      expect(res.status).toBe(400);
    });

    it('should reject missing chatId', async () => {
      const res = await request(app)
        .post('/api/chats/message')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ content: 'No chat ID' });

      expect(res.status).toBe(400);
    });

    it('should reject message to non-participant chat', async () => {
      const res = await request(app)
        .post('/api/chats/message')
        .set('Authorization', `Bearer ${charlieToken}`)
        .send({ chatId, content: 'Unauthorized!' });

      expect(res.status).toBe(403);
    });

    it('should reject message to non-existent chat', async () => {
      const res = await request(app)
        .post('/api/chats/message')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ chatId: '00000000-0000-0000-0000-000000000000', content: 'Hello?' });

      expect(res.status).toBe(404);
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/chats/message')
        .send({ chatId, content: 'No auth' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/chats/:chatId/messages', () => {
    let chatId: string;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ participantId: bobId });
      chatId = res.body.id;

      // Send a few messages
      await request(app)
        .post('/api/chats/message')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ chatId, content: 'Message 1' });

      await request(app)
        .post('/api/chats/message')
        .set('Authorization', `Bearer ${bobToken}`)
        .send({ chatId, content: 'Message 2' });
    });

    it('should get messages for a chat', async () => {
      const res = await request(app)
        .get(`/api/chats/${chatId}/messages`)
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('messages');
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('page');
      expect(res.body).toHaveProperty('hasMore');
      expect(res.body.messages.length).toBeGreaterThanOrEqual(2);
    });

    it('should paginate messages', async () => {
      const res = await request(app)
        .get(`/api/chats/${chatId}/messages?page=1&limit=1`)
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(res.body.messages.length).toBeLessThanOrEqual(1);
      expect(res.body.hasMore).toBe(true);
    });

    it('should return 403 for non-participant', async () => {
      const res = await request(app)
        .get(`/api/chats/${chatId}/messages`)
        .set('Authorization', `Bearer ${charlieToken}`);

      expect(res.status).toBe(403);
    });

    it('should reject invalid chatId format', async () => {
      const res = await request(app)
        .get('/api/chats/not-a-uuid/messages')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/chats/read', () => {
    let chatId: string;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ participantId: bobId });
      chatId = res.body.id;

      await request(app)
        .post('/api/chats/message')
        .set('Authorization', `Bearer ${bobToken}`)
        .send({ chatId, content: 'Read test message' });
    });

    it('should mark messages as read', async () => {
      const res = await request(app)
        .put('/api/chats/read')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ chatId });

      expect(res.status).toBe(200);
    });

    it('should reject missing chatId', async () => {
      const res = await request(app)
        .put('/api/chats/read')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .put('/api/chats/read')
        .send({ chatId });

      expect(res.status).toBe(401);
    });
  });
});
