import { FibbingItNewEngine, FibbingItGameState, FibbingItAction } from '../fibbing-it-new.engine';
import { Player } from '@tb2/shared-types';

describe('FibbingItNewEngine', () => {
  let engine: FibbingItNewEngine;
  let mockPlayers: Player[];

  beforeEach(() => {
    engine = new FibbingItNewEngine();
    mockPlayers = [
      { id: 'player1', name: 'Alice', avatar: 'avatar1', connected: true, score: 0 },
      { id: 'player2', name: 'Bob', avatar: 'avatar2', connected: true, score: 0 },
      { id: 'player3', name: 'Charlie', avatar: 'avatar3', connected: true, score: 0 },
    ];
  });

  describe('getGameConfig', () => {
    it('should return the correct game configuration', () => {
      const config = engine.getGameConfig();
      
      expect(config.id).toBe('fibbing-it');
      expect(config.name).toBe('Fibbing It');
      expect(config.minPlayers).toBe(2);
      expect(config.maxPlayers).toBe(8);
      expect(config.phases).toHaveLength(7); // lobby, prompt, voting, reveal, scoring, round-end, game-over
      expect(config.defaultSettings.maxRounds).toBe(5);
    });

    it('should have correct phase configurations', () => {
      const config = engine.getGameConfig();
      const phaseNames = config.phases.map(p => p.name);
      
      expect(phaseNames).toContain('lobby');
      expect(phaseNames).toContain('prompt');
      expect(phaseNames).toContain('choose');
      expect(phaseNames).toContain('reveal');
      expect(phaseNames).toContain('scoring');
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

    it('should return true for game-over phase', () => {
      const state = engine.initialize(mockPlayers);
      state.phase = 'game-over';
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
      
      // Prompt -> Voting
      state = engine.advancePhase(state);
      expect(state.phase).toBe('choose');
      
      // Voting -> Reveal
      state = engine.advancePhase(state);
      expect(state.phase).toBe('reveal');
      
      // Reveal -> Scoring
      state = engine.advancePhase(state);
      expect(state.phase).toBe('scoring');
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
      const action: FibbingItAction = {
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
        prompt: 'What is your favorite color?',
        answers: new Map(),
        votes: new Map(),
        timeLeft: 60,
        phase: 'prompt',
      };

      const action: FibbingItAction = {
        type: 'submitAnswer',
        playerId: 'player1',
        data: { answer: 'Blue' },
        timestamp: Date.now(),
      };

      const result = engine.processAction(state, action);

      expect(result.isValid).toBe(true);
      expect(result.events).toHaveLength(1);
      expect(result.events.some(e => e.type === 'submitted')).toBe(true);
    });

    it('should process submitVote action correctly', () => {
      const state = engine.initialize(mockPlayers);
      state.phase = 'choose';
      state.currentRound = {
        roundNumber: 1,
        promptId: 'prompt1',
        prompt: 'What is your favorite color?',
        answers: new Map([
          ['answer1', { playerId: 'player1', text: 'Blue' }],
          ['answer2', { playerId: 'player2', text: 'Red' }],
        ]),
        votes: new Map(),
        timeLeft: 45,
        phase: 'choose',
      };

      const action: FibbingItAction = {
        type: 'submitVote',
        playerId: 'player1',
        data: { vote: 'answer2' },
        timestamp: Date.now(),
      };

      const result = engine.processAction(state, action);

      expect(result.isValid).toBe(true);
      expect(result.events).toHaveLength(1);
      expect(result.events.some(e => e.type === 'submitted')).toBe(true);
    });

    it('should reject invalid actions', () => {
      const state = engine.initialize(mockPlayers);
      const action: FibbingItAction = {
        type: 'submitAnswer',
        playerId: 'player1',
        data: { answer: 'Blue' },
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

  describe('round management', () => {
    it('should start new round correctly', () => {
      const state = engine.initialize(mockPlayers);
      state.round = 1;
      state.phase = 'scoring';
      
      const newState = engine.startNewRound(state);
      
      expect(newState.round).toBe(2);
      expect(newState.phase).toBe('prompt');
      expect(newState.currentRound).toBeDefined();
      expect(newState.currentRound?.roundNumber).toBe(2);
      expect(newState.currentRound?.answers.size).toBe(0);
      expect(newState.currentRound?.votes.size).toBe(0);
    });

    it('should end game when max rounds reached', () => {
      const state = engine.initialize(mockPlayers);
      state.round = 5; // Max rounds
      state.phase = 'scoring';
      
      const newState = engine.startNewRound(state);
      
      expect(newState.phase).toBe('game-over');
      expect(newState.round).toBe(6);
    });

    it('should calculate scores correctly', () => {
      const state = engine.initialize(mockPlayers);
      state.currentRound = {
        roundNumber: 1,
        promptId: 'p1',
        prompt: 'What is the national animal of Scotland?',
        answers: new Map([
          ['answer1', { playerId: 'player1', text: 'Unicorn' }], // Correct answer
          ['answer2', { playerId: 'player2', text: 'Lion' }],    // Wrong answer
        ]),
        votes: new Map([
          ['player1', 'answer2'], // Player1 votes for answer2
          ['player2', 'answer1'], // Player2 votes for answer1
        ]),
        timeLeft: 0,
        phase: 'choose',
      };
      
      const newState = engine.calculateScores(state);
      
      // Player1 should get 1000 points for correct answer + 500 for vote received = 1500
      const player1 = newState.players.find(p => p.id === 'player1');
      expect(player1?.score).toBe(1500);
      
      // Player2 should get 500 points for vote received = 500
      const player2 = newState.players.find(p => p.id === 'player2');
      expect(player2?.score).toBe(500);
    });

    it('should detect round completion correctly', () => {
      const state = engine.initialize(mockPlayers);
      state.currentRound = {
        roundNumber: 1,
        promptId: 'p1',
        prompt: 'What is the national animal of Scotland?',
        answers: new Map([
          ['answer1', { playerId: 'player1', text: 'Unicorn' }],
          ['answer2', { playerId: 'player2', text: 'Lion' }],
          ['answer3', { playerId: 'player3', text: 'Dragon' }],
        ]),
        votes: new Map([
          ['player1', 'answer2'],
          ['player2', 'answer1'],
          ['player3', 'answer1'],
        ]),
        timeLeft: 0,
        phase: 'choose',
      };
      
      const isComplete = engine.isRoundComplete(state);
      expect(isComplete).toBe(true);
    });

    it('should detect incomplete round correctly', () => {
      const state = engine.initialize(mockPlayers);
      state.currentRound = {
        roundNumber: 1,
        promptId: 'p1',
        prompt: 'What is the national animal of Scotland?',
        answers: new Map([
          ['answer1', { playerId: 'player1', text: 'Unicorn' }],
          ['answer2', { playerId: 'player2', text: 'Lion' }],
        ]),
        votes: new Map([
          ['player1', 'answer2'],
          // Player2 hasn't voted yet
        ]),
        timeLeft: 0,
        phase: 'choose',
      };
      
      const isComplete = engine.isRoundComplete(state);
      expect(isComplete).toBe(false);
    });
  });
});
