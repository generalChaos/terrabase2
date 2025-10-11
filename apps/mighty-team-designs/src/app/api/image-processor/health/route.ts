import { NextRequest, NextResponse } from 'next/server';
import { imageProcessorClient } from '@/lib/services/imageProcessorClient';

// GET /api/image-processor/health - Check image processor health
export async function GET(request: NextRequest) {
  try {
    const health = await imageProcessorClient.getHealth();
    
    return NextResponse.json({
      success: true,
      data: health
    });

  } catch (error) {
    console.error('Error in GET /api/image-processor/health:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Image processor service unavailable',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    );
  }
}
