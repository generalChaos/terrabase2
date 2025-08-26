'use client';
import { PhaseLayout, gameStyles, animationDelays } from '../shared';
import type { Choice } from '@party/types';

type FibbingItRevealViewProps = {
  question: string;
  choices: Choice[];
  correctAnswer: string;
  timeLeft: number;
  roomCode?: string;
  votes?: Array<{ voter: string; choiceId: string }>;
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
        <div className="bg-green-500/20 border border-green-500 rounded-xl p-6 text-center">
          <div className="text-sm text-green-400 mb-2">Correct Answer:</div>
          <div className="text-2xl text-white font-bold">{correctAnswer}</div>
        </div>
      </div>

      {/* All Choices with Results */}
      <div className={`${gameStyles.content.box} ${gameStyles.animation.fadeIn}`} style={{ animationDelay: animationDelays.slow }}>
        {choices.map((choice, index) => {
          const voteCount = votes.filter(v => v.choiceId === choice.id).length;
          const isCorrect = choice.text === correctAnswer;

          return (
            <div
              key={choice.id}
              className={`w-full p-4 rounded-xl border-2 transition-all duration-200 ${
                isCorrect
                  ? 'bg-green-500/20 border-green-500 text-white'
                  : 'bg-slate-800 border-slate-600 text-white'
              }`}
              style={{ 
                animationDelay: `${900 + index * 100}ms`,
                transitionDelay: `${index * 100}ms`
              }}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{choice.text}</span>
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
                  <div className="text-green-400 font-bold mt-2">
                    ✓ Correct!
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
