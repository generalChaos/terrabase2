'use client';
import { PlayerAvatar } from '../../shared/ui';

type HostVotingOverlayProps = {
  players: Array<{
    id: string;
    name: string;
    avatar?: string;
    score: number;
    connected?: boolean;
  }>;
  votes: Array<{ voter: string; choiceId: string }>;
};

export function HostVotingOverlay({ players, votes }: HostVotingOverlayProps) {
  return (
    <div className="absolute top-24 right-6 bg-slate-800/90 backdrop-blur-sm rounded-2xl p-4 border border-slate-600/50 animate-fade-in-left">
      <h3 className="text-lg font-bold text-white mb-4">Player Status</h3>
      <div className="space-y-3">
        {players.slice(0, 6).map(player => {
          const hasVoted = votes.some(v => v.voter === player.id);
          return (
            <div key={player.id} className="flex items-center gap-3">
              <PlayerAvatar avatar={player.avatar} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white truncate">{player.name}</div>
                <div className={`text-xs ${hasVoted ? 'text-green-400' : 'text-slate-400'}`}>
                  {hasVoted ? 'Voted' : 'Waiting...'}
                </div>
              </div>
              <div className={`w-2 h-2 rounded-full ${hasVoted ? 'bg-green-500' : 'bg-slate-500'}`} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
