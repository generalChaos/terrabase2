/**
 * Frontend Error Handling Service
 *
 * Provides consistent error handling using the Result pattern
 * and standardized error responses from the backend.
 */

import {
  Result,
  success,
  failure,
  ErrorCategory,
} from '@party/types';

// Frontend-specific error types
export interface FrontendError {
  code: string;
  message: string;
  category: ErrorCategory;
  details?: unknown;
  context?: string;
  timestamp: string;
  retryable: boolean;
  userActionRequired: boolean;
}

// Error handling result
export type ErrorHandlingResult<T> = Result<T, FrontendError>;

// Error recovery strategies
export interface ErrorRecoveryStrategy {
  retryable: boolean;
  maxRetries: number;
  backoffMs: number;
  userActionRequired: boolean;
  fallbackBehavior?: () => void;
}

// Error handler configuration
export interface ErrorHandlerConfig {
  showUserNotifications: boolean;
  logToConsole: boolean;
  retryStrategies: Map<string, ErrorRecoveryStrategy>;
  defaultRetryStrategy: ErrorRecoveryStrategy;
}

// Default error handler configuration
const defaultConfig: ErrorHandlerConfig = {
  showUserNotifications: true,
  logToConsole: true,
  retryStrategies: new Map([
    [
      'NETWORK_ERROR',
      {
        retryable: true,
        maxRetries: 3,
        backoffMs: 1000,
        userActionRequired: false,
      },
    ],
    [
      'VALIDATION_ERROR',
      {
        retryable: false,
        maxRetries: 0,
        backoffMs: 0,
        userActionRequired: true,
      },
    ],
    [
      'BUSINESS_LOGIC_ERROR',
      {
        retryable: false,
        maxRetries: 0,
        backoffMs: 0,
        userActionRequired: true,
      },
    ],
    [
      'SYSTEM_ERROR',
      {
        retryable: true,
        maxRetries: 2,
        backoffMs: 2000,
        userActionRequired: false,
      },
    ],
  ]),
  defaultRetryStrategy: {
    retryable: false,
    maxRetries: 0,
    backoffMs: 0,
    userActionRequired: true,
  },
};

export class FrontendErrorHandler {
  private config: ErrorHandlerConfig;
  private errorCounts: Map<string, number> = new Map();

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Handle any error and convert it to a standardized format
   */
  handleError(error: unknown, context: string): ErrorHandlingResult<never> {
    const frontendError = this.toFrontendError(error, context);

    // Log error if configured
    if (this.config.logToConsole) {
      this.logError(frontendError, context);
    }

    // Show user notification if configured
    if (this.config.showUserNotifications) {
      this.showUserNotification(frontendError);
    }

    // Update error count
    this.updateErrorCount(frontendError.code);

    return failure(frontendError);
  }

  /**
   * Handle async operations with automatic error handling
   */
  async handleAsync<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<ErrorHandlingResult<T>> {
    try {
      const result = await operation();
      return success(result);
    } catch (error) {
      return this.handleError(error, context);
    }
  }

  /**
   * Handle async operations with custom error mapping
   */
  async handleAsyncWithMapping<T, E>(
    operation: () => Promise<T>,
    errorMapper: (error: unknown) => E,
    context: string
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
   * Convert backend error response to frontend error
   */
  handleBackendError(
    errorResponse: unknown,
    context: string
  ): ErrorHandlingResult<never> {
    // Type guard for error response
    if (errorResponse && typeof errorResponse === 'object') {
      const response = errorResponse as Record<string, unknown>;
      const frontendError: FrontendError = {
        code: (response.code as string) || 'UNKNOWN_ERROR',
        message:
          (response.error as string) ||
          (response.message as string) ||
          'An unknown error occurred',
        category: this.mapErrorCategory(response.category as string),
        details: response.details,
        context: (response.context as string) || context,
        timestamp: (response.timestamp as string) || new Date().toISOString(),
        retryable: (response.retryable as boolean) || false,
        userActionRequired: (response.userActionRequired as boolean) || true,
      };

      return failure(frontendError);
    }

    // Fallback for non-object error responses
    const frontendError: FrontendError = {
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
      category: ErrorCategory.SYSTEM,
      details: { originalError: errorResponse },
      context,
      timestamp: new Date().toISOString(),
      retryable: false,
      userActionRequired: true,
    };

    return failure(frontendError);
  }

  /**
   * Check if an error should be retried
   */
  shouldRetry(error: FrontendError): boolean {
    const strategy =
      this.config.retryStrategies.get(error.code) ||
      this.config.defaultRetryStrategy;
    return (
      strategy.retryable && this.getErrorCount(error.code) < strategy.maxRetries
    );
  }

  /**
   * Get retry strategy for an error
   */
  getRetryStrategy(error: FrontendError): ErrorRecoveryStrategy {
    return (
      this.config.retryStrategies.get(error.code) ||
      this.config.defaultRetryStrategy
    );
  }

  /**
   * Get appropriate retry delay for an error
   */
  getRetryDelay(error: FrontendError): number {
    const strategy = this.getRetryStrategy(error);
    const errorCount = this.getErrorCount(error.code);
    return Math.min(strategy.backoffMs * Math.pow(2, errorCount), 10000); // Max 10 seconds
  }

  /**
   * Attempt to recover from an error
   */
  async attemptRecovery<T>(
    error: FrontendError,
    recoveryOperation: () => Promise<T>,
    context: string
  ): Promise<ErrorHandlingResult<T>> {
    if (!this.shouldRetry(error)) {
      return failure(error);
    }

    const delay = this.getRetryDelay(error);

    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, delay));

