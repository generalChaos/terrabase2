'use client';
import { TimerRing } from '../../shared/ui';

type TimerDisplayProps = {
  timeLeft: number;
  totalTime: number;
};

export function TimerDisplay({ timeLeft, totalTime }: TimerDisplayProps) {
  return (
    <div className="relative animate-scale-in flex justify-center" style={{ animationDelay: '500ms' }}>
      {/* Timer Container - Made Bigger */}
      <div className="relative transform scale-150">
        <TimerRing
          seconds={Math.ceil(timeLeft / 1000)}
          total={Math.ceil(totalTime / 1000)}
        />
      </div>
    </div>
  );
}
