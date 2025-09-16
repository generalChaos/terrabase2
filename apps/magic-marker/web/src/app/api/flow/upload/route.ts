import { NextRequest } from 'next/server';
import { ImageFlowService } from '@/lib/imageFlowService';
import { ApiUtils } from '@/lib/apiUtils';

// POST /api/flow/upload - Upload image and create new flow
export async function POST(request: NextRequest) {
  try {
    // Validate request content type
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return ApiUtils.validationError('Invalid content type. Expected multipart/form-data');
    }

    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return ApiUtils.validationError('No image file provided');
    }

    // Use ImageFlowService to upload and create flow
    const result = await ImageFlowService.uploadImage(file);

    if (!result.success) {
      return ApiUtils.validationError(result.error || 'Upload failed');
    }

    return ApiUtils.success({
      success: true,
      flowId: result.flowId,
      imagePath: result.imagePath,
      message: 'Image uploaded and flow created successfully'
    });

  } catch (error) {
    console.error('Flow upload error:', error);
    
    let errorMessage = 'Upload failed';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return ApiUtils.internalError(errorMessage);
  }
}