    try {
      const result = await recoveryOperation();
      // Reset error count on successful recovery
      this.errorCounts.delete(error.code);
      return success(result);
    } catch (recoveryError) {
      return this.handleError(recoveryError, context);
    }
  }

  /**
   * Convert any error to a standardized frontend error
   */
  private toFrontendError(error: unknown, context: string): FrontendError {
    // Handle known error types
    if (error instanceof Error) {
      return {
        code: 'FRONTEND_ERROR',
        message: error.message,
        category: ErrorCategory.SYSTEM,
        details: {
          name: error.name,
          stack: error.stack,
        },
        context,
        timestamp: new Date().toISOString(),
        retryable: false,
        userActionRequired: true,
      };
    }

    // Handle network errors
    if (error && typeof error === 'object' && 'status' in error) {
      const networkError = error as {
        status: number;
        statusText?: string;
        url?: string;
      };
      return {
        code: 'NETWORK_ERROR',
        message: `Network error: ${networkError.status} ${networkError.statusText || ''}`,
        category: ErrorCategory.NETWORK,
        details: {
          status: networkError.status,
          statusText: networkError.statusText,
          url: networkError.url,
        },
        context,
        timestamp: new Date().toISOString(),
        retryable: true,
        userActionRequired: false,
      };
    }

    // Handle unknown errors
    return {
      code: 'UNKNOWN_ERROR',
      message:
        typeof error === 'string' ? error : 'An unexpected error occurred',
      category: ErrorCategory.SYSTEM,
      details: { originalError: error },
      context,
      timestamp: new Date().toISOString(),
      retryable: false,
      userActionRequired: true,
    };
  }

  /**
   * Map error category strings to ErrorCategory enum
   */
  private mapErrorCategory(category: string): ErrorCategory {
    switch (category?.toUpperCase()) {
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
   * Log error to console
   */
  private logError(error: FrontendError | unknown, context: string): void {
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const frontendError = error as FrontendError;
      console.error(`Error in ${context}:`, {
        code: frontendError.code,
        message: frontendError.message,
        category: frontendError.category,
        context: frontendError.context,
        timestamp: frontendError.timestamp,
        details: frontendError.details,
        retryable: frontendError.retryable,
        userActionRequired: frontendError.userActionRequired,
      });
    } else {
      console.error(`Unknown error in ${context}:`, error);
    }
  }

  /**
   * Show user notification for error
   */
  private showUserNotification(error: FrontendError): void {
    // This would integrate with your notification system
    // For now, we'll use console.log as a placeholder
    const notification = {
      type: error.retryable ? 'warning' : 'error',
      title: error.code,
      message: error.message,
      retryable: error.retryable,
      userActionRequired: error.userActionRequired,
    };

    console.log('User notification:', notification);

    // TODO: Integrate with your UI notification system
    // Example: toast.error(notification.message) or showModal(notification)
  }

  /**
   * Update error count for tracking
   */
  private updateErrorCount(errorCode: string): void {
    const currentCount = this.errorCounts.get(errorCode) || 0;
    this.errorCounts.set(errorCode, currentCount + 1);
  }

  /**
   * Get current error count for a specific error code
   */
  private getErrorCount(errorCode: string): number {
    return this.errorCounts.get(errorCode) || 0;
  }

  /**
   * Reset error count for a specific error code
   */
  resetErrorCount(errorCode: string): void {
    this.errorCounts.delete(errorCode);
  }

  /**
   * Reset all error counts
   */
  resetAllErrorCounts(): void {
    this.errorCounts.clear();
  }

  /**
   * Get error statistics
   */
  getErrorStats(): { [code: string]: number } {
    const stats: { [code: string]: number } = {};
    this.errorCounts.forEach((count, code) => {
      stats[code] = count;
    });
    return stats;
  }
}

// Export singleton instance
export const errorHandler = new FrontendErrorHandler();

// Export helper functions for common use cases
export const handleError = (error: unknown, context: string) =>
  errorHandler.handleError(error, context);
export const handleAsync = <T>(operation: () => Promise<T>, context: string) =>
  errorHandler.handleAsync(operation, context);
export const handleBackendError = (errorResponse: unknown, context: string) =>
  errorHandler.handleBackendError(errorResponse, context);
