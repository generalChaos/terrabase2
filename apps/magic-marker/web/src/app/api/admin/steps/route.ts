import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/admin/steps - Get processing steps for a flow
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const flowId = searchParams.get('flowId')

    if (!flowId) {
      return NextResponse.json({ 
        error: 'flowId parameter is required' 
      }, { status: 400 })
    }

    const { data: steps, error } = await supabase
      .from('image_processing_steps')
      .select('*')
      .eq('flow_id', flowId)
      .order('step_order', { ascending: true })

    if (error) {
      console.error('Error fetching processing steps:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch processing steps' 
      }, { status: 500 })
    }

    return NextResponse.json({ steps: steps || [] })
  } catch (error) {
    console.error('Error in steps API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}