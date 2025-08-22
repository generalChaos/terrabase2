"use client";
import { TimerRing, PlayerAvatar } from "../../shared/ui";
import type { Choice } from "@party/types";

type FibbingItVotingViewProps = {
  question: string;
  choices: Choice[];
  timeLeft: number;
  totalTime: number;
  round: number;
  maxRounds: number;
  votes?: Array<{ voter: string; choiceId: string }>;
  players?: Array<{ id: string; name: string; avatar?: string; score: number; connected?: boolean }>;
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
  votes = [],
  players = [],
  onSubmitVote,
  hasVoted,
  selectedChoiceId,
  gotAnswerCorrect,
  isPlayer = false
}: FibbingItVotingViewProps) {
  const handleVote = (choiceId: string) => {
    if (onSubmitVote && !hasVoted && !gotAnswerCorrect) {
      onSubmitVote(choiceId);
    }
  };

  if (isPlayer) {
    // Mobile-style player view
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 bg-slate-800/50">
          <button className="text-white text-2xl">←</button>
          <div className="text-white font-mono text-lg">GR7A</div>
          <div className="text-white font-bold text-xl">
            {Math.ceil(timeLeft / 1000)}
          </div>
        </div>

        {/* Question */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-8 leading-relaxed">
            {question}
          </h2>

          {/* Choices */}
          <div className="w-full max-w-md space-y-4">
            {choices.map((choice) => (
              <button
                key={choice.id}
                onClick={() => handleVote(choice.id)}
                disabled={hasVoted || gotAnswerCorrect}
                className={`w-full p-4 text-lg rounded-xl transition-all duration-200 ${
                  selectedChoiceId === choice.id
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-600'
                } ${hasVoted || gotAnswerCorrect ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {choice.text}
              </button>
            ))}
          </div>

          {hasVoted && (
            <div className="mt-4 text-teal-400 font-medium">
              Vote submitted!
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop view (host or player)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-6">
        <h1 className="text-4xl font-bold text-white tracking-wider">FIBBING IT!</h1>
        <div className="text-2xl font-mono text-teal-400 bg-slate-800 px-4 py-2 rounded-lg">
          GR7A
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="text-center space-y-8 w-full max-w-4xl">
          {/* Title */}
          <h2 className="text-6xl font-bold text-white tracking-wider">VOTING</h2>

          {/* Timer */}
          <div className="flex justify-center">
            <TimerRing
              seconds={Math.ceil(timeLeft / 1000)}
              total={Math.ceil(totalTime / 1000)}
            />
          </div>

          {/* Question */}
          <h3 className="text-2xl text-white mb-8">
            {question}
          </h3>

          {/* Choices Grid */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            {choices.map((choice) => (
              <div
                key={choice.id}
                className="bg-slate-800/50 rounded-2xl p-6 border border-slate-600 hover:border-slate-500 transition-colors"
              >
                <div className="text-xl text-white mb-4">{choice.text}</div>
                <div className="text-sm text-slate-400">
                  Votes: {votes.filter(v => v.choiceId === choice.id).length}
                </div>
              </div>
            ))}
          </div>

          {/* Player Status */}
          <div className="grid grid-cols-3 gap-4">
            {players.slice(0, 6).map((player) => {
              const hasVoted = votes.some(v => v.voter === player.id);
              return (
                <div key={player.id} className="text-center">
                  <PlayerAvatar
                    avatar={player.avatar}
                  />
                  <div className={`text-sm mt-2 ${hasVoted ? 'text-teal-400' : 'text-slate-400'}`}>
                    {hasVoted ? 'Voted' : 'Waiting...'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
