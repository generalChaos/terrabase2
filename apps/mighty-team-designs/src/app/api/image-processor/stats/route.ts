import { NextRequest, NextResponse } from 'next/server';
import { imageProcessorClient } from '@/lib/services/imageProcessorClient';

// GET /api/image-processor/stats - Get image processor statistics
export async function GET(request: NextRequest) {
  try {
    const stats = await imageProcessorClient.getStats();
    
    return NextResponse.json({
      success: true,
      data: stats.data
    });

  } catch (error) {
    console.error('Error in GET /api/image-processor/stats:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to get image processor statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
