import { useState, useEffect, useRef, useCallback } from 'react';
import { Chat, Group, Message } from '../types';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { chatApi, groupApi } from '../services/api';
import { getSocket } from '../services/socket';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import Avatar from './Avatar';
import OnlineStatus from './OnlineStatus';
import Logo from './Logo';

interface ChatAreaProps {
  chat?: Chat | null;
  group?: Group | null;
}

export default function ChatArea({ chat, group }: ChatAreaProps) {
  const user = useAuthStore((s) => s.user);
  const { messages, setMessages, appendMessages, addMessage, setLoadingMessages, hasMoreMessages, setHasMoreMessages, currentPage, setCurrentPage, updateChatLastMessage, updateGroupLastMessage } = useChatStore();
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  const chatId = chat?._id || group?._id;
  const isGroup = !!group;

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    if (chatId) {
      loadMessages();
      setTypingUsers([]);
    }
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  useEffect(() => {
    const socket = getSocket();

    const handleNewMessage = (data: { message: Message; chatId: string }) => {
      if (data.chatId === chatId) {
        addMessage(data.message);
        if (chat) updateChatLastMessage(chat._id, data.message);
      }
    };

    const handleNewGroupMessage = (data: { message: Message; groupId: string }) => {
      if (data.groupId === chatId) {
        addMessage(data.message);
        if (group) updateGroupLastMessage(group._id, data.message);
      }
    };

    const handleTypingStart = ({ userId: typingUserId }: { userId: string }) => {
      if (typingUserId !== user?._id) {
        setTypingUsers((prev) => (prev.includes(typingUserId) ? prev : [...prev, typingUserId]));
      }
    };

    const handleTypingStop = ({ userId: typingUserId }: { userId: string }) => {
      setTypingUsers((prev) => prev.filter((id) => id !== typingUserId));
    };

    socket.on('new_message', handleNewMessage);
    socket.on('new_group_message', handleNewGroupMessage);
    socket.on('typing_start', handleTypingStart);
    socket.on('typing_stop', handleTypingStop);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('new_group_message', handleNewGroupMessage);
      socket.off('typing_start', handleTypingStart);
      socket.off('typing_stop', handleTypingStop);
    };
  }, [chatId, chat, group, user?._id]);

  const loadMessages = async (page = 1) => {
    if (!chatId) return;
    setLoading(true);
    try {
      const res = isGroup
        ? await groupApi.getGroupMessages(chatId, page)
        : await chatApi.getMessages(chatId, page);
      const data = res.data;
      if (page === 1) {
        setMessages(data.messages);
      } else {
        appendMessages(data.messages);
      }
      setHasMoreMessages(data.hasMore);
      setCurrentPage(data.page);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (hasMoreMessages && !loading) {
      const prevScrollHeight = messagesContainerRef.current?.scrollHeight || 0;
      loadMessages(currentPage + 1).then(() => {
        requestAnimationFrame(() => {
          const container = messagesContainerRef.current;
          if (container) {
            container.scrollTop = container.scrollHeight - prevScrollHeight;
          }
        });
      });
    }
  };

  const handleSend = async (content: string) => {
    if (!chatId) return;
    const socket = getSocket();
    if (isGroup) {
      socket.emit('group_message', { groupId: chatId, content });
    } else {
      socket.emit('send_message', { chatId, content });
    }
  };

  const handleTyping = (isTyping: boolean) => {
    if (!chatId) return;
    const socket = getSocket();
    socket.emit(isTyping ? 'typing_start' : 'typing_stop', { chatId });
  };

  const markAsRead = async () => {
    if (!chatId || isGroup) return;
    try {
      await chatApi.markAsRead(chatId);
      getSocket().emit('message_seen', { chatId });
    } catch {
      // silently fail
    }
  };

  useEffect(() => {
    if (chatId && !isGroup) {
      markAsRead();
    }
  }, [chatId, isGroup]);

  if (!chatId) {
    return (
      <div className="chat-area items-center justify-center">
        <div className="text-center text-gray-400">
          <Logo size={80} className="justify-center mb-4" />
          <p className="text-sm">Select a conversation to start chatting</p>
        </div>
      </div>
    );
  }

  const otherParticipant = chat?.participants.find((p) => p._id !== user?._id);
  const headerName = isGroup ? group?.name : otherParticipant?.displayName || 'Unknown';
  const headerAvatar = isGroup ? group?.avatar : otherParticipant?.avatar;
  const isOnline = otherParticipant?.online ?? false;
  const lastSeen = otherParticipant?.lastSeen;

  const userDisplayNames: Record<string, string> = {};
  if (chat) {
    chat.participants.forEach((p) => { userDisplayNames[p._id] = p.displayName; });
  }
  if (group) {
    (group.members as any[]).forEach((m) => { userDisplayNames[m._id!] = m.displayName; });
  }

  return (
    <div className="chat-area">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center gap-3">
        <Avatar src={headerAvatar} name={headerName || ''} online={isGroup ? undefined : isOnline} />
        <div>
          <h2 className="font-semibold text-sm text-gray-900 dark:text-white">{headerName}</h2>
          {isGroup ? (
            <p className="text-xs text-gray-400">{group?.members.length} members</p>
          ) : (
            <OnlineStatus online={isOnline} lastSeen={lastSeen} />
          )}
        </div>
      </div>

      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-2"
        onScroll={(e) => {
          const el = e.currentTarget;
          if (el.scrollTop < 50 && hasMoreMessages && !loading) {
            handleLoadMore();
          }
        }}
      >
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            No messages yet. Say hello!
          </div>
        ) : (
          <>
            {hasMoreMessages && (
              <div className="text-center py-2">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="text-xs text-blue-500 hover:text-blue-600 disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Load older messages'}
                </button>
              </div>
            )}
            {messages.map((msg, i) => {
              const prevMsg = i > 0 ? messages[i - 1] : null;
              const showSender = isGroup && (prevMsg?.sender as any)?._id !== (msg.sender as any)?._id;
              const senderName = isGroup ? (msg.sender as any)?.displayName : undefined;
              return (
                <MessageBubble
                  key={msg._id}
                  message={msg}
                  showSender={showSender}
                  senderName={senderName}
                />
              );
            })}
          </>
        )}
        <TypingIndicator typingUsers={typingUsers} userDisplayNames={userDisplayNames} />
        <div ref={messagesEndRef} />
      </div>

      <MessageInput onSend={handleSend} onTyping={handleTyping} />
    </div>
  );
}
