'use client';
import { TimerRing } from './games/shared/ui';
import type { Choice } from '../shared/types';

type VotingViewProps = {
  question: string;
  choices: Choice[];
  timeLeft: number;
  totalTime: number;
  round: number;
  maxRounds: number;
  votes: Array<{ voter: string; vote: string }>;
  players: Array<{ id: string; name: string; avatar?: string }>;
};

export function VotingView({
  question,
  choices,
  timeLeft,
  totalTime,
  round,
  maxRounds,
  votes,
  players,
}: VotingViewProps) {
  const getVoteCount = (choiceId: string) => {
    return votes.filter(v => v.vote === choiceId).length;
  };

  const getVoterNames = (choiceId: string) => {
    const voters = votes.filter(v => v.vote === choiceId);
    return voters.map(v => {
      const player = players.find(p => p.id === v.voter);
      return player?.name || 'Unknown';
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      {/* Round indicator */}
      <div className="mb-8">
        <div className="text-sm text-[--muted] mb-2">
          Round {round} of {maxRounds}
        </div>
        <div className="w-24 h-1 bg-[--panel] rounded-full overflow-hidden">
          <div
            className="h-full bg-[--accent] transition-all duration-300 ease-out"
            style={{ width: `${(round / maxRounds) * 100}%` }}
          />
        </div>
      </div>

      {/* Timer and Question */}
      <div className="flex flex-col items-center gap-8 mb-8">
        <TimerRing seconds={timeLeft} total={totalTime} />

        <div className="max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-bold text-[--text] leading-tight mb-4">
            {question}
          </h1>
          <p className="text-[--muted] text-lg">
            Players are voting on the correct answer...
          </p>
        </div>
      </div>

      {/* Choices and Vote Counts */}
      <div className="w-full max-w-4xl">
        <h2 className="text-2xl font-semibold mb-6">Voting Results</h2>
        <div className="grid gap-4">
          {choices.map(choice => {
            const voteCount = getVoteCount(choice.id);
            const voterNames = getVoterNames(choice.id);
            const isTruth = choice.id.startsWith('TRUE::');

            return (
              <div
                key={choice.id}
                className={`p-4 rounded-xl border-2 transition-all ${
                  isTruth
                    ? 'border-[--success] bg-[--success]/10'
                    : 'border-[--border] bg-[--panel]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-sm px-2 py-1 rounded-full ${
                        isTruth
                          ? 'bg-[--success] text-black font-semibold'
                          : 'bg-[--muted] text-[--text]'
                      }`}
                    >
                      {isTruth ? 'TRUTH' : 'BLUFF'}
                    </span>
                    <span className="text-lg font-medium">{choice.text}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[--accent]">
                      {voteCount}
                    </div>
                    <div className="text-sm text-[--muted]">votes</div>
                  </div>
                </div>

                {voterNames.length > 0 && (
                  <div className="text-sm text-[--muted]">
                    Voted by: {voterNames.join(', ')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress Info */}
      <div className="mt-8 text-[--muted] text-center">
        <p>
          Total votes: {votes.length} / {players.length}
        </p>
        <p className="text-sm mt-1">Time remaining: {timeLeft} seconds</p>
      </div>
    </div>
  );
}
