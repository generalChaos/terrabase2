'use client';
import { TimerPhaseLayout, gameStyles, animationDelays } from '../shared';
import type { Choice } from '../../../shared/types';

type FibbingItVotingViewProps = {
  question: string;
  choices: Choice[];
  timeLeft: number;
  totalTime: number;
  round: number;
  maxRounds: number;
  roomCode?: string;
  votes?: Array<{ voter: string; vote: string }>;
  players?: Array<{
    id: string;
    name: string;
    avatar?: string;
    score: number;
    connected?: boolean;
  }>;
  onSubmitVote?: (choiceId: string) => void;
  hasVoted?: boolean;
  selectedChoiceId?: string;
  gotAnswerCorrect?: boolean;
  isPlayer?: boolean;
  isHost?: boolean;
};

export function FibbingItVotingView({
  question,
  choices,
  timeLeft,
  totalTime,
  round,
  maxRounds,
  roomCode = 'GR7A',
  votes = [],
  players = [],
  onSubmitVote,
  hasVoted,
  gotAnswerCorrect,
  isPlayer = false,
  isHost = false,
}: FibbingItVotingViewProps) {
  const handleVote = (choiceId: string) => {
    if (onSubmitVote && !hasVoted && !gotAnswerCorrect) {
      onSubmitVote(choiceId);
    }
  };

  // Content for both mobile and desktop
  const votingContent = (
    <>
      {/* Question */}
      <h2 className={`${gameStyles.text.headingMedium} mb-6 leading-relaxed ${gameStyles.animation.fadeIn}`} style={{ animationDelay: animationDelays.fast }}>
        {question}
      </h2>

      {/* Choices */}
      <div className={`${gameStyles.content.box} ${gameStyles.animation.fadeIn}`} style={{ animationDelay: animationDelays.medium }}>
        {choices && choices.length > 0 ? (
          choices.map((choice) => {
            return (
              <button
                key={choice.id}
                onClick={() => handleVote(choice.id)}
                disabled={hasVoted}
                className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-200 ${
                  hasVoted
                    ? 'bg-slate-800 border-slate-600 text-slate-400'
                    : 'bg-slate-800 border-slate-600 text-white hover:border-teal-400 hover:bg-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{choice.text}</span>
                  {hasVoted && (
                    <span className="text-teal-400 font-bold font-baloo2">
                      {votes.filter(v => v.vote === choice.id).length} votes
                    </span>
                  )}
                </div>
              </button>
            );
          })
        ) : (
          <div className="text-center text-slate-400 p-8">
            <div className="text-2xl mb-2">🤔</div>
            <div>No choices available</div>
            <div className="text-sm mt-2">Choices: {JSON.stringify(choices)}</div>
          </div>
        )}
      </div>

      {/* Vote confirmation */}
      {hasVoted && (
        <div className={`mt-6 ${gameStyles.text.success} ${gameStyles.animation.fadeIn}`} style={{ animationDelay: animationDelays.slower }}>
          ✓ Vote submitted!
        </div>
      )}

      {/* Host view: Choices Grid */}
      {isHost && (
        <div className="grid grid-cols-2 gap-6 mb-8">
          {choices.map(choice => (
            <div
              key={choice.id}
              className={gameStyles.card.standard}
            >
              <div className="text-xl text-white mb-4">{choice.text}</div>
              <div className="text-sm text-slate-400">
                Votes: {votes.filter(v => v.vote === choice.id).length}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );

  return (
    <TimerPhaseLayout
      roomCode={roomCode}
      timeLeft={timeLeft}
      totalTime={totalTime}
      isPlayer={isPlayer}
      isHost={isHost}
      phaseTitle="VOTING"
      round={round}
      maxRounds={maxRounds}
      showBackButton={isPlayer}
      onBackClick={() => window.history.back()}
    >
      {votingContent}
    </TimerPhaseLayout>
  );
}
