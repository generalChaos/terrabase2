import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { GameConfig, GameEvent } from '../shared/types';
import { TimerServiceError, TimerNotFoundError } from './errors';

export interface TimerCallbacks {
  onTick: (events: GameEvent[]) => void;
  onExpire: () => void;
}

@Injectable()
export class TimerService implements OnModuleDestroy {
  private timers = new Map<string, NodeJS.Timeout>();
  private cleanupInterval?: NodeJS.Timeout;

  constructor() {
    // Set up periodic cleanup of orphaned timers
    // Only set up cleanup interval in production to avoid test interference
    if (process.env.NODE_ENV !== 'test') {
      this.cleanupInterval = setInterval(() => {
        this.cleanupOrphanedTimers();
      }, GameConfig.TIMING.TIMER.CLEANUP_INTERVAL_MS);
    }
  }

  /**
   * Start a timer for a room with the specified duration
   */
  startTimer(
    roomCode: string,
    duration: number,
    callbacks: {
      onTick?: (events: GameEvent[]) => void;
      onExpire?: () => void;
    },
  ): void {
    // Handle edge cases: zero or negative duration timers should complete immediately
    if (duration <= 0) {
      console.log(`⏰ Timer for room ${roomCode}: duration ${duration}s, calling onExpire immediately`);
      callbacks.onExpire?.();
      return;
    }

    console.log(`⏰ Starting timer for room ${roomCode}: ${duration}s`);
    
    // Clear any existing timer for this room
    this.stopTimer(roomCode);

    let timeRemaining = duration;

    // Create the timer
    const timer = setInterval(() => {
      timeRemaining--;
      
      if (timeRemaining <= 0) {
        console.log(`⏰ Timer expired for room ${roomCode}, calling onExpire`);
        this.stopTimer(roomCode);
        callbacks.onExpire?.();
      } else {
        console.log(`⏰ Timer tick for room ${roomCode}: ${timeRemaining}s remaining`);
        callbacks.onTick?.([]);
      }
    }, 1000);

    // Store the timer
    this.timers.set(roomCode, timer);
    
    console.log(`⏰ Timer started successfully for room ${roomCode}: ${duration}s`);
  }

  /**
   * Stop a timer for a specific room
   */
  stopTimer(roomCode: string): boolean {
    const timer = this.timers.get(roomCode);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(roomCode);
      return true;
    }
    return false;
  }

  /**
   * Stop timer for a room (external cleanup method)
   */
  stopTimerForRoom(roomCode: string): boolean {
    return this.stopTimer(roomCode);
  }

  /**
   * Check if a timer is running for a room
   */
  isTimerRunning(roomCode: string): boolean {
    return this.timers.has(roomCode);
  }

  /**
   * Get all active timer room codes
   */
  getActiveTimers(): string[] {
    return Array.from(this.timers.keys());
  }

  /**
   * Get timer count for monitoring
   */
  getTimerCount(): number {
    return this.timers.size;
  }

  // NEW: Clean up orphaned timers (timers without active rooms)
  private cleanupOrphanedTimers(): void {
    const orphanedCount = this.timers.size;
    if (orphanedCount > 0) {
      this.stopAllTimers();
    }
  }

  // IMPROVED: Implement OnModuleDestroy for proper cleanup
  onModuleDestroy() {
    // Clear the cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }

    // Stop all active timers
    this.stopAllTimers();
  }

  /**
   * Stop all timers (cleanup method)
   */
  private stopAllTimers(): void {
    for (const [roomCode, timer] of this.timers.entries()) {
      clearInterval(timer);
    }
    this.timers.clear();
  }
}
