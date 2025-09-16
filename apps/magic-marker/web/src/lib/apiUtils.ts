import { NextResponse } from 'next/server'

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  timestamp: string
}

export class ApiUtils {
  /**
   * Create a successful API response
   */
  static success<T>(data: T, status: number = 200): NextResponse<ApiResponse<T>> {
    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    }, { status })
  }

  /**
   * Create an error API response
   */
  static error(message: string, status: number = 500): NextResponse<ApiResponse> {
    return NextResponse.json({
      success: false,
      error: message,
      timestamp: new Date().toISOString()
    }, { status })
  }

  /**
   * Create a validation error response
   */
  static validationError(message: string): NextResponse<ApiResponse> {
    return this.error(`Validation error: ${message}`, 400)
  }

  /**
   * Create a not found error response
   */
  static notFound(message: string = 'Resource not found'): NextResponse<ApiResponse> {
    return this.error(message, 404)
  }

  /**
   * Create an internal server error response
   */
  static internalError(message: string = 'Internal server error'): NextResponse<ApiResponse> {
    return this.error(message, 500)
  }
}
