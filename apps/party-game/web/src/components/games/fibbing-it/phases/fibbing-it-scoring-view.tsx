'use client';
import { TimerPhaseLayout, gameStyles, animationDelays } from '../shared';
import type { Choice } from '../../../shared/types';

type FibbingItScoringViewProps = {
  question: string;
  choices: Choice[];
  correctAnswer: string;
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
  isPlayer?: boolean;
  isHost?: boolean;
};

export function FibbingItScoringView({
  question,
  choices,
  correctAnswer,
  timeLeft,
  totalTime,
  round,
  maxRounds,
  roomCode = 'GR7A',
  votes = [],
  players = [],
  isPlayer = false,
  isHost = false,
}: FibbingItScoringViewProps) {
  // Content for both mobile and desktop
  const scoringContent = (
    <>
      {/* Question */}
      <h2 className={`${gameStyles.text.headingMedium} mb-6 leading-relaxed ${gameStyles.animation.fadeIn}`} style={{ animationDelay: animationDelays.fast }}>
        {question}
      </h2>

      {/* Answer Display */}
      <div className={`${gameStyles.content.box} ${gameStyles.animation.fadeIn}`} style={{ animationDelay: animationDelays.medium }}>
        <div className="bg-slate-800 border border-slate-600 rounded-xl p-4">
          <div className="text-sm text-slate-400 mb-2">Correct Answer:</div>
          <div className="text-white font-medium">{correctAnswer}</div>
        </div>

        {/* Round Info */}
        <div className={`text-2xl font-bold ${gameStyles.text.accent}`}>
          Round {round} of {maxRounds}
        </div>
      </div>

      {/* Host view: Enhanced scoring display */}
      {isHost && (
        <>
          {/* Question and Answer Card */}
          <div className={gameStyles.card.standard}>
            <h3 className="text-2xl text-white mb-4">{question}</h3>
            <div className={`text-xl ${gameStyles.text.accent} font-bold font-baloo2`}>
              Correct Answer: {correctAnswer}
            </div>
          </div>

          {/* Choices and Votes Grid */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            {choices.map(choice => {
              const voteCount = votes.filter(v => v.vote === choice.id).length;
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

          {/* Player Scores */}
          {players.length > 0 && (
            <div className="w-full max-w-md mx-auto space-y-3">
              <h3 className="text-2xl text-white font-bold mb-4">Player Scores</h3>
              {players
                .sort((a, b) => b.score - a.score)
                .map((player, index) => (
                  <div
                    key={player.id}
                    className={`w-full p-4 rounded-xl transition-all duration-500 transform
                      opacity-100 translate-y-0
                      relative overflow-hidden bg-slate-800/50 border border-slate-600/50
                    `}
                    style={{ 
                      animationDelay: `${900 + index * 100}ms`,
                      transitionDelay: `${index * 100}ms`
                    }}
                  >
                    {/* Content */}
                    <div className="relative z-10 flex items-center gap-3">
                      {/* Left: Player Avatar */}
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold">
                          {player.name.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      
                      {/* Center: Player Name */}
                      <div className="flex-1">
                        <span className="text-white font-bold text-xl drop-shadow-2xl tracking-wide">{player.name}</span>
                      </div>
                      
                      {/* Right: Points */}
                      <div className={`text-white font-black text-3xl ${gameStyles.text.accent} font-baloo2 tracking-wider`}>
                        {player.score}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </>
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
      phaseTitle="SCORING"
      round={round}
      maxRounds={maxRounds}
      showBackButton={isPlayer}
      onBackClick={() => window.history.back()}
    >
      {scoringContent}
    </TimerPhaseLayout>
  );
}
