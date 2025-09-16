import { NextRequest } from 'next/server';
import { SimpleImageService } from '@/lib/simpleImageService';
import { ApiUtils } from '@/lib/apiUtils';

// GET /api/images/[id] - Get specific image analysis
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const image = await SimpleImageService.getImageAnalysis(id);
    
    if (!image) {
      return ApiUtils.notFound('Image analysis not found');
    }

    return ApiUtils.success(image);
  } catch (error) {
    console.error('Error getting image:', error);
    return ApiUtils.internalError('Failed to retrieve image');
  }
}
