import { NextResponse } from 'next/server';
import { ImageService } from '@/lib/imageService';
import { AnalysisFlowService } from '@/lib/analysisFlowService';

// GET /api/images - Get all images with their analysis flows
export async function GET() {
  try {
    // Get all images
    const images = await ImageService.getAllImages();
    
    // Get all analysis flows
    const analysisFlows = await AnalysisFlowService.getAllAnalysisFlows();
    
    // Create a map of analysis flows by original image ID
    const flowsByImageId = new Map();
    analysisFlows.forEach(flow => {
      flowsByImageId.set(flow.original_image_id, flow);
    });

    // Create a map of final images by ID
    const finalImagesByFlowId = new Map();
    for (const flow of analysisFlows) {
      if (flow.final_image_id) {
        const finalImage = await ImageService.getImage(flow.final_image_id);
        if (finalImage) {
          finalImagesByFlowId.set(flow.original_image_id, finalImage.file_path);
        }
      }
    }

    // Combine images with their analysis flows
    const imagesWithFlows = images.map(image => {
      const flow = flowsByImageId.get(image.id);
      return {
        id: image.id,
        originalImagePath: image.file_path,
        analysisResult: image.analysis_result,
        questions: flow?.questions || [],
        answers: flow?.answers || [],
        finalImagePath: finalImagesByFlowId.get(image.id) || null,
        createdAt: new Date(image.created_at),
        updatedAt: new Date(image.updated_at),
        // New fields from analysis flows
        sessionId: flow?.session_id,
        totalQuestions: flow?.total_questions || 0,
        totalAnswers: flow?.total_answers || 0,
        currentStep: flow?.current_step,
        totalCostUsd: flow?.total_cost_usd || 0,
        totalTokens: flow?.total_tokens || 0,
        isActive: flow?.is_active || false
      };
    });

    return NextResponse.json(imagesWithFlows);
  } catch (err) {
    console.error('Route error:', err);
    return NextResponse.json({ error: 'Failed to retrieve images' }, { status: 500 });
  }
}
