import { Test, TestingModule } from '@nestjs/testing';
import { TimerService } from '../timer.service';

describe('TimerService', () => {
  let service: TimerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TimerService],
    }).compile();

    service = module.get<TimerService>(TimerService);
  });

  afterEach(() => {
    // Clean up any running timers
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('startTimer', () => {
    it('should start a timer with the specified duration', () => {
      jest.useFakeTimers();
      const roomCode = 'TEST123';
      const duration = 5; // 5 seconds
      const callbacks = {
        onTick: jest.fn(),
        onExpire: jest.fn(),
      };

      service.startTimer(roomCode, duration, callbacks);

      expect(service.isTimerRunning(roomCode)).toBe(true);
    });

    it('should call onTick callback at regular intervals', () => {
      jest.useFakeTimers();
      const roomCode = 'TEST123';
      const duration = 10; // 10 seconds
      const callbacks = {
        onTick: jest.fn(),
        onExpire: jest.fn(),
      };

      service.startTimer(roomCode, duration, callbacks);

      // Fast-forward time to trigger ticks
      jest.advanceTimersByTime(1000); // 1 second
      expect(callbacks.onTick).toHaveBeenCalled();

      jest.advanceTimersByTime(1000); // 2 seconds
      expect(callbacks.onTick).toHaveBeenCalledTimes(2);
    });

    it('should call onExpire callback when timer finishes', () => {
      jest.useFakeTimers();
      const roomCode = 'TEST123';
      const duration = 5; // 5 seconds
      const callbacks = {
        onTick: jest.fn(),
        onExpire: jest.fn(),
      };

      service.startTimer(roomCode, duration, callbacks);

      // Fast-forward time to complete the timer
      jest.advanceTimersByTime(5000);

      expect(callbacks.onExpire).toHaveBeenCalled();
    });

    it('should emit timer events with correct data', () => {
      jest.useFakeTimers();
      const roomCode = 'TEST123';
      const duration = 10; // 10 seconds
      const callbacks = {
        onTick: jest.fn(),
        onExpire: jest.fn(),
      };

      service.startTimer(roomCode, duration, callbacks);

      // Fast-forward to trigger a tick
      jest.advanceTimersByTime(1000);

      expect(callbacks.onTick).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'timer',
            data: expect.objectContaining({
              timeLeft: expect.any(Number),
            }),
            target: 'all',
            timestamp: expect.any(Number),
          }),
        ])
      );
    });

    it('should handle zero duration timers', () => {
      const roomCode = 'TEST123';
      const duration = 0;
      const callbacks = {
        onTick: jest.fn(),
        onExpire: jest.fn(),
      };

      service.startTimer(roomCode, duration, callbacks);

      // Zero duration timers should complete immediately
      expect(callbacks.onExpire).toHaveBeenCalled();
    });

    it('should handle negative duration timers', () => {
      const roomCode = 'TEST123';
      const duration = -1;
      const callbacks = {
        onTick: jest.fn(),
        onExpire: jest.fn(),
      };

      service.startTimer(roomCode, duration, callbacks);

      // Negative duration timers should complete immediately
      expect(callbacks.onExpire).toHaveBeenCalled();
    });

    it('should stop existing timer when starting a new one for the same room', () => {
      jest.useFakeTimers();
      const roomCode = 'TEST123';
      const duration1 = 10;
      const duration2 = 5;
      const callbacks1 = {
        onTick: jest.fn(),
        onExpire: jest.fn(),
      };
      const callbacks2 = {
        onTick: jest.fn(),
        onExpire: jest.fn(),
      };

      // Start first timer
      service.startTimer(roomCode, duration1, callbacks1);
      expect(service.isTimerRunning(roomCode)).toBe(true);

      // Start second timer - should stop first one
      service.startTimer(roomCode, duration2, callbacks2);
      expect(service.isTimerRunning(roomCode)).toBe(true);

      // Fast-forward to complete second timer
      jest.advanceTimersByTime(5000);
      expect(callbacks2.onExpire).toHaveBeenCalled();
    });
  });

  describe('stopTimer', () => {
    it('should stop a running timer', () => {
      jest.useFakeTimers();
      const roomCode = 'TEST123';
      const duration = 10; // 10 seconds
      const callbacks = {
        onTick: jest.fn(),
        onExpire: jest.fn(),
      };

      service.startTimer(roomCode, duration, callbacks);

      // Fast-forward a bit
      jest.advanceTimersByTime(2000);
      expect(callbacks.onTick).toHaveBeenCalled();

      // Stop the timer
      const result = service.stopTimer(roomCode);

      expect(result).toBe(true);
      expect(service.isTimerRunning(roomCode)).toBe(false);

      // Fast-forward more - should not trigger more callbacks
      jest.advanceTimersByTime(8000);
      expect(callbacks.onExpire).not.toHaveBeenCalled();
    });

    it('should handle stopping non-existent timer', () => {
      const nonExistentRoomCode = 'NONEXISTENT';

      const result = service.stopTimer(nonExistentRoomCode);

      expect(result).toBe(false);
    });

    it('should handle stopping already stopped timer', () => {
      jest.useFakeTimers();
      const roomCode = 'TEST123';
      const duration = 5; // 5 seconds
      const callbacks = {
        onTick: jest.fn(),
        onExpire: jest.fn(),
      };

      service.startTimer(roomCode, duration, callbacks);

      // Stop the timer
      const result1 = service.stopTimer(roomCode);
      expect(result1).toBe(true);

      // Try to stop it again
      const result2 = service.stopTimer(roomCode);
      expect(result2).toBe(false);
    });
  });

  describe('stopTimerForRoom', () => {
    it('should stop timer for a specific room', () => {
      jest.useFakeTimers();
      const roomCode = 'TEST123';
      const duration = 10; // 10 seconds
      const callbacks = {
        onTick: jest.fn(),
        onExpire: jest.fn(),
      };

      service.startTimer(roomCode, duration, callbacks);
      expect(service.isTimerRunning(roomCode)).toBe(true);

      const result = service.stopTimerForRoom(roomCode);
      expect(result).toBe(true);
      expect(service.isTimerRunning(roomCode)).toBe(false);
    });
  });

  describe('isTimerRunning', () => {
    it('should return true for running timer', () => {
      jest.useFakeTimers();
      const roomCode = 'TEST123';
      const duration = 10;
      const callbacks = {
        onTick: jest.fn(),
        onExpire: jest.fn(),
      };

      service.startTimer(roomCode, duration, callbacks);
      expect(service.isTimerRunning(roomCode)).toBe(true);
    });

    it('should return false for stopped timer', () => {
      const roomCode = 'TEST123';
      expect(service.isTimerRunning(roomCode)).toBe(false);
    });
  });

  describe('getActiveTimers', () => {
    it('should return list of active timer room codes', () => {
      jest.useFakeTimers();
      const roomCode1 = 'TEST123';
      const roomCode2 = 'TEST456';
      const duration = 10;
      const callbacks = {
        onTick: jest.fn(),
        onExpire: jest.fn(),
      };

      service.startTimer(roomCode1, duration, callbacks);
      service.startTimer(roomCode2, duration, callbacks);

      const activeTimers = service.getActiveTimers();
      expect(activeTimers).toContain(roomCode1);
      expect(activeTimers).toContain(roomCode2);
      expect(activeTimers).toHaveLength(2);
    });

    it('should return empty array when no timers are running', () => {
      const activeTimers = service.getActiveTimers();
      expect(activeTimers).toEqual([]);
    });
  });

  describe('timer behavior', () => {
    it('should maintain accurate time tracking', () => {
      jest.useFakeTimers();
      const roomCode = 'TEST123';
      const duration = 10; // 10 seconds
      const callbacks = {
        onTick: jest.fn(),
        onExpire: jest.fn(),
      };

      service.startTimer(roomCode, duration, callbacks);

      // Check time at different intervals
      jest.advanceTimersByTime(1000); // 1 second
      expect(callbacks.onTick).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            data: expect.objectContaining({
              timeLeft: 9, // 10 - 1 = 9 seconds
            }),
          }),
        ])
      );

      jest.advanceTimersByTime(2000); // 3 seconds total
      expect(callbacks.onTick).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            data: expect.objectContaining({
              timeLeft: 7, // 10 - 3 = 7 seconds
            }),
          }),
        ])
      );
    });

    it('should handle multiple timers independently', () => {
      jest.useFakeTimers();
      const roomCode1 = 'TEST123';
      const roomCode2 = 'TEST456';
      const callbacks1 = {
        onTick: jest.fn(),
        onExpire: jest.fn(),
      };
      const callbacks2 = {
        onTick: jest.fn(),
        onExpire: jest.fn(),
      };

      service.startTimer(roomCode1, 5, callbacks1); // 5 seconds
      service.startTimer(roomCode2, 10, callbacks2); // 10 seconds

      // Fast-forward to 5 seconds
      jest.advanceTimersByTime(5000);

      expect(callbacks1.onExpire).toHaveBeenCalled();
      expect(callbacks2.onExpire).not.toHaveBeenCalled();

      // Fast-forward to 10 seconds
      jest.advanceTimersByTime(5000);

      expect(callbacks2.onExpire).toHaveBeenCalled();
    });

    it('should handle rapid timer operations', () => {
      jest.useFakeTimers();
      const roomCode = 'TEST123';
      const duration = 10; // 10 seconds
      const callbacks = {
        onTick: jest.fn(),
        onExpire: jest.fn(),
      };

      service.startTimer(roomCode, duration, callbacks);

      // Start, stop, and restart rapidly
      service.stopTimer(roomCode);
      service.startTimer(roomCode, duration, callbacks);
      service.stopTimer(roomCode);

      // Should not throw errors
      expect(callbacks.onTick).not.toHaveBeenCalled();
      expect(callbacks.onExpire).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle very long durations', () => {
      jest.useFakeTimers();
      const roomCode = 'TEST123';
      const duration = 3600; // 1 hour
      const callbacks = {
        onTick: jest.fn(),
        onExpire: jest.fn(),
      };

      service.startTimer(roomCode, duration, callbacks);

      expect(service.isTimerRunning(roomCode)).toBe(true);

      // Fast-forward to trigger ticks
      jest.advanceTimersByTime(1000);
      expect(callbacks.onTick).toHaveBeenCalled();
    });

    it('should handle very short durations', () => {
      jest.useFakeTimers();
      const roomCode = 'TEST123';
      const duration = 1; // 1 second
      const callbacks = {
        onTick: jest.fn(),
        onExpire: jest.fn(),
      };

      service.startTimer(roomCode, duration, callbacks);

      // Fast-forward to complete
      jest.advanceTimersByTime(1000);
      expect(callbacks.onExpire).toHaveBeenCalled();
    });

    it('should handle missing callbacks gracefully', () => {
      jest.useFakeTimers();
      const roomCode = 'TEST123';
      const duration = 5; // 5 seconds
      const callbacks = {};

      // Should not throw errors when callbacks are missing
      expect(() => {
        service.startTimer(roomCode, duration, callbacks as any);
      }).not.toThrow();
    });

    it('should handle partial callbacks', () => {
      jest.useFakeTimers();
      const roomCode = 'TEST123';
      const duration = 5; // 5 seconds
      const callbacks = {
        onTick: jest.fn(),
        // onExpire is missing
      };

      // Should not throw errors when onExpire is missing
      expect(() => {
        service.startTimer(roomCode, duration, callbacks as any);
      }).not.toThrow();
    });
  });

  describe('cleanup', () => {
    it('should clean up timers on service destruction', () => {
      jest.useFakeTimers();
      const roomCode = 'TEST123';
      const duration = 10; // 10 seconds
      const callbacks = {
        onTick: jest.fn(),
        onExpire: jest.fn(),
      };

      service.startTimer(roomCode, duration, callbacks);

      // Fast-forward a bit
      jest.advanceTimersByTime(2000);
      expect(callbacks.onTick).toHaveBeenCalled();

      // Simulate service destruction (this would normally happen in ngOnDestroy)
      // For now, we'll just test that the timer can be stopped
      service.stopTimer(roomCode);

      // Fast-forward more - should not trigger more callbacks
      jest.advanceTimersByTime(8000);
      expect(callbacks.onExpire).not.toHaveBeenCalled();
    });
  });
});
