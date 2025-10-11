import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { enhancedTeamDesignService } from '@/lib/services/enhancedTeamDesignService';

const PlayerSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  number: z.string(),
});

const AssetPackSchema = z.object({
  id: z.string().optional(),
  clean_logo_url: z.string().optional(),
  tshirt_front_url: z.string().optional(),
  tshirt_back_url: z.string().optional(),
  banner_url: z.string().optional(),
  processing_time_ms: z.number().optional(),
  colors: z.object({
    colors: z.array(z.string()),
    frequencies: z.array(z.number()),
    percentages: z.array(z.number()),
    total_pixels_analyzed: z.number()
  }).optional()
}).optional();

const TeamLogoSchema = z.object({
  id: z.string(),
  variant_number: z.number(),
  public_url: z.string(),
  is_selected: z.boolean().optional(),
  generation_prompt: z.string().optional(),
  model_used: z.string().optional(),
  generation_time_ms: z.number().optional(),
  generation_cost_usd: z.number().optional(),
  asset_pack: AssetPackSchema
});

const UpdateFlowSchema = z.object({
  contact_email: z.string().email().optional(),
  contact_phone: z.string().min(10).optional(),
  player_roster: z.array(PlayerSchema).optional(),
  status: z.enum(['pending', 'generating', 'completed', 'failed']).optional(),
  team_logos: z.array(TeamLogoSchema).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: flowId } = await params;
    console.log('🔄 Flows API: Received GET request for flow:', flowId);
    
    // Get the flow data
    const flow = await enhancedTeamDesignService.getFlowById(flowId);
    
    if (!flow) {
      console.log('❌ Flows API: Flow not found:', flowId);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Flow not found' 
        },
        { status: 404 }
      );
    }

    console.log('✅ Flows API: Flow retrieved successfully:', flow.id);
    
    return NextResponse.json({
      success: true,
      data: flow
    });

  } catch (error) {
    console.error('❌ Flows API GET Error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve flow',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: flowId } = await params;
    console.log('🔄 Flows API: Received PATCH request for flow:', flowId);
    const body = await request.json();
    console.log('🔄 Flows API: Request body:', body);
    
    // Validate the request body
    const validatedData = UpdateFlowSchema.parse(body);
    console.log('🔄 Flows API: Validated data:', validatedData);
    
    // Update the flow with the new data
    console.log('🔄 Flows API: Calling updateFlow...');
    const updatedFlow = await enhancedTeamDesignService.updateFlow(flowId, validatedData);
    console.log('🔄 Flows API: Update successful:', updatedFlow);
    
    return NextResponse.json({
      success: true,
      flow: updatedFlow
    });
    
  } catch (error) {
    console.error('❌ Flows API Error:', error);
    
    if (error instanceof z.ZodError) {
      console.error('❌ Validation error:', error.errors);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request data',
          details: error.errors 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update flow',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}