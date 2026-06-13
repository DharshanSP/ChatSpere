import { Chat, Group } from '../types';
import { useAuthStore } from '../store/authStore';
import Avatar from './Avatar';
import OnlineStatus from './OnlineStatus';

interface ChatListItemProps {
  chat?: Chat;
  group?: Group;
  isActive: boolean;
  onClick: () => void;
}

function formatTime(dateStr?: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' });
  return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
}

function truncate(str: string, len: number): string {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '...' : str;
}

export default function ChatListItem({ chat, group, isActive, onClick }: ChatListItemProps) {
  const user = useAuthStore((s) => s.user);

  let displayName = '';
  let avatarSrc = '';
  let online = false;
  let lastSeen: string | undefined;
  let lastMessageContent = '';
  let lastMessageTime = '';

  if (chat) {
    const other = chat.participants.find((p) => p._id !== user?._id);
    displayName = other?.displayName || 'Unknown User';
    avatarSrc = other?.avatar || '';
    online = other?.online || false;
    lastSeen = other?.lastSeen;
    lastMessageContent = chat.lastMessage?.content || '';
    lastMessageTime = chat.lastMessage?.createdAt || chat.updatedAt;
  }

  if (group) {
    displayName = group.name;
    avatarSrc = group.avatar || '';
    lastMessageContent = group.lastMessage?.content || '';
    lastMessageTime = group.lastMessage?.createdAt || group.updatedAt;
  }

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
        isActive ? 'bg-gray-100 dark:bg-gray-800' : ''
      }`}
    >
      <Avatar src={avatarSrc} name={displayName} online={chat ? online : undefined} />
      <div className="flex-1 min-w-0 text-left">
        <div className="flex justify-between items-center">
          <h3 className="font-medium text-sm text-gray-900 dark:text-white truncate">
            {displayName}
          </h3>
          {lastMessageTime && (
            <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
              {formatTime(lastMessageTime)}
            </span>
          )}
        </div>
        <div className="flex justify-between items-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {truncate(lastMessageContent, 40) || (chat ? 'No messages yet' : '')}
          </p>
          {chat && <OnlineStatus online={online} lastSeen={lastSeen} showLabel={false} />}
        </div>
      </div>
    </button>
  );
}
