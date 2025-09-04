import { NextResponse } from 'next/server';
import { PromptExecutor } from '@/lib/promptExecutor';

// GET /api/test-questions - Test questions generation directly
export async function GET() {
  try {
    console.log('🧪 Testing questions generation directly...');
    
    const result = await PromptExecutor.execute('questions_generation', {
      analysis: 'This is a test image analysis for testing purposes.'
    });
    
    console.log('✅ Questions generation result:', JSON.stringify(result, null, 2));
    
    return NextResponse.json({
      success: true,
      message: 'Questions generation test completed!',
      result
    });
  } catch (error) {
    console.error('❌ Questions generation test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Questions generation test failed'
    }, { status: 500 });
  }
}
