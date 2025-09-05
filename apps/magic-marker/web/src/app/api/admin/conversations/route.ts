import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: analysisFlows, error } = await supabase
      .from('analysis_flows')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching analysis flows:', error)
      return NextResponse.json(
        { error: 'Failed to fetch analysis flows' },
        { status: 500 }
      )
    }

    return NextResponse.json(analysisFlows)
  } catch (error) {
    console.error('Error in analysis flows API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
