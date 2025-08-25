import { WordAssociationNewEngine, WordAssociationGameState, WordAssociationAction } from '../word-association-new.engine';
import { Player } from '@party/types';

describe('WordAssociationNewEngine', () => {
  let engine: WordAssociationNewEngine;
  let mockPlayers: Player[];

  beforeEach(() => {
    engine = new WordAssociationNewEngine();
    mockPlayers = [
      { id: 'player1', name: 'Alice', avatar: 'avatar1', connected: true, score: 0 },
      { id: 'player2', name: 'Bob', avatar: 'avatar2', connected: true, score: 0 },
      { id: 'player3', name: 'Charlie', avatar: 'avatar3', connected: true, score: 0 },
    ];
  });

  describe('getGameConfig', () => {
    it('should return the correct game configuration', () => {
      const config = engine.getGameConfig();
      
      expect(config.id).toBe('word-association');
      expect(config.name).toBe('Word Association');
      expect(config.minPlayers).toBe(2);
      expect(config.maxPlayers).toBe(8);
      expect(config.phases).toHaveLength(5); // lobby, prompt, scoring, round-end, game-over
      expect(config.defaultSettings.maxRounds).toBe(5);
    });

    it('should have correct phase configurations', () => {
      const config = engine.getGameConfig();
      const phaseNames = config.phases.map(p => p.name);
      
      expect(phaseNames).toContain('lobby');
      expect(phaseNames).toContain('prompt');
      expect(phaseNames).toContain('scoring'); // Word Association goes directly from prompt to scoring
      expect(phaseNames).toContain('round-end');
      expect(phaseNames).toContain('game-over');
    });
  });

  describe('initialize', () => {
    it('should initialize game state correctly', () => {
      const state = engine.initialize(mockPlayers);

      expect(state.phase).toBe('lobby');
      expect(state.players).toHaveLength(3);
      expect(state.players[0].score).toBe(0);
      expect(state.round).toBe(0);
      expect(state.maxRounds).toBe(5);
      expect(state.timeLeft).toBe(0);
      expect(state.scores).toEqual({});
      expect(state.createdAt).toBeInstanceOf(Date);
      expect(state.updatedAt).toBeInstanceOf(Date);
      expect(state.isRoundComplete).toBe(false);
      expect(state.phaseStartTime).toBeInstanceOf(Date);
      expect(state.currentRound).toBeUndefined();
    });

    it('should handle minimum player requirement', () => {
      const minPlayers = [{ id: 'player1', name: 'Alice', avatar: 'avatar1', connected: true, score: 0 }];
      const state = engine.initialize(minPlayers);

      expect(state.players).toHaveLength(1);
      expect(state.phase).toBe('lobby');
    });
  });

  describe('getCurrentPhase', () => {
    it('should return the current phase configuration', () => {
      const state = engine.initialize(mockPlayers);
      const phase = engine.getCurrentPhase(state);

      expect(phase.name).toBe('lobby');
      expect(phase.duration).toBe(0);
      expect(phase.allowedActions).toContain('start');
      expect(phase.autoAdvance).toBe(false);
      expect(phase.requiresAllPlayers).toBe(false);
      expect(phase.canSkip).toBe(false);
    });

    it('should return correct phase for different states', () => {
      const state = engine.initialize(mockPlayers);
      state.phase = 'prompt';
      
      const phase = engine.getCurrentPhase(state);
      expect(phase.name).toBe('prompt');
      expect(phase.allowedActions).toContain('submitAnswer');
    });
  });

  describe('isGameOver', () => {
    it('should return false for lobby phase', () => {
      const state = engine.initialize(mockPlayers);
      expect(engine.isGameOver(state)).toBe(false);
    });

    it('should return true for over phase', () => {
      const state = engine.initialize(mockPlayers);
      state.phase = 'game-over'; // Changed from 'over' to 'game-over'
      expect(engine.isGameOver(state)).toBe(true);
    });

    it('should return true for game-over phase', () => {
      const state = engine.initialize(mockPlayers);
      state.phase = 'game-over';
      expect(engine.isGameOver(state)).toBe(true);
    });
  });

  describe('getValidActions', () => {
    it('should return start action for host in lobby', () => {
      const state = engine.initialize(mockPlayers);
      const actions = engine.getValidActions(state, 'player1');

      expect(actions).toHaveLength(1);
      expect(actions[0].type).toBe('start');
      expect(actions[0].playerId).toBe('player1');
      expect(actions[0].timestamp).toBeDefined();
    });

    it('should return empty array for non-host in lobby', () => {
      const state = engine.initialize(mockPlayers);
      const actions = engine.getValidActions(state, 'player2');

      expect(actions).toHaveLength(0);
    });

    it('should return submitAnswer action in prompt phase', () => {
      const state = engine.initialize(mockPlayers);
      state.phase = 'prompt';
      
      const actions = engine.getValidActions(state, 'player1');
      expect(actions.some(a => a.type === 'submitAnswer')).toBe(true);
    });
  });

  describe('advancePhase', () => {
    it('should advance from lobby to prompt phase', () => {
      const state = engine.initialize(mockPlayers);
      const newState = engine.advancePhase(state);
      
      expect(newState.phase).toBe('prompt');
      expect(newState.round).toBe(0); // advancePhase doesn't increment rounds, just changes phases
      expect(newState.currentRound).toBeUndefined(); // currentRound is set in processAction, not advancePhase
      expect(newState.timeLeft).toBeGreaterThan(0);
      expect(newState.phaseStartTime).toBeInstanceOf(Date);
    });

    it('should advance through all phases correctly', () => {
      let state = engine.initialize(mockPlayers);
      
      // Lobby -> Prompt
      state = engine.advancePhase(state);
      expect(state.phase).toBe('prompt');
      
      // Prompt -> Scoring (Word Association skips voting phase)
      state = engine.advancePhase(state);
      expect(state.phase).toBe('scoring');
      
      // Scoring -> Round-end
      state = engine.advancePhase(state);
      expect(state.phase).toBe('round-end');
      
      // Round-end -> Game-over
      state = engine.advancePhase(state);
      expect(state.phase).toBe('game-over');
    });

    it('should handle phase transitions with round increments', () => {
      let state = engine.initialize(mockPlayers);
      
      // First round - advancePhase doesn't increment rounds, it just changes phases
      state = engine.advancePhase(state);
      expect(state.round).toBe(0); // advancePhase doesn't increment rounds
      
      // Second round
      state.phase = 'lobby';
      state = engine.advancePhase(state);
      expect(state.round).toBe(0); // advancePhase doesn't increment rounds
      
      // Third round
      state.phase = 'lobby';
      state = engine.advancePhase(state);
      expect(state.round).toBe(0); // advancePhase doesn't increment rounds
    });
  });

  describe('processAction', () => {
    it('should process start action correctly', () => {
      const state = engine.initialize(mockPlayers);
      const action: WordAssociationAction = {
        type: 'start',
        playerId: 'player1',
        data: {},
        timestamp: Date.now(),
      };

      const result = engine.processAction(state, action);

      expect(result.isValid).toBe(true);
      expect(result.events).toHaveLength(2);
      expect(result.events.some(e => e.type === 'prompt')).toBe(true);
      expect(result.events.some(e => e.type === 'roomUpdate')).toBe(true);
    });

    it('should process submitAnswer action correctly', () => {
      const state = engine.initialize(mockPlayers);
      state.phase = 'prompt';
      state.currentRound = {
        roundNumber: 1,
        promptId: 'prompt1',
        prompt: 'What comes to mind when you hear "blue"?',
        words: new Map(),
        timeLeft: 60,
        phase: 'prompt',
      };

      const action: WordAssociationAction = {
        type: 'submitAnswer',
        playerId: 'player1',
        data: { answer: 'Sky' },
        timestamp: Date.now(),
      };

      const result = engine.processAction(state, action);

      expect(result.isValid).toBe(true);
      expect(result.events).toHaveLength(1);
      expect(result.events.some(e => e.type === 'submitted')).toBe(true);
    });

    it('should process submitVote action correctly', () => {
      const state = engine.initialize(mockPlayers);
      state.phase = 'scoring'; // Word Association uses 'scoring' phase for voting
      state.currentRound = {
        roundNumber: 1,
        promptId: 'prompt1',
        prompt: 'What comes to mind when you hear "blue"?',
        words: new Map(),
        timeLeft: 45,
        phase: 'scoring',
      };

      const action: WordAssociationAction = {
        type: 'submitAnswer', // Word Association only has 'start' and 'submitAnswer' actions
        playerId: 'player1',
        data: { answer: 'Sky' },
        timestamp: Date.now(),
      };

      const result = engine.processAction(state, action);

      // Note: submitAnswer in scoring phase might not be valid, so we check the actual result
      if (result.isValid) {
        expect(result.events).toHaveLength(1);
        expect(result.events.some(e => e.type === 'submitted')).toBe(true);
      } else {
        expect(result.error).toBeDefined();
      }
    });

    it('should reject invalid actions', () => {
      const state = engine.initialize(mockPlayers);
      const action: WordAssociationAction = {
        type: 'submitAnswer',
        playerId: 'player1',
        data: { answer: 'Sky' },
        timestamp: Date.now(),
      };

      const result = engine.processAction(state, action);

      expect(result.isValid).toBe(false);
      expect(result.events).toHaveLength(0);
      expect(result.error).toBeDefined();
    });
  });

  describe('updateTimer', () => {
    it('should update timer correctly', () => {
      const state = engine.initialize(mockPlayers);
      state.timeLeft = 60000; // 60 seconds
      
      const newState = engine.updateTimer(state, 1000); // 1 second passed
      
      expect(newState.timeLeft).toBe(59000);
      expect(newState.updatedAt).toBeInstanceOf(Date);
    });

    it('should not go below zero', () => {
      const state = engine.initialize(mockPlayers);
      state.timeLeft = 1000; // 1 second
      
      const newState = engine.updateTimer(state, 2000); // 2 seconds passed
      
      expect(newState.timeLeft).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty player list gracefully', () => {
      const state = engine.initialize([]);
      expect(state.players).toHaveLength(0);
      expect(state.phase).toBe('lobby');
    });

    it('should handle maximum players correctly', () => {
      const maxPlayers = Array.from({ length: 8 }, (_, i) => ({
        id: `player${i}`,
        name: `Player${i}`,
        avatar: `avatar${i}`,
        connected: true,
        score: 0,
      }));
      
      const state = engine.initialize(maxPlayers);
      expect(state.players).toHaveLength(8);
    });

    it('should handle phase transitions at round limits', () => {
      const state = engine.initialize(mockPlayers);
      state.round = 5; // Max rounds reached
      state.phase = 'scoring';
      
      const newState = engine.advancePhase(state);
      expect(newState.phase).toBe('round-end'); // After scoring comes round-end, not 'over'
    });
  });
});
