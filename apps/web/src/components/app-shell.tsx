'use client';
import { ReactNode } from 'react';
import { TimerRing } from './games/shared/ui';

export function AppShell({
  title,
  right,
  timer,
  children,
  sub,
}: {
  title: string;
  right?: ReactNode;
  timer?: { seconds: number; total: number } | null;
  children: ReactNode;
  sub?: ReactNode;
}) {
  return (
    <div className="max-w-[1100px] mx-auto px-6 py-6 text-white text-6xl font-bold">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="text-3xl h1">Fibbing It!</div>
          <div className="hidden sm:block opacity-70">{title}</div>
        </div>
        <div className="flex items-center gap-4">
          {timer ? (
            <TimerRing seconds={timer.seconds} total={timer.total} />
          ) : null}
          {right}
        </div>
      </header>
      {sub && <div className="mt-3 text-sm opacity-80">{sub}</div>}
      <main className="mt-6">{children}</main>
    </div>
  );
}
