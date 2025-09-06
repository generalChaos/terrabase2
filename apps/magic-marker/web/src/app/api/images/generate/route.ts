import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { OpenAIService } from '@/lib/openai';
import { QuestionAnswer } from '@/lib/types';
import { StepService } from '@/lib/stepService';
import { ImageService } from '@/lib/imageService';
import { AnalysisFlowService } from '@/lib/analysisFlowService';
import { PromptExecutor } from '@/lib/promptExecutor';

// POST /api/images/generate - Generate new image based on answers
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageAnalysisId, answers } = body;

    if (!imageAnalysisId || !answers || answers.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Get the original image data
    const imageData = await ImageService.getImage(imageAnalysisId);
    if (!imageData) {
      return NextResponse.json({ 
        success: false, 
        error: 'Image not found' 
      }, { status: 404 });
    }

    // Get the analysis flow for this image
    const analysisFlow = await AnalysisFlowService.getActiveAnalysisFlow(imageAnalysisId);
    if (!analysisFlow) {
      return NextResponse.json({ 
        success: false, 
        error: 'Analysis flow not found' 
      }, { status: 404 });
    }

    try {
      const questions = analysisFlow.questions;
      
      // Step 3: Answer Analysis
      console.log('🔍 Starting answer analysis...');
      const answerAnalysisStartTime = Date.now();
      const answerStrings = (answers as QuestionAnswer[]).map(a => a.answer);
      
      // Log answer analysis step
      await StepService.logStep({
        flow_id: analysisFlow.id,
        step_type: 'conversational_question',
        step_order: 3,
        prompt_content: 'Analyze user answers and prepare for image generation',
        input_data: { questions, answers: answerStrings },
        output_data: { analyzed_answers: answerStrings },
        response_time_ms: 0, // This is just processing, no AI call
        model_used: 'none',
        success: true
      });
      
      // Use image generation prompt system
      console.log('🎨 Starting image generation with prompt system...');
      const imageGenerationStartTime = Date.now();
      const imageGenerationResult = await PromptExecutor.execute('image_generation', {
        prompt: `Create an image based on these artistic preferences:
Questions: ${questions.map((q: { text: string }) => q.text).join(', ')}
Answers: ${answerStrings.join(', ')}
Style: Artistic and creative interpretation of the user's preferences`
      });
      const imageGenerationTime = Date.now() - imageGenerationStartTime;
      
      // Type guard to ensure we have the image_base64 property
      if (!('image_base64' in imageGenerationResult)) {
        throw new Error('Image generation failed: No image data returned');
      }
      
      // Convert base64 image to buffer
      const imageBuffer = Buffer.from(imageGenerationResult.image_base64, 'base64');
      
      const filename = `generated-${imageAnalysisId}-${Date.now()}.png`;
      
      // Upload to Supabase Storage
      const { data: _uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('images')
        .upload(filename, imageBuffer, {
          contentType: 'image/png',
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Supabase storage error:', uploadError);
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to upload generated image to storage' 
        }, { status: 500 });
      }

      // Get public URL for the uploaded image
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('images')
        .getPublicUrl(filename);
      
      // Create final image record
      const finalImageRecord = await ImageService.createImage(
        'Generated image based on user preferences',
        'final',
        publicUrl,
        imageBuffer.length,
        'image/png'
      );

      // Update analysis flow with answers and final image
      await AnalysisFlowService.updateAnalysisFlow(analysisFlow.id, {
        answers: answers,
        totalAnswers: answers.length,
        final_image_id: finalImageRecord.id,
        currentStep: 'completed'
      });

      // Log image generation step
      await StepService.logStep({
        flow_id: analysisFlow.id,
        step_type: 'image_generation',
        step_order: 4,
        prompt_content: `Generate an artistic image based on the original image analysis and user preferences: ${answerStrings.join(', ')}`,
        input_data: { prompt: `Generated image based on answers: ${answerStrings.join(', ')}` },
        output_data: { image_base64_length: imageGenerationResult.image_base64.length },
        response_time_ms: imageGenerationTime,
        model_used: 'dall-e-3',
        success: true
      });

      return NextResponse.json({
        success: true,
        finalImagePath: publicUrl
      });

    } catch (error) {
      console.error('Image generation error:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to generate image' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Generate route error:', error);
    
    let errorMessage = 'Image generation failed';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Handle specific OpenAI errors
      if (error.message.includes('model_not_found')) {
        errorMessage = 'AI model not available. Please try again later.';
        statusCode = 503;
      } else if (error.message.includes('rate_limit')) {
        errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
        statusCode = 429;
      } else if (error.message.includes('insufficient_quota')) {
        errorMessage = 'API quota exceeded. Please check your OpenAI account.';
        statusCode = 402;
      } else if (error.message.includes('content_policy')) {
        errorMessage = 'Content policy violation. Please try different answers.';
        statusCode = 400;
      }
    }
    
    return NextResponse.json({ 
      success: false, 
      error: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: statusCode });
  }
}
