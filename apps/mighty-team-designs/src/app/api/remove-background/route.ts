import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image_url, output_format = 'png', quality = 95 } = body;

    console.log('🔍 Background Removal API: Received request for image:', image_url);

    if (!image_url) {
      return NextResponse.json(
        {
          success: false,
          error: 'Image URL is required'
        },
        { status: 400 }
      );
    }

    // Call the Python background removal service
    const bgRemovalRequestBody = {
      image_url,
      output_format,
      quality
    };

    console.log('🔍 Calling Python background removal service with:', bgRemovalRequestBody);
    
    const pythonResponse = await fetch(`${config.imageProcessor.baseUrl}/remove-background`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bgRemovalRequestBody)
    });

    console.log('🔍 Python background removal response status:', pythonResponse.status);

    if (!pythonResponse.ok) {
      const errorText = await pythonResponse.text();
      console.error('❌ Python background removal service error:', errorText);
      return NextResponse.json(
        {
          success: false,
          error: 'Background removal failed',
          details: errorText
        },
        { status: 500 }
      );
    }

    const result = await pythonResponse.json();
    console.log('✅ Background removal completed successfully');

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ Background Removal API Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to remove background',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
