'use client';
import { PhaseLayout, gameStyles, animationDelays } from '../shared';
import type { Choice } from '../../../shared/types';

type FibbingItRevealViewProps = {
  question: string;
  choices: Choice[];
  correctAnswer: string;
  timeLeft: number;
  roomCode?: string;
  votes?: Array<{ voter: string; vote: string }>;
  players?: Array<{
    id: string;
    name: string;
    avatar?: string;
    score: number;
    connected?: boolean;
  }>;
  isPlayer?: boolean;
  isHost?: boolean;
};

export function FibbingItRevealView({
  question,
  choices,
  correctAnswer,
  timeLeft,
  roomCode = 'GR7A',
  votes = [],
  players = [],
  isPlayer = false,
  isHost = false,
}: FibbingItRevealViewProps) {
  // Content for both mobile and desktop
  const revealContent = (
    <>
      {/* Question */}
      <h2 className={`${gameStyles.text.headingMedium} mb-6 leading-relaxed ${gameStyles.animation.fadeIn}`} style={{ animationDelay: animationDelays.fast }}>
        {question}
      </h2>

      {/* Correct Answer Highlight */}
      <div className={`${gameStyles.content.box} ${gameStyles.animation.fadeIn}`} style={{ animationDelay: animationDelays.medium }}>
        <div className="bg-gradient-to-r from-green-500/30 to-emerald-500/30 border-2 border-green-400 rounded-xl p-6 text-center shadow-lg shadow-green-500/25">
          <div className="text-sm text-green-300 mb-2 font-medium">🎯 Correct Answer:</div>
          <div className="text-3xl text-white font-bold mb-2">{correctAnswer}</div>
          <div className="text-green-300 text-sm">This was the actual answer to the question!</div>
        </div>
      </div>

      {/* All Choices with Results */}
      <div className={`${gameStyles.content.box} ${gameStyles.animation.fadeIn}`} style={{ animationDelay: animationDelays.slow }}>
        {choices.map((choice, index) => {
          const voteCount = votes.filter(v => v.vote === choice.id).length;
          const isCorrect = choice.text === correctAnswer;
          const player = players.find(p => p.id === choice.by);

          return (
            <div
              key={choice.id}
              className={`w-full p-4 rounded-xl border-2 transition-all duration-200 ${
                isCorrect
                  ? 'bg-green-500/20 border-green-500 text-white shadow-lg shadow-green-500/25'
                  : 'bg-slate-800 border-slate-600 text-white'
              }`}
              style={{ 
                animationDelay: `${900 + index * 100}ms`,
                transitionDelay: `${index * 100}ms`
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Player Avatar */}
                  {player && (
                    <div className="flex-shrink-0">
                      <img
                        src={player.avatar || `/avatars/avatar_1_transparent.png`}
                        alt={`${player.name}'s avatar`}
                        className="w-8 h-8 rounded-full border-2 border-slate-600"
                      />
                    </div>
                  )}
                  
                  {/* Answer Text */}
                  <span className="font-medium">{choice.text}</span>
                  
                  {/* Player Name for non-system answers */}
                  {choice.by !== 'system' && player && (
                    <span className="text-sm text-slate-400 ml-2">
                      by {player.name}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-teal-400 font-bold">
                    {voteCount} votes
                  </span>
                  {isCorrect && (
                    <span className="text-green-400 font-bold text-xl">
                      ✓
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Host view: Enhanced reveal display */}
      {isHost && (
        <div className="grid grid-cols-2 gap-6 mb-8">
          {choices.map(choice => {
            const voteCount = votes.filter(v => v.vote === choice.id).length;
            const isCorrect = choice.text === correctAnswer;
            const player = players.find(p => p.id === choice.by);

            return (
              <div
                key={choice.id}
                className={`rounded-2xl p-6 border transition-colors ${
                  isCorrect
                    ? 'bg-green-500/20 border-green-500 shadow-lg shadow-green-500/25'
                    : 'bg-slate-800/50 border-slate-600'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  {/* Player Avatar */}
                  {player && (
                    <div className="flex-shrink-0">
                      <img
                        src={player.avatar || `/avatars/avatar_1_transparent.png`}
                        alt={`${player.name}'s avatar`}
                        className="w-10 h-10 rounded-full border-2 border-slate-600"
                      />
                    </div>
                  )}
                  
                  {/* Answer Text and Player Info */}
                  <div className="flex-1">
                    <div className="text-xl text-white mb-1">{choice.text}</div>
                    {choice.by !== 'system' && player && (
                      <div className="text-sm text-slate-400">
                        by {player.name}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-sm text-slate-400 mb-2">
                  Votes: {voteCount}
                </div>
                
                {isCorrect && (
                  <div className="text-green-400 font-bold text-lg flex items-center gap-2">
                    <span>✓</span>
                    <span>Correct Answer!</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );

  return (
    <PhaseLayout
      roomCode={roomCode}
      timeLeft={timeLeft}
      isPlayer={isPlayer}
      isHost={isHost}
      showBackButton={isPlayer}
      onBackClick={() => window.history.back()}
    >
      {revealContent}
    </PhaseLayout>
  );
}
