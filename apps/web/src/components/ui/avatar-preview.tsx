'use client';

import Image from 'next/image';
import { getAvatarImagePath, getAvatarDisplayName, type Avatar } from '@/lib/avatar-utils';

interface AvatarPreviewProps {
  avatar: Avatar;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showBorder?: boolean;
  className?: string;
}

export function AvatarPreview({ 
  avatar, 
  size = 'lg', 
  showBorder = true,
  className = ''
}: AvatarPreviewProps) {
  const sizeMap = {
    sm: 'w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12',
    md: 'w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16',
    lg: 'w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24',
    xl: 'w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28',
    '2xl': 'w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32'
  };

  const baseClasses = `rounded-full transition-all duration-200 ${className}`;
  const borderClasses = showBorder ? 'bg-white/20 border-2 border-white/30' : '';

  return (
    <div 
      className={`${baseClasses} ${borderClasses} ${sizeMap[size]} overflow-hidden`}
    >
      <Image
        src={getAvatarImagePath(avatar)}
        alt={getAvatarDisplayName(avatar)}
        width={128}
        height={128}
        className="w-full h-full object-cover"
        priority={size === '2xl'}
      />
    </div>
  );
}
