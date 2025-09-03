'use client';
import { TimerRing } from './games/shared/ui';
import type { Choice, Vote } from '../shared/types';

type PlayerScoringViewProps = {
  question: string;
  correctAnswer: string;
  choices: Choice[];
  timeLeft: number;
  totalTime: number;
  round: number;
  maxRounds: number;
  votes: Vote[];
  scores: Array<{ playerId: string; score: number }>;
  playerId: string; // Current player's ID
};

export function PlayerScoringView({
  question,
  correctAnswer,
  choices,
  timeLeft,
  totalTime,
  round,
  maxRounds,
  votes,
  scores,
  playerId,
}: PlayerScoringViewProps) {
  const getVoteCount = (choiceId: string) => {
    return votes.filter(v => v.vote === choiceId).length;
  };

  const getScoreForPlayer = (id: string) => {
    const scoreData = scores.find(s => s.playerId === id);
    return scoreData?.score || 0;
  };

  const getPlayerVote = () => {
    return votes.find(v => v.voter === playerId);
  };

  const getPlayerChoice = () => {
    const vote = getPlayerVote();
    if (!vote) return null;
    return choices.find(c => c.id === vote.vote);
  };

  const calculatePlayerRoundScore = () => {
    const vote = getPlayerVote();
    if (!vote) return 0;

    let roundScore = 0;

    // Check if player voted for truth (+1000 points)
    if (vote.vote.startsWith('TRUE::')) {
      roundScore += 1000;
    }

    // Check if player's bluff fooled others (+500 per fooled player)
    const playerBluff = choices.find(
      c => c.by === playerId && !c.id.startsWith('TRUE::')
    );
    if (playerBluff) {
      const fooledCount = getVoteCount(playerBluff.id);
      roundScore += fooledCount * 500;
    }

    return roundScore;
  };

  const playerChoice = getPlayerChoice();
  const playerVotedCorrectly = playerChoice?.id.startsWith('TRUE::');
  const roundScore = calculatePlayerRoundScore();
  const totalScore = getScoreForPlayer(playerId);

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
          <div className="text-xl text-[--success] font-semibold">
            ✅ Correct Answer:{' '}
            <span className="text-[--text]">{correctAnswer}</span>
          </div>
        </div>
      </div>

      {/* Personal Results */}
      <div className="w-full max-w-2xl">
        <h2 className="text-2xl font-semibold mb-6">Your Results</h2>

        {/* Your Vote */}
        <div className="bg-[--panel] rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Your Vote</h3>
          {playerChoice ? (
            <div
              className={`p-4 rounded-xl border-2 ${
                playerVotedCorrectly
                  ? 'border-[--success] bg-[--success]/10'
                  : 'border-[--danger] bg-[--danger]/10'
              }`}
            >
              <div className="flex items-center justify-center gap-3 mb-2">
                <span
                  className={`text-sm px-2 py-1 rounded-full ${
                    playerVotedCorrectly
                      ? 'bg-[--success] text-black font-semibold'
                      : 'bg-[--danger] text-white font-semibold'
                  }`}
                >
                  {playerVotedCorrectly ? 'CORRECT!' : 'WRONG'}
                </span>
                <span className="text-lg font-medium">{playerChoice.text}</span>
              </div>
              <div
                className={`text-lg font-semibold ${
                  playerVotedCorrectly ? 'text-[--success]' : 'text-[--danger]'
                }`}
              >
                {playerVotedCorrectly ? '🎉 +1000 points!' : '😅 0 points'}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl border-2 border-[--muted] bg-[--muted]/10">
              <div className="text-[--muted]">
                You didn&apos;t vote this round
              </div>
            </div>
          )}
        </div>

        {/* Bluff Performance */}
        {choices.some(c => c.by === playerId && !c.id.startsWith('TRUE::')) && (
          <div className="bg-[--panel] rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Your Bluff</h3>
            {choices
              .filter(c => c.by === playerId && !c.id.startsWith('TRUE::'))
              .map(bluff => {
                const fooledCount = getVoteCount(bluff.id);
                const bluffScore = fooledCount * 500;

                return (
                  <div
                    key={bluff.id}
                    className="p-4 rounded-xl border-2 border-[--warning] bg-[--warning]/10"
                  >
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <span className="bg-[--warning] text-black font-semibold text-sm px-2 py-1 rounded-full">
                        YOUR BLUFF
                      </span>
                      <span className="text-lg font-medium">{bluff.text}</span>
                    </div>
                    <div className="text-lg font-semibold text-[--warning]">
                      {fooledCount > 0
                        ? `🎭 Fooled ${fooledCount} players! +${bluffScore} points!`
                        : '😔 Nobody fell for it... 0 points'}
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* Score Summary */}
        <div className="bg-[--panel] rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Score Summary</h3>
          <div className="text-center">
            <div className="text-3xl font-bold text-[--accent] mb-2">
              +{roundScore}
            </div>
            <div className="text-sm text-[--muted] mb-4">Points this round</div>
            <div className="text-xl font-semibold text-[--text]">
              Total Score: <span className="text-[--accent]">{totalScore}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Info */}
      <div className="mt-8 text-[--muted] text-center">
        <p className="text-sm">Next round starts in {timeLeft} seconds...</p>
      </div>
    </div>
  );
}
