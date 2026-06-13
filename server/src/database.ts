import { createClient, Client, Config } from '@libsql/client';
import crypto from 'crypto';

let db: Client;

export async function getDb(): Promise<Client> {
  if (!db) {
    const url = process.env.DATABASE_URL || 'file:chatsphere.db';
    const authToken = process.env.DATABASE_AUTH_TOKEN;
    const config: Config = { url };
    if (authToken) {
      config.authToken = authToken;
    }
    db = createClient(config);
    await initSchema();
  }
  return db;
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function now(): string {
  return new Date().toISOString();
}

async function initSchema(): Promise<void> {
  await db.execute(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    displayName TEXT NOT NULL,
    avatar TEXT DEFAULT '',
    bio TEXT DEFAULT '',
    online INTEGER DEFAULT 0,
    lastSeen TEXT DEFAULT (datetime('now')),
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS chats (
    id TEXT PRIMARY KEY,
    lastMessageId TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS chat_participants (
    chatId TEXT NOT NULL,
    userId TEXT NOT NULL,
    PRIMARY KEY (chatId, userId)
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    chatId TEXT NOT NULL,
    senderId TEXT NOT NULL,
    content TEXT NOT NULL,
    messageType TEXT DEFAULT 'text',
    fileUrl TEXT DEFAULT '',
    fileName TEXT DEFAULT '',
    fileSize INTEGER DEFAULT 0,
    mimeType TEXT DEFAULT '',
    replyToId TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS message_readBy (
    messageId TEXT NOT NULL,
    userId TEXT NOT NULL,
    PRIMARY KEY (messageId, userId)
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS message_deliveredTo (
    messageId TEXT NOT NULL,
    userId TEXT NOT NULL,
    PRIMARY KEY (messageId, userId)
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    avatar TEXT DEFAULT '',
    creatorId TEXT NOT NULL,
    lastMessageId TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS group_members (
    groupId TEXT NOT NULL,
    userId TEXT NOT NULL,
    PRIMARY KEY (groupId, userId)
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS group_admins (
    groupId TEXT NOT NULL,
    userId TEXT NOT NULL,
    PRIMARY KEY (groupId, userId)
  )`);

  await db.execute(`CREATE INDEX IF NOT EXISTS idx_chat_participants_userId ON chat_participants(userId)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_messages_chatId ON messages(chatId)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_messages_createdAt ON messages(createdAt)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_group_members_userId ON group_members(userId)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_chats_updatedAt ON chats(updatedAt)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_groups_updatedAt ON groups(updatedAt)`);
}

export function close(): void {
  if (db) {
    db.close();
    db = undefined as any;
  }
}
