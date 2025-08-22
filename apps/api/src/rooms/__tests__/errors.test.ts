import {
  GameError,
  RoomNotFoundError,
  PlayerNotFoundError,
  InvalidGameActionError,
  InsufficientPlayersError,
  GameAlreadyStartedError,
  TimerServiceError,
} from '../errors';

describe('Custom Error Classes', () => {
  describe('GameError', () => {
    it('should create a basic game error', () => {
      const error = new GameError('Test message', 'TEST_ERROR');

      expect(error.message).toBe('Test message');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('GameError');
      expect(error.details).toBeUndefined();
    });

    it('should create a game error with custom status code', () => {
      const error = new GameError('Test message', 'TEST_ERROR', 500);

      expect(error.statusCode).toBe(500);
    });

    it('should create a game error with details', () => {
      const details = { roomCode: 'ABC123', playerId: 'player1' };
      const error = new GameError('Test message', 'TEST_ERROR', 400, details);

      expect(error.details).toEqual(details);
    });
  });

  describe('RoomNotFoundError', () => {
    it('should create a room not found error', () => {
      const error = new RoomNotFoundError('ABC123');

      expect(error.message).toBe('Room ABC123 not found');
      expect(error.code).toBe('ROOM_NOT_FOUND');
      expect(error.statusCode).toBe(404);
      expect(error.details).toEqual({ roomCode: 'ABC123' });
    });
  });

  describe('PlayerNotFoundError', () => {
    it('should create a player not found error', () => {
      const error = new PlayerNotFoundError('player1', 'ABC123');

      expect(error.message).toBe('Player player1 not found in room ABC123');
      expect(error.code).toBe('PLAYER_NOT_FOUND');
      expect(error.statusCode).toBe(404);
      expect(error.details).toEqual({
        playerId: 'player1',
        roomCode: 'ABC123',
      });
    });
  });

  describe('InvalidGameActionError', () => {
    it('should create an invalid game action error', () => {
      const error = new InvalidGameActionError('submitAnswer', 'lobby');

      expect(error.message).toBe(
        'Action submitAnswer not allowed in phase lobby',
      );
      expect(error.code).toBe('INVALID_ACTION');
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({ action: 'submitAnswer', phase: 'lobby' });
    });
  });

  describe('InsufficientPlayersError', () => {
    it('should create an insufficient players error', () => {
      const error = new InsufficientPlayersError(2, 1);

      expect(error.message).toBe('Need at least 2 players to start, got 1');
      expect(error.code).toBe('INSUFFICIENT_PLAYERS');
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({ required: 2, actual: 1 });
    });
  });

  describe('GameAlreadyStartedError', () => {
    it('should create a game already started error', () => {
      const error = new GameAlreadyStartedError('ABC123');

      expect(error.message).toBe('Game already started in room ABC123');
      expect(error.code).toBe('GAME_ALREADY_STARTED');
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({ roomCode: 'ABC123' });
    });
  });

  describe('TimerServiceError', () => {
    it('should create a timer service error', () => {
      const error = new TimerServiceError('Timer failed to start');

      expect(error.message).toBe('Timer failed to start');
      expect(error.code).toBe('TIMER_SERVICE_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.details).toBeUndefined();
    });

    it('should create a timer service error with details', () => {
      const details = { roomCode: 'ABC123', duration: 15 };
      const error = new TimerServiceError('Timer failed to start', details);

      expect(error.details).toEqual(details);
    });
  });

  describe('Error Inheritance', () => {
    it('should properly inherit from Error', () => {
      const error = new GameError('Test', 'TEST');

      expect(error instanceof Error).toBe(true);
      expect(error instanceof GameError).toBe(true);
    });

    it('should have proper prototype chain', () => {
      const roomError = new RoomNotFoundError('ABC123');

      expect(roomError instanceof GameError).toBe(true);
      expect(roomError instanceof Error).toBe(true);
    });
  });

  describe('Error Stack Traces', () => {
    it('should capture stack traces', () => {
      const error = new GameError('Test', 'TEST');

      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe('string');
    });
  });
});
