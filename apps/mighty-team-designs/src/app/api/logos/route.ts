import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { serviceManager } from '@/lib/services/serviceManager';
import { logError } from '@/lib/debug';

// Validation schemas
const GenerateLogoSchema = z.object({
  flow_id: z.string().uuid(),
  team_name: z.string(),
  sport: z.string(),
  age_group: z.string(),
  round1_answers: z.record(z.any()),
  round2_answers: z.array(z.any()),
  variant_count: z.number().min(1).max(3).optional().default(1)
});

// POST /api/logos/generate - Generate team logo(s)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = GenerateLogoSchema.parse(body);

    // Generate logos using the service layer
    const generatedLogos = await serviceManager.flows.generateLogosForFlow(
      validatedData.flow_id,
      validatedData.variant_count
    );

    return NextResponse.json({
      success: true,
      data: {
        flow_id: validatedData.flow_id,
        logos: generatedLogos,
        selected_logo_id: generatedLogos[0].id,
        generation_time_ms: generatedLogos.reduce((sum, logo) => sum + logo.generation_time_ms, 0)
      }
    });

  } catch (error) {
    console.error('Error in POST /api/logos/generate:', error);
    
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