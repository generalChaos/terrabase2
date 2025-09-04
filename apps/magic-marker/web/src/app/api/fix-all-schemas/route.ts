import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST /api/fix-all-schemas - Fix all prompt schemas properly
export async function POST() {
  try {
    console.log('🔧 Fixing all prompt schemas properly...');

    // Fix image_analysis
    const { error: error1 } = await supabase
      .from('prompt_definitions')
      .update({
        input_schema: {
          type: 'object',
          properties: {
            image: { type: 'string' },
            context: { type: 'string' },
            analysis_type: { type: 'string', enum: ['general', 'artistic', 'technical', 'child_drawing'] },
            focus_areas: { type: 'array', items: { type: 'string' } },
            user_instructions: { type: 'string' }
          },
          required: ['image']
        },
        output_schema: {
          type: 'object',
          properties: {
            analysis: { type: 'string', minLength: 10 },
            response: { type: 'string' },
            confidence_score: { type: 'number', minimum: 0, maximum: 1 },
            identified_elements: { type: 'array', items: { type: 'string' } },
            artistic_notes: { type: 'string' },
            technical_notes: { type: 'string' }
          },
          required: ['analysis']
        },
        return_schema: {
          type: 'object',
          properties: {
            analysis: { type: 'string' },
            response: { type: 'string' }
          },
          required: ['analysis']
        },
        prompt_text: 'Analyze this image and describe what you see in 2-3 sentences.'
      })
      .eq('name', 'image_analysis');

    if (error1) {
      console.error('Error fixing image_analysis:', error1);
      return NextResponse.json({ success: false, error: error1.message }, { status: 500 });
    }

    // Fix image_text_analysis
    const { error: error2 } = await supabase
      .from('prompt_definitions')
      .update({
        input_schema: {
          type: 'object',
          properties: {
            image: { type: 'string', description: 'Base64 encoded image' },
            text: { type: 'string', description: 'Text prompt or instruction' },
            context: { type: 'string', description: 'Additional context' },
            instructions: { type: 'string', description: 'Specific processing instructions' }
          },
          required: ['image', 'text']
        },
        output_schema: {
          type: 'object',
          properties: {
            analysis: { type: 'string', minLength: 10, description: 'Analysis result' },
            response: { type: 'string', description: 'Optional additional response' }
          },
          required: ['analysis']
        },
        return_schema: {
          type: 'object',
          properties: {
            analysis: { type: 'string', minLength: 10 },
            response: { type: 'string' }
          },
          required: ['analysis']
        },
        prompt_text: 'You are an expert image analyst. Analyze the provided image based on the given text prompt and context.\n\nImage: {image}\nText Prompt: {text}\nContext: {context}\nInstructions: {instructions}\n\nProvide a detailed analysis that addresses the text prompt while considering the visual elements in the image. Focus on:\n- Visual composition and elements\n- Artistic interpretation\n- Technical aspects if relevant\n- Any specific requirements from the text prompt\n\nBe thorough, insightful, and provide actionable insights.'
      })
      .eq('name', 'image_text_analysis');

    if (error2) {
      console.error('Error fixing image_text_analysis:', error2);
      return NextResponse.json({ success: false, error: error2.message }, { status: 500 });
    }

    console.log('✅ All schemas fixed properly!');

    return NextResponse.json({
      success: true,
      message: 'All prompt schemas fixed properly!'
    });
  } catch (error) {
    console.error('❌ Error fixing schemas:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
