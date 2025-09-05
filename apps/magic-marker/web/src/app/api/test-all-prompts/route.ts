import { NextResponse } from 'next/server';
import { PromptExecutor } from '@/lib/promptExecutor';

// GET /api/test-all-prompts - Test all prompt types
export async function GET() {
  const results: Record<string, unknown> = {};
  const errors: Record<string, string> = {};

  // Test data
  const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  const testAnalysis = 'This is a test image analysis for testing purposes.';
  const testQuestions = [
    { id: '1', text: 'What is the main color?', type: 'multiple_choice', options: ['Blue', 'Red', 'Green', 'Yellow'], required: true }
  ];
  const testAnswers = ['Blue', 'Artistic', 'Modern'];

  console.log('🧪 Testing all prompt types...');

  // 1. Test image_analysis
  try {
    console.log('Testing image_analysis...');
    results.image_analysis = await PromptExecutor.execute('image_analysis', {
      image: testImageBase64,
      context: 'Test context',
      analysis_type: 'general',
      focus_areas: ['composition'],
      user_instructions: 'Test instructions'
    });
    console.log('✅ image_analysis passed');
  } catch (error) {
    errors.image_analysis = error instanceof Error ? error.message : 'Unknown error';
    console.log('❌ image_analysis failed:', error);
  }

  // 2. Test questions_generation
  try {
    console.log('Testing questions_generation...');
    results.questions_generation = await PromptExecutor.execute('questions_generation', {
      analysis: testAnalysis
    });
    console.log('✅ questions_generation passed');
  } catch (error) {
    errors.questions_generation = error instanceof Error ? error.message : 'Unknown error';
    console.log('❌ questions_generation failed:', error);
  }

  // 3. Test conversational_question
  try {
    console.log('Testing conversational_question...');
    results.conversational_question = await PromptExecutor.execute('conversational_question', {
      analysis: testAnalysis,
      previousAnswers: testAnswers,
      conversationContext: {
        questions: testQuestions,
        artisticDirection: 'Modern'
      }
    });
    console.log('✅ conversational_question passed');
  } catch (error) {
    errors.conversational_question = error instanceof Error ? error.message : 'Unknown error';
    console.log('❌ conversational_question failed:', error);
  }

  // 4. Test image_prompt_creation
  try {
    console.log('Testing image_prompt_creation...');
    results.image_prompt_creation = await PromptExecutor.execute('image_prompt_creation', {
      questions: testQuestions,
      answers: testAnswers
    });
    console.log('✅ image_prompt_creation passed');
  } catch (error) {
    errors.image_prompt_creation = error instanceof Error ? error.message : 'Unknown error';
    console.log('❌ image_prompt_creation failed:', error);
  }

  // 5. Test text_processing
  try {
    console.log('Testing text_processing...');
    results.text_processing = await PromptExecutor.execute('text_processing', {
      text: 'Test text for processing',
      context: 'Test context',
      instructions: 'Process this text',
      format: 'JSON'
    });
    console.log('✅ text_processing passed');
  } catch (error) {
    errors.text_processing = error instanceof Error ? error.message : 'Unknown error';
    console.log('❌ text_processing failed:', error);
  }

  // 6. Test image_text_analysis
  try {
    console.log('Testing image_text_analysis...');
    results.image_text_analysis = await PromptExecutor.execute('image_text_analysis', {
      image: testImageBase64,
      text: 'Describe this image',
      context: 'Test context',
      instructions: 'Provide detailed analysis'
    });
    console.log('✅ image_text_analysis passed');
  } catch (error) {
    errors.image_text_analysis = error instanceof Error ? error.message : 'Unknown error';
    console.log('❌ image_text_analysis failed:', error);
  }

  const successCount = Object.keys(results).length;
  const totalCount = 6; // Number of tests we're running
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
