import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { GAME_CONFIG } from './constants';
import { GameEvent } from './game-engine.interface';
import { TimerServiceError, TimerNotFoundError } from './errors';

export interface TimerCallbacks {
  onExpire: () => void;
  onTick?: (events: GameEvent[]) => void;
}

@Injectable()
export class TimerService implements OnModuleDestroy {
  private timers = new Map<string, NodeJS.Timeout>();
  private cleanupInterval: NodeJS.Timeout;
  
  constructor() {
    // Set up periodic cleanup of orphaned timers
    this.cleanupInterval = setInterval(() => {
      this.cleanupOrphanedTimers();
    }, GAME_CONFIG.CLEANUP_INTERVAL_MS);
  }
  
  // NEW: Method to stop timer when room is deleted
  stopTimerForRoom(roomCode: string): void {
    this.stopTimer(roomCode);
  }
  
  startTimer(roomCode: string, duration: number, callbacks: TimerCallbacks): void {
    try {
      // Validate inputs
      if (!roomCode || roomCode.trim().length === 0) {
        throw new TimerServiceError('Room code is required');
      }
      
      if (duration < 0) {
        throw new TimerServiceError(`Invalid duration: ${duration} seconds`);
      }
      
      if (!callbacks.onExpire) {
        throw new TimerServiceError('onExpire callback is required');
      }
      
      // Clear existing timer if any
      this.stopTimer(roomCode);
      
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
      }, duration * 1000); // Convert seconds to milliseconds
      
      this.timers.set(roomCode, timer);
      console.log(`⏰ Started timer for room ${roomCode}, duration: ${duration}s`);
    } catch (error) {
      console.error(`❌ Failed to start timer for room ${roomCode}:`, error);
      throw error;
    }
  }
  
  stopTimer(roomCode: string): void {
    const timer = this.timers.get(roomCode);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(roomCode);
      console.log(`⏰ Stopped timer for room ${roomCode}`);
    }
  }
  
  // REMOVED: getTimeLeft method as it's not needed without RoomManager dependency
  
  isTimerRunning(roomCode: string): boolean {
    return this.timers.has(roomCode);
  }
  
  // IMPROVED: Better stopAllTimers with logging
  stopAllTimers(): void {
    const timerCount = this.timers.size;
    for (const [roomCode] of this.timers) {
      this.stopTimer(roomCode);
    }
    console.log(`⏰ Stopped all ${timerCount} timers`);
  }
  
  // IMPROVED: Better cleanup with logging
  cleanup(): void {
    console.log(`🧹 Cleaning up TimerService with ${this.timers.size} active timers`);
    this.stopAllTimers();
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      console.log('🧹 Cleanup interval cleared');
    }
  }
  
  // NEW: Get timer count for monitoring
  getTimerCount(): number {
    return this.timers.size;
  }
  
  // NEW: Check if specific room has timer
  hasTimer(roomCode: string): boolean {
    return this.timers.has(roomCode);
  }
  
  getActiveTimers(): string[] {
    return Array.from(this.timers.keys());
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
    console.log('🧹 TimerService module destroying, cleaning up resources');
    this.cleanup();
  }
}
