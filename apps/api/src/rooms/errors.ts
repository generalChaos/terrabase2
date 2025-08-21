// Base error class with proper structure
export class GameError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400,
    public readonly details?: any,
    public readonly category: 'VALIDATION' | 'BUSINESS_LOGIC' | 'SYSTEM' | 'AUTHENTICATION' = 'BUSINESS_LOGIC'
  ) {
    super(message);
    this.name = 'GameError';
  }
}

// Room-related errors
export class RoomNotFoundError extends GameError {
  constructor(roomCode: string) {
    super(`Room ${roomCode} not found`, 'ROOM_NOT_FOUND', 404, { roomCode }, 'VALIDATION');
  }
}

export class PlayerNotFoundError extends GameError {
  constructor(playerId: string, roomCode: string) {
    super(`Player ${playerId} not found in room ${roomCode}`, 'PLAYER_NOT_FOUND', 404, { playerId, roomCode }, 'VALIDATION');
  }
}

export class RoomFullError extends GameError {
  constructor(roomCode: string, maxPlayers: number) {
    super(`Room ${roomCode} is full (max ${maxPlayers} players)`, 'ROOM_FULL', 400, { roomCode, maxPlayers }, 'BUSINESS_LOGIC');
  }
}

// Game action errors
export class InvalidGameActionError extends GameError {
  constructor(action: string, phase: string) {
    super(`Action ${action} not allowed in phase ${phase}`, 'INVALID_ACTION', 400, { action, phase }, 'VALIDATION');
  }
}

export class InsufficientPlayersError extends GameError {
  constructor(required: number, actual: number) {
    super(`Need at least ${required} players to start, got ${actual}`, 'INSUFFICIENT_PLAYERS', 400, { required, actual }, 'BUSINESS_LOGIC');
  }
}

export class GameAlreadyStartedError extends GameError {
  constructor(roomCode: string) {
    super(`Game already started in room ${roomCode}`, 'GAME_ALREADY_STARTED', 400, { roomCode }, 'BUSINESS_LOGIC');
  }
}

export class GameNotStartedError extends GameError {
  constructor(roomCode: string) {
    super(`Game not started in room ${roomCode}`, 'GAME_NOT_STARTED', 400, { roomCode }, 'BUSINESS_LOGIC');
  }
}

// Player-related errors
export class PlayerNameTakenError extends GameError {
  constructor(nickname: string, roomCode: string) {
    super(`Nickname "${nickname}" is already taken in room ${roomCode}`, 'PLAYER_NAME_TAKEN', 409, { nickname, roomCode }, 'VALIDATION');
  }
}

export class PlayerNotHostError extends GameError {
  constructor(playerId: string, roomCode: string) {
    super(`Player ${playerId} is not the host of room ${roomCode}`, 'PLAYER_NOT_HOST', 403, { playerId, roomCode }, 'AUTHENTICATION');
  }
}

export class PlayerNotJoinedError extends GameError {
  constructor(playerId: string, roomCode: string) {
    super(`Player ${playerId} has not joined room ${roomCode}`, 'PLAYER_NOT_JOINED', 400, { playerId, roomCode }, 'VALIDATION');
  }
}

// Game state errors
export class InvalidGamePhaseError extends GameError {
  constructor(phase: string, expectedPhase: string) {
    super(`Invalid game phase: ${phase}, expected: ${expectedPhase}`, 'INVALID_GAME_PHASE', 400, { phase, expectedPhase }, 'VALIDATION');
  }
}

export class GameActionAlreadyPerformedError extends GameError {
  constructor(action: string, playerId: string) {
    super(`Player ${playerId} already performed action: ${action}`, 'ACTION_ALREADY_PERFORMED', 400, { action, playerId }, 'BUSINESS_LOGIC');
  }
}

// Timer service errors
export class TimerServiceError extends GameError {
  constructor(message: string, details?: any) {
    super(message, 'TIMER_SERVICE_ERROR', 500, details, 'SYSTEM');
  }
}

export class TimerNotFoundError extends GameError {
  constructor(roomCode: string) {
    super(`Timer not found for room ${roomCode}`, 'TIMER_NOT_FOUND', 404, { roomCode }, 'SYSTEM');
  }
}

// Connection errors
export class ConnectionError extends GameError {
  constructor(message: string, details?: any) {
    super(message, 'CONNECTION_ERROR', 500, details, 'SYSTEM');
  }
}

export class RoomCodeRequiredError extends GameError {
  constructor() {
    super('Room code is required in query parameters', 'ROOM_CODE_REQUIRED', 400, {}, 'VALIDATION');
  }
}

// Input validation errors
export class ValidationError extends GameError {
  constructor(field: string, message: string, details?: any) {
    super(`Validation error for ${field}: ${message}`, 'VALIDATION_ERROR', 400, { field, message, details }, 'VALIDATION');
  }
}

export class EmptyInputError extends GameError {
  constructor(field: string) {
    super(`Field ${field} cannot be empty`, 'EMPTY_INPUT', 400, { field }, 'VALIDATION');
  }
}

// System errors
export class GameEngineError extends GameError {
  constructor(message: string, details?: any) {
    super(message, 'GAME_ENGINE_ERROR', 500, details, 'SYSTEM');
  }
}

export class DatabaseError extends GameError {
  constructor(message: string, details?: any) {
    super(message, 'DATABASE_ERROR', 500, details, 'SYSTEM');
  }
}

// Error response interface for consistent client responses
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    category: string;
    details?: any;
    timestamp: string;
    requestId?: string;
  };
}

// Error factory for creating consistent error responses
export class ErrorResponseFactory {
  static create(error: GameError, requestId?: string): ErrorResponse {
    return {
      error: {
        code: error.code,
        message: error.message,
        category: error.category,
        details: error.details,
        timestamp: new Date().toISOString(),
        requestId
      }
    };
  }

  static createFromGenericError(error: Error, code: string = 'UNKNOWN_ERROR', requestId?: string): ErrorResponse {
    return {
      error: {
        code,
        message: error.message || 'An unexpected error occurred',
        category: 'SYSTEM',
        details: { originalError: error.name },
        timestamp: new Date().toISOString(),
        requestId
      }
    };
  }
}
