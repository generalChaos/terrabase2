import { NextRequest, NextResponse } from 'next/server';
import { ImageGenerationService } from '@/lib/services/imageGenerationService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ flowId: string }> }
) {
  try {
    const { flowId } = await params;
    console.log('🎨 Asset Packs API: Received GET request for flow:', flowId);
    
    // Get all asset packs for the flow
    const assetPacks = await ImageGenerationService.getAssetPacksForFlow(flowId);
    
    console.log('✅ Asset Packs API: Retrieved', assetPacks.length, 'asset packs for flow:', flowId);
    
    return NextResponse.json({
      success: true,
      data: assetPacks
    });

  } catch (error) {
    console.error('❌ Asset Packs API Error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve asset packs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

