import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { base64String } = await request.json();
    
    if (!base64String) {
      return NextResponse.json({ error: 'No base64 string provided' }, { status: 400 });
    }

    // Return the image as a response
    const imageBuffer = Buffer.from(base64String, 'base64');
    
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': imageBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error processing base64 image:', error);
    return NextResponse.json({ error: 'Failed to process image' }, { status: 500 });
  }
}

