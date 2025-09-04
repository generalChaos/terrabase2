import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST /api/fix-prompts-v2 - Fix the prompt definitions with correct content
export async function POST() {
  try {
    console.log('🔧 Fixing prompt definitions with correct content...');

    // Fix questions_generation - should generate questions array
    const { error: error1 } = await supabase
      .from('prompt_definitions')
      .update({
        prompt_text: 'Based on the image analysis provided, generate exactly 8 creative questions that will help create an artistic image prompt. Return ONLY JSON with this exact schema:\n\n{\n  "questions": [\n    {\n      "id": "unique_id_1",\n      "text": "question text",\n      "type": "multiple_choice",\n      "options": ["option1", "option2", "option3", "option4"],\n      "required": true\n    }\n  ]\n}\n\nRules:\n- Generate exactly 8 questions\n- Each question must have exactly 4 multiple choice options\n- Questions should be about artistic style, mood, composition, colors, etc.\n- required is always true\n- No extra keys. No preamble. No markdown. Only JSON.',
        return_schema: {
          type: 'object',
          properties: {
            questions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  text: { type: 'string' },
                  type: { type: 'string', enum: ['multiple_choice'] },
                  options: { 
                    type: 'array', 
                    items: { type: 'string' },
                    minItems: 2,
                    maxItems: 6
                  },
                  required: { type: 'boolean' }
                },
                required: ['id', 'text', 'type', 'options', 'required']
              },
              minItems: 3,
              maxItems: 15
            },
            response: { type: 'string' }
          },
          required: ['questions']
        }
      })
      .eq('name', 'questions_generation');

    if (error1) {
      console.error('Error fixing questions_generation:', error1);
      return NextResponse.json({ success: false, error: error1.message }, { status: 500 });
    }

    // Fix image_text_analysis - should analyze image with text prompt
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
        }
      })
      .eq('name', 'image_text_analysis');

    if (error2) {
      console.error('Error fixing image_text_analysis:', error2);
      return NextResponse.json({ success: false, error: error2.message }, { status: 500 });
    }

    console.log('✅ Prompts fixed with correct content!');

    return NextResponse.json({
      success: true,
      message: 'Prompt definitions fixed with correct content!'
    });
  } catch (error) {
    console.error('❌ Error fixing prompts:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
