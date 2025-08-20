"use client";
export function TimerRing({ seconds, total }: { seconds: number; total: number }) {
  const pct = Math.max(0, Math.min(1, seconds / total));
  const R = 18, C = 2 * Math.PI * R;
  const stroke = seconds <= 3 ? "var(--danger)" : seconds <= 10 ? "var(--warning)" : "var(--accent)";
  return (
    <div className="relative w-12 h-12" aria-label={`Time left ${seconds}s`} role="timer">
      <svg viewBox="0 0 44 44" className="w-12 h-12 -rotate-90">
        <circle cx="22" cy="22" r={R} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="6" />
        <circle cx="22" cy="22" r={R} fill="none" stroke={stroke} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={(1 - pct) * C} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-[--text] text-sm font-semibold">{seconds}s</div>
    </div>
  );
}
