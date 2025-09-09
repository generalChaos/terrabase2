import { NextRequest, NextResponse } from 'next/server';
import { ImageFlowService } from '@/lib/imageFlowService';
import { ApiUtils } from '@/lib/apiUtils';

// POST /api/flow/[flowId]/deactivate - Deactivate analysis flow
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ flowId: string }> }
) {
  try {
    const { flowId } = await params;

    if (!flowId) {
      return ApiUtils.validationError('Flow ID is required');
    }

    // Deactivate the analysis flow
    await ImageFlowService.deactivateAnalysisFlow(flowId);

    return ApiUtils.success({
      success: true,
      flowId,
      message: 'Analysis flow deactivated successfully'
    });

  } catch (error) {
    console.error('Flow deactivation error:', error);
    
    let errorMessage = 'Failed to deactivate flow';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return ApiUtils.internalError(errorMessage);
  }
}
