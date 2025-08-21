import { Injectable, Logger } from '@nestjs/common';
import { 
  GameError, 
  ErrorResponse, 
  ErrorResponseFactory,
  ConnectionError,
  RoomCodeRequiredError,
  ValidationError,
  EmptyInputError
} from './errors';

@Injectable()
export class ErrorHandlerService {
  private readonly logger = new Logger(ErrorHandlerService.name);

  /**
   * Handle errors and return appropriate error responses
   */
  handleError(error: unknown, context: string, requestId?: string): ErrorResponse {
    // If it's already a GameError, use it directly
    if (error instanceof GameError) {
      this.logError(error, context);
      return ErrorResponseFactory.create(error, requestId);
    }

    // If it's a standard Error, convert it
    if (error instanceof Error) {
      this.logError(error, context);
      return ErrorResponseFactory.createFromGenericError(error, 'UNKNOWN_ERROR', requestId);
    }

    // If it's something else, create a generic error
    const genericError = new Error(`Unexpected error in ${context}: ${String(error)}`);
    this.logError(genericError, context);
    return ErrorResponseFactory.createFromGenericError(genericError, 'UNEXPECTED_ERROR', requestId);
  }

  /**
   * Handle WebSocket-specific errors
   */
  handleWebSocketError(error: unknown, context: string, clientId?: string): ErrorResponse {
    const requestId = clientId || `ws-${Date.now()}`;
    return this.handleError(error, `WebSocket ${context}`, requestId);
  }

  /**
   * Validate input and throw appropriate errors
   */
  validateInput(value: any, fieldName: string, context: string): void {
    if (value === undefined || value === null) {
      throw new ValidationError(fieldName, 'is required', { context });
    }

    if (typeof value === 'string' && value.trim().length === 0) {
      throw new EmptyInputError(fieldName);
    }

    if (typeof value === 'string' && value.length > 1000) {
      throw new ValidationError(fieldName, 'is too long (max 1000 characters)', { context, maxLength: 1000 });
    }
  }

  /**
   * Validate room code format
   */
  validateRoomCode(roomCode: string): void {
    if (!roomCode || typeof roomCode !== 'string') {
      throw new RoomCodeRequiredError();
    }

    if (roomCode.trim().length === 0) {
      throw new RoomCodeRequiredError();
    }

    // Room codes should be alphanumeric and reasonable length
    if (!/^[a-zA-Z0-9]{4,8}$/.test(roomCode)) {
      throw new ValidationError('roomCode', 'must be 4-8 alphanumeric characters', { 
        received: roomCode,
        pattern: '^[a-zA-Z0-9]{4,8}$'
      });
    }
  }

  /**
   * Validate player nickname
   */
  validateNickname(nickname: string): void {
    this.validateInput(nickname, 'nickname', 'player join');

    if (nickname.length < 2) {
      throw new ValidationError('nickname', 'must be at least 2 characters long', { 
        received: nickname,
        minLength: 2
      });
    }

    if (nickname.length > 20) {
      throw new ValidationError('nickname', 'must be at most 20 characters long', { 
        received: nickname,
        maxLength: 20
      });
    }

    // Check for potentially problematic characters
    if (/[<>\"'&]/.test(nickname)) {
      throw new ValidationError('nickname', 'contains invalid characters', { 
        received: nickname,
        invalidChars: ['<', '>', '"', "'", '&']
      });
    }
  }

  /**
   * Validate game action data
   */
  validateGameAction(action: any, context: string): void {
    if (!action || typeof action !== 'object') {
      throw new ValidationError('action', 'must be a valid object', { context });
    }

    if (!action.type || typeof action.type !== 'string') {
      throw new ValidationError('action.type', 'must be a valid string', { context });
    }

    if (!action.playerId || typeof action.playerId !== 'string') {
      throw new ValidationError('action.playerId', 'must be a valid string', { context });
    }
  }

  /**
   * Log errors with appropriate level based on error type
   */
  private logError(error: Error, context: string): void {
    if (error instanceof GameError) {
      switch (error.category) {
        case 'VALIDATION':
          this.logger.warn(`Validation error in ${context}: ${error.message}`, error.details);
          break;
        case 'BUSINESS_LOGIC':
          this.logger.warn(`Business logic error in ${context}: ${error.message}`, error.details);
          break;
        case 'AUTHENTICATION':
          this.logger.warn(`Authentication error in ${context}: ${error.message}`, error.details);
          break;
        case 'SYSTEM':
          this.logger.error(`System error in ${context}: ${error.message}`, error.stack, error.details);
          break;
      }
    } else {
      this.logger.error(`Unexpected error in ${context}: ${error.message}`, error.stack);
    }
  }

  /**
   * Create a user-friendly error message
   */
  createUserFriendlyMessage(error: GameError): string {
    switch (error.code) {
      case 'ROOM_NOT_FOUND':
        return 'The room you\'re looking for doesn\'t exist. Please check the room code.';
      case 'PLAYER_NAME_TAKEN':
        return 'That nickname is already taken. Please choose a different one.';
      case 'ROOM_FULL':
        return 'This room is full. Please try another room or wait for a spot to open.';
      case 'INSUFFICIENT_PLAYERS':
        return 'Not enough players to start the game. Please wait for more players to join.';
      case 'INVALID_ACTION':
        return 'That action is not allowed right now. Please wait for your turn.';
      case 'PLAYER_NOT_HOST':
        return 'Only the host can perform this action.';
      case 'GAME_ALREADY_STARTED':
        return 'The game has already started. Please wait for the next round.';
      case 'CONNECTION_ERROR':
        return 'Connection lost. Please refresh the page and try again.';
      default:
        return 'Something went wrong. Please try again.';
    }
  }

  /**
   * Check if an error is retryable
   */
  isRetryableError(error: GameError): boolean {
    // System errors are usually retryable
    if (error.category === 'SYSTEM') {
      return true;
    }

    // Connection errors might be retryable
    if (error.code === 'CONNECTION_ERROR') {
      return true;
    }

    // Most other errors are not retryable
    return false;
  }
}
