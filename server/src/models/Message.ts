import { getDb, generateId, now } from '../database';

export interface IMessage {
  id: string;
  chat: string;
  sender: any;
  content: string;
  messageType: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  readBy: string[];
  deliveredTo: string[];
  replyTo?: any;
  createdAt: string;
  updatedAt: string;
}

async function rowToMessage(row: any) {
  if (!row) return null;
  const { UserService } = require('./User');
  const sender = await UserService.findById(row.senderId);
  const db = await getDb();
  const readByResult = await db.execute({ sql: 'SELECT userId FROM message_readBy WHERE messageId = ?', args: [row.id] });
  const deliveredResult = await db.execute({ sql: 'SELECT userId FROM message_deliveredTo WHERE messageId = ?', args: [row.id] });
  let replyTo = null;
  if (row.replyToId) {
    const replyResult = await db.execute({ sql: 'SELECT * FROM messages WHERE id = ?', args: [row.replyToId] });
    replyTo = await rowToMessage(replyResult.rows[0]);
  }

  return {
    _id: row.id,
    id: row.id,
    chat: row.chatId,
    sender,
    content: row.content,
    messageType: row.messageType,
    fileUrl: row.fileUrl,
    fileName: row.fileName,
    fileSize: row.fileSize,
    mimeType: row.mimeType,
    readBy: readByResult.rows.map((r: any) => r.userId),
    deliveredTo: deliveredResult.rows.map((r: any) => r.userId),
    replyTo,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const MessageService = {
  async create(data: {
    chatId: string; senderId: string; content: string; messageType?: string;
    fileUrl?: string; fileName?: string; fileSize?: number; mimeType?: string;
    replyToId?: string; deliveredTo?: string[];
  }) {
    const db = await getDb();
    const id = generateId();
    const timestamp = now();
    await db.execute({
      sql: `INSERT INTO messages (id, chatId, senderId, content, messageType, fileUrl, fileName, fileSize, mimeType, replyToId, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, data.chatId, data.senderId, data.content, data.messageType || 'text',
             data.fileUrl || '', data.fileName || '', data.fileSize || 0, data.mimeType || '',
             data.replyToId || null, timestamp, timestamp],
    });

    if (data.deliveredTo && data.deliveredTo.length > 0) {
      const insert = `INSERT INTO message_deliveredTo (messageId, userId) VALUES (?, ?)`;
      for (const uid of data.deliveredTo) {
        await db.execute({ sql: insert, args: [id, uid] });
      }
    }

    const result = await db.execute({ sql: 'SELECT * FROM messages WHERE id = ?', args: [id] });
    return rowToMessage(result.rows[0]);
  },

  async findById(id: string) {
    const db = await getDb();
    const result = await db.execute({ sql: 'SELECT * FROM messages WHERE id = ?', args: [id] });
    return rowToMessage(result.rows[0]);
  },

  async findByChat(chatId: string, page = 1, limit = 50) {
    const db = await getDb();
    const skip = (page - 1) * limit;
    const rowsResult = await db.execute({
      sql: 'SELECT * FROM messages WHERE chatId = ? ORDER BY createdAt DESC LIMIT ? OFFSET ?',
      args: [chatId, limit, skip],
    });
    const countResult = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM messages WHERE chatId = ?',
      args: [chatId],
    });
    const total = Number(countResult.rows[0].count);
    const messages = [];
    for (const row of rowsResult.rows.reverse()) {
      const msg = await rowToMessage(row);
      if (msg) messages.push(msg);
    }
    return {
      messages,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + limit < total,
    };
  },

  async markAsRead(chatId: string, userId: string, excludeSenderId: string) {
    const db = await getDb();
    const rows = await db.execute({
      sql: 'SELECT id FROM messages WHERE chatId = ? AND senderId != ?',
      args: [chatId, excludeSenderId],
    });
    const insert = `INSERT OR IGNORE INTO message_readBy (messageId, userId) VALUES (?, ?)`;
    for (const row of rows.rows) {
      await db.execute({ sql: insert, args: [row.id, userId] });
    }
  },

  async markAsDelivered(chatId: string, userId: string) {
    const db = await getDb();
    const rows = await db.execute({ sql: 'SELECT id FROM messages WHERE chatId = ?', args: [chatId] });
    const insert = `INSERT OR IGNORE INTO message_deliveredTo (messageId, userId) VALUES (?, ?)`;
    for (const row of rows.rows) {
      await db.execute({ sql: insert, args: [row.id, userId] });
    }
  },
};
