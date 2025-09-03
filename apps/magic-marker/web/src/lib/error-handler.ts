export interface ErrorResponse {
  success: false;
  error: string;
  timestamp: string;
  requestId: string;
  code?: string;
}

export class ErrorHandler {
  static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static handleOpenAIError(error: any): { message: string; statusCode: number } {
    console.error('OpenAI error:', error);

    if (error.code === 'rate_limit_exceeded') {
      return {
        message: 'AI service is busy. Please wait a moment and try again.',
        statusCode: 429
      };
    } else if (error.code === 'insufficient_quota') {
      return {
        message: 'AI service quota exceeded. Please try again later.',
        statusCode: 402
      };
    } else if (error.code === 'model_not_found') {
      return {
        message: 'AI model not available. Please try again later.',
        statusCode: 503
      };
    } else if (error.code === 'timeout') {
      return {
        message: 'Request timed out. Please try again.',
        statusCode: 408
      };
    } else if (error.code === 'content_policy_violation') {
      return {
        message: 'Content not allowed. Please try different input.',
        statusCode: 400
      };
    } else if (error.status === 401) {
      return {
        message: 'AI service authentication failed. Please contact support.',
        statusCode: 503
      };
    } else if (error.status === 429) {
      return {
        message: 'Too many requests. Please wait and try again.',
        statusCode: 429
      };
    } else if (error.status >= 500) {
      return {
        message: 'AI service is temporarily unavailable. Please try again later.',
        statusCode: 503
      };
    } else {
      return {
        message: `AI service error: ${error.message || 'Unknown error'}`,
        statusCode: 500
      };
    }
  }

  static handleSupabaseError(error: any): { message: string; statusCode: number } {
    console.error('Supabase error:', error);

    if (error.message.includes('File size exceeds maximum')) {
      return {
        message: 'File too large for storage. Please try a smaller file.',
        statusCode: 413
      };
    } else if (error.message.includes('already exists')) {
      return {
        message: 'File with this name already exists. Please try again.',
        statusCode: 409
      };
    } else if (error.message.includes('quota')) {
      return {
        message: 'Storage quota exceeded. Please contact support.',
        statusCode: 507
      };
    } else if (error.message.includes('duplicate key')) {
      return {
        message: 'Record already exists. Please try again.',
        statusCode: 409
      };
    } else if (error.message.includes('foreign key')) {
      return {
        message: 'Database constraint violation. Please try again.',
        statusCode: 400
      };
    } else if (error.message.includes('permission')) {
      return {
        message: 'Database permission denied. Please contact support.',
        statusCode: 403
      };
    } else if (error.message.includes('not found')) {
      return {
        message: 'Requested resource not found.',
        statusCode: 404
      };
    } else {
      return {
        message: 'Database error. Please try again.',
        statusCode: 500
      };
    }
  }

  static handleValidationError(error: string): { message: string; statusCode: number } {
    return {
      message: error,
      statusCode: 400
    };
  }

  static createErrorResponse(
    message: string, 
    statusCode: number, 
    code?: string
  ): ErrorResponse {
    return {
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
      requestId: this.generateRequestId(),
      code
    };
  }
}
