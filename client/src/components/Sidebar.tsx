import { useState, useEffect } from 'react';
import { PlusIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { useUserStore } from '../store/userStore';
import { chatApi, userApi, groupApi } from '../services/api';
import { connectSocket, getSocket } from '../services/socket';
import { Chat, Group } from '../types';
import SearchBar from './SearchBar';
import ChatListItem from './ChatListItem';
import Avatar from './Avatar';
import GroupModal from './GroupModal';
import Logo from './Logo';

interface SidebarProps {
  onLogout: () => void;
}

export default function Sidebar({ onLogout }: SidebarProps) {
  const user = useAuthStore((s) => s.user);
  const { chats, groups, setChats, setGroups, setActiveChat, setActiveGroup, activeChat, activeGroup } = useChatStore();
  const { users, setUsers } = useUserStore();
  const [search, setSearch] = useState('');
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);

  useEffect(() => {
    loadChats();
    loadGroups();
    setupSocketListeners();
  }, []);

  const loadChats = async () => {
    try {
      const res = await chatApi.getUserChats();
      setChats(res.data);
    } catch (err) {
      console.error('Failed to load chats:', err);
    }
  };

  const loadGroups = async () => {
    try {
      const res = await groupApi.getUserGroups();
      setGroups(res.data);
    } catch (err) {
      console.error('Failed to load groups:', err);
    }
  };

  const setupSocketListeners = () => {
    const socket = connectSocket();
    socket.on('new_message', (data: { message: any; chatId: string }) => {
      loadChats();
    });
    socket.on('new_group_message', () => {
      loadGroups();
    });
    socket.on('user_online', (userId: string) => {
      useUserStore.getState().addOnlineUser(userId);
    });
    socket.on('user_offline', ({ userId }: { userId: string }) => {
      useUserStore.getState().removeOnlineUser(userId);
    });
  };

  const handleSearch = async (q: string) => {
    setSearch(q);
    if (q.trim()) {
      try {
        const res = await userApi.getUsers(q);
        setUsers(res.data);
      } catch {
        console.error('Search failed');
      }
    } else {
      setUsers([]);
    }
  };

  const handleStartChat = async (userId: string) => {
    try {
      const res = await chatApi.createChat(userId);
      setActiveChat(res.data);
      setChats(
        chats.map((c) => (c._id === res.data._id ? res.data : c))
      );
      setShowNewChat(false);
      setSearch('');
      setUsers([]);
    } catch (err) {
      console.error('Failed to create chat:', err);
    }
  };

  const handleSelectChat = (chat: Chat) => {
    setActiveChat(chat);
    setActiveGroup(null);
  };

  const handleSelectGroup = (group: Group) => {
    setActiveGroup(group);
    setActiveChat(null);
  };

  const combinedList = [
    ...chats.map((c) => ({ type: 'chat' as const, item: c, updatedAt: c.updatedAt })),
    ...groups.map((g) => ({ type: 'group' as const, item: g, updatedAt: g.updatedAt })),
  ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return (
    <div className="sidebar">
      <div className="px-4 pt-4 pb-2 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-1">
          <Logo size={32} />
          <button
            onClick={onLogout}
            className="p-1.5 text-gray-500 hover:text-red-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            title="Logout"
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar src={user?.avatar} name={user?.displayName || ''} size="md" />
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white text-sm">
                {user?.displayName}
              </h2>
              <span className="text-xs text-green-500">Online</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowGroupModal(true)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Create Group"
            >
              <PlusIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <SearchBar
              value={search}
              onChange={handleSearch}
              placeholder="Search users..."
            />
          </div>
          <button
            onClick={() => setShowNewChat(!showNewChat)}
            className={`px-3 py-2 text-sm rounded-lg transition-colors ${
              showNewChat
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            New Chat
          </button>
        </div>
      </div>

      {showNewChat && search.trim() && (
        <div className="overflow-y-auto border-b border-gray-200 dark:border-gray-700 max-h-48">
          {users.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-4">No users found</p>
          ) : (
            users.map((u) => (
              <button
                key={u._id}
                onClick={() => handleStartChat(u._id)}
                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Avatar src={u.avatar} name={u.displayName} size="sm" online={u.online} />
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{u.displayName}</p>
                  <p className="text-xs text-gray-500">@{u.username}</p>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {combinedList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <p className="text-sm">No conversations yet</p>
            <p className="text-xs mt-1">Search for users to start chatting</p>
          </div>
        ) : (
          combinedList.map((entry) => {
            if (entry.type === 'chat') {
              const c = entry.item as Chat;
              return (
                <ChatListItem
                  key={`chat-${c._id}`}
                  chat={c}
                  isActive={activeChat?._id === c._id}
                  onClick={() => handleSelectChat(c)}
                />
              );
            }
            const g = entry.item as Group;
            return (
              <ChatListItem
                key={`group-${g._id}`}
                group={g}
                isActive={activeGroup?._id === g._id}
                onClick={() => handleSelectGroup(g)}
              />
            );
          })
        )}
      </div>

      {showGroupModal && (
        <GroupModal
          onClose={() => setShowGroupModal(false)}
          onCreated={(group) => {
            setGroups([group, ...groups]);
            setShowGroupModal(false);
          }}
        />
      )}
    </div>
  );
}
