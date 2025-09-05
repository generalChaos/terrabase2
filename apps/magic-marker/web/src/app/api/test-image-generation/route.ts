import { NextResponse } from 'next/server';
import { OpenAIService } from '@/lib/openai';
import { supabase } from '@/lib/supabase';

// POST /api/test-image-generation - Test image generation with step logging
export async function POST(request: Request) {
  try {
    const { prompt, imageId } = await request.json();

    if (!prompt) {
      return NextResponse.json({
        success: false,
        error: 'Prompt is required'
      }, { status: 400 });
    }

    console.log('🧪 Testing image generation with step logging...');
    console.log('📝 Prompt:', prompt);
    console.log('🆔 Image ID:', imageId || 'No image ID provided');
    
    // Generate image with step logging
    const imageUrl = await OpenAIService.generateImage(prompt, imageId);
    
    console.log('✅ Image generated successfully:', imageUrl);
    
    // If we have an imageId, check the logged steps
    let steps = [];
    if (imageId) {
      const { data: stepData } = await supabase
        .from('image_processing_steps')
        .select('*')
        .eq('image_id', imageId)
        .eq('step_type', 'image_generation')
        .order('created_at', { ascending: false })
        .limit(1);
      
      steps = stepData || [];
    }
    
    return NextResponse.json({
      success: true,
      message: 'Image generation completed successfully!',
      result: {
        imageUrl,
        prompt,
        imageId,
        stepsLogged: steps.length > 0,
        stepData: steps[0] || null
      }
    });
  } catch (error) {
    console.error('❌ Image generation test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Image generation test failed'
    }, { status: 500 });
  }
}

// GET /api/test-image-generation - Test with sample data
export async function GET() {
  try {
    // Create a test image record first
    const testImageId = `test-${Date.now()}`;
    const { data: testImage, error: imageError } = await supabase
      .from('images')
      .insert({
        id: testImageId,
        original_image_path: 'test/path.jpg',
        analysis_result: 'Test analysis for image generation',
        questions: JSON.stringify([]),
        answers: JSON.stringify([])
      })
      .select()
      .single();

    if (imageError) {
      console.error('Error creating test image:', imageError);
      return NextResponse.json({
        success: false,
        error: 'Failed to create test image'
      }, { status: 500 });
    }

    const testPrompt = 'A beautiful sunset over a mountain landscape, digital art style';
    
    console.log('🧪 Testing image generation with sample data...');
    console.log('🆔 Test Image ID:', testImage.id);
    
    // Generate image with step logging
    const imageUrl = await OpenAIService.generateImage(testPrompt, testImage.id);
    
    console.log('✅ Image generated successfully:', imageUrl);
    
    // Check the logged steps
    const { data: stepData } = await supabase
      .from('image_processing_steps')
      .select('*')
      .eq('image_id', testImage.id)
      .eq('step_type', 'image_generation')
      .order('created_at', { ascending: false })
      .limit(1);
    
    return NextResponse.json({
      success: true,
      message: 'Image generation test completed successfully!',
      result: {
        imageUrl,
        prompt: testPrompt,
        imageId: testImage.id,
        stepsLogged: stepData && stepData.length > 0,
        stepData: stepData?.[0] || null
      }
    });
  } catch (error) {
    console.error('❌ Image generation test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Image generation test failed'
    }, { status: 500 });
  }
}
