import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import { OpenAIService } from '@/lib/openai';
import { SimpleImageService } from '@/lib/simpleImageService';
import { ApiUtils } from '@/lib/apiUtils';

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

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!file.type || !allowedTypes.includes(file.type.toLowerCase())) {
      return ApiUtils.validationError(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return ApiUtils.validationError(`File too large. Maximum size is ${Math.round(maxSize / (1024 * 1024))}MB`);
    }

    if (file.size < 1024) {
      return ApiUtils.validationError('File too small. Please upload a valid image file.');
    }

    const imageId = uuidv4();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `${imageId}.${fileExtension}`;
    
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Upload image to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('images')
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Supabase storage error:', uploadError);
      return ApiUtils.internalError('Failed to upload image to storage');
    }

    // Get public URL for the uploaded image
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);

    // Convert image to base64 for OpenAI API
    const base64Image = buffer.toString('base64');

    // Analyze image with OpenAI
    const analysisResult = await OpenAIService.analyzeImage(base64Image);
    const questionsResult = await OpenAIService.generateQuestions(analysisResult.response);
    
    const analysis = analysisResult.response;
    const questions = questionsResult;

    // Create image analysis record
    const imageAnalysis = await SimpleImageService.createImageAnalysis(
      publicUrl,
      analysis,
      questions
    );

    return ApiUtils.success({
      success: true,
      imageAnalysisId: imageAnalysis.id,
      originalImagePath: publicUrl,
      analysis: analysis,
      questions: questions
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    let errorMessage = 'Upload failed';
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Handle specific OpenAI errors
      if (error.message.includes('rate limit exceeded')) {
        errorMessage = 'AI service is busy. Please wait a moment and try again.';
      } else if (error.message.includes('quota exceeded')) {
        errorMessage = 'AI service quota exceeded. Please try again later.';
      } else if (error.message.includes('model not available')) {
        errorMessage = 'AI model not available. Please try again later.';
      } else if (error.message.includes('Invalid image payload')) {
        errorMessage = 'Invalid image file. Please try a different image.';
      } else if (error.message.includes('content policy')) {
        errorMessage = 'Image content not allowed. Please try a different image.';
      }
    }
    
    return ApiUtils.internalError(errorMessage);
  }
}
