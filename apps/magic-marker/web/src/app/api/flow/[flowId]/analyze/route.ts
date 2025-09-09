import { NextRequest } from 'next/server';
import { ImageFlowService } from '@/lib/imageFlowService';
import { ApiUtils } from '@/lib/apiUtils';

// POST /api/flow/[flowId]/analyze - Analyze uploaded image
export async function POST(
  request: NextRequest,
  { params }: { params: { flowId: string } }
) {
  try {
    const { flowId } = params;

    if (!flowId) {
      return ApiUtils.validationError('Flow ID is required');
    }

    // Use ImageFlowService to analyze the image
    const result = await ImageFlowService.analyzeImage(flowId);

    if (!result.success) {
      return ApiUtils.validationError(result.error || 'Analysis failed');
    }

    return ApiUtils.success({
      success: true,
      analysis: result.analysis,
      flowId: flowId,
      message: 'Image analyzed successfully'
    });

  } catch (error) {
    console.error('Flow analysis error:', error);
    
    let errorMessage = 'Analysis failed';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return ApiUtils.internalError(errorMessage);
  }
}
