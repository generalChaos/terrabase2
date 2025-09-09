import { NextRequest } from 'next/server';
import { SimpleImageService } from '@/lib/simpleImageService';
import { QuestionAnswer } from '@/lib/types';
import { OpenAIService } from '@/lib/openai';
import { ApiUtils } from '@/lib/apiUtils';
import { supabase } from '@/lib/supabase';

// POST /api/images/generate - Generate new image based on answers
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageAnalysisId, answers, prompt } = body;

    if (!imageAnalysisId || !answers || answers.length === 0) {
      return ApiUtils.validationError('Missing required fields: imageAnalysisId and answers');
    }

    // Get the image analysis
    const imageAnalysis = await SimpleImageService.getImageAnalysis(imageAnalysisId);
    if (!imageAnalysis) {
      return ApiUtils.notFound('Image analysis not found');
    }

    // TODO match the answers to the questions.  remove the other options.  Format: "this is a question? answer"

    try {
      // Update the image analysis with answers
      const updatedAnalysis = await SimpleImageService.updateImageAnalysis(imageAnalysisId, answers);
      
      // Create image prompt from questions and answers with context (or use custom prompt)
      const answerStrings = answers.map((a: QuestionAnswer) => a.answer);
      const imagePrompt = await OpenAIService.createImagePrompt(
        imageAnalysis, 
        answers, 
        prompt
      );
      
      // Generate new image
      const imageUrl = await OpenAIService.generateImage(imagePrompt);
      
      // Download and save the generated image to Supabase Storage
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      const buffer = Buffer.from(imageBuffer);
      
      const filename = `generated-${imageAnalysisId}-${Date.now()}.png`;
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images')
        .upload(filename, buffer, {
          contentType: 'image/png',
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Supabase storage error:', uploadError);
        return ApiUtils.internalError('Failed to upload generated image to storage');
      }

      // Get public URL for the uploaded image
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filename);
      
      // Set final image
      const finalAnalysis = await SimpleImageService.setFinalImage(imageAnalysisId, publicUrl);

      return ApiUtils.success({
        success: true,
        finalImagePath: publicUrl,
        imageAnalysis: finalAnalysis
      });

    } catch (error) {
      console.error('Image generation error:', error);
      return ApiUtils.internalError('Failed to generate image');
    }

  } catch (error) {
    console.error('Route error:', error);
    return ApiUtils.internalError('Internal server error');
  }
}
