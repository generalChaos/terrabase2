import { NextRequest, NextResponse } from 'next/server';
import { ErrorHandler } from '@/lib/error-handler';

// GET /api/test-errors - Test error handling scenarios
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const testType = searchParams.get('type');

  try {
    switch (testType) {
      case 'validation':
        throw new Error('Invalid input provided');
      
      case 'openai':
        const openaiError = {
          code: 'rate_limit_exceeded',
          message: 'Rate limit exceeded'
        };
        const { message, statusCode } = ErrorHandler.handleOpenAIError(openaiError);
        return NextResponse.json(ErrorHandler.createErrorResponse(message, statusCode), { status: statusCode });
      
      case 'supabase':
        const supabaseError = {
          message: 'File size exceeds maximum'
        };
        const { message: supabaseMessage, statusCode: supabaseStatusCode } = ErrorHandler.handleSupabaseError(supabaseError);
        return NextResponse.json(ErrorHandler.createErrorResponse(supabaseMessage, supabaseStatusCode), { status: supabaseStatusCode });
      
      case 'timeout':
        // Simulate a timeout
        await new Promise(resolve => setTimeout(resolve, 100));
        throw new Error('Request timeout');
      
      case 'unknown':
        throw new Error('Unknown error occurred');
      
      default:
        return NextResponse.json({
          success: true,
          message: 'Error handling test endpoint',
          availableTests: [
            'validation',
            'openai', 
            'supabase',
            'timeout',
            'unknown'
          ],
          usage: 'Add ?type=<testType> to test specific error scenarios'
        });
    }
  } catch (error) {
    console.error('Test error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorResponse = ErrorHandler.createErrorResponse(
      `Test error: ${errorMessage}`,
      500,
      'TEST_ERROR'
    );
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
