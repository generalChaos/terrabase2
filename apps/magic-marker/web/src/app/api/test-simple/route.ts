import { NextResponse } from 'next/server';
import { PromptExecutor } from '@/lib/promptExecutor';

// GET /api/test-simple - Test simple text processing
export async function GET() {
  try {
    console.log('🧪 Testing simple text processing...');
    
    // Test with a simple text processing prompt
    const result = await PromptExecutor.execute('text_processing', {
      text: 'Hello, this is a test message.',
      context: 'This is a test context',
      instructions: 'Please respond with a greeting',
      format: 'JSON'
    });
    
    console.log('✅ Simple text processing successful:', result);
    
    return NextResponse.json({
      success: true,
      message: 'Simple text processing completed successfully!',
      result
    });
  } catch (error) {
    console.error('❌ Simple text processing test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Simple text processing test failed'
    }, { status: 500 });
  }
}
