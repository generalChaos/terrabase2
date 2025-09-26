import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { ImageGenerationService } from '@/lib/services/imageGenerationService';
import { logDebug } from '@/lib/debug';

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

    // Extract answers for prompt generation
    const style = validatedData.round2_answers.find(a => a.id === 'style')?.selected || 0;
    const colors = validatedData.round2_answers.find(a => a.id === 'colors')?.selected || 0;
    const mascot = validatedData.round2_answers.find(a => a.id === 'mascot')?.selected || 0;

    // Get the options for each answer
    const styleOptions = validatedData.round2_answers.find(a => a.id === 'style')?.options || ['Fun', 'Professional', 'Tough', 'Friendly'];
    const colorOptions = validatedData.round2_answers.find(a => a.id === 'colors')?.options || ['Team colors', 'Custom colors', 'Classic colors'];
    const mascotOptions = validatedData.round2_answers.find(a => a.id === 'mascot')?.options || ['Yes', 'No', 'Text only'];

    // Generate logos using the image generation service
    const generatedLogos = await ImageGenerationService.generateLogos(validatedData.flow_id, {
      teamName: validatedData.team_name,
      sport: validatedData.sport,
      ageGroup: validatedData.age_group,
      style: styleOptions[style],
      colors: colorOptions[colors],
      mascot: mascotOptions[mascot],
      variantCount: validatedData.variant_count
    });

    // Update the flow with logo data
    const { data: updatedFlow, error: updateError } = await supabase
      .from('team_design_flows')
      .update({
        logo_variants: generatedLogos,
        selected_logo_id: generatedLogos[0].id,
        logo_generated_at: new Date().toISOString(),
        current_step: 'completed'
      })
      .eq('id', validatedData.flow_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating flow with logo data:', updateError);
      return NextResponse.json(
        { error: 'Failed to update flow with logo data' },
        { status: 500 }
      );
    }

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