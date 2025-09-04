import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST /api/clean-prompt-texts - Remove hardcoded schemas from prompt texts
export async function POST() {
  try {
    console.log('🧹 Cleaning prompt texts...');

    // Clean image_analysis
    const { error: error1 } = await supabase
      .from('prompt_definitions')
      .update({
        prompt_text: 'Analyze this image and provide a detailed description of what you see. Focus on the visual elements, composition, colors, and any notable features.'
      })
      .eq('name', 'image_analysis');

    if (error1) {
      console.error('Error cleaning image_analysis:', error1);
      return NextResponse.json({ success: false, error: error1.message }, { status: 500 });
    }

    // Clean questions_generation
    const { error: error2 } = await supabase
      .from('prompt_definitions')
      .update({
        prompt_text: 'Based on the image analysis provided, generate creative questions that will help create an artistic image prompt. Generate exactly 8 questions about artistic style, mood, composition, colors, and other visual elements. Each question should have 4 multiple choice options.'
      })
      .eq('name', 'questions_generation');

    if (error2) {
      console.error('Error cleaning questions_generation:', error2);
      return NextResponse.json({ success: false, error: error2.message }, { status: 500 });
    }

    // Clean conversational_question
    const { error: error3 } = await supabase
      .from('prompt_definitions')
      .update({
        prompt_text: 'Based on the image analysis and previous answers, generate a follow-up question that will help refine the artistic vision. Consider the conversation context and previous responses to create a meaningful next question.'
      })
      .eq('name', 'conversational_question');

    if (error3) {
      console.error('Error cleaning conversational_question:', error3);
      return NextResponse.json({ success: false, error: error3.message }, { status: 500 });
    }

    // Clean image_prompt_creation
    const { error: error4 } = await supabase
      .from('prompt_definitions')
      .update({
        prompt_text: 'Based on the questions and answers provided, create a detailed artistic image prompt that captures the desired style, mood, and visual elements. The prompt should be specific and descriptive for image generation.'
      })
      .eq('name', 'image_prompt_creation');

    if (error4) {
      console.error('Error cleaning image_prompt_creation:', error4);
      return NextResponse.json({ success: false, error: error4.message }, { status: 500 });
    }

    // Clean text_processing
    const { error: error5 } = await supabase
      .from('prompt_definitions')
      .update({
        prompt_text: 'Process the provided text according to the given instructions and context. Apply any requested formatting, analysis, or transformation to the text.'
      })
      .eq('name', 'text_processing');

    if (error5) {
      console.error('Error cleaning text_processing:', error5);
      return NextResponse.json({ success: false, error: error5.message }, { status: 500 });
    }

    // Clean image_text_analysis
    const { error: error6 } = await supabase
      .from('prompt_definitions')
      .update({
        prompt_text: 'Analyze the provided image based on the given text prompt and context. Provide a detailed analysis that addresses the text prompt while considering the visual elements in the image. Focus on visual composition, artistic interpretation, and any specific requirements from the text prompt.'
      })
      .eq('name', 'image_text_analysis');

    if (error6) {
      console.error('Error cleaning image_text_analysis:', error6);
      return NextResponse.json({ success: false, error: error6.message }, { status: 500 });
    }

    console.log('✅ All prompt texts cleaned!');

    return NextResponse.json({
      success: true,
      message: 'All prompt texts cleaned successfully!'
    });
  } catch (error) {
    console.error('❌ Error cleaning prompt texts:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
