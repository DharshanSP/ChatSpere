interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  online?: boolean;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
};

const colors = [
  'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
  'bg-indigo-500', 'bg-teal-500', 'bg-orange-500', 'bg-cyan-500',
];

function getColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function Avatar({ src, name, size = 'md', online }: AvatarProps) {
  if (src) {
    return (
      <div className="relative inline-flex">
        <img
          src={src}
          alt={name}
          className={`${sizeClasses[size]} rounded-full object-cover`}
        />
        {online !== undefined && (
          <span
            className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white dark:border-gray-900 rounded-full ${
              online ? 'bg-green-500' : 'bg-gray-400'
            }`}
          />
        )}
      </div>
    );
  }

  return (
    <div className="relative inline-flex">
      <div
        className={`${sizeClasses[size]} ${getColor(name)} rounded-full flex items-center justify-center text-white font-medium`}
      >
        {getInitials(name)}
      </div>
      {online !== undefined && (
        <span
          className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white dark:border-gray-900 rounded-full ${
            online ? 'bg-green-500' : 'bg-gray-400'
          }`}
        />
      )}
    </div>
  );
}
