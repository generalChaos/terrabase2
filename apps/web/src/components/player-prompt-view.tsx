'use client';
import { useState } from 'react';
import { TimerRing } from './games/shared/ui';

type PlayerPromptViewProps = {
  question: string;
  timeLeft: number;
  totalTime: number;
  round: number;
  maxRounds: number;
  onSubmitAnswer: (answer: string) => void;
  hasSubmitted: boolean;
};

export function PlayerPromptView({
  question,
  timeLeft,
  totalTime,
  round,
  maxRounds,
  onSubmitAnswer,
  hasSubmitted,
}: PlayerPromptViewProps) {
  const [answer, setAnswer] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (answer.trim()) {
      onSubmitAnswer(answer.trim());
    }
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
          <h1 className="text-3xl md:text-4xl font-bold text-[--text] leading-tight">
            {question}
          </h1>
        </div>
      </div>

      {/* Answer Input */}
      <div className="w-full max-w-md">
        {!hasSubmitted ? (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="answer"
                className="block text-sm font-medium text-[--muted] mb-2"
              >
                Your Answer
              </label>
              <input
                id="answer"
                type="text"
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                placeholder="Type your answer here..."
                className="w-full h-12 px-4 rounded-xl bg-[--panel] border border-[--border] text-[--text] placeholder-[--muted] focus:outline-none focus:ring-2 focus:ring-[--accent] focus:border-transparent"
                disabled={timeLeft <= 0}
              />
            </div>
            <button
              type="submit"
              disabled={!answer.trim() || timeLeft <= 0}
              className="w-full h-12 px-6 rounded-xl bg-[--accent] text-black font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[--accent-hover] transition-colors"
            >
              Submit Answer
            </button>
          </form>
        ) : (
          <div className="text-center">
            <div className="mb-4">
              <label className="block text-sm font-medium text-[--muted] mb-2">
                Your Answer
              </label>
              <div className="w-full h-12 px-4 rounded-xl bg-[--panel] border border-[--accent] text-[--text] flex items-center justify-center">
                <span className="font-medium">{answer}</span>
              </div>
            </div>
            <div className="text-2xl font-semibold text-[--accent] mb-2">
              ✅ Answer Submitted!
            </div>
            <div className="text-[--muted]">Waiting for other players...</div>
          </div>
        )}
      </div>

      {/* Time remaining info */}
      <div className="mt-8 text-[--muted] text-sm">
        Time remaining: {timeLeft} seconds
      </div>
    </div>
  );
}
