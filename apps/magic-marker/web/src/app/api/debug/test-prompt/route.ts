import { NextRequest, NextResponse } from 'next/server';
import { PromptExecutor } from '@/lib/promptExecutor';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { promptName, input } = body;

    if (!promptName || !input) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: promptName and input'
      }, { status: 400 });
    }

    console.log(`🧪 Testing prompt: ${promptName}`);
    console.log('📊 Input:', JSON.stringify(input, null, 2));

    const startTime = Date.now();
    
    const result = await PromptExecutor.execute(promptName, input);
    
    const executionTime = Date.now() - startTime;
    
    console.log(`✅ Prompt test completed in ${executionTime}ms`);
    console.log('📄 Result:', JSON.stringify(result, null, 2));

    return NextResponse.json({
      success: true,
      response: result,
      executionTime,
      tokensUsed: 0 // We don't track tokens in PromptExecutor yet
    });
  } catch (error) {
    console.error('❌ Prompt test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTime: 0
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Prompt Tester API',
    usage: 'POST with { promptName: string, input: any } to test a prompt',
    description: 'Test any prompt with custom input and get the response'
  });
}
