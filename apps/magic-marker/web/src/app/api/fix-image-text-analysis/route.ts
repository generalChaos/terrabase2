import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST /api/fix-image-text-analysis - Fix the image_text_analysis prompt properly
export async function POST() {
  try {
    console.log('🔧 Fixing image_text_analysis prompt properly...');

    const { error } = await supabase
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
        }
      })
      .eq('name', 'image_text_analysis');

    if (error) {
      console.error('Error fixing image_text_analysis:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    console.log('✅ image_text_analysis prompt fixed!');

    return NextResponse.json({
      success: true,
      message: 'image_text_analysis prompt fixed successfully!'
    });
  } catch (error) {
    console.error('❌ Error fixing image_text_analysis:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
