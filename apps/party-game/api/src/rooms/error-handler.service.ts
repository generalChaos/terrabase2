import { Injectable, Logger } from '@nestjs/common';
import {
  Result,
  success,
  failure,
  StandardError,
  ErrorCategory,
  createErrorResponse,
  createSuccessResponse,
  shouldRetry,
  getUserActionRequired,
  getLogLevel,
} from '../shared/config';
import {
  GameError,
  ValidationError,
  EmptyInputError,
  RoomCodeRequiredError,
  ConnectionError,
  RoomNotFoundError,
  PlayerNotFoundError,
  RoomFullError,
  InvalidGameActionError,
  InsufficientPlayersError,
  GameAlreadyStartedError,
  GameNotStartedError,
  PlayerNameTakenError,
  PlayerNotHostError,
  PlayerNotJoinedError,
  InvalidGamePhaseError,
  GameActionAlreadyPerformedError,
  TimerServiceError,
  TimerNotFoundError,
  GameEngineError,
  DatabaseError,
} from './errors';

@Injectable()
export class ErrorHandlerService {
  private readonly logger = new Logger(ErrorHandlerService.name);

  /**
   * Convert any error to a standardized Result
   */
  handleError(
    error: unknown,
    context: string,
    requestId?: string,
  ): Result<never, StandardError> {
    const standardError = this.toStandardError(error, context, requestId);

    // Log based on error category
    this.logError(standardError, context);

    return failure(standardError);
  }

  /**
   * Handle async operations with automatic error handling
   */
  async handleAsync<T>(
    operation: () => Promise<T>,
    context: string,
    requestId?: string,
  ): Promise<Result<T, StandardError>> {
    try {
      const result = await operation();
      return success(result);
    } catch (error) {
      return this.handleError(error, context, requestId);
    }
  }

  /**
   * Handle async operations with custom error mapping
   */
  async handleAsyncWithMapping<T, E>(
    operation: () => Promise<T>,
    errorMapper: (error: unknown) => E,
    context: string,
    requestId?: string,
  ): Promise<Result<T, E>> {
    try {
      const result = await operation();
      return success(result);
    } catch (error) {
      const mappedError = errorMapper(error);
      this.logError(mappedError, context);
      return failure(mappedError);
    }
  }

  /**
   * Convert any error to a standardized error format
   */
  private toStandardError(
    error: unknown,
    context: string,
    requestId?: string,
  ): StandardError {
    // Handle known GameError instances
    if (error instanceof GameError) {
      return {
        code: error.code,
        message: error.message,
        category: this.mapErrorCategory(error.category),
        statusCode: error.statusCode,
        details: error.details,
        timestamp: new Date().toISOString(),
        requestId,
        context,
      };
    }

    // Handle validation errors
    if (error instanceof ValidationError) {
      return {
        code: 'VALIDATION_ERROR',
        message: error.message,
        category: ErrorCategory.VALIDATION,
        statusCode: 400,
        details: error.details,
        timestamp: new Date().toISOString(),
        requestId,
        context,
      };
    }

    // Handle connection errors
    if (error instanceof ConnectionError) {
      return {
        code: 'CONNECTION_ERROR',
        message: error.message,
        category: ErrorCategory.NETWORK,
        statusCode: 500,
        details: error.details,
        timestamp: new Date().toISOString(),
        requestId,
        context,
      };
    }

    // Handle unknown errors
    return {
      code: 'INTERNAL_ERROR',
      message:
        error instanceof Error ? error.message : 'An unexpected error occurred',
      category: ErrorCategory.SYSTEM,
      statusCode: 500,
      details: {
        originalError: error instanceof Error ? error.name : typeof error,
        stack: error instanceof Error ? error.stack : undefined,
      },
      timestamp: new Date().toISOString(),
      requestId,
      context,
    };
  }

  /**
   * Map error category strings to ErrorCategory enum
   */
  private mapErrorCategory(category: string): ErrorCategory {
    switch (category.toUpperCase()) {
      case 'VALIDATION':
        return ErrorCategory.VALIDATION;
      case 'BUSINESS_LOGIC':
        return ErrorCategory.BUSINESS_LOGIC;
      case 'SYSTEM':
        return ErrorCategory.SYSTEM;
      case 'AUTHENTICATION':
        return ErrorCategory.AUTHENTICATION;
      case 'NETWORK':
        return ErrorCategory.NETWORK;
      default:
        return ErrorCategory.SYSTEM;
    }
  }

  /**
   * Log error based on category and configuration
   */
  private logError(error: StandardError | unknown, context: string): void {
    if (typeof error === 'object' && error !== null && 'category' in error) {
      const standardError = error as StandardError;
      const logLevel = getLogLevel(
        standardError.category.toLowerCase() as keyof typeof getLogLevel,
      );

      const logData = {
        code: standardError.code,
        message: standardError.message,
        category: standardError.category,
        statusCode: standardError.statusCode,
        context: standardError.context || context,
        timestamp: standardError.timestamp,
        requestId: standardError.requestId,
        details: standardError.details,
      };

      switch (logLevel) {
        case 'debug':
          this.logger.debug(`Error in ${context}:`, logData);
          break;
        case 'info':
          this.logger.log(`Error in ${context}:`, logData);
          break;
        case 'warn':
          this.logger.warn(`Error in ${context}:`, logData);
          break;
        case 'error':
        default:
          this.logger.error(`Error in ${context}:`, logData);
          break;
      }
    } else {
      // Fallback for unknown error types
      this.logger.error(`Unknown error in ${context}:`, error);
    }
  }

