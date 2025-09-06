import { NextResponse } from 'next/server'
import { AnalysisFlowService } from '@/lib/analysisFlowService'
import { ImageService } from '@/lib/imageService'

// GET /api/admin/analysis-flows - Get all analysis flows with image paths
export async function GET() {
  try {
    const analysisFlows = await AnalysisFlowService.getAllAnalysisFlows()

    // Enhance flows with image paths
    const enhancedFlows = await Promise.all(
      analysisFlows.map(async (flow) => {
        const enhancedFlow = { ...flow }
        
        // Get original image path
        if (flow.original_image_id) {
          try {
            const originalImage = await ImageService.getImage(flow.original_image_id)
            if (originalImage) {
              enhancedFlow.original_image_path = originalImage.file_path
            }
          } catch (error) {
            console.warn('Failed to fetch original image path:', error)
          }
        }
        
        // Get final image path
        if (flow.final_image_id) {
          try {
            const finalImage = await ImageService.getImage(flow.final_image_id)
            if (finalImage) {
              enhancedFlow.final_image_path = finalImage.file_path
            }
          } catch (error) {
            console.warn('Failed to fetch final image path:', error)
          }
        }
        
        return enhancedFlow
      })
    )

    return NextResponse.json(enhancedFlows)
  } catch (error) {
    console.error('Error in analysis flows API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
