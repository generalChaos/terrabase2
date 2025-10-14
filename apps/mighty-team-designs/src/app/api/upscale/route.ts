import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Upscale API: Starting request processing');
    const body = await request.json();
    const { image_url, scale_factor = 4, output_format = 'png', quality = 95 } = body;

    console.log('🔍 Upscale API: Received request for image:', image_url?.substring(0, 100) + '...');
    console.log('🔍 Upscale API: Image URL type:', image_url?.startsWith('data:') ? 'data URL' : 'regular URL');
    console.log('🔍 Upscale API: Image URL length:', image_url?.length);

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
    console.log('🔍 Full URL being called:', `${config.imageProcessor.baseUrl}/upscale`);
    
    let pythonResponse;
    try {
      console.log('🔍 Attempting to call Python service...');
      pythonResponse = await fetch(`${config.imageProcessor.baseUrl}/upscale`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(upscaleRequestBody)
      });
      console.log('🔍 Python service call completed');
    } catch (fetchError) {
      console.error('❌ Fetch error:', fetchError);
      throw new Error(`Failed to connect to Python service: ${fetchError.message}`);
    }

    console.log('🔍 Python upscaling response status:', pythonResponse.status);
    console.log('🔍 Python upscaling response headers:', Object.fromEntries(pythonResponse.headers.entries()));

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

    // Return the response directly from Python service
    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ Upscale API Error:', error);

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