  /**
   * Create a standardized error response for WebSocket clients
   */
  createWebSocketErrorResponse(
    error: unknown,
    context: string,
    clientId: string,
    requestId?: string,
  ) {
    const standardError = this.toStandardError(error, context, requestId);

    // Normalize category to uppercase for config lookup
    const normalizedCategory =
      standardError.category.toUpperCase() as keyof typeof shouldRetry;

    return {
      error: standardError.message,
      code: standardError.code,
      statusCode: standardError.statusCode,
      details: standardError.details,
      context: standardError.context,
      timestamp: standardError.timestamp,
      requestId: standardError.requestId,
      category: standardError.category,
      retryable: shouldRetry(normalizedCategory),
      userActionRequired: getUserActionRequired(normalizedCategory),
    };
  }

  /**
   * Validate input fields with centralized limits
   */
  validateInput(
    value: any,
    fieldName: string,
    context: string,
  ): Result<void, StandardError> {
    if (value === null || value === undefined) {
      return failure({
        code: 'EMPTY_INPUT',
        message: `Field ${fieldName} cannot be empty`,
        category: ErrorCategory.VALIDATION,
        statusCode: 400,
        details: { field: fieldName },
        timestamp: new Date().toISOString(),
        context,
      });
    }

    if (typeof value === 'string' && value.trim().length === 0) {
      return failure({
        code: 'EMPTY_INPUT',
        message: `Field ${fieldName} cannot be empty`,
        category: ErrorCategory.VALIDATION,
        statusCode: 400,
        details: { field: fieldName },
        timestamp: new Date().toISOString(),
        context,
      });
    }

    return success(undefined);
  }

  /**
   * Validate room code format
   */
  validateRoomCode(
    roomCode: string,
    context: string,
  ): Result<void, StandardError> {
    if (!roomCode) {
      return failure({
        code: 'ROOM_CODE_REQUIRED',
        message: 'Room code is required',
        category: ErrorCategory.VALIDATION,
        statusCode: 400,
        details: { field: 'roomCode' },
        timestamp: new Date().toISOString(),
        context,
      });
    }

    // Room code should be 4-8 alphanumeric characters
    const roomCodePattern = /^[a-zA-Z0-9]{4,8}$/;
    if (!roomCodePattern.test(roomCode)) {
      return failure({
        code: 'INVALID_ROOM_CODE',
        message: 'Room code must be 4-8 alphanumeric characters',
        category: ErrorCategory.VALIDATION,
        statusCode: 400,
        details: {
          field: 'roomCode',
          value: roomCode,
          pattern: '4-8 alphanumeric characters',
        },
        timestamp: new Date().toISOString(),
        context,
      });
    }

    return success(undefined);
  }

  /**
   * Validate nickname format
   */
  validateNickname(
    nickname: string,
    context: string,
  ): Result<void, StandardError> {
    if (!nickname) {
      return failure({
        code: 'EMPTY_INPUT',
        message: 'Nickname cannot be empty',
        category: ErrorCategory.VALIDATION,
        statusCode: 400,
        details: { field: 'nickname' },
        timestamp: new Date().toISOString(),
        context,
      });
    }

    if (nickname.length < 2) {
      return failure({
        code: 'NICKNAME_TOO_SHORT',
        message: 'Nickname must be at least 2 characters',
        category: ErrorCategory.VALIDATION,
        statusCode: 400,
        details: {
          field: 'nickname',
          minLength: 2,
          actualLength: nickname.length,
        },
        timestamp: new Date().toISOString(),
        context,
      });
    }

    if (nickname.length > 20) {
      return failure({
        code: 'NICKNAME_TOO_LONG',
        message: 'Nickname must be 20 characters or less',
        category: ErrorCategory.VALIDATION,
        statusCode: 400,
        details: {
          field: 'nickname',
          maxLength: 20,
          actualLength: nickname.length,
        },
        timestamp: new Date().toISOString(),
        context,
      });
    }

    return success(undefined);
  }

  /**
   * Check if an error is retryable
   */
  isRetryable(error: StandardError): boolean {
    return shouldRetry(
      error.category.toLowerCase() as keyof typeof shouldRetry,
    );
  }

  /**
   * Check if user action is required for an error
   */
  requiresUserAction(error: StandardError): boolean {
    return getUserActionRequired(
      error.category.toLowerCase() as keyof typeof getUserActionRequired,
    );
  }

  /**
   * Get appropriate log level for an error
   */
  getLogLevel(error: StandardError): string {
    return getLogLevel(
      error.category.toLowerCase() as keyof typeof getLogLevel,
    );
  }
}
