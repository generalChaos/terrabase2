import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { imageProcessorClient } from '@/lib/services/imageProcessorClient';

// Validation schema
const AssetPackRequestSchema = z.object({
  logo_url: z.string().url('Invalid logo URL'),
  team_name: z.string().min(1, 'Team name is required'),
  sport: z.string().optional(),
  roster: z.array(z.string()).optional().default([])
});

// POST /api/image-processor/asset-pack - Generate asset pack
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = AssetPackRequestSchema.parse(body);

    // Call the Python image processor
    const result = await imageProcessorClient.generateAssetPack({
      logo_url: validatedData.logo_url,
      team_name: validatedData.team_name,
      sport: validatedData.sport,
      roster: validatedData.roster
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Asset pack generation failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('Error in POST /api/image-processor/asset-pack:', error);
    
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
