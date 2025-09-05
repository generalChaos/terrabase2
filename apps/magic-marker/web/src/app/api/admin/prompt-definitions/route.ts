import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/admin/prompt-definitions - Get all prompt definitions
export async function GET() {
  try {
    const { data: prompts, error } = await supabase
      .from('prompt_definitions')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching prompt definitions:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ prompts })
  } catch (error) {
    console.error('Error in prompt definitions API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/prompt-definitions - Update a prompt definition
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, prompt_text, active, input_schema, output_schema, return_schema } = body

    if (!id && !name) {
      return NextResponse.json({ error: 'Prompt ID or name is required' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (prompt_text !== undefined) updateData.prompt_text = prompt_text
    if (active !== undefined) updateData.active = active
    if (input_schema !== undefined) updateData.input_schema = input_schema
    if (output_schema !== undefined) updateData.output_schema = output_schema
    if (return_schema !== undefined) updateData.return_schema = return_schema

    const query = supabase
      .from('prompt_definitions')
      .update(updateData)
    
    if (id) {
      query.eq('id', id)
    } else if (name) {
      query.eq('name', name)
    }

    const { data, error } = await query
      .select()
      .single()

    if (error) {
      console.error('Error updating prompt definition:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ prompt: data })
  } catch (error) {
    console.error('Error in prompt definitions update API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
