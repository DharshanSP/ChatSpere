interface OnlineStatusProps {
  online: boolean;
  lastSeen?: string;
  showLabel?: boolean;
}

function formatLastSeen(dateStr?: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function OnlineStatus({ online, lastSeen, showLabel = true }: OnlineStatusProps) {
  return (
    <span className={`text-xs ${online ? 'text-green-500' : 'text-gray-400'}`}>
      {online ? (showLabel ? 'Online' : '') : formatLastSeen(lastSeen)}
    </span>
  );
}
