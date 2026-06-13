import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { disconnectSocket } from '../services/socket';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';

export default function ChatView() {
  const logout = useAuthStore((s) => s.logout);
  const { activeChat, activeGroup } = useChatStore();

  const handleLogout = () => {
    disconnectSocket();
    logout();
  };

  return (
    <div className="h-screen flex bg-white dark:bg-gray-900">
      <Sidebar onLogout={handleLogout} />
      <ChatArea chat={activeChat} group={activeGroup} />
    </div>
  );
}
