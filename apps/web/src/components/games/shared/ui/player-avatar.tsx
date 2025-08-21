import type { Player } from "@party/types";

type PlayerAvatarProps = Pick<Player, 'name' | 'avatar' | 'connected'>;

export function PlayerAvatar({ name, avatar, connected }: PlayerAvatarProps) {
  return (
    <div className="rounded-2xl bg-[--panel] border border-slate-800 p-4">
      <div className="text-3xl">{avatar ?? "🙂"}</div>
      <div className="mt-1 font-medium">{name}</div>
      <div className={`text-xs mt-1 ${connected ? "text-[--success]" : "text-slate-400"}`}>
        {connected ? "online" : "disconnected"}
      </div>
    </div>
  );
}
