import { NextResponse } from 'next/server';
import { PromptExecutor } from '@/lib/promptExecutor';

// GET /api/test-all-prompts - Test all prompt types
export async function GET() {
  const results: Record<string, unknown> = {};
  const errors: Record<string, string> = {};

  // Test data
  const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  const testAnalysis = 'This is a test image analysis for testing purposes.';
  // Test data for prompts that need it

  console.log('🧪 Testing all prompt types...');

  // 1. Test image_analysis
  try {
    console.log('Testing image_analysis...');
    results.image_analysis = await PromptExecutor.executeWithSchemaEnforcement('image_analysis', {
      image: testImageBase64,
      prompt: 'Analyze this image and describe what you see, focusing on composition, colors, and artistic style.'
    });
    console.log('✅ image_analysis passed');
  } catch (error) {
    errors.image_analysis = error instanceof Error ? error.message : 'Unknown error';
    console.log('❌ image_analysis failed:', error);
  }

  // 2. Test questions_generation
  try {
    console.log('Testing questions_generation...');
    results.questions_generation = await PromptExecutor.executeWithSchemaEnforcement('questions_generation', {
      analysis: testAnalysis,
      prompt: ''
    });
    console.log('✅ questions_generation passed');
  } catch (error) {
    errors.questions_generation = error instanceof Error ? error.message : 'Unknown error';
    console.log('❌ questions_generation failed:', error);
  }

  // 3. Test image_generation
  try {
    console.log('Testing image_generation...');
    results.image_generation = await PromptExecutor.executeWithSchemaEnforcement('image_generation', {
      prompt: 'A beautiful landscape with mountains and a lake at sunset, in a happy and bright style',
      flow_summary: {}
    });
    console.log('✅ image_generation passed');
  } catch (error) {
    errors.image_generation = error instanceof Error ? error.message : 'Unknown error';
    console.log('❌ image_generation failed:', error);
  }

  // 5. Test text_processing
  try {
    console.log('Testing text_processing...');
    results.text_processing = await PromptExecutor.executeWithSchemaEnforcement('text_processing', {
      prompt: 'This is a test text to process. Please analyze it and provide insights.'
    });
    console.log('✅ text_processing passed');
  } catch (error) {
    errors.text_processing = error instanceof Error ? error.message : 'Unknown error';
    console.log('❌ text_processing failed:', error);
  }

  // 6. Test questions_generation
  try {
    console.log('Testing questions_generation...');
    results.questions_generation_2 = await PromptExecutor.executeWithSchemaEnforcement('questions_generation', {
      analysis: 'This is a test image showing a beautiful landscape with mountains and a lake at sunset. The composition is well-balanced with warm colors and dramatic lighting.',
      prompt: ''
    });
    console.log('✅ questions_generation passed');
  } catch (error) {
    errors.questions_generation = error instanceof Error ? error.message : 'Unknown error';
    console.log('❌ questions_generation failed:', error);
  }

  const successCount = Object.keys(results).length;
  const totalCount = 5; // Number of tests we're running
  const errorCount = Object.keys(errors).length;

  return NextResponse.json({
    success: errorCount === 0,
    message: `Testing complete: ${successCount}/${totalCount} prompts working`,
    summary: {
      total: totalCount,
      passed: successCount,
      failed: errorCount,
      successRate: `${Math.round((successCount / totalCount) * 100)}%`
    },
    results,
    errors: Object.keys(errors).length > 0 ? errors : undefined
  });
}
