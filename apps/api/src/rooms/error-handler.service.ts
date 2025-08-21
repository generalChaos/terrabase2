import { Injectable } from '@nestjs/common';
import { GameConfig } from '../config/game.config';
import { 
  GameError, 
  ValidationError, 
  EmptyInputError,
  RoomCodeRequiredError,
  ConnectionError
} from './errors';

@Injectable()
export class ErrorHandlerService {
  
  /**
   * Handle WebSocket errors and return consistent error responses
   */
  handleWebSocketError(error: any, context: string, clientId: string) {
    console.error(`❌ WebSocket error in ${context} for client ${clientId}:`, error);
    
    if (error instanceof GameError) {
      return {
        error: error.message,
        code: error.code,
        statusCode: error.statusCode,
        details: error.details,
        context
      };
    }
    
    // Handle validation errors
    if (error instanceof ValidationError) {
      return {
        error: error.message,
        code: 'VALIDATION_ERROR',
        statusCode: GameConfig.HTTP_STATUS.BAD_REQUEST,
        details: error.details,
        context
      };
    }
    
    // Handle connection errors
    if (error instanceof ConnectionError) {
      return {
        error: error.message,
        code: 'CONNECTION_ERROR',
        statusCode: GameConfig.HTTP_STATUS.BAD_REQUEST,
        details: error.details,
        context
      };
    }
    
    // Handle unknown errors
    return {
      error: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
      statusCode: GameConfig.HTTP_STATUS.INTERNAL_SERVER_ERROR,
      details: { originalError: error.message },
      context
    };
  }

  /**
   * Validate input fields with centralized limits
   */
  validateInput(value: any, fieldName: string, context: string): void {
    if (value === undefined || value === null) {
      throw new EmptyInputError(fieldName);
    }
    
    if (typeof value === 'string') {
      if (value.trim().length === 0) {
        throw new EmptyInputError(fieldName);
      }
      
      if (value.length > GameConfig.VALIDATION.MAX_INPUT_LENGTH) {
        throw new ValidationError(fieldName, `is too long (max ${GameConfig.VALIDATION.MAX_INPUT_LENGTH} characters)`, { 
          context, 
          maxLength: GameConfig.VALIDATION.MAX_INPUT_LENGTH 
        });
      }
    }
  }

  /**
   * Validate nickname using centralized configuration
   */
  validateNickname(nickname: string): void {
    if (!nickname || typeof nickname !== 'string') {
      throw new ValidationError('nickname', 'must be a non-empty string', { context: 'join' });
    }
    
    const trimmedNickname = nickname.trim();
    if (trimmedNickname.length === 0) {
      throw new EmptyInputError('nickname');
    }
    
    if (trimmedNickname.length < GameConfig.RULES.PLAYERS.MIN_NICKNAME_LENGTH) {
      throw new ValidationError('nickname', `must be at least ${GameConfig.RULES.PLAYERS.MIN_NICKNAME_LENGTH} characters long`, {
        context: 'join',
        minLength: GameConfig.RULES.PLAYERS.MIN_NICKNAME_LENGTH
      });
    }
    
    if (trimmedNickname.length > GameConfig.RULES.PLAYERS.MAX_NICKNAME_LENGTH) {
      throw new ValidationError('nickname', `must be at most ${GameConfig.RULES.PLAYERS.MAX_NICKNAME_LENGTH} characters long`, {
        context: 'join',
        maxLength: GameConfig.RULES.PLAYERS.MAX_NICKNAME_LENGTH
      });
    }
  }

  /**
   * Validate room code using centralized configuration
   */
  validateRoomCode(roomCode: string): void {
    if (!roomCode || typeof roomCode !== 'string') {
      throw new RoomCodeRequiredError();
    }
    
    if (roomCode.length < GameConfig.VALIDATION.ROOM_CODE_MIN_LENGTH) {
      throw new ValidationError('roomCode', `must be at least ${GameConfig.VALIDATION.ROOM_CODE_MIN_LENGTH} characters long`, {
        context: 'connection',
        minLength: GameConfig.VALIDATION.ROOM_CODE_MIN_LENGTH
      });
    }
    
    if (roomCode.length > GameConfig.VALIDATION.ROOM_CODE_MAX_LENGTH) {
      throw new ValidationError('roomCode', `must be at most ${GameConfig.VALIDATION.ROOM_CODE_MAX_LENGTH} characters long`, {
        context: 'connection',
        maxLength: GameConfig.VALIDATION.ROOM_CODE_MAX_LENGTH
      });
    }
    
    if (!GameConfig.VALIDATION.ROOM_CODE_PATTERN.test(roomCode)) {
      throw new ValidationError('roomCode', 'must contain only letters and numbers', {
        context: 'connection',
        pattern: GameConfig.VALIDATION.ROOM_CODE_PATTERN.toString()
      });
    }
  }

  /**
   * Validate game action using centralized configuration
   */
  validateGameAction(action: any, context: string): void {
    this.validateInput(action, 'action', context);
    
    if (typeof action === 'object' && action.type) {
      this.validateInput(action.type, 'action.type', context);
    }
  }
}
