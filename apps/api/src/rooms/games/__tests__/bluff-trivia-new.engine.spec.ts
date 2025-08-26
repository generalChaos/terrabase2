import { BluffTriviaNewEngine, BluffTriviaState, BluffTriviaAction } from '../bluff-trivia-new.engine';
import { Player } from '@party/types';

describe('BluffTriviaNewEngine', () => {
  let engine: BluffTriviaNewEngine;
  let mockPlayers: Player[];

  beforeEach(() => {
    engine = new BluffTriviaNewEngine();
    mockPlayers = [
      { id: 'player1', name: 'Alice', avatar: 'avatar1', connected: true, score: 0 },
      { id: 'player2', name: 'Bob', avatar: 'avatar2', connected: true, score: 0 },
      { id: 'player3', name: 'Charlie', avatar: 'avatar3', connected: true, score: 0 },
    ];
  });

  describe('getGameConfig', () => {
    it('should return the correct game configuration', () => {
      const config = engine.getGameConfig();
      
      expect(config.id).toBe('bluff-trivia');
      expect(config.name).toBe('Bluff Trivia');
      expect(config.minPlayers).toBe(2);
      expect(config.maxPlayers).toBe(8);
      expect(config.phases).toHaveLength(5);
      expect(config.defaultSettings.maxRounds).toBe(5);
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
      expect(state.usedPromptIds).toBeInstanceOf(Set);
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
  });

  describe('isGameOver', () => {
    it('should return false for lobby phase', () => {
      const state = engine.initialize(mockPlayers);
      expect(engine.isGameOver(state)).toBe(false);
    });

    it('should return true for over phase', () => {
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
  });

  describe('advancePhase', () => {
    it('should advance from lobby to prompt phase', () => {
      const state = engine.initialize(mockPlayers);
      const newState = engine.advancePhase(state);

      expect(newState.phase).toBe('prompt');
      expect(newState.round).toBe(1);
      expect(newState.currentRound).toBeDefined();
      expect(newState.currentRound?.prompt).toBeDefined();
      expect(newState.currentRound?.answer).toBeDefined();
      expect(newState.currentRound?.bluffs).toHaveLength(0);
      expect(newState.currentRound?.votes).toBeInstanceOf(Map);
      expect(newState.currentRound?.correctAnswerPlayers).toBeInstanceOf(Set);
    });
  });

  describe('processAction', () => {
    it('should process start action correctly', () => {
      const state = engine.initialize(mockPlayers);
      const action: BluffTriviaAction = {
        type: 'start',
        playerId: 'player1',
        data: {},
        timestamp: Date.now(),
      };

      const result = engine.processAction(state, action);

      expect(result.isValid).toBe(true);
      expect(result.newState.phase).toBe('prompt');
      expect(result.newState.round).toBe(1);
      expect(result.events).toHaveLength(2);
      expect(result.events[0].type).toBe('roomUpdate');
      expect(result.events[1].type).toBe('prompt');
    });

    it('should process submitAnswer action correctly', () => {
      const state = engine.initialize(mockPlayers);
      state.phase = 'prompt';
      state.currentRound = {
        roundNumber: 1,
        promptId: 'prompt1',
        prompt: 'What is the capital of France?',
        answer: 'Paris',
        bluffs: [],
        votes: new Map(),
        correctAnswerPlayers: new Set(),
        timeLeft: 15,
        phase: 'prompt',
      };

      const action: BluffTriviaAction = {
        type: 'submitAnswer',
        playerId: 'player1',
        data: { answer: 'Paris' },
        timestamp: Date.now(),
      };

      const result = engine.processAction(state, action);

      expect(result.isValid).toBe(true);
      expect(result.events).toHaveLength(2);
      expect(result.events[0].type).toBe('roomUpdate');
      expect(result.events[1].type).toBe('submitted');
    });
  });

  describe('updateTimer', () => {
    it('should update timer correctly', () => {
      const state = engine.initialize(mockPlayers);
      state.timeLeft = 10;

      const newState = engine.updateTimer(state, 3);

      expect(newState.timeLeft).toBe(7);
      expect(newState.updatedAt).toBeInstanceOf(Date);
    });

    it('should not go below 0', () => {
      const state = engine.initialize(mockPlayers);
      state.timeLeft = 2;

      const newState = engine.updateTimer(state, 5);

      expect(newState.timeLeft).toBe(0);
    });
  });
});
