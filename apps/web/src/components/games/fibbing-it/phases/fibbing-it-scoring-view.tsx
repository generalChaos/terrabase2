"use client";
import { TimerRing, PlayerAvatar } from "../../shared/ui";
import type { Choice } from "@party/types";

type FibbingItScoringViewProps = {
  question: string;
  correctAnswer: string;
  choices: Choice[];
  timeLeft: number;
  totalTime: number;
  round: number;
  maxRounds: number;
  votes?: Array<{ voter: string; choiceId: string }>;
  players?: Array<{ id: string; name: string; avatar?: string; score: number; connected?: boolean }>;
  scores?: Array<{ playerId: string; score: number }>;
  playerId?: string;
  isPlayer?: boolean;
  isHost?: boolean;
};

export function FibbingItScoringView({
  question,
  correctAnswer,
  choices,
  timeLeft,
  totalTime,
  votes = [],
  players = [],
  scores = [],
  playerId,
  isPlayer = false
}: FibbingItScoringViewProps) {
  const getPlayerScore = (playerId: string) => {
    return scores.find(s => s.playerId === playerId)?.score || 0;
  };

  if (isPlayer) {
    // Mobile-style player view
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 bg-slate-800/50">
          <button className="text-white text-2xl">←</button>
          <div className="text-white font-mono text-lg">GR7A</div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-8">
            {question}
          </h2>

          <div className="text-xl text-teal-400 mb-8">
            Correct Answer: {correctAnswer}
          </div>

          <div className="text-lg text-white">
            Your Score: {getPlayerScore(playerId || "")}
          </div>
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
          <h2 className="text-6xl font-bold text-white tracking-wider">SCORING</h2>

          {/* Timer */}
          <div className="flex justify-center">
            <TimerRing
              seconds={Math.ceil(timeLeft / 1000)}
              total={Math.ceil(totalTime / 1000)}
            />
          </div>

          {/* Question and Answer */}
          <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-600">
            <h3 className="text-2xl text-white mb-4">{question}</h3>
            <div className="text-xl text-teal-400 font-bold">
              Correct Answer: {correctAnswer}
            </div>
          </div>

          {/* Choices and Votes */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            {choices.map((choice) => {
              const voteCount = votes.filter(v => v.choiceId === choice.id).length;
              const isCorrect = choice.text === correctAnswer;
              
              return (
                <div
                  key={choice.id}
                  className={`rounded-2xl p-6 border transition-colors ${
                    isCorrect 
                      ? 'bg-green-500/20 border-green-500' 
                      : 'bg-slate-800/50 border-slate-600'
                  }`}
                >
                  <div className="text-xl text-white mb-2">{choice.text}</div>
                  <div className="text-sm text-slate-400">
                    Votes: {voteCount}
                  </div>
                  {isCorrect && (
                    <div className="text-green-400 font-bold mt-2">✓ Correct!</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Player Scores */}
          <div className="grid grid-cols-3 gap-4">
            {players.slice(0, 6).map((player) => (
              <div key={player.id} className="text-center">
                <PlayerAvatar
                  avatar={player.avatar}
                />
                <div className="text-lg text-white font-bold mt-2">
                  {getPlayerScore(player.id)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
