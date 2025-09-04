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
    const { id, prompt_text, active } = body

    if (!id) {
      return NextResponse.json({ error: 'Prompt ID is required' }, { status: 400 })
    }

    const updateData: any = {}
    if (prompt_text !== undefined) updateData.prompt_text = prompt_text
    if (active !== undefined) updateData.active = active

    const { data, error } = await supabase
      .from('prompt_definitions')
      .update(updateData)
      .eq('id', id)
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
