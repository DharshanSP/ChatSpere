import { getDb, generateId, now } from '../database';
import { UserService } from './User';

export interface IChat {
  id: string;
  participants: any[];
  lastMessage?: any;
  createdAt: string;
  updatedAt: string;
}

async function buildChat(id: string) {
  const db = await getDb();
  const chatRow = await db.execute({ sql: 'SELECT * FROM chats WHERE id = ?', args: [id] });
  const row = chatRow.rows[0] as any;
  if (!row) return null;

  const participantRows = await db.execute({ sql: 'SELECT userId FROM chat_participants WHERE chatId = ?', args: [id] });
  const participantIds = participantRows.rows.map((r: any) => r.userId);
  const participants = [];
  for (const pid of participantIds) {
    const user = await UserService.findById(pid);
    if (user) participants.push(user);
  }

  let lastMessage = null;
  if (row.lastMessageId) {
    const { MessageService } = require('./Message');
    lastMessage = await MessageService.findById(row.lastMessageId);
  }

  return {
    _id: row.id,
    id: row.id,
    participants,
    lastMessage,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const ChatService = {
  async create(participants: string[]) {
    const db = await getDb();
    const id = generateId();
    const timestamp = now();
    await db.execute({ sql: 'INSERT INTO chats (id, createdAt, updatedAt) VALUES (?, ?, ?)', args: [id, timestamp, timestamp] });
    for (const pid of participants) {
      await db.execute({ sql: 'INSERT INTO chat_participants (chatId, userId) VALUES (?, ?)', args: [id, pid] });
    }
    return buildChat(id);
  },

  async findExisting(participants: string[]): Promise<any> {
    const db = await getDb();
    if (participants.length !== 2) return null;
    const rows = await db.execute({
      sql: `SELECT c.id FROM chats c
            WHERE (SELECT COUNT(*) FROM chat_participants WHERE chatId = c.id) = 2
            AND EXISTS (SELECT 1 FROM chat_participants WHERE chatId = c.id AND userId = ?)
            AND EXISTS (SELECT 1 FROM chat_participants WHERE chatId = c.id AND userId = ?)`,
      args: [participants[0], participants[1]],
    });
    if (rows.rows.length > 0) {
      return buildChat(rows.rows[0].id as string);
    }
    return null;
  },

  async findByUser(userId: string): Promise<any[]> {
    const db = await getDb();
    const rows = await db.execute({
      sql: `SELECT c.id FROM chats c
            JOIN chat_participants cp ON cp.chatId = c.id
            WHERE cp.userId = ?
            GROUP BY c.id
            ORDER BY c.updatedAt DESC`,
      args: [userId],
    });
    const chats = [];
    for (const row of rows.rows) {
      const chat = await buildChat(row.id as string);
      if (chat) chats.push(chat);
    }
    return chats;
  },

  async findById(id: string): Promise<any> {
    return buildChat(id);
  },

  async updateTimestamp(id: string) {
    const db = await getDb();
    await db.execute({ sql: 'UPDATE chats SET updatedAt = ? WHERE id = ?', args: [now(), id] });
  },

  async setLastMessage(chatId: string, messageId: string) {
    const db = await getDb();
    await db.execute({ sql: 'UPDATE chats SET lastMessageId = ?, updatedAt = ? WHERE id = ?', args: [messageId, now(), chatId] });
  },
};
