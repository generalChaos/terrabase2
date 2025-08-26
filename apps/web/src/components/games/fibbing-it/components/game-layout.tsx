'use client';
import { ReactNode } from 'react';
import { gameStyles, animationDelays } from '../shared';

type GameLayoutProps = {
  children: ReactNode;
};

export function GameLayout({ children }: GameLayoutProps) {
  return (
    <div className={`${gameStyles.background} ${gameStyles.container.fullScreen}`}>
      {/* Main Content */}
      <div className={`${gameStyles.container.centered} ${gameStyles.animation.fadeIn}`} style={{ animationDelay: animationDelays.normal }}>
        <div className={gameStyles.container.content}>
          {children}
        </div>
      </div>
    </div>
  );
}
