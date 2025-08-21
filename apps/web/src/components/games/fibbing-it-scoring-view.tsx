"use client";
import { TimerRing } from "../timer-ring";
import { PlayerAvatar } from "../player-avatar";
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
  round,
  maxRounds,
  votes = [],
  players = [],
  scores = [],
  playerId,
  isPlayer = false,
  isHost = false
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

          {/* Answer Input */}
          <div className="w-full max-w-md space-y-4">
            <input
              type="text"
              placeholder="Enter your answer..."
              className="w-full px-4 py-3 text-lg bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
            />
            
            <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-xl font-bold py-3 rounded-xl transition-all duration-200">
              Submit
            </button>
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
          <div className="relative">
            <TimerRing
              timeLeft={timeLeft}
              totalTime={totalTime}
              size={120}
              strokeWidth={8}
              className="text-teal-400"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {Math.ceil(timeLeft / 1000)}s
              </span>
            </div>
          </div>

          {/* Question and Answer */}
          <div className="space-y-4">
            <h3 className="text-2xl text-white">
              {question}
            </h3>
            <div className="text-xl text-teal-400 font-bold">
              Correct Answer: {correctAnswer}
            </div>
          </div>

          {/* Choices with Vote Results */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            {choices.map((choice) => {
              const voteCount = votes.filter(v => v.choiceId === choice.id).length;
              const isCorrect = choice.text === correctAnswer;
              
              return (
                <div
                  key={choice.id}
                  className={`
                    p-6 rounded-2xl text-xl font-bold transition-all duration-200
                    ${isCorrect
                      ? 'bg-green-600 text-white shadow-2xl'
                      : 'bg-slate-800 text-white border border-slate-600'
                    }
                  `}
                >
                  <div className="mb-2">{choice.text}</div>
                  <div className="text-sm opacity-80">
                    Votes: {voteCount}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Player Status */}
          <div className="flex justify-center space-x-4 mb-4">
            {players.slice(0, 4).map((player) => (
              <PlayerAvatar
                key={player.id}
                player={player}
                size="small"
                className="text-2xl"
              />
            ))}
          </div>
          
          <div className="text-xl text-slate-300">
            Calculating scores...
          </div>
        </div>
      </div>
    </div>
  );
}
