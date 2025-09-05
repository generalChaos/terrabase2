import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { OpenAIService } from '@/lib/openai';
import { QuestionAnswer } from '@/lib/types';
import { StepService } from '@/lib/stepService';

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
    const { data: imageData, error: fetchError } = await supabase
      .from('images')
      .select('questions, analysis_result')
      .eq('id', imageAnalysisId)
      .single();

    if (fetchError) {
      console.error('Supabase error:', fetchError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to retrieve image data' 
      }, { status: 500 });
    }

    if (!imageData) {
      return NextResponse.json({ 
        success: false, 
        error: 'Image not found' 
      }, { status: 404 });
    }

    try {
      const questions = JSON.parse(imageData.questions);
      
      // Step 3: Answer Analysis
      console.log('🔍 Starting answer analysis...');
      const _answerAnalysisStartTime = Date.now();
      const answerStrings = (answers as QuestionAnswer[]).map(a => a.answer);
      
      // Log answer analysis step
      await StepService.logStep({
        image_id: imageAnalysisId,
        step_type: 'answer_analysis',
        step_order: 3,
        input_data: { questions, answers: answerStrings },
        output_data: { analyzed_answers: answerStrings },
        response_time_ms: 0, // This is just processing, no AI call
        model_used: 'none',
        success: true
      });
      
      // Create image prompt from questions and answers
      const prompt = `Create an image based on these artistic preferences:
Questions: ${questions.map((q: { text: string }) => q.text).join(', ')}
Answers: ${answerStrings.join(', ')}
Style: Artistic and creative interpretation of the user's preferences`;
      
      // Generate new image with proper step logging
      const imageUrl = await OpenAIService.generateImage(prompt, imageAnalysisId);
      
      // Download and save the generated image to Supabase Storage
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      const buffer = Buffer.from(imageBuffer);
      
      const filename = `generated-${imageAnalysisId}-${Date.now()}.png`;
      
      // Upload to Supabase Storage
      const { data: _uploadData, error: uploadError } = await supabase.storage
        .from('images')
        .upload(filename, buffer, {
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
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filename);
      
      // Update database with final image path and answers
      const { error: updateError } = await supabase
        .from('images')
        .update({ 
          final_image_path: publicUrl, 
          answers: JSON.stringify(answers),
          updated_at: new Date().toISOString()
        })
        .eq('id', imageAnalysisId);

      if (updateError) {
        console.error('Supabase update error:', updateError);
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to save generated image' 
        }, { status: 500 });
      }

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
