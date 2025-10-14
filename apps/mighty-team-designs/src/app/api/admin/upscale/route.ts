import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image_url, scale_factor = 4, output_format = 'png', quality = 95 } = body;

    console.log('🔍 Admin Upscale API: Received request for image:', image_url);

    if (!image_url) {
      return NextResponse.json(
        {
          success: false,
          error: 'Image URL is required'
        },
        { status: 400 }
      );
    }

    // Call the Python upscaling service
    const upscaleRequestBody = {
      image_url,
      scale_factor,
      output_format,
      quality
    };

    console.log('🔍 Calling Python upscaling service with:', upscaleRequestBody);
    
    const pythonResponse = await fetch(`${config.imageProcessor.baseUrl}/upscale`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(upscaleRequestBody)
    });

    console.log('🔍 Python upscaling response status:', pythonResponse.status);

    if (!pythonResponse.ok) {
      const errorText = await pythonResponse.text();
      console.error('❌ Python upscaling service error:', errorText);
      return NextResponse.json(
        {
          success: false,
          error: 'Upscaling failed',
          details: errorText
        },
        { status: 500 }
      );
    }

    const result = await pythonResponse.json();
    console.log('✅ Upscaling completed successfully');

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ Admin Upscale API Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upscale image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
