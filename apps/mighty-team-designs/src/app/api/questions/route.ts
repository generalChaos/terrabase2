import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { serviceManager } from '@/lib/services/serviceManager';
import { logError } from '@/lib/debug';

// Validation schemas
const GetQuestionsSchema = z.object({
  flow_id: z.string().uuid(),
  sport: z.string(),
  age_group: z.string()
});

// GET /api/questions - Get question set for a flow
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const validatedData = GetQuestionsSchema.parse({
      flow_id: searchParams.get('flow_id'),
      sport: searchParams.get('sport'),
      age_group: searchParams.get('age_group')
    });

    const questionSet = await serviceManager.flows.getQuestionsForFlow(
      validatedData.flow_id,
      validatedData.sport,
      validatedData.age_group
    );

    return NextResponse.json({
      success: true,
      data: questionSet
    });

  } catch (error) {
    await logError('system', 'api', 'Failed to get questions', error as Error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}