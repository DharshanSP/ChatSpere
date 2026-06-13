import { getDb, generateId, now } from '../database';
import { UserService } from './User';

export interface IGroup {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  creator: any;
  admins: any[];
  members: any[];
  lastMessage?: any;
  createdAt: string;
  updatedAt: string;
}

async function buildGroup(id: string) {
  const db = await getDb();
  const groupRow = await db.execute({ sql: 'SELECT * FROM groups WHERE id = ?', args: [id] });
  const row = groupRow.rows[0] as any;
  if (!row) return null;

  const memberRows = await db.execute({ sql: 'SELECT userId FROM group_members WHERE groupId = ?', args: [id] });
  const adminRows = await db.execute({ sql: 'SELECT userId FROM group_admins WHERE groupId = ?', args: [id] });
  const memberIds = memberRows.rows.map((r: any) => r.userId);
  const adminIds = adminRows.rows.map((r: any) => r.userId);

  const members = [];
  for (const mid of memberIds) {
    const user = await UserService.findById(mid);
    if (user) members.push(user);
  }
  const admins = [];
  for (const aid of adminIds) {
    const user = await UserService.findById(aid);
    if (user) admins.push(user);
  }
  const creator = await UserService.findById(row.creatorId);

  let lastMessage = null;
  if (row.lastMessageId) {
    const { MessageService } = require('./Message');
    lastMessage = await MessageService.findById(row.lastMessageId);
  }

  return {
    _id: row.id,
    id: row.id,
    name: row.name,
    description: row.description || '',
    avatar: row.avatar || '',
    creator,
    admins,
    members,
    lastMessage,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const GroupService = {
  async create(data: { name: string; description?: string; creatorId: string; members: string[] }) {
    const db = await getDb();
    const id = generateId();
    const timestamp = now();
    await db.execute({
      sql: 'INSERT INTO groups (id, name, description, creatorId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
      args: [id, data.name, data.description || '', data.creatorId, timestamp, timestamp],
    });

    const uniqueMembers = [...new Set([data.creatorId, ...data.members])];
    for (const mid of uniqueMembers) {
      await db.execute({ sql: 'INSERT INTO group_members (groupId, userId) VALUES (?, ?)', args: [id, mid] });
    }
    await db.execute({ sql: 'INSERT INTO group_admins (groupId, userId) VALUES (?, ?)', args: [id, data.creatorId] });

    return buildGroup(id);
  },

  async findByUser(userId: string) {
    const db = await getDb();
    const rows = await db.execute({
      sql: `SELECT g.id FROM groups g
            JOIN group_members gm ON gm.groupId = g.id
            WHERE gm.userId = ?
            ORDER BY g.updatedAt DESC`,
      args: [userId],
    });
    const groups = [];
    for (const row of rows.rows) {
      const group = await buildGroup(row.id as string);
      if (group) groups.push(group);
    }
    return groups;
  },

  async findById(id: string) {
    return buildGroup(id);
  },

  async update(id: string, data: { name?: string; description?: string; avatar?: string }) {
    const db = await getDb();
    const sets: string[] = [];
    const params: any[] = [];
    if (data.name !== undefined) { sets.push('name = ?'); params.push(data.name); }
    if (data.description !== undefined) { sets.push('description = ?'); params.push(data.description); }
    if (data.avatar !== undefined) { sets.push('avatar = ?'); params.push(data.avatar); }
    if (sets.length > 0) {
      sets.push('updatedAt = ?');
      params.push(now());
      params.push(id);
      await db.execute({ sql: `UPDATE groups SET ${sets.join(', ')} WHERE id = ?`, args: params });
    }
    return buildGroup(id);
  },

  async addMembers(groupId: string, memberIds: string[]) {
    const db = await getDb();
    for (const mid of memberIds) {
      await db.execute({ sql: 'INSERT OR IGNORE INTO group_members (groupId, userId) VALUES (?, ?)', args: [groupId, mid] });
    }
    await db.execute({ sql: 'UPDATE groups SET updatedAt = ? WHERE id = ?', args: [now(), groupId] });
    return buildGroup(groupId);
  },

  async removeMember(groupId: string, userId: string) {
    const db = await getDb();
    await db.execute({ sql: 'DELETE FROM group_members WHERE groupId = ? AND userId = ?', args: [groupId, userId] });
    await db.execute({ sql: 'DELETE FROM group_admins WHERE groupId = ? AND userId = ?', args: [groupId, userId] });
    await db.execute({ sql: 'UPDATE groups SET updatedAt = ? WHERE id = ?', args: [now(), groupId] });
    return buildGroup(groupId);
  },

  async setLastMessage(groupId: string, messageId: string) {
    const db = await getDb();
    await db.execute({ sql: 'UPDATE groups SET lastMessageId = ?, updatedAt = ? WHERE id = ?', args: [messageId, now(), groupId] });
  },

  async isMember(groupId: string, userId: string): Promise<boolean> {
    const db = await getDb();
    const result = await db.execute({ sql: 'SELECT 1 FROM group_members WHERE groupId = ? AND userId = ?', args: [groupId, userId] });
    return result.rows.length > 0;
  },

  async isAdmin(groupId: string, userId: string): Promise<boolean> {
    const db = await getDb();
    const result = await db.execute({ sql: 'SELECT 1 FROM group_admins WHERE groupId = ? AND userId = ?', args: [groupId, userId] });
    return result.rows.length > 0;
  },

  async getMembers(groupId: string): Promise<string[]> {
    const db = await getDb();
    const result = await db.execute({ sql: 'SELECT userId FROM group_members WHERE groupId = ?', args: [groupId] });
    return result.rows.map((r: any) => r.userId);
  },
};
