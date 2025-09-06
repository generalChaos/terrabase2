import { NextResponse } from 'next/server'
import { AnalysisFlowService } from '@/lib/analysisFlowService'

export async function GET() {
  try {
    const analysisFlows = await AnalysisFlowService.getAllAnalysisFlows()

    return NextResponse.json(analysisFlows)
  } catch (error) {
    console.error('Error in analysis flows API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
