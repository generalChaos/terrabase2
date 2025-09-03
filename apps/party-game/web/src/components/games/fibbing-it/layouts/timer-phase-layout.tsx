'use client';
import { ReactNode } from 'react';
import { TimerRing } from '../../shared/ui';
import { PhaseLayout } from './phase-layout';
import { gameStyles, animationDelays } from '../shared';

type TimerPhaseLayoutProps = {
  children: ReactNode;
  roomCode: string;
  timeLeft: number;
  totalTime: number;
  isPlayer?: boolean;
  isHost?: boolean;
  phaseTitle?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  round?: number;
  maxRounds?: number;
};

export function TimerPhaseLayout({
  children,
  roomCode,
  timeLeft,
  totalTime,
  isPlayer = false,
  isHost = false,
  phaseTitle,
  showBackButton = false,
  onBackClick,
  round,
  maxRounds,
}: TimerPhaseLayoutProps) {
  if (isPlayer) {
    // Mobile view - timer is in header, no additional timer display needed
    return (
      <PhaseLayout
        roomCode={roomCode}
        timeLeft={timeLeft}
        isPlayer={true}
        showBackButton={showBackButton}
        onBackClick={onBackClick}
      >
        {children}
      </PhaseLayout>
    );
  }

  // Host view - includes timer display
  return (
    <PhaseLayout
      roomCode={roomCode}
      timeLeft={timeLeft}
      isHost={true}
      phaseTitle={phaseTitle}
    >
      {/* Round Info */}
      {round && maxRounds && (
        <div className={`${gameStyles.text.body} ${gameStyles.animation.fadeIn}`} style={{ animationDelay: animationDelays.medium }}>
          Round {round} of {maxRounds}
        </div>
      )}

      {/* Timer */}
      <div className={`relative ${gameStyles.animation.scale}`} style={{ animationDelay: animationDelays.slow }}>
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

      {/* Phase-specific content */}
      {children}
    </PhaseLayout>
  );
}
