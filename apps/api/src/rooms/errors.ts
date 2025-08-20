export class GameError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'GameError';
  }
}

export class RoomNotFoundError extends GameError {
  constructor(roomCode: string) {
    super(`Room ${roomCode} not found`, 'ROOM_NOT_FOUND', 404, { roomCode });
  }
}

export class PlayerNotFoundError extends GameError {
  constructor(playerId: string, roomCode: string) {
    super(`Player ${playerId} not found in room ${roomCode}`, 'PLAYER_NOT_FOUND', 404, { playerId, roomCode });
  }
}

export class InvalidGameActionError extends GameError {
  constructor(action: string, phase: string) {
    super(`Action ${action} not allowed in phase ${phase}`, 'INVALID_ACTION', 400, { action, phase });
  }
}

export class InsufficientPlayersError extends GameError {
  constructor(required: number, actual: number) {
    super(`Need at least ${required} players to start, got ${actual}`, 'INSUFFICIENT_PLAYERS', 400, { required, actual });
  }
}

export class GameAlreadyStartedError extends GameError {
  constructor(roomCode: string) {
    super(`Game already started in room ${roomCode}`, 'GAME_ALREADY_STARTED', 400, { roomCode });
  }
}

export class TimerServiceError extends GameError {
  constructor(message: string, details?: any) {
    super(message, 'TIMER_SERVICE_ERROR', 500, details);
  }
}
