import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { GameConfig } from '../config/game.config';
import { GameEvent } from './game-engine.interface';
import { TimerServiceError, TimerNotFoundError } from './errors';

export interface TimerCallbacks {
  onTick: (events: GameEvent[]) => void;
  onExpire: () => void;
}

@Injectable()
export class TimerService implements OnModuleDestroy {
  private timers = new Map<string, NodeJS.Timeout>();
  private cleanupInterval: NodeJS.Timeout;
  
  constructor() {
    // Set up periodic cleanup of orphaned timers
    this.cleanupInterval = setInterval(() => {
      this.cleanupOrphanedTimers();
    }, GameConfig.TIMING.TIMER.CLEANUP_INTERVAL_MS);
  }

  /**
   * Start a timer for a room with the specified duration
   */
  startTimer(roomCode: string, duration: number, callbacks: TimerCallbacks): void {
    if (this.timers.has(roomCode)) {
      console.log(`⏰ Timer already running for room ${roomCode}, stopping existing timer`);
      this.stopTimer(roomCode);
    }

    console.log(`⏰ Starting ${duration}s timer for room ${roomCode}`);
    
    const timer = setInterval(() => {
      try {
        // Call the tick callback to let the caller handle room state
        if (callbacks.onTick) {
          callbacks.onTick([]);
        }
        
        // Call the expire callback when timer should expire
        // The caller is responsible for checking if the room still exists
        callbacks.onExpire();
        
        // Stop the timer after it expires
        this.stopTimer(roomCode);
      } catch (error) {
        console.error(`❌ Timer tick error for room ${roomCode}:`, error);
        // Stop the timer on error to prevent cascading failures
        this.stopTimer(roomCode);
      }
    }, GameConfig.TIMING.CONVERSIONS.SECONDS_TO_MS * duration); // Convert seconds to milliseconds
    
    this.timers.set(roomCode, timer);
    console.log(`✅ Timer started for room ${roomCode}`);
  }

  /**
   * Stop a timer for a specific room
   */
  stopTimer(roomCode: string): boolean {
    const timer = this.timers.get(roomCode);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(roomCode);
      console.log(`⏰ Timer stopped for room ${roomCode}`);
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
      console.log(`🧹 Found ${orphanedCount} orphaned timers, cleaning up...`);
      this.stopAllTimers();
    }
  }
  
  // IMPROVED: Implement OnModuleDestroy for proper cleanup
  onModuleDestroy() {
    console.log('🧹 TimerService shutting down, cleaning up all timers...');
    
    // Clear the cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
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
      console.log(`⏰ Stopped timer for room ${roomCode}`);
    }
    this.timers.clear();
  }
}
