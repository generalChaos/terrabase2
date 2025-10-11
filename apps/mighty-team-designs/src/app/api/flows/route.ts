import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { serviceManager } from '@/lib/services/serviceManager';
import { logError } from '@/lib/debug';

// Validation schemas
const CreateFlowSchema = z.object({
  team_name: z.string().min(1, 'Team name is required'),
  sport: z.string().min(1, 'Sport is required'),
  logo_style: z.string().min(1, 'Logo style is required'),
  debug_mode: z.boolean().optional().default(false)
});


// POST /api/flows - Create a new team design flow
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = CreateFlowSchema.parse(body);

    const flow = await serviceManager.flows.createTeamDesignFlow(validatedData);

    return NextResponse.json({
      success: true,
      data: flow
    });

  } catch (error) {
    await logError('system', 'api', 'Failed to create flow', error as Error);
    
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

