import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { serviceManager } from '@/lib/services/serviceManager';
import { logError } from '@/lib/debug';

// Validation schemas
const GenerateQuestionsSchema = z.object({
  flow_id: z.string().uuid(),
  team_name: z.string(),
  sport: z.string(),
  age_group: z.string(),
  round1_answers: z.object({
    team_name: z.string(),
    sport: z.string(),
    age_group: z.string()
  })
});

// POST /api/questions/generate - Generate questions for a flow
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = GenerateQuestionsSchema.parse(body);

    // Generate questions using the service
    const questionSet = await serviceManager.questions.generateQuestionsForFlow(
      validatedData.flow_id,
      validatedData.team_name,
      validatedData.sport,
      validatedData.age_group
    );

    return NextResponse.json({
      success: true,
      data: {
        questions: questionSet.questions
      }
    });

  } catch (error) {
    await logError('system', 'api', 'Failed to generate questions', error as Error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
