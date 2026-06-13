import { Message } from '../types';
import { useAuthStore } from '../store/authStore';
import { PaperClipIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';

interface MessageBubbleProps {
  message: Message;
  showSender?: boolean;
  senderName?: string;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function isImage(mimeType?: string): boolean {
  return mimeType?.startsWith('image/') ?? false;
}

function isVideo(mimeType?: string): boolean {
  return mimeType?.startsWith('video/') ?? false;
}

function isAudio(mimeType?: string): boolean {
  return mimeType?.startsWith('audio/') ?? false;
}

export default function MessageBubble({ message, showSender, senderName }: MessageBubbleProps) {
  const user = useAuthStore((s) => s.user);
  const isSent = (message.sender as any)?._id === user?._id || message.sender === user?._id;

  const renderFilePreview = () => {
    if (!message.fileUrl) return null;

    if (isImage(message.mimeType)) {
      return (
        <img
          src={message.fileUrl}
          alt={message.fileName || 'Image'}
          className="max-w-full rounded-lg mb-1 cursor-pointer"
          loading="lazy"
        />
      );
    }

    if (isVideo(message.mimeType)) {
      return (
        <video controls className="max-w-full rounded-lg mb-1 max-h-60">
          <source src={message.fileUrl} type={message.mimeType} />
        </video>
      );
    }

    if (isAudio(message.mimeType)) {
      return (
        <audio controls className="max-w-full mb-1">
          <source src={message.fileUrl} type={message.mimeType} />
        </audio>
      );
    }

    return (
      <a
        href={message.fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-sm underline mb-1"
      >
        <PaperClipIcon className="w-4 h-4" />
        {message.fileName || 'File'}
      </a>
    );
  };

  return (
    <div className={`flex ${isSent ? 'justify-end' : 'justify-start'} mb-2`}>
      <div className="max-w-[75%]">
        {showSender && senderName && !isSent && (
          <p className="text-xs text-gray-500 mb-1 px-1">{senderName}</p>
        )}
        {message.replyTo && (
          <div className={`text-xs mb-1 px-3 py-1 rounded-lg ${isSent ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'} flex items-center gap-1`}>
            <ArrowUturnLeftIcon className="w-3 h-3" />
            <span className="opacity-75 truncate max-w-[200px]">
              {(message.replyTo as any)?.content || 'Reply'}
            </span>
          </div>
        )}
        <div className={`message-bubble ${isSent ? 'sent' : 'received'}`}>
          {renderFilePreview()}
          {message.messageType === 'text' && <p className="text-sm whitespace-pre-wrap">{message.content}</p>}
          {message.messageType === 'voice' && message.fileUrl && (
            <audio controls className="max-w-full">
              <source src={message.fileUrl} />
            </audio>
          )}
          <div className={`flex items-center justify-end gap-1 mt-1 ${isSent ? 'text-blue-100' : 'text-gray-400'}`}>
            <span className="text-[10px]">{formatTime(message.createdAt)}</span>
            {isSent && (
              <span className="text-[10px]">
                {message.readBy.length > 1 ? '✓✓' : '✓'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
