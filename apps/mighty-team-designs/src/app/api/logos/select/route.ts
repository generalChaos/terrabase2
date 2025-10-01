import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { serviceManager } from '@/lib/services/serviceManager';
import { logError } from '@/lib/debug';

// Validation schemas
const SelectLogoSchema = z.object({
  flow_id: z.string().uuid(),
  logo_id: z.string().uuid()
});

// PUT /api/logos/select - Select a logo for a flow
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = SelectLogoSchema.parse(body);

    // Select the logo using the existing service method
    const selectedLogo = await serviceManager.logos.selectLogo(validatedData.flow_id, validatedData.logo_id);

    // Update the flow to mark as completed
    const flow = await serviceManager.flows.updateTeamDesignFlow(validatedData.flow_id, {
      current_step: 'completed'
    });

    return NextResponse.json({
      success: true,
      data: {
        flow_id: validatedData.flow_id,
        selected_logo_id: validatedData.logo_id,
        flow
      }
    });

  } catch (error) {
    await logError('system', 'api', 'Failed to select logo', error as Error);
    
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
