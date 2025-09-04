import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('Test new prompt system endpoint called');
    
    // Test fetching all prompt definitions
    const { data: allPrompts, error: promptsError } = await supabase
      .from('prompt_definitions')
      .select('*')
      .order('created_at', { ascending: true });

    if (promptsError) {
      throw new Error(`Failed to fetch prompts: ${promptsError.message}`);
    }

    console.log('All prompt definitions:', allPrompts?.length || 0);
    
    // Test fetching specific prompts
    const { data: imageAnalysisPrompt } = await supabase
      .from('prompt_definitions')
      .select('*')
      .eq('name', 'image_analysis')
      .single();

    const { data: questionsPrompt } = await supabase
      .from('prompt_definitions')
      .select('*')
      .eq('name', 'questions_generation')
      .single();

    const { data: imagePromptCreation } = await supabase
      .from('prompt_definitions')
      .select('*')
      .eq('name', 'image_prompt_creation')
      .single();
    
    // Test prompt system functionality
    const testResults = {
      total_prompts: allPrompts?.length || 0,
      active_prompts: allPrompts?.filter(p => p.active).length || 0,
      prompt_types: [...new Set(allPrompts?.map(p => p.type) || [])],
      prompts: allPrompts?.map(p => ({
        id: p.id,
        name: p.name,
        type: p.type,
        active: p.active,
        prompt_text_length: p.prompt_text.length,
        has_input_schema: !!p.input_schema,
        has_output_schema: !!p.output_schema,
        has_return_schema: !!p.return_schema,
        created_at: p.created_at
      })) || [],
      specific_prompts: {
        image_analysis: imageAnalysisPrompt ? {
          id: imageAnalysisPrompt.id,
          type: imageAnalysisPrompt.type,
          active: imageAnalysisPrompt.active,
          prompt_text_length: imageAnalysisPrompt.prompt_text.length,
          found: true
        } : { found: false },
        questions_generation: questionsPrompt ? {
          id: questionsPrompt.id,
          type: questionsPrompt.type,
          active: questionsPrompt.active,
          prompt_text_length: questionsPrompt.prompt_text.length,
          found: true
        } : { found: false },
        image_prompt_creation: imagePromptCreation ? {
          id: imagePromptCreation.id,
          type: imagePromptCreation.type,
          active: imagePromptCreation.active,
          prompt_text_length: imagePromptCreation.prompt_text.length,
          found: true
        } : { found: false }
      }
    };
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'New prompt system test completed successfully',
      results: testResults
    });

  } catch (error: unknown) {
    console.error('Test new prompt system error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
