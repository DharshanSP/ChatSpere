import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    } else if (!error.response) {
      // Network error (server down, timeout, etc.)
      console.error('Network error: Could not connect to server');
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data: { username: string; email: string; password: string; displayName: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
};

export const userApi = {
  getUsers: (search?: string) =>
    api.get('/users', { params: { search } }),
  getUserById: (id: string) =>
    api.get(`/users/${id}`),
  updateProfile: (data: { displayName?: string; bio?: string; avatar?: string }) =>
    api.put('/users/profile', data),
  getOnlineUsers: () =>
    api.get('/users/online'),
};

export const chatApi = {
  createChat: (participantId: string) =>
    api.post('/chats', { participantId }),
  getUserChats: () =>
    api.get('/chats'),
  getChatById: (id: string) =>
    api.get(`/chats/${id}`),
  sendMessage: (data: { chatId: string; content: string; messageType?: string; fileUrl?: string; fileName?: string; fileSize?: number; mimeType?: string; replyTo?: string }) =>
    api.post('/chats/message', data),
  getMessages: (chatId: string, page?: number) =>
    api.get(`/chats/${chatId}/messages`, { params: { page } }),
  markAsRead: (chatId: string) =>
    api.put('/chats/read', { chatId }),
};

export const groupApi = {
  createGroup: (data: { name: string; description?: string; members: string[] }) =>
    api.post('/groups', data),
  getUserGroups: () =>
    api.get('/groups'),
  getGroupById: (id: string) =>
    api.get(`/groups/${id}`),
  updateGroup: (id: string, data: { name?: string; description?: string; avatar?: string }) =>
    api.put(`/groups/${id}`, data),
  addMembers: (id: string, members: string[]) =>
    api.post(`/groups/${id}/members`, { members }),
  removeMember: (groupId: string, userId: string) =>
    api.delete(`/groups/${groupId}/members/${userId}`),
  sendGroupMessage: (data: { groupId: string; content: string; messageType?: string; fileUrl?: string }) =>
    api.post('/groups/message', data),
  getGroupMessages: (groupId: string, page?: number) =>
    api.get(`/groups/${groupId}/messages`, { params: { page } }),
};

export const fileApi = {
  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default api;
