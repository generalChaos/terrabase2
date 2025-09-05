import { NextRequest, NextResponse } from 'next/server'
import { AnalysisFlowService } from '@/lib/analysisFlowService'
import { ImageService } from '@/lib/imageService'

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

// GET /api/admin/analysis-flows/[id] - Get specific analysis flow with image paths
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

    // Enhance flow with image paths
    const enhancedFlow = { ...analysisFlow }
    
    // Get original image path
    if (analysisFlow.original_image_id) {
      try {
        const originalImage = await ImageService.getImage(analysisFlow.original_image_id)
        if (originalImage) {
          enhancedFlow.original_image_path = originalImage.file_path
        }
      } catch (error) {
        console.warn('Failed to fetch original image path:', error)
      }
    }
    
    // Get final image path
    if (analysisFlow.final_image_id) {
      try {
        const finalImage = await ImageService.getImage(analysisFlow.final_image_id)
        if (finalImage) {
          enhancedFlow.final_image_path = finalImage.file_path
        }
      } catch (error) {
        console.warn('Failed to fetch final image path:', error)
      }
    }

    return NextResponse.json(enhancedFlow);

  } catch (error: unknown) {
    console.error('Error in analysis flow get API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
