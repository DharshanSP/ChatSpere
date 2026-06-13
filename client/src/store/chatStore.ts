import { create } from 'zustand';
import { Chat, Message, Group } from '../types';

interface ChatState {
  chats: Chat[];
  groups: Group[];
  activeChat: Chat | null;
  activeGroup: Group | null;
  messages: Message[];
  loadingMessages: boolean;
  hasMoreMessages: boolean;
  currentPage: number;
  setChats: (chats: Chat[]) => void;
  setGroups: (groups: Group[]) => void;
  setActiveChat: (chat: Chat | null) => void;
  setActiveGroup: (group: Group | null) => void;
  addMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
  appendMessages: (messages: Message[]) => void;
  setLoadingMessages: (loading: boolean) => void;
  setHasMoreMessages: (hasMore: boolean) => void;
  setCurrentPage: (page: number) => void;
  updateChatLastMessage: (chatId: string, message: Message) => void;
  updateGroupLastMessage: (groupId: string, message: Message) => void;
  addChat: (chat: Chat) => void;
  addGroup: (group: Group) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  chats: [],
  groups: [],
  activeChat: null,
  activeGroup: null,
  messages: [],
  loadingMessages: false,
  hasMoreMessages: true,
  currentPage: 1,

  setChats: (chats) => set({ chats }),
  setGroups: (groups) => set({ groups }),

  setActiveChat: (chat) => set({ activeChat: chat, activeGroup: null, messages: [], currentPage: 1 }),
  setActiveGroup: (group) => set({ activeGroup: group, activeChat: null, messages: [], currentPage: 1 }),

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  setMessages: (messages) => set({ messages }),

  appendMessages: (messages) =>
    set((state) => ({ messages: [...messages, ...state.messages] })),

  setLoadingMessages: (loading) => set({ loadingMessages: loading }),
  setHasMoreMessages: (hasMore) => set({ hasMoreMessages: hasMore }),
  setCurrentPage: (page) => set({ currentPage: page }),

  updateChatLastMessage: (chatId, message) =>
    set((state) => ({
      chats: state.chats.map((c) =>
        c._id === chatId ? { ...c, lastMessage: message } : c
      ),
    })),

  updateGroupLastMessage: (groupId, message) =>
    set((state) => ({
      groups: state.groups.map((g) =>
        g._id === groupId ? { ...g, lastMessage: message } : g
      ),
    })),

  addChat: (chat) =>
    set((state) => {
      const exists = state.chats.find((c) => c._id === chat._id);
      if (exists) {
        return {
          chats: state.chats.map((c) => (c._id === chat._id ? chat : c)),
        };
      }
      return { chats: [chat, ...state.chats] };
    }),

  addGroup: (group) =>
    set((state) => {
      const exists = state.groups.find((g) => g._id === group._id);
      if (exists) {
        return {
          groups: state.groups.map((g) => (g._id === group._id ? group : g)),
        };
      }
      return { groups: [group, ...state.groups] };
    }),
}));
