import { NextResponse } from 'next/server';
import { OpenAIService } from '@/lib/openai';

// POST /api/test-image-text - Test image + text analysis
export async function POST(request: Request) {
  try {
    const { imageBase64, textPrompt, context, instructions } = await request.json();

    if (!imageBase64 || !textPrompt) {
      return NextResponse.json({
        success: false,
        error: 'imageBase64 and textPrompt are required'
      }, { status: 400 });
    }

    console.log('🧪 Testing image + text analysis...');
    console.log('📝 Text prompt:', textPrompt);
    console.log('🖼️ Image base64 length:', imageBase64.length);
    
    const result = await OpenAIService.analyzeImageWithText(
      imageBase64,
      textPrompt,
      context,
      instructions
    );
    
    console.log('✅ Image + text analysis successful:', {
      response: result.response?.substring(0, 100) + '...'
    });
    
    return NextResponse.json({
      success: true,
      message: 'Image + text analysis completed successfully!',
      result
    });
  } catch (error) {
    console.error('❌ Image + text analysis test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Image + text analysis test failed'
    }, { status: 500 });
  }
}

// GET /api/test-image-text - Test with a simple image and text
export async function GET() {
  try {
    // Test with a simple base64 image (1x1 pixel) and a text prompt
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const testTextPrompt = 'Describe what you see in this image and explain its artistic value.';
    const testContext = 'This is a test image for validating our new prompt system.';
    const testInstructions = 'Provide a detailed analysis focusing on visual elements and artistic interpretation.';
    
    console.log('🧪 Testing image + text analysis with sample data...');
    
    const result = await OpenAIService.analyzeImageWithText(
      testImageBase64,
      testTextPrompt,
      testContext,
      testInstructions
    );
    
    console.log('✅ Image + text analysis successful:', {
      response: result.response?.substring(0, 100) + '...'
    });
    
    return NextResponse.json({
      success: true,
      message: 'Image + text analysis test completed successfully!',
      testData: {
        imageBase64: testImageBase64,
        textPrompt: testTextPrompt,
        context: testContext,
        instructions: testInstructions
      },
      result
    });
  } catch (error) {
    console.error('❌ Image + text analysis test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Image + text analysis test failed'
    }, { status: 500 });
  }
}
