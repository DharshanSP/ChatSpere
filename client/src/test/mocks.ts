export const mockUser = {
  _id: 'user-1',
  username: 'testuser',
  email: 'test@test.com',
  displayName: 'Test User',
  avatar: '',
  bio: 'Test bio',
  online: false,
  lastSeen: '2026-06-13T00:00:00.000Z',
};

export const mockUser2 = {
  _id: 'user-2',
  username: 'testuser2',
  email: 'test2@test.com',
  displayName: 'Test User 2',
  avatar: '',
  bio: '',
  online: true,
  lastSeen: '2026-06-13T00:00:00.000Z',
};

export const mockMessage = {
  _id: 'msg-1',
  chat: 'chat-1',
  sender: mockUser,
  content: 'Hello world!',
  messageType: 'text' as const,
  fileUrl: '',
  fileName: '',
  fileSize: 0,
  mimeType: '',
  readBy: [],
  deliveredTo: ['user-1'],
  replyTo: null,
  createdAt: '2026-06-13T00:00:00.000Z',
  updatedAt: '2026-06-13T00:00:00.000Z',
};

export const mockChat = {
  _id: 'chat-1',
  participants: [mockUser, mockUser2],
  lastMessage: mockMessage,
  createdAt: '2026-06-13T00:00:00.000Z',
  updatedAt: '2026-06-13T00:00:00.000Z',
};

export const mockGroup = {
  _id: 'group-1',
  name: 'Test Group',
  description: 'A test group',
  avatar: '',
  creator: mockUser,
  admins: [mockUser],
  members: [mockUser, mockUser2],
  lastMessage: mockMessage,
  createdAt: '2026-06-13T00:00:00.000Z',
  updatedAt: '2026-06-13T00:00:00.000Z',
};
