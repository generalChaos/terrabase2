'use client';

type RoundInfoProps = {
  round: number;
  maxRounds: number;
};

export function RoundInfo({ round, maxRounds }: RoundInfoProps) {
  return (
    <div className="text-center mb-8 mt-12 animate-fade-in-up" style={{ animationDelay: '800ms' }}>
      <div className="text-sm text-slate-400">
        Round {round} of {maxRounds}
      </div>
    </div>
  );
}
