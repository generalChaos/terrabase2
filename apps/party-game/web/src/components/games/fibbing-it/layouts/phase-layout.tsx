'use client';
import { ReactNode } from 'react';
import { gameStyles, animationDelays } from '../shared';

type PhaseLayoutProps = {
  children: ReactNode;
  roomCode: string;
  timeLeft: number;
  isPlayer?: boolean;
  isHost?: boolean;
  phaseTitle?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
};

export function PhaseLayout({
  children,
  roomCode,
  timeLeft,
  isPlayer = false,
  isHost = false,
  phaseTitle,
  showBackButton = false,
  onBackClick,
}: PhaseLayoutProps) {
  if (isPlayer) {
    // Mobile-style player view
    return (
      <div className={`${gameStyles.background} ${gameStyles.container.fullScreen}`}>
        {/* Mobile Header */}
        <div className={`flex items-center justify-between p-4 bg-slate-800/50 backdrop-blur-sm ${gameStyles.animation.slideDown}`}>
          {showBackButton ? (
            <button 
              onClick={onBackClick}
              className={gameStyles.button.back}
            >
              ←
            </button>
          ) : (
            <div className="w-8" /> // Spacer for alignment
          )}
          
          <div className="text-white font-mono text-lg">{roomCode}</div>
          <div className={`text-white font-bold text-xl ${gameStyles.animation.pulse}`}>
            {Math.ceil(timeLeft / 1000)}
          </div>
        </div>

        {/* Main Content */}
        <div className={`${gameStyles.container.centered} text-center ${gameStyles.animation.fadeIn}`} style={{ animationDelay: animationDelays.fast }}>
          {children}
        </div>
      </div>
    );
  }

  // Host view (desktop)
  return (
    <div className={`${gameStyles.background} ${gameStyles.container.fullScreen}`}>
      {/* Header */}
      <div className={`flex justify-between items-center p-6 ${gameStyles.animation.slideDown}`}>
        <h1 className={`${gameStyles.text.headingLarge} tracking-wider ${gameStyles.animation.fadeIn}`}>
          FIBBING IT!
        </h1>
        <div className={`${gameStyles.text.roomCode} ${gameStyles.animation.fadeIn}`} style={{ animationDelay: animationDelays.quick }}>
          {roomCode}
        </div>
      </div>

      {/* Main Content */}
      <div className={`${gameStyles.container.centered} ${gameStyles.animation.fadeIn}`} style={{ animationDelay: animationDelays.normal }}>
        <div className={gameStyles.container.content}>
          {/* Phase Title */}
          {phaseTitle && (
            <h2 className={`text-6xl font-bold text-white tracking-wider ${gameStyles.animation.fadeIn}`} style={{ animationDelay: animationDelays.medium }}>
              {phaseTitle}
            </h2>
          )}
          
          {children}
        </div>
      </div>
    </div>
  );
}
