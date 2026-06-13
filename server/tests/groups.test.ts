import request from 'supertest';
import { getDb, close } from '../src/database';
import { app } from '../server';

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret-key';
  await getDb();
});

afterAll(() => close());

describe('Group Endpoints', () => {
  let aliceToken: string;
  let aliceId: string;
  let bobToken: string;
  let bobId: string;
  let charlieToken: string;
  let charlieId: string;

  beforeAll(async () => {
    const timestamp = Date.now();

    const alice = await request(app)
      .post('/api/auth/register')
      .send({ username: 'gpalice_' + timestamp, email: `gpalice_${timestamp}@test.com`, password: 'password123', displayName: 'Alice GP' });
    aliceToken = alice.body.token;
    aliceId = alice.body.user.id;

    const bob = await request(app)
      .post('/api/auth/register')
      .send({ username: 'gpbob_' + timestamp, email: `gpbob_${timestamp}@test.com`, password: 'password123', displayName: 'Bob GP' });
    bobToken = bob.body.token;
    bobId = bob.body.user.id;

    const charlie = await request(app)
      .post('/api/auth/register')
      .send({ username: 'gpcharlie_' + timestamp, email: `gpcharlie_${timestamp}@test.com`, password: 'password123', displayName: 'Charlie GP' });
    charlieToken = charlie.body.token;
    charlieId = charlie.body.user.id;
  });

  describe('POST /api/groups', () => {
    it('should create a group with members', async () => {
      const res = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ name: 'Test Group', description: 'A test group', members: [bobId, charlieId] });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('Test Group');
      expect(res.body.description).toBe('A test group');
      expect(res.body.members).toHaveLength(3); // alice + bob + charlie
      expect(res.body.admins).toHaveLength(1);
      expect(res.body.creator.id).toBe(aliceId);
    });

    it('should reject group without name', async () => {
      const res = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ members: [bobId, charlieId] });

      expect(res.status).toBe(400);
    });

    it('should reject group with fewer than 2 members', async () => {
      const res = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ name: 'Small Group', members: [bobId] });

      expect(res.status).toBe(400);
    });

    it('should reject group with empty members array', async () => {
      const res = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ name: 'Empty Group', members: [] });

      expect(res.status).toBe(400);
    });

    it('should reject invalid member IDs', async () => {
      const res = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ name: 'Bad IDs', members: ['not-a-uuid', 'also-bad'] });

      expect(res.status).toBe(400);
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/groups')
        .send({ name: 'No Auth', members: [bobId, charlieId] });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/groups', () => {
    it('should return user groups', async () => {
      const res = await request(app)
        .get('/api/groups')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0].name).toBe('Test Group');
    });

    it('should return empty array for user with no groups', async () => {
      // Register a new user with no groups
      const timestamp = Date.now();
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'nogroups_' + timestamp, email: `nog_${timestamp}@test.com`, password: 'password123', displayName: 'No Groups' });
      const newToken = res.body.token;

      const groupsRes = await request(app)
        .get('/api/groups')
        .set('Authorization', `Bearer ${newToken}`);

      expect(groupsRes.status).toBe(200);
      expect(groupsRes.body).toEqual([]);
    });

    it('should require authentication', async () => {
      const res = await request(app).get('/api/groups');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/groups/:id', () => {
    let groupId: string;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ name: 'Get By ID Group', members: [bobId, charlieId] });
      groupId = res.body.id;
    });

    it('should get group by ID', async () => {
      const res = await request(app)
        .get(`/api/groups/${groupId}`)
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(groupId);
      expect(res.body.name).toBe('Get By ID Group');
    });

    it('should return 404 for non-existent group', async () => {
      const res = await request(app)
        .get('/api/groups/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(404);
    });

    it('should return 403 for non-member', async () => {
      // Register a non-member
      const timestamp = Date.now();
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'nomem_' + timestamp, email: `nomem_${timestamp}@test.com`, password: 'password123', displayName: 'Non Member' });
      const nonMemberToken = res.body.token;

      const groupsRes = await request(app)
        .get(`/api/groups/${groupId}`)
        .set('Authorization', `Bearer ${nonMemberToken}`);

      expect(groupsRes.status).toBe(403);
    });

    it('should reject invalid group ID format', async () => {
      const res = await request(app)
        .get('/api/groups/bad-id')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/groups/:id', () => {
    let groupId: string;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ name: 'Update Me', members: [bobId, charlieId] });
      groupId = res.body.id;
    });

    it('should update group name and description (admin)', async () => {
      const res = await request(app)
        .put(`/api/groups/${groupId}`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ name: 'Updated Name', description: 'Updated description' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Name');
      expect(res.body.description).toBe('Updated description');
    });

    it('should reject update by non-admin', async () => {
      const res = await request(app)
        .put(`/api/groups/${groupId}`)
        .set('Authorization', `Bearer ${bobToken}`)
        .send({ name: 'Bob Update' });

      expect(res.status).toBe(403);
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .put(`/api/groups/${groupId}`)
        .send({ name: 'No Auth Update' });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/groups/:id/members', () => {
    let groupId: string;
    let newUserId: string;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ name: 'Add Members', members: [bobId, charlieId] });
      groupId = res.body.id;

      // Register a user to add
      const timestamp = Date.now();
      const newUser = await request(app)
        .post('/api/auth/register')
        .send({ username: 'newmember_' + timestamp, email: `newm_${timestamp}@test.com`, password: 'password123', displayName: 'New Member' });
      newUserId = newUser.body.user.id;
    });

    it('should add members (admin)', async () => {
      const res = await request(app)
        .post(`/api/groups/${groupId}/members`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ members: [newUserId] });

      expect(res.status).toBe(200);
      const ids = res.body.members.map((m: any) => m.id);
      expect(ids).toContain(newUserId);
    });

    it('should reject add by non-admin', async () => {
      const res = await request(app)
        .post(`/api/groups/${groupId}/members`)
        .set('Authorization', `Bearer ${bobToken}`)
        .send({ members: [newUserId] });

      expect(res.status).toBe(403);
    });

    it('should reject empty members array', async () => {
      const res = await request(app)
        .post(`/api/groups/${groupId}/members`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ members: [] });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/groups/:id/members/:userId', () => {
    let groupId: string;
    let removableUserId: string;

    beforeAll(async () => {
      const timestamp = Date.now();
      const res = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ name: 'Remove Members', members: [bobId, charlieId] });
      groupId = res.body.id;

      const newUser = await request(app)
        .post('/api/auth/register')
        .send({ username: 'removable_' + timestamp, email: `rem_${timestamp}@test.com`, password: 'password123', displayName: 'Removable' });
      removableUserId = newUser.body.user.id;

      // Add the user first
      await request(app)
        .post(`/api/groups/${groupId}/members`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ members: [removableUserId] });
    });

    it('should remove member (admin)', async () => {
      const res = await request(app)
        .delete(`/api/groups/${groupId}/members/${removableUserId}`)
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      const ids = res.body.members.map((m: any) => m.id);
      expect(ids).not.toContain(removableUserId);
    });

    it('should allow self-removal (leave group)', async () => {
      // Bob can remove himself
      const res = await request(app)
        .delete(`/api/groups/${groupId}/members/${bobId}`)
        .set('Authorization', `Bearer ${bobToken}`);

      expect(res.status).toBe(200);
    });

    it('should reject removal by non-admin of another user', async () => {
      // Charlie (non-admin) trying to remove someone
      const res = await request(app)
        .delete(`/api/groups/${groupId}/members/${charlieId}`)
        .set('Authorization', `Bearer ${charlieToken}`);
      // Charlie can remove themselves but not others — in this case removing self is allowed
      // Let's try a different scenario: charlie tries to remove alice (admin)
      const res2 = await request(app)
        .delete(`/api/groups/${groupId}/members/${aliceId}`)
        .set('Authorization', `Bearer ${charlieToken}`);

      expect(res2.status).toBe(403);
    });
  });

  describe('POST /api/groups/message', () => {
    let groupId: string;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ name: 'Message Group', members: [bobId, charlieId] });
      groupId = res.body.id;
    });

    it('should send a group message', async () => {
      const res = await request(app)
        .post('/api/groups/message')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ groupId, content: 'Welcome to the group!' });

      expect(res.status).toBe(201);
      expect(res.body.message.content).toBe('Welcome to the group!');
      expect(res.body.message.sender.id).toBe(aliceId);
    });

    it('should reject message to non-member', async () => {
      const timestamp = Date.now();
      const outsider = await request(app)
        .post('/api/auth/register')
        .send({ username: 'outsider_' + timestamp, email: `out_${timestamp}@test.com`, password: 'password123', displayName: 'Outsider' });
      const outsiderToken = outsider.body.token;

      const res = await request(app)
        .post('/api/groups/message')
        .set('Authorization', `Bearer ${outsiderToken}`)
        .send({ groupId, content: 'Not a member!' });

      expect(res.status).toBe(403);
    });

    it('should reject empty content', async () => {
      const res = await request(app)
        .post('/api/groups/message')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ groupId, content: '' });

      expect(res.status).toBe(400);
    });

    it('should reject missing groupId', async () => {
      const res = await request(app)
        .post('/api/groups/message')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ content: 'No group' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/groups/:groupId/messages', () => {
    let groupId: string;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ name: 'Read Messages Group', members: [bobId, charlieId] });
      groupId = res.body.id;

      await request(app)
        .post('/api/groups/message')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ groupId, content: 'First group message' });

      await request(app)
        .post('/api/groups/message')
        .set('Authorization', `Bearer ${bobToken}`)
        .send({ groupId, content: 'Second group message' });
    });

    it('should get group messages', async () => {
      const res = await request(app)
        .get(`/api/groups/${groupId}/messages`)
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('messages');
      expect(res.body.messages.length).toBeGreaterThanOrEqual(2);
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('hasMore');
    });

    it('should return 403 for non-member', async () => {
      const timestamp = Date.now();
      const outsider = await request(app)
        .post('/api/auth/register')
        .send({ username: 'out2_' + timestamp, email: `out2_${timestamp}@test.com`, password: 'password123', displayName: 'Outsider 2' });
      const outsiderToken = outsider.body.token;

      const res = await request(app)
        .get(`/api/groups/${groupId}/messages`)
        .set('Authorization', `Bearer ${outsiderToken}`);

      expect(res.status).toBe(403);
    });

    it('should reject invalid groupId format', async () => {
      const res = await request(app)
        .get('/api/groups/bad-id/messages')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(400);
    });
  });
});
