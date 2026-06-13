import { create } from 'zustand';
import { User } from '../types';

interface UserState {
  users: User[];
  onlineUsers: string[];
  setUsers: (users: User[]) => void;
  setOnlineUsers: (userIds: string[]) => void;
  addOnlineUser: (userId: string) => void;
  removeOnlineUser: (userId: string) => void;
}

export const useUserStore = create<UserState>((set) => ({
  users: [],
  onlineUsers: [],
  setUsers: (users) => set({ users }),
  setOnlineUsers: (userIds) => set({ onlineUsers: userIds }),
  addOnlineUser: (userId) =>
    set((state) => ({
      onlineUsers: state.onlineUsers.includes(userId)
        ? state.onlineUsers
        : [...state.onlineUsers, userId],
    })),
  removeOnlineUser: (userId) =>
    set((state) => ({
      onlineUsers: state.onlineUsers.filter((id) => id !== userId),
    })),
}));
