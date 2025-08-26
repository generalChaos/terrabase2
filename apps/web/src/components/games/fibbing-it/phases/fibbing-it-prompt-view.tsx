'use client';
import { useState } from 'react';
import { buttonVariants } from '@party/ui';
import { TimerPhaseLayout } from '../shared';
import { gameStyles, animationDelays } from '../shared';

type FibbingItPromptViewProps = {
  question: string;
  timeLeft: number;
  totalTime: number;
  round: number;
  maxRounds: number;
  roomCode?: string;
  isPlayer?: boolean;
  isHost?: boolean;
  onSubmitAnswer?: (answer: string) => void;
  hasSubmitted?: boolean;
};

export function FibbingItPromptView({
  question,
  timeLeft,
  totalTime,
  round,
  maxRounds,
  roomCode = 'GR7A',
  isPlayer = false,
  isHost = false,
  onSubmitAnswer,
  hasSubmitted = false,
}: FibbingItPromptViewProps) {
  const [answer, setAnswer] = useState('');

  const handleSubmit = () => {
    if (answer.trim() && onSubmitAnswer) {
      onSubmitAnswer(answer.trim());
    }
  };

  // Content for both mobile and desktop
  const promptContent = (
    <>
      {/* Question */}
      <h2 className={`${gameStyles.text.headingLarge} mb-8 leading-relaxed ${gameStyles.animation.fadeIn}`} style={{ animationDelay: animationDelays.medium }}>
        {question}
      </h2>

      {/* Answer Input */}
      <div className={`${gameStyles.content.form} ${gameStyles.animation.fadeIn}`} style={{ animationDelay: animationDelays.medium }}>
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Enter your answer..."
          className="w-full px-4 py-3 text-lg bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[--accent] focus:border-transparent transition-all duration-200"
          disabled={hasSubmitted}
        />

        <button
          onClick={handleSubmit}
          disabled={!answer.trim() || hasSubmitted}
          className={buttonVariants({
            variant: hasSubmitted ? "success" : "accent",
            size: "xl",
            fullWidth: true,
            animation: hasSubmitted ? "none" : "glow"
          })}
        >
          {hasSubmitted ? "Submitted!" : "Submit"}
        </button>
      </div>

      {/* Status for host view */}
      {isHost && (
        <div className={`${gameStyles.text.body} ${gameStyles.animation.fadeIn}`} style={{ animationDelay: animationDelays.slowest }}>
          Players are submitting answers...
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
      round={round}
      maxRounds={maxRounds}
      showBackButton={isPlayer}
      onBackClick={() => window.history.back()}
    >
      {promptContent}
    </TimerPhaseLayout>
  );
}
