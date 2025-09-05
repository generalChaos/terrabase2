import { NextRequest, NextResponse } from 'next/server';
import { ImageService } from '@/lib/imageService';
import { AnalysisFlowService } from '@/lib/analysisFlowService';

// GET /api/images/[id] - Get specific image with its analysis flow
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get the image
    const image = await ImageService.getImage(id);
    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Get the analysis flow for this image
    const analysisFlow = await AnalysisFlowService.getActiveAnalysisFlow(id);
    
    // Get final image if it exists
    let finalImagePath = null;
    if (analysisFlow?.final_image_id) {
      const finalImage = await ImageService.getImage(analysisFlow.final_image_id);
      finalImagePath = finalImage?.file_path || null;
    }

    const imageWithFlow = {
      id: image.id,
      originalImagePath: image.file_path,
      analysisResult: image.analysis_result,
      questions: analysisFlow?.questions || [],
      answers: analysisFlow?.answers || [],
      finalImagePath: finalImagePath,
      createdAt: new Date(image.created_at),
      updatedAt: new Date(image.updated_at),
      // New fields from analysis flows
      sessionId: analysisFlow?.session_id,
      totalQuestions: analysisFlow?.total_questions || 0,
      totalAnswers: analysisFlow?.total_answers || 0,
      currentStep: analysisFlow?.current_step,
      totalCostUsd: analysisFlow?.total_cost_usd || 0,
      totalTokens: analysisFlow?.total_tokens || 0,
      isActive: analysisFlow?.is_active || false
    };

    return NextResponse.json(imageWithFlow);
  } catch (err) {
    console.error('Route error:', err);
    return NextResponse.json({ error: 'Failed to retrieve image' }, { status: 500 });
  }
}
