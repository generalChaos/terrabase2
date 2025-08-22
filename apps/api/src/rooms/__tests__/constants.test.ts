import {
  GAME_PHASE_DURATIONS,
  GAME_CONFIG,
  PHASE_NAMES,
  EventType,
  EventTarget,
  GAME_TYPES,
} from '../constants';

describe('Game Constants', () => {
  describe('GAME_PHASE_DURATIONS', () => {
    it('should have correct phase durations', () => {
      expect(GAME_PHASE_DURATIONS.PROMPT).toBe(15);
      expect(GAME_PHASE_DURATIONS.CHOOSE).toBe(20);
      expect(GAME_PHASE_DURATIONS.SCORING).toBe(6);
    });

    it('should have positive durations for timed phases', () => {
      expect(GAME_PHASE_DURATIONS.PROMPT).toBeGreaterThan(0);
      expect(GAME_PHASE_DURATIONS.CHOOSE).toBeGreaterThan(0);
      expect(GAME_PHASE_DURATIONS.SCORING).toBeGreaterThan(0);
    });

    it('should be readonly', () => {
      expect(() => {
        // @ts-expect-error - Testing readonly constraint
        GAME_PHASE_DURATIONS.PROMPT = 999;
      }).toThrow();
    });
  });

  describe('GAME_CONFIG', () => {
    it('should have correct configuration values', () => {
      expect(GAME_CONFIG.MAX_ROUNDS).toBe(5);
      expect(GAME_CONFIG.CLEANUP_INTERVAL_MS).toBe(5 * 60 * 1000);
      expect(GAME_CONFIG.TIMER_TICK_MS).toBe(1000);
    });

    it('should have reasonable values', () => {
      expect(GAME_CONFIG.MAX_ROUNDS).toBeGreaterThan(0);
      expect(GAME_CONFIG.CLEANUP_INTERVAL_MS).toBeGreaterThan(0);
      expect(GAME_CONFIG.TIMER_TICK_MS).toBeGreaterThan(0);
    });
  });

  describe('PHASE_NAMES', () => {
    it('should have all required phase names', () => {
      expect(PHASE_NAMES.LOBBY).toBe('lobby');
      expect(PHASE_NAMES.PROMPT).toBe('prompt');
      expect(PHASE_NAMES.CHOOSE).toBe('choose');
      expect(PHASE_NAMES.SCORING).toBe('scoring');
      expect(PHASE_NAMES.OVER).toBe('over');
    });

    it('should have unique phase names', () => {
      const phaseNames = Object.values(PHASE_NAMES);
      const uniqueNames = new Set(phaseNames);
      expect(phaseNames.length).toBe(uniqueNames.size);
    });
  });

  describe('EventType', () => {
    it('should have all required event types', () => {
      expect(EventType.TIMER).toBe('timer');
      expect(EventType.PROMPT).toBe('prompt');
      expect(EventType.CHOICES).toBe('choices');
      expect(EventType.SCORES).toBe('scores');
      expect(EventType.ROOM_UPDATE).toBe('roomUpdate');
      expect(EventType.GAME_OVER).toBe('gameOver');
    });

    it('should have unique event types', () => {
      const eventTypes = Object.values(EventType);
      const uniqueTypes = new Set(eventTypes);
      expect(eventTypes.length).toBe(uniqueTypes.size);
    });
  });

  describe('EventTarget', () => {
    it('should have all required event targets', () => {
      expect(EventTarget.ALL).toBe('all');
      expect(EventTarget.PLAYER).toBe('player');
      expect(EventTarget.HOST).toBe('host');
    });

    it('should have unique event targets', () => {
      const eventTargets = Object.values(EventTarget);
      const uniqueTargets = new Set(eventTargets);
      expect(eventTargets.length).toBe(uniqueTargets.size);
    });
  });

  describe('GAME_TYPES', () => {
    it('should have correct game type', () => {
      expect(GAME_TYPES.BLUFF_TRIVIA).toBe('bluff-trivia');
    });

    it('should be readonly', () => {
      expect(() => {
        // @ts-expect-error - Testing readonly constraint
        GAME_TYPES.BLUFF_TRIVIA = 'different-game';
      }).toThrow();
    });
  });

  describe('Constants Integration', () => {
    it('should have consistent phase durations and names', () => {
      // All timed phases should have durations > 0
      const timedPhases = [
        PHASE_NAMES.PROMPT,
        PHASE_NAMES.CHOOSE,
        PHASE_NAMES.SCORING,
      ];
      timedPhases.forEach((phase) => {
        const duration =
          GAME_PHASE_DURATIONS[
            phase.toUpperCase() as keyof typeof GAME_PHASE_DURATIONS
          ];
        expect(duration).toBeGreaterThan(0);
      });
    });

    it('should only include timed phases', () => {
      // Only timed phases should be in GAME_PHASE_DURATIONS
      const timedPhaseKeys = Object.keys(GAME_PHASE_DURATIONS);
      expect(timedPhaseKeys).toContain('PROMPT');
      expect(timedPhaseKeys).toContain('CHOOSE');
      expect(timedPhaseKeys).toContain('SCORING');
      expect(timedPhaseKeys).not.toContain('LOBBY');
      expect(timedPhaseKeys).not.toContain('OVER');
    });
  });
});
