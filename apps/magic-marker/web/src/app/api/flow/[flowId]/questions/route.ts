import { NextRequest } from 'next/server';
import { ImageFlowService } from '@/lib/imageFlowService';
import { ApiUtils } from '@/lib/apiUtils';

// POST /api/flow/[flowId]/questions - Generate questions based on analysis
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ flowId: string }> }
) {
  try {
    const { flowId } = await params;

    if (!flowId) {
      return ApiUtils.validationError('Flow ID is required');
    }

    // Use ImageFlowService to generate questions
    const result = await ImageFlowService.generateQuestions(flowId);

    if (!result.success) {
      return ApiUtils.validationError(result.error || 'Questions generation failed');
    }

    return ApiUtils.success({
      success: true,
      questions: result.questions,
      flowId: flowId,
      message: 'Questions generated successfully'
    });

  } catch (error) {
    console.error('Questions generation error:', error);
    
    let errorMessage = 'Questions generation failed';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return ApiUtils.internalError(errorMessage);
  }
}
