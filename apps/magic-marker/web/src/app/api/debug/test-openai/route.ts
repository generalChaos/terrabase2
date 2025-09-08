import { NextResponse } from 'next/server';
import { OpenAIService } from '@/lib/openai';

// GET /api/test-openai - Test OpenAI service
export async function GET() {
  try {
    // Test with a simple base64 image (1x1 pixel)
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    const result = await OpenAIService.analyzeImage(
      testImageBase64,
      undefined, // no imageId for test
      'This is a test image'
    );
    
    return NextResponse.json({
      success: true,
      analysis: result.analysis,
      message: 'OpenAI service with new prompt system is working correctly!'
    });
  } catch (error) {
    console.error('OpenAI test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'OpenAI service test failed'
    }, { status: 500 });
  }
}
