"use client";
import { useState } from "react";
import { TimerRing } from "../../shared/ui";
import { buttonVariants } from "@party/ui";

type FibbingItPromptViewProps = {
  question: string;
  timeLeft: number;
  totalTime: number;
  round: number;
  maxRounds: number;
  onSubmitAnswer?: (answer: string) => void;
  hasSubmitted?: boolean;
  isPlayer?: boolean;
};

export function FibbingItPromptView({
  question,
  timeLeft,
  totalTime,
  round,
  maxRounds,
  onSubmitAnswer,
  hasSubmitted,
  isPlayer = false,
}: FibbingItPromptViewProps) {
  const [answer, setAnswer] = useState("");

  const handleSubmit = () => {
    if (answer.trim() && onSubmitAnswer) {
      onSubmitAnswer(answer.trim());
    }
  };

  if (isPlayer) {
    // Mobile-style player view
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col animate-fade-in">
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 bg-slate-800/50 backdrop-blur-sm animate-slide-down">
          <button className="text-white text-2xl hover:scale-110 transition-transform duration-200">←</button>
          <div className="text-white font-mono text-lg">GRMT</div>
          <div className="text-white font-bold text-xl animate-pulse-slow">
            {Math.ceil(timeLeft / 1000)}
          </div>
        </div>

        {/* Question */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <h2 className="text-3xl font-bold text-white mb-8 leading-relaxed">
            {question}
          </h2>

          {/* Answer Input */}
          <div className="w-full max-w-md space-y-4 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
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
        </div>
      </div>
    );
  }

  // Host view (desktop)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center p-6 animate-slide-down">
        <h1 className="text-4xl font-bold text-white tracking-wider animate-fade-in-up">
          FIBBING IT!
        </h1>
        <div className="text-2xl font-mono text-teal-400 bg-slate-800 px-4 py-2 rounded-lg animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          GR7A
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
        <div className="text-center space-y-8">
          {/* Round Info */}
          <div className="text-2xl text-slate-300 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
            Round {round} of {maxRounds}
          </div>

          {/* Timer */}
          <div className="relative animate-scale-in" style={{ animationDelay: '600ms' }}>
            <TimerRing
              seconds={Math.ceil(timeLeft / 1000)}
              total={Math.ceil(totalTime / 1000)}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold text-white">
                {Math.ceil(timeLeft / 1000)}s
              </span>
            </div>
          </div>

          {/* Question */}
          <h2 className="text-4xl font-bold text-white max-w-4xl leading-relaxed animate-fade-in-up" style={{ animationDelay: '700ms' }}>
            {question}
          </h2>

          {/* Status */}
          <div className="text-xl text-slate-300 animate-fade-in-up" style={{ animationDelay: '800ms' }}>
            Players are submitting answers...
          </div>
        </div>
      </div>
    </div>
  );
}
