import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { serviceManager } from '@/lib/services/serviceManager';
import { logError } from '@/lib/debug';

// Validation schemas
const GenerateColorsMascotsSchema = z.object({
  flow_id: z.string().uuid(),
  team_name: z.string(),
  sport: z.string(),
  logo_style: z.string(),
  round1_answers: z.object({
    team_name: z.string(),
    sport: z.string(),
    logo_style: z.string()
  })
});

// POST /api/ai/colors-mascots - Generate colors and mascots for a flow
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = GenerateColorsMascotsSchema.parse(body);

    // Generate colors and mascots using the service
    const result = await serviceManager.questions.generateColorsAndMascotsForFlow(
      validatedData.flow_id,
      validatedData.team_name,
      validatedData.sport,
      validatedData.logo_style
    );

    return NextResponse.json({
      success: true,
      data: {
        colors: result.colors,
        mascots: result.mascots
      }
    });

  } catch (error) {
    await logError('system', 'api', 'Failed to generate colors and mascots', error as Error);
    
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

