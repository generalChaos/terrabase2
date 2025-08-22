import type { Player } from '@party/types';

type PlayerAvatarProps = Pick<Player, 'avatar'>;

export function PlayerAvatar({ avatar }: PlayerAvatarProps) {
  return (
    <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center transition-all duration-200 hover:scale-105">
      <div className="text-3xl">{avatar ?? '🙂'}</div>
    </div>
  );
}
