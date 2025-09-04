import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST /api/fix-prompts - Fix the prompt definitions directly
export async function POST() {
  try {
    console.log('🔧 Fixing prompt definitions...');

    // Fix image_prompt_creation
    const { error: error1 } = await supabase
      .from('prompt_definitions')
      .update({
        prompt_text: 'Based on these questions and answers, create a detailed image generation prompt for DALL-E 3.',
        return_schema: {
          type: 'object',
          properties: {
            prompt: { type: 'string', minLength: 20 },
            response: { type: 'string' }
          },
          required: ['prompt']
        },
        response_format: 'json_object'
      })
      .eq('name', 'image_prompt_creation');

    if (error1) {
      console.error('Error fixing image_prompt_creation:', error1);
      return NextResponse.json({ success: false, error: error1.message }, { status: 500 });
    }

    // Fix image_text_analysis
    const { error: error2 } = await supabase
      .from('prompt_definitions')
      .update({
        prompt_text: 'You are an expert image analyst. Analyze the provided image based on the given text prompt and context.\n\nImage: {image}\nText Prompt: {text}\nContext: {context}\nInstructions: {instructions}\n\nProvide a detailed analysis that addresses the text prompt while considering the visual elements in the image. Focus on:\n- Visual composition and elements\n- Artistic interpretation\n- Technical aspects if relevant\n- Any specific requirements from the text prompt\n\nBe thorough, insightful, and provide actionable insights.',
        return_schema: {
          type: 'object',
          properties: {
            analysis: { type: 'string', minLength: 10 },
            response: { type: 'string' }
          },
          required: ['analysis']
        },
        response_format: 'json_object'
      })
      .eq('name', 'image_text_analysis');

    if (error2) {
      console.error('Error fixing image_text_analysis:', error2);
      return NextResponse.json({ success: false, error: error2.message }, { status: 500 });
    }

    console.log('✅ Prompts fixed successfully!');

    return NextResponse.json({
      success: true,
      message: 'Prompt definitions fixed successfully!'
    });
  } catch (error) {
    console.error('❌ Error fixing prompts:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
