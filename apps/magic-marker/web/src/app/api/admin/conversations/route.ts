import { NextResponse } from 'next/server'
import { ImageFlowService } from '@/lib/imageFlowService'

export async function GET() {
  try {
    const analysisFlows = await ImageFlowService.getAllAnalysisFlows()

    return NextResponse.json(analysisFlows)
  } catch (error) {
    console.error('Error in analysis flows API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
