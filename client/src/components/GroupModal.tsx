import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { userApi, groupApi } from '../services/api';
import { User, Group } from '../types';
import Avatar from './Avatar';

interface GroupModalProps {
  onClose: () => void;
  onCreated: (group: Group) => void;
}

export default function GroupModal({ onClose, onCreated }: GroupModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await userApi.getUsers();
      setUsers(res.data);
    } catch {
      console.error('Failed to load users');
    }
  };

  const toggleUser = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (!name.trim() || selectedIds.length < 2) return;
    setLoading(true);
    try {
      const res = await groupApi.createGroup({
        name: name.trim(),
        description: description.trim() || undefined,
        members: selectedIds,
      });
      onCreated(res.data);
    } catch (err) {
      console.error('Failed to create group:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = search
    ? users.filter(
        (u) =>
          u.displayName.toLowerCase().includes(search.toLowerCase()) ||
          u.username.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Create Group</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Group name"
            className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Group description (optional)"
            className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members..."
            className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <p className="text-xs text-gray-500 mb-2">
            Select at least 2 members ({selectedIds.length} selected)
          </p>
          {filteredUsers.map((u) => (
            <button
              key={u._id}
              onClick={() => toggleUser(u._id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg mb-1 transition-colors ${
                selectedIds.includes(u._id)
                  ? 'bg-blue-50 dark:bg-blue-900/30'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(u._id)}
                onChange={() => toggleUser(u._id)}
                className="rounded text-blue-500"
              />
              <Avatar src={u.avatar} name={u.displayName} size="sm" />
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{u.displayName}</p>
                <p className="text-xs text-gray-500">@{u.username}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleCreate}
            disabled={!name.trim() || selectedIds.length < 2 || loading}
            className="w-full py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
}
