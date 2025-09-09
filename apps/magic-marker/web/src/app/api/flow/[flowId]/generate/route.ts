import { NextRequest } from 'next/server';
import { ImageFlowService } from '@/lib/imageFlowService';
import { ApiUtils } from '@/lib/apiUtils';
import { QuestionAnswer } from '@/lib/types';

// POST /api/flow/[flowId]/generate - Generate final image based on answers
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ flowId: string }> }
) {
  try {
    const { flowId } = await params;
    const body = await request.json();
    const { answers } = body;

    if (!flowId) {
      return ApiUtils.validationError('Flow ID is required');
    }

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return ApiUtils.validationError('Answers array is required');
    }

    // Validate answers structure
    for (const answer of answers) {
      if (!answer.questionId || !answer.answer) {
        return ApiUtils.validationError('Each answer must have questionId and answer fields');
      }
    }

    // Use ImageFlowService to generate final image
    const result = await ImageFlowService.generateFinalImage(flowId, answers as QuestionAnswer[]);

    if (!result.success) {
      return ApiUtils.validationError(result.error || 'Image generation failed');
    }

    return ApiUtils.success({
      success: true,
      finalImagePath: result.finalImagePath,
      flowId: result.flowId,
      message: 'Final image generated successfully'
    });

  } catch (error) {
    console.error('Image generation error:', error);
    
    let errorMessage = 'Image generation failed';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return ApiUtils.internalError(errorMessage);
  }
}
