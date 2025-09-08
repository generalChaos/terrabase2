import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('🔍 [DEBUG] Testing database connection and prompt definitions...')
    
    // Test database connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('prompt_definitions')
      .select('count')
      .limit(1)
    
    if (connectionError) {
      throw new Error(`Database connection failed: ${connectionError.message}`)
    }
    
    // Get all prompt definitions
    const { data: prompts, error: promptsError } = await supabase
      .from('prompt_definitions')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true })
    
    if (promptsError) {
      throw new Error(`Failed to fetch prompts: ${promptsError.message}`)
    }
    
    // Get specific questions_generation prompt
    const { data: questionsPrompt, error: questionsError } = await supabase
      .from('prompt_definitions')
      .select('*')
      .eq('name', 'questions_generation')
      .eq('active', true)
      .single()
    
    if (questionsError) {
      throw new Error(`Failed to fetch questions_generation prompt: ${questionsError.message}`)
    }
    
    return NextResponse.json({
      success: true,
      database: {
        connected: true,
        totalPrompts: prompts?.length || 0,
        activePrompts: prompts?.filter(p => p.active).length || 0
      },
      questions_generation: {
        model: questionsPrompt?.model,
        promptLength: questionsPrompt?.prompt_text?.length || 0,
        promptPreview: questionsPrompt?.prompt_text?.substring(0, 200) + '...',
        outputSchema: questionsPrompt?.output_schema,
        inputSchema: questionsPrompt?.input_schema
      },
      allPrompts: prompts?.map(p => ({
        name: p.name,
        type: p.type,
        model: p.model,
        active: p.active,
        sortOrder: p.sort_order
      })) || []
    })
  } catch (error) {
    console.error('❌ [DEBUG] Database test failed:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        database: { connected: false }
      },
      { status: 500 }
    )
  }
}
