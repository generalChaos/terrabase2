import { GameRegistryNew } from '../game-registry-new';
import { GameEngine } from '@party/types';

describe('GameRegistryNew', () => {
  let registry: GameRegistryNew;

  beforeEach(() => {
    registry = new GameRegistryNew();
  });

  describe('constructor', () => {
    it('should register all available game engines', () => {
      expect(registry.hasGame('bluff-trivia')).toBe(true);
      expect(registry.hasGame('fibbing-it')).toBe(true);
      expect(registry.hasGame('word-association')).toBe(true);
    });
  });

  describe('getEngine', () => {
    it('should return the correct engine for bluff-trivia', () => {
      const engine = registry.getEngine('bluff-trivia');
      expect(engine).toBeDefined();
      expect(engine?.getGameConfig().id).toBe('bluff-trivia');
    });

    it('should return the correct engine for fibbing-it', () => {
      const engine = registry.getEngine('fibbing-it');
      expect(engine).toBeDefined();
      expect(engine?.getGameConfig().id).toBe('fibbing-it');
    });

    it('should return the correct engine for word-association', () => {
      const engine = registry.getEngine('word-association');
      expect(engine).toBeDefined();
      expect(engine?.getGameConfig().id).toBe('word-association');
    });

    it('should return undefined for unknown game type', () => {
      const engine = registry.getEngine('unknown-game');
      expect(engine).toBeUndefined();
    });
  });

  describe('getAvailableGames', () => {
    it('should return all registered game types', () => {
      const games = registry.getAvailableGames();
      expect(games).toContain('bluff-trivia');
      expect(games).toContain('fibbing-it');
      expect(games).toContain('word-association');
      expect(games).toHaveLength(3);
    });
  });

  describe('hasGame', () => {
    it('should return true for registered games', () => {
      expect(registry.hasGame('bluff-trivia')).toBe(true);
      expect(registry.hasGame('fibbing-it')).toBe(true);
      expect(registry.hasGame('word-association')).toBe(true);
    });

    it('should return false for unregistered games', () => {
      expect(registry.hasGame('unknown-game')).toBe(false);
    });
  });

  describe('register', () => {
    it('should allow registering new game engines', () => {
      const mockEngine: GameEngine<any, any, any> = {
        getGameConfig: () => ({ id: 'test-game', name: 'Test Game' } as any),
        initialize: () => ({} as any),
        processAction: () => ({ newState: {} as any, events: [], isValid: true }),
        advancePhase: () => ({} as any),
        getCurrentPhase: () => ({ name: 'lobby', duration: 0, allowedActions: [], autoAdvance: false, requiresAllPlayers: false, canSkip: false }),
        isGameOver: () => false,
        getWinners: () => [],
        getValidActions: () => [],
        generatePhaseEvents: () => [],
      };

      registry.register('test-game', mockEngine);
      expect(registry.hasGame('test-game')).toBe(true);
      expect(registry.getEngine('test-game')).toBe(mockEngine);
    });
  });
});
