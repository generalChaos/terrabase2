"use client";
import { TimerRing } from "./timer-ring";

type PromptViewProps = {
  question: string;
  timeLeft: number;
  totalTime: number;
  round: number;
  maxRounds: number;
};

export function PromptView({ question, timeLeft, totalTime, round, maxRounds }: PromptViewProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      {/* Round indicator */}
      <div className="mb-8">
        <div className="text-sm text-[--muted] mb-2">Round {round} of {maxRounds}</div>
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

      {/* Instructions */}
      <div className="text-[--muted] text-lg">
        <p>Players are submitting their answers...</p>
        <p className="text-sm mt-2 opacity-80">Time remaining: {timeLeft} seconds</p>
      </div>
    </div>
  );
}
