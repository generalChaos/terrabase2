'use client';
export function TimerRing({
  seconds,
  total,
}: {
  seconds: number;
  total: number;
}) {
  const pct = Math.max(0, Math.min(1, seconds / total));
  const R = 18,
    C = 2 * Math.PI * R;
  
  // Fun gradient colors for the timer ring
  const getGradientColors = () => {
    if (seconds <= 3) {
      return 'url(#dangerGradient)';
    } else if (seconds <= 10) {
      return 'url(#warningGradient)';
    } else if (seconds <= 20) {
      return 'url(#accentGradient)';
    } else {
      return 'url(#successGradient)';
    }
  };
  
  return (
    <div
      className="relative w-12 h-12"
      aria-label={`Time left ${seconds}s`}
      role="timer"
    >
      <svg viewBox="0 0 44 44" className="w-12 h-12 -rotate-90">
        {/* Define fun gradients */}
        <defs>
          <linearGradient id="dangerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="50%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
          <linearGradient id="warningGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#eab308" />
            <stop offset="50%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
          <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#14b8a6" />
            <stop offset="50%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          <linearGradient id="successGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="50%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#14b8a6" />
          </linearGradient>
        </defs>
        
        {/* Background circle */}
        <circle
          cx="22"
          cy="22"
          r={R}
          fill="none"
          stroke="rgba(255,255,255,.1)"
          strokeWidth="6"
        />
        
        {/* Progress circle with fun gradient */}
        <circle
          cx="22"
          cy="22"
          r={R}
          fill="none"
          stroke={getGradientColors()}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={(1 - pct) * C}
        />
      </svg>
      
      {/* Simple center text */}
      <div className="absolute inset-0 grid place-items-center">
        <span className="text-white text-lg font-bold">
          {seconds}
        </span>
      </div>
    </div>
  );
}
