export interface User {
  _id: string;
  username: string;
  email: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  online: boolean;
  lastSeen: string;
}

export interface Message {
  _id: string;
  chat: string;
  sender: User | string;
  content: string;
  messageType: 'text' | 'image' | 'video' | 'file' | 'audio' | 'voice';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  readBy: string[];
  deliveredTo: string[];
  replyTo?: Message | string;
  createdAt: string;
  updatedAt: string;
}

export interface Chat {
  _id: string;
  participants: User[];
  lastMessage?: Message;
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  _id: string;
  name: string;
  description?: string;
  avatar?: string;
  creator: User | string;
  admins: User[] | string[];
  members: User[] | string[];
  lastMessage?: Message;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface PaginatedMessages {
  messages: Message[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}
