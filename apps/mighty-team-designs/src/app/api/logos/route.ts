import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { serviceManager } from '@/lib/services/serviceManager';
import { ImageGenerationService } from '@/lib/services/imageGenerationService';
import { logError } from '@/lib/debug';

// Validation schemas
const GenerateLogoSchema = z.object({
  flow_id: z.string().uuid(),
  team_name: z.string(),
  sport: z.string(),
  logo_style: z.string(),
  colors: z.string(),
  mascot: z.string(),
  custom_colors: z.string().optional(),
  mascot_type: z.string().optional(),
  variant_count: z.number().min(1).max(3).optional().default(1)
});

// POST /api/logos/generate - Generate team logo(s)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = GenerateLogoSchema.parse(body);

    // Use the direct color and mascot descriptions from the frontend
    const colorDescription = validatedData.colors;
    const mascotDescription = validatedData.mascot;
    const customColors = validatedData.custom_colors || '';
    const mascotType = validatedData.mascot_type || 'AUTO_DETERMINED';

    console.log('=== API ROUTE DEBUG ===');
    console.log('📥 Received request body:', JSON.stringify({
      flow_id: validatedData.flow_id,
      team_name: validatedData.team_name,
      sport: validatedData.sport,
      logo_style: validatedData.logo_style,
      colors: validatedData.colors,
      mascot: validatedData.mascot,
      custom_colors: validatedData.custom_colors,
      mascot_type: validatedData.mascot_type,
      variant_count: validatedData.variant_count
    }, null, 2));
    
    console.log('🎨 Color Description:', colorDescription);
    console.log('🎨 Custom Colors:', customColors);
    console.log('🦅 Mascot Description:', mascotDescription);
    console.log('🦅 Mascot Type:', mascotType);

    // Generate logos using the real image generation service
    const generatedLogos = await ImageGenerationService.generateLogos(validatedData.flow_id, {
      teamName: validatedData.team_name,
      sport: validatedData.sport,
      style: validatedData.logo_style,
      colors: colorDescription,
      customColors: customColors,
      mascot: mascotDescription,
      mascotType: mascotType,
      variantCount: validatedData.variant_count
    });

    return NextResponse.json({
      success: true,
      data: {
        flow_id: validatedData.flow_id,
        logos: generatedLogos,
        selected_logo_id: generatedLogos[0]?.id,
        generation_time_ms: generatedLogos.reduce((sum, logo) => sum + logo.generation_time_ms, 0)
      }
    });

  } catch (error) {
    console.error('Error in POST /api/logos/generate:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}