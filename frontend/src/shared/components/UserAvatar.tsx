import { useMemo } from 'react';
import { User } from 'lucide-react';
import type { AppUser } from '@/types/app';

interface UserAvatarProps {
  user: Pick<AppUser, 'username' | 'displayName' | 'avatarUrl'> | null | undefined;
  size?: number;
  className?: string;
}

function initialsFrom(user: UserAvatarProps['user']): string {
  const label = (user?.displayName || user?.username || 'U').trim();
  const parts = label.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
  }
  return label.slice(0, 2).toUpperCase() || 'U';
}

export function UserAvatar({ user, size = 32, className = '' }: UserAvatarProps) {
  const initials = useMemo(() => initialsFrom(user), [user]);
  const src = user?.avatarUrl?.trim() || '';

  if (src.startsWith('data:image/')) {
    return (
      <img
        src={src}
        alt=""
        className={`user-avatar-img ${className}`.trim()}
        width={size}
        height={size}
        style={{ width: size, height: size }}
        draggable={false}
      />
    );
  }

  return (
    <div
      className={`user-avatar-fallback ${className}`.trim()}
      style={{ width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.36)) }}
      aria-hidden="true"
    >
      {initials || <User size={Math.round(size * 0.55)} />}
    </div>
  );
}
