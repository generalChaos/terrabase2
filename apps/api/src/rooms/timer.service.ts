import { Injectable } from '@nestjs/common';
import { RoomManager } from './room-manager';
import { GAME_CONFIG } from './constants';
import { GameEvent } from './game-engine.interface';
import { TimerServiceError } from './errors';

export interface TimerCallbacks {
  onExpire: () => void;
  onTick?: (events: GameEvent[]) => void;
}

@Injectable()
export class TimerService {
  private timers = new Map<string, NodeJS.Timeout>();
  private cleanupInterval: NodeJS.Timeout;
  
  constructor(private readonly roomManager: RoomManager) {
    // Set up periodic cleanup of inactive rooms
    this.cleanupInterval = setInterval(() => {
      this.roomManager.cleanupInactiveRooms();
    }, GAME_CONFIG.CLEANUP_INTERVAL_MS);
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
          const events = this.roomManager.updateTimer(roomCode, 1);
          
          // Broadcast timer events to clients if callback provided
          if (callbacks.onTick && events.length > 0) {
            callbacks.onTick(events);
          }
          
          // Check if timer expired (timeLeft reached 0)
          const room = this.roomManager.getRoom(roomCode);
          if (room?.gameState?.timeLeft === 0) {
            // Timer expired, call the callback
            callbacks.onExpire();
          }
        } catch (error) {
          console.error(`❌ Timer tick error for room ${roomCode}:`, error);
          // Stop the timer on error to prevent cascading failures
          this.stopTimer(roomCode);
        }
      }, GAME_CONFIG.TIMER_TICK_MS);
      
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
  
  getTimeLeft(roomCode: string): number {
    const room = this.roomManager.getRoom(roomCode);
    return room?.gameState?.timeLeft || 0;
  }
  
  isTimerRunning(roomCode: string): boolean {
    return this.timers.has(roomCode);
  }
  
  stopAllTimers(): void {
    for (const [roomCode] of this.timers) {
      this.stopTimer(roomCode);
    }
    console.log('⏰ Stopped all timers');
  }
  
  cleanup(): void {
    this.stopAllTimers();
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
  
  getActiveTimers(): string[] {
    return Array.from(this.timers.keys());
  }
}
