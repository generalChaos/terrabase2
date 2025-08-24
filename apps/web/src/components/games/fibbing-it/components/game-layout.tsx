'use client';
import { ReactNode } from 'react';

type GameLayoutProps = {
  children: ReactNode;
};

export function GameLayout({ children }: GameLayoutProps) {
  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col animate-fade-in min-h-screen">
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
        <div className="text-center space-y-8 w-full max-w-4xl">
          {children}
        </div>
      </div>
    </div>
  );
}
