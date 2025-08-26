/**
 * Centralized game timing utilities
 * This ensures consistent timing between host and player views
 */

/**
 * Get the total time for a specific game phase in milliseconds
 * These values must match the backend timing configuration
 */
export function getTotalTimeForPhase(phase: string): number {
  switch (phase) {
    case 'prompt':
      return 25000; // 25 seconds for answer submission (matches backend)
    case 'choose':
      return 45000; // 45 seconds for voting (matches backend)
    case 'reveal':
      return 15000; // 15 seconds for reveal (matches backend)
    case 'scoring':
      return 10000; // 10 seconds for scoring (matches backend)
    case 'round-end':
      return 8000;  // 8 seconds for round end (matches backend)
    default:
      return 30000; // 30 seconds default
  }
}

/**
 * Convert milliseconds to seconds for display
 */
export function msToSeconds(ms: number): number {
  return Math.ceil(ms / 1000);
}

/**
 * Convert seconds to milliseconds
 */
export function secondsToMs(seconds: number): number {
  return seconds * 1000;
}
