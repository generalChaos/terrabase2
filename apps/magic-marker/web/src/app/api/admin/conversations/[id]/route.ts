import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const { is_active } = body

    if (is_active === undefined) {
      return NextResponse.json({ 
        success: false, 
        error: 'is_active field is required' 
      }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('analysis_flows')
      .update({ is_active })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating analysis flow:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update analysis flow' 
      }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ 
        success: false, 
        error: 'Analysis flow not found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      analysisFlow: data
    });

  } catch (error: unknown) {
    console.error('Error in analysis flow update API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
