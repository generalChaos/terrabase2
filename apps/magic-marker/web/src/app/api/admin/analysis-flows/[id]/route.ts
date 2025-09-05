import { NextRequest, NextResponse } from 'next/server'
import { AnalysisFlowService } from '@/lib/analysisFlowService'

// PATCH /api/admin/analysis-flows/[id] - Update analysis flow
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

    // Get the current flow
    const currentFlow = await AnalysisFlowService.getAnalysisFlow(id)
    if (!currentFlow) {
      return NextResponse.json({ 
        success: false, 
        error: 'Analysis flow not found' 
      }, { status: 404 });
    }

    // Update the flow
    const updatedFlow = await AnalysisFlowService.updateAnalysisFlow(id, {
      // Only update is_active status
    })

    // Deactivate if needed
    if (!is_active) {
      await AnalysisFlowService.deactivateAnalysisFlow(id)
    }

    return NextResponse.json({
      success: true,
      analysisFlow: updatedFlow
    });

  } catch (error: unknown) {
    console.error('Error in analysis flow update API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// GET /api/admin/analysis-flows/[id] - Get specific analysis flow
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    const analysisFlow = await AnalysisFlowService.getAnalysisFlow(id)
    if (!analysisFlow) {
      return NextResponse.json({ 
        success: false, 
        error: 'Analysis flow not found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      analysisFlow
    });

  } catch (error: unknown) {
    console.error('Error in analysis flow get API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
