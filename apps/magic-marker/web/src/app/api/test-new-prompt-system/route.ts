import { NextResponse } from 'next/server';
import { OpenAIService } from '@/lib/openaiNew';

// GET /api/test-new-prompt-system - Test the new prompt system
export async function GET() {
  try {
    // Test with a simple base64 image (1x1 pixel)
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    console.log('🧪 Testing new prompt system...');
    
    // Test image analysis
    const analysisResult = await OpenAIService.analyzeImage(
      testImageBase64,
      undefined, // no imageId for test
      'This is a test image',
      'general',
      ['composition', 'colors'],
      'Focus on the artistic elements'
    );
    
    console.log('✅ Image analysis successful:', analysisResult);
    
    // Test questions generation
    console.log('🧪 Testing questions generation...');
    const questionsResult = await OpenAIService.generateQuestions(
      analysisResult.analysis
    );
    
    console.log('✅ Questions generation successful:', questionsResult);
    console.log('📊 Questions count:', questionsResult.length);
    
    return NextResponse.json({
      success: true,
      message: 'New prompt system is working correctly!',
      results: {
        analysis: analysisResult,
        questions: questionsResult
      }
    });
  } catch (error) {
    console.error('❌ New prompt system test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'New prompt system test failed'
    }, { status: 500 });
  }
}
