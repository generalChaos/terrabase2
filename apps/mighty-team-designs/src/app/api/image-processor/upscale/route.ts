import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { imageProcessorClient } from '@/lib/services/imageProcessorClient';

// Validation schema
const UpscaleRequestSchema = z.object({
  image_url: z.string().url('Invalid image URL'),
  scale_factor: z.number().min(1).max(4).optional().default(2),
  model: z.string().optional().default('opencv')
});

// POST /api/image-processor/upscale - Upscale an image
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = UpscaleRequestSchema.parse(body);

    // Call the Python image processor
    const result = await imageProcessorClient.upscaleImage({
      image_url: validatedData.image_url,
      scale_factor: validatedData.scale_factor,
      model: validatedData.model
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Upscaling failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('Error in POST /api/image-processor/upscale:', error);
    
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
