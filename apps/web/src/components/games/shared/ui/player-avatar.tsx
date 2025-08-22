import type { Player } from '@party/types';

type PlayerAvatarProps = Pick<Player, 'avatar'> & {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
};

export function PlayerAvatar({ avatar, size = 'lg' }: PlayerAvatarProps) {
  const sizeMap = {
    sm: 'var(--avatar-sm)',
    md: 'var(--avatar-md)', 
    lg: 'var(--avatar-lg)',
    xl: 'var(--avatar-xl)',
    '2xl': 'var(--avatar-2xl)'
  };
  
  const fontMap = {
    sm: 'var(--avatar-font-sm)',
    md: 'var(--avatar-font-md)',
    lg: 'var(--avatar-font-lg)', 
    xl: 'var(--avatar-font-xl)',
    '2xl': 'var(--avatar-font-2xl)'
  };

  return (
    <div 
      className="rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center transition-all duration-200"
      style={{ 
        width: sizeMap[size],
        height: sizeMap[size]
      }}
    >
      <div style={{ fontSize: fontMap[size] }}>{avatar ?? '🙂'}</div>
    </div>
  );
}
