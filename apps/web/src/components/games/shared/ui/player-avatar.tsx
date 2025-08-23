import type { Player } from '@party/types';
import Image from 'next/image';
import { isImageAvatar, getAvatarImagePath, type Avatar } from '@/lib/avatar-utils';

type PlayerAvatarProps = Pick<Player, 'avatar'> & {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
};

export function PlayerAvatar({ avatar, size = 'lg' }: PlayerAvatarProps) {
  const sizeMap = {
    sm: 'w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12',
    md: 'w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16',
    lg: 'w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24',
    xl: 'w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28',
    '2xl': 'w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32'
  };

  // If no avatar is provided, use default
  const displayAvatar: Avatar = avatar && isImageAvatar(avatar) ? avatar : 'avatar_1_transparent.png';

  return (
    <div 
      className={`rounded-full bg-white/20 border-2 border-white/30 overflow-hidden transition-all duration-200 ${sizeMap[size]}`}
    >
      <Image
        src={getAvatarImagePath(displayAvatar)}
        alt={`Avatar ${displayAvatar}`}
        width={128}
        height={128}
        className="w-full h-full object-cover"
        priority={size === '2xl'} // Prioritize loading for large avatars
      />
    </div>
  );
}
