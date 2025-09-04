import { NextRequest, NextResponse } from 'next/server';
import { OpenAIService } from '@/lib/openaiNew';

// GET /api/test-openai - Test OpenAI service
export async function GET() {
  try {
    // Test with a simple base64 image (1x1 pixel)
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    const result = await OpenAIService.analyzeImage(
      testImageBase64,
      undefined, // no imageId for test
      'This is a test image',
      'general',
      ['composition', 'colors'],
      'Focus on the artistic elements'
    );
    
    return NextResponse.json({
      success: true,
      analysis: result.analysis,
      analysisMetadata: {
        confidence_score: result.confidence_score,
        identified_elements: result.identified_elements,
        artistic_notes: result.artistic_notes,
        technical_notes: result.technical_notes
      },
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
