import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/debug-prompt - Debug the questions_generation prompt
export async function GET() {
  try {
    console.log('🔍 Debugging questions_generation prompt...');
    
    // Get the full prompt definition
    const { data, error } = await supabase
      .from('prompt_definitions')
      .select('*')
      .eq('name', 'questions_generation')
      .single();
    
    if (error) {
      console.error('❌ Error querying prompt:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }
    
    console.log('✅ Prompt definition found:', data);
    
    return NextResponse.json({
      success: true,
      prompt: {
        name: data.name,
        type: data.type,
        prompt_text: data.prompt_text,
        input_schema: data.input_schema,
        output_schema: data.output_schema,
        model: data.model,
        response_format: data.response_format
      }
    });
  } catch (error) {
    console.error('❌ Debug failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
