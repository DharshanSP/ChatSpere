import { useState, useRef, KeyboardEvent } from 'react';
import { PaperAirplaneIcon, PaperClipIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { fileApi } from '../services/api';

interface MessageInputProps {
  onSend: (content: string) => void;
  onTyping?: (isTyping: boolean) => void;
  disabled?: boolean;
}

export default function MessageInput({ onSend, onTyping, disabled }: MessageInputProps) {
  const [content, setContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState('');
  const typingTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (value: string) => {
    setContent(value);
    if (onTyping) {
      onTyping(true);
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => onTyping(false), 2000);
    }
  };

  const handleSend = () => {
    if (!content.trim() && !uploadedUrl) return;
    onSend(content.trim());
    setContent('');
    setSelectedFile(null);
    setUploadedUrl('');
    if (onTyping) onTyping(false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsUploading(true);
    try {
      const res = await fileApi.uploadFile(file);
      setUploadedUrl(res.data.fileUrl);
    } catch {
      setSelectedFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setUploadedUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
      {selectedFile && (
        <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <span className="text-sm text-gray-600 dark:text-gray-300 truncate flex-1">
            {isUploading ? 'Uploading...' : selectedFile.name}
          </span>
          <button onClick={clearFile} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}
      <div className="flex items-end gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          disabled={disabled}
        >
          <PaperClipIcon className="w-5 h-5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
        />
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            disabled={disabled}
            className="w-full resize-none bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
        </div>
        <button
          onClick={handleSend}
          disabled={(!content.trim() && !uploadedUrl) || disabled || isUploading}
          className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PaperAirplaneIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
