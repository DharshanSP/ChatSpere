import { getDb, generateId, now } from '../database';

export interface IUser {
  id: string;
  username: string;
  email: string;
  password: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  online: boolean;
  lastSeen: string;
  createdAt: string;
  updatedAt: string;
}

function rowToUser(row: any): IUser {
  if (!row) return null;
  return {
    ...row,
    _id: row.id,
    online: !!row.online,
  };
}

function rowToUserPublic(row: any) {
  if (!row) return null;
  const { password, ...rest } = row;
  return { ...rest, _id: row.id, online: !!rest.online };
}

export const UserService = {
  async create(data: { username: string; email: string; password: string; displayName: string }): Promise<IUser> {
    const db = await getDb();
    const id = generateId();
    const timestamp = now();
    await db.execute({
      sql: `INSERT INTO users (id, username, email, password, displayName, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [id, data.username, data.email, data.password, data.displayName, timestamp, timestamp],
    });
    const result = await db.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [id] });
    return rowToUser(result.rows[0]);
  },

  async findById(id: string) {
    const db = await getDb();
    const result = await db.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [id] });
    return rowToUserPublic(result.rows[0]);
  },

  async findByEmail(email: string) {
    const db = await getDb();
    const result = await db.execute({ sql: 'SELECT * FROM users WHERE email = ?', args: [email] });
    return rowToUser(result.rows[0]);
  },

  async findByUsername(username: string) {
    const db = await getDb();
    const result = await db.execute({ sql: 'SELECT * FROM users WHERE username = ?', args: [username] });
    return rowToUser(result.rows[0]);
  },

  async findByEmailOrUsername(email: string, username: string) {
    const db = await getDb();
    const result = await db.execute({
      sql: 'SELECT * FROM users WHERE email = ? OR username = ?',
      args: [email, username],
    });
    return rowToUser(result.rows[0]);
  },

  async search(query: string, excludeUserId?: string) {
    const db = await getDb();
    const like = `%${query}%`;
    let sql = `SELECT * FROM users WHERE (username LIKE ? OR displayName LIKE ? OR email LIKE ?)`;
    const params: any[] = [like, like, like];
    if (excludeUserId) {
      sql += ` AND id != ?`;
      params.push(excludeUserId);
    }
    sql += ` ORDER BY online DESC, displayName ASC LIMIT 20`;
    const result = await db.execute({ sql, args: params });
    return result.rows.map(rowToUserPublic);
  },

  async update(id: string, data: { displayName?: string; bio?: string; avatar?: string }) {
    const db = await getDb();
    const sets: string[] = [];
    const params: any[] = [];
    if (data.displayName !== undefined) { sets.push('displayName = ?'); params.push(data.displayName); }
    if (data.bio !== undefined) { sets.push('bio = ?'); params.push(data.bio); }
    if (data.avatar !== undefined) { sets.push('avatar = ?'); params.push(data.avatar); }
    if (sets.length > 0) {
      sets.push('updatedAt = ?');
      params.push(now());
      params.push(id);
      await db.execute({ sql: `UPDATE users SET ${sets.join(', ')} WHERE id = ?`, args: params });
    }
    const result = await db.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [id] });
    return rowToUserPublic(result.rows[0]);
  },

  async setOnline(id: string, online: boolean) {
    const db = await getDb();
    await db.execute({
      sql: 'UPDATE users SET online = ?, lastSeen = ?, updatedAt = ? WHERE id = ?',
      args: [online ? 1 : 0, now(), now(), id],
    });
  },

  async getOnlineUsers(excludeUserId?: string) {
    const db = await getDb();
    let sql = 'SELECT * FROM users WHERE online = 1';
    const params: any[] = [];
    if (excludeUserId) {
      sql += ' AND id != ?';
      params.push(excludeUserId);
    }
    const result = await db.execute({ sql, args: params });
    return result.rows.map(rowToUserPublic);
  },

  async getAll(excludeUserId?: string) {
    const db = await getDb();
    let sql = 'SELECT * FROM users';
    const params: any[] = [];
    if (excludeUserId) {
      sql += ' WHERE id != ?';
      params.push(excludeUserId);
    }
    sql += ' ORDER BY online DESC, displayName ASC LIMIT 20';
    const result = await db.execute({ sql, args: params });
    return result.rows.map(rowToUserPublic);
  },
};
