import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { logDebug } from '@/lib/debug';

// Validation schemas
const CreateFlowSchema = z.object({
  team_name: z.string().min(1, 'Team name is required'),
  sport: z.string().min(1, 'Sport is required'),
  age_group: z.string().min(1, 'Age group is required'),
  debug_mode: z.boolean().optional().default(false)
});


// POST /api/flows - Create a new team design flow
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = CreateFlowSchema.parse(body);

    // Generate a new session ID for anonymous tracking
    const userSessionId = uuidv4();

    const flowData = {
      user_session_id: userSessionId,
      team_name: validatedData.team_name,
      sport: validatedData.sport,
      age_group: validatedData.age_group,
      round1_answers: {
        team_name: validatedData.team_name,
        sport: validatedData.sport,
        age_group: validatedData.age_group
      },
      round2_questions: [],
      round2_answers: [],
      logo_variants: [],
      current_step: 'round1' as const,
      debug_mode: validatedData.debug_mode,
      is_active: true
    };

    const { data: flow, error } = await supabase
      .from('team_design_flows')
      .insert(flowData)
      .select()
      .single();

    if (error) {
      console.error('Error creating flow:', error);
      return NextResponse.json(
        { error: 'Failed to create team design flow' },
        { status: 500 }
      );
    }

    // Log debug information if enabled
    if (validatedData.debug_mode) {
      await logDebug(flow.id, 'info', 'flow_creation', 'Team design flow created', {
        team_name: validatedData.team_name,
        sport: validatedData.sport,
        age_group: validatedData.age_group
      });
    }

    return NextResponse.json({
      success: true,
      data: flow
    });

  } catch (error) {
    console.error('Error in POST /api/flows:', error);
    
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

