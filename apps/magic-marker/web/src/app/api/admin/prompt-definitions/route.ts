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

// POST /api/admin/prompt-definitions - Create a new prompt definition
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type, prompt_text, active, input_schema, output_schema, return_schema, model, response_format, max_tokens, temperature, sort_order } = body

    if (!name || !type) {
      return NextResponse.json({ error: 'Name and type are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('prompt_definitions')
      .insert({
        name,
        type,
        prompt_text: prompt_text || '',
        active: active !== undefined ? active : true,
        input_schema: input_schema || {},
        output_schema: output_schema || {},
        return_schema: return_schema || {},
        model: model || 'gpt-4o',
        response_format: response_format || 'json_object',
        max_tokens: max_tokens || null,
        temperature: temperature || null,
        sort_order: sort_order || 1
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating prompt definition:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ prompt: data })
  } catch (error) {
    console.error('Error in prompt definitions create API:', error)
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
    const { id, name, prompt_text, active, input_schema, output_schema, return_schema, model, response_format, max_tokens, temperature } = body

    if (!id && !name) {
      return NextResponse.json({ error: 'Prompt ID or name is required' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (prompt_text !== undefined) updateData.prompt_text = prompt_text
    if (active !== undefined) updateData.active = active
    if (input_schema !== undefined) updateData.input_schema = input_schema
    if (output_schema !== undefined) updateData.output_schema = output_schema
    if (return_schema !== undefined) updateData.return_schema = return_schema
    if (body.sort_order !== undefined) updateData.sort_order = body.sort_order
    if (model !== undefined) updateData.model = model
    if (response_format !== undefined) updateData.response_format = response_format
    if (max_tokens !== undefined) updateData.max_tokens = max_tokens
    if (temperature !== undefined) updateData.temperature = temperature

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

// DELETE /api/admin/prompt-definitions - Delete a prompt definition
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'Prompt ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('prompt_definitions')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting prompt definition:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in prompt definitions delete API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
