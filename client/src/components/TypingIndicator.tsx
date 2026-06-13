interface TypingIndicatorProps {
  typingUsers: string[];
  userDisplayNames: Record<string, string>;
}

export default function TypingIndicator({ typingUsers, userDisplayNames }: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null;

  let text = '';
  if (typingUsers.length === 1) {
    text = `${userDisplayNames[typingUsers[0]!] || 'Someone'} is typing...`;
  } else if (typingUsers.length === 2) {
    text = `${userDisplayNames[typingUsers[0]!] || 'Someone'} and ${userDisplayNames[typingUsers[1]!] || 'someone else'} are typing...`;
  } else {
    text = 'Several people are typing...';
  }

  return (
    <div className="text-xs text-blue-500 italic px-4 py-1 flex items-center gap-1">
      <span className="flex gap-0.5">
        <span className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </span>
      {text}
    </div>
  );
}
