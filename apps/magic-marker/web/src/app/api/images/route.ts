import { SimpleImageService } from '@/lib/simpleImageService';
import { ApiUtils } from '@/lib/apiUtils';

// GET /api/images - Get all image analyses
export async function GET() {
  try {
    const images = await SimpleImageService.getAllImageAnalyses();
    return ApiUtils.success(images);
  } catch (error) {
    console.error('Error getting images:', error);
    return ApiUtils.internalError('Failed to retrieve images');
  }
}
