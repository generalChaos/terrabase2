import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { PromptExecutor } from '@/lib/promptExecutor';
import { StepService } from '@/lib/stepService';
import { ImageService } from '@/lib/imageService';
import { AnalysisFlowService } from '@/lib/analysisFlowService';

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`🚀 [${requestId}] Upload API called`);
  console.log(`🔧 [${requestId}] Environment check:`, {
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
  });

  try {

    // Validate request content type
    const contentType = request.headers.get('content-type');
    console.log('Content-Type:', contentType);
    
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid content type. Expected multipart/form-data' 
      }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    console.log(`📁 [${requestId}] File received:`, {
      name: file?.name,
      size: file?.size,
      type: file?.type
    });
    
    if (!file) {
      console.log(`❌ [${requestId}] No file provided`);
      return NextResponse.json({ 
        success: false, 
        error: 'No image file provided. Please select an image to upload.' 
      }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    console.log(`🔍 [${requestId}] Validating file type:`, file.type);
    if (!file.type || !allowedTypes.includes(file.type.toLowerCase())) {
      console.log(`❌ [${requestId}] Invalid file type:`, file.type);
      return NextResponse.json({ 
        success: false, 
        error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}` 
      }, { status: 400 });
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    console.log(`📏 [${requestId}] Validating file size:`, file.size, 'bytes');
    if (file.size > maxSize) {
      console.log(`❌ [${requestId}] File too large:`, file.size, 'bytes');
      return NextResponse.json({ 
        success: false, 
        error: `File too large. Maximum size is ${Math.round(maxSize / (1024 * 1024))}MB` 
      }, { status: 400 });
    }

    // Validate file size (minimum 1KB)
    if (file.size < 1024) {
      console.log(`❌ [${requestId}] File too small:`, file.size, 'bytes');
      return NextResponse.json({ 
        success: false, 
        error: 'File too small. Please upload a valid image file.' 
      }, { status: 400 });
    }

    const imageId = uuidv4();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `${imageId}.${fileExtension}`;
    
    console.log(`🆔 [${requestId}] Generated image ID:`, imageId);
    console.log(`📄 [${requestId}] Generated filename:`, fileName);
    
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Upload image to Supabase Storage using admin client
    console.log(`☁️ [${requestId}] Uploading to Supabase storage:`, fileName);
    console.log(`📊 [${requestId}] Buffer size:`, buffer.length, 'bytes');
    const { data: _uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('images')
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error(`❌ [${requestId}] Supabase storage error:`, uploadError);
      console.error(`❌ [${requestId}] Supabase error details:`, {
        message: uploadError.message,
        name: uploadError.name
      });
      
      // Handle specific Supabase errors
      if (uploadError.message.includes('File size exceeds maximum')) {
        return NextResponse.json({ 
          success: false, 
          error: 'File too large for storage. Please try a smaller image.' 
        }, { status: 413 });
      } else if (uploadError.message.includes('already exists')) {
        return NextResponse.json({ 
          success: false, 
          error: 'File with this name already exists. Please try again.' 
        }, { status: 409 });
      } else if (uploadError.message.includes('quota')) {
        return NextResponse.json({ 
          success: false, 
          error: 'Storage quota exceeded. Please contact support.' 
        }, { status: 507 });
      } else {
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to upload image to storage. Please try again.' 
        }, { status: 500 });
      }
    }

    // Get public URL for the uploaded image
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('images')
      .getPublicUrl(fileName);
      
    console.log(`🔗 [${requestId}] Generated public URL:`, publicUrl);

    // Convert image to base64 for OpenAI API
    const base64Image = buffer.toString('base64');
    console.log(`🔄 [${requestId}] Converted to base64, length:`, base64Image.length);

    // Step 1: Analyze image using prompt system
    console.log(`🤖 [${requestId}] Starting image analysis with prompt system...`);
    const analysisStartTime = Date.now();
    const analysisResult = await PromptExecutor.execute('image_analysis', {
      image: base64Image,
      prompt: 'Analyze this image and describe what you see, focusing on artistic elements, composition, colors, and mood.'
    });
    const analysisTime = Date.now() - analysisStartTime;
    console.log(`✅ [${requestId}] Image analysis completed in ${analysisTime}ms`);
    // Type guard to ensure we have the response property
    if (!('response' in analysisResult)) {
      throw new Error('Analysis failed: No response returned');
    }
    console.log(`📝 [${requestId}] Analysis length:`, analysisResult.response?.length || 0);

    // Step 2: Generate questions from analysis using prompt system
    console.log(`❓ [${requestId}] Starting questions generation with prompt system...`);
    const questionsStartTime = Date.now();
    const questionsResult = await PromptExecutor.execute('questions_generation', {
      response: analysisResult.response
    });
    const questionsTime = Date.now() - questionsStartTime;
    console.log(`✅ [${requestId}] Questions generation completed in ${questionsTime}ms`);
    console.log(`🔍 [${requestId}] Questions result structure:`, JSON.stringify(questionsResult, null, 2));
    // Type guard to ensure we have the questions property
    if (!('questions' in questionsResult)) {
      throw new Error('Questions generation failed: No questions returned');
    }
    console.log(`❓ [${requestId}] Questions count:`, questionsResult.questions?.length || 0);

    // Create image record using ImageService
    console.log(`💾 [${requestId}] Creating image record...`);
    const imageRecord = await ImageService.createImage(
      analysisResult.response,
      'original',
      publicUrl,
      file.size,
      file.type
    );

    // Generate session ID and create analysis flow
    console.log(`🔄 [${requestId}] Creating analysis flow...`);
    const sessionId = AnalysisFlowService.generateSessionId();
    const analysisFlow = await AnalysisFlowService.createAnalysisFlow(
      imageRecord.id,
      sessionId,
      analysisResult.response
    );

    // Ensure unique IDs for questions
    const questionsWithUniqueIds = questionsResult.questions.map((q, index) => ({
      ...q,
      id: `q_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 6)}`
    }));

    // Add questions to the analysis flow
    console.log(`❓ [${requestId}] Adding questions to analysis flow...`);
    await AnalysisFlowService.updateAnalysisFlow(analysisFlow.id, {
      questions: questionsWithUniqueIds,
      totalQuestions: questionsWithUniqueIds.length,
      currentStep: 'questions'
    });

    // Log both steps using the analysis flow ID
    console.log(`📊 [${requestId}] Logging analysis step...`);
    await StepService.logStep({
      flow_id: analysisFlow.id,
      step_type: 'analysis',
      step_order: 1,
      input_data: { image_base64_length: base64Image.length },
      output_data: { response: analysisResult.response },
      response_time_ms: analysisTime,
      model_used: 'gpt-4o',
      success: true
    });

    console.log(`📊 [${requestId}] Logging questions generation step...`);
    await StepService.logStep({
      flow_id: analysisFlow.id,
      step_type: 'questions',
      step_order: 2,
      input_data: { response: analysisResult.response.trim() },
      output_data: { questions: questionsResult.questions },
      response_time_ms: questionsTime,
      model_used: 'gpt-4o',
      success: true
    });

    console.log(`🎉 [${requestId}] Upload completed successfully!`);
    return NextResponse.json({
      success: true,
      imageAnalysisId: imageRecord.id, // Return the actual image ID
      flowId: analysisFlow.id, // Return the analysis flow ID
      originalImagePath: publicUrl,
      analysis: analysisResult.response,
      questions: questionsWithUniqueIds // Return generated questions with unique IDs
    });

  } catch (error) {
    console.error(`💥 [${requestId}] Upload error:`, error);
    
    let errorMessage = 'Upload failed';
    let statusCode = 500;
    let debugInfo = null;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Add debug info for validation errors
      if (error.message.includes('validation failed')) {
        debugInfo = {
          type: 'validation_error',
          details: error.message,
          suggestion: 'Check the AI response format against expected schema'
        };
      }
      
      // Handle specific OpenAI errors
      if (error.message.includes('OpenAI API key not configured')) {
        errorMessage = 'AI service not configured. Please contact support.';
        statusCode = 503;
      } else if (error.message.includes('rate limit exceeded')) {
        errorMessage = 'AI service is busy. Please wait a moment and try again.';
        statusCode = 429;
      } else if (error.message.includes('quota exceeded')) {
        errorMessage = 'AI service quota exceeded. Please try again later.';
        statusCode = 402;
      } else if (error.message.includes('model not available')) {
        errorMessage = 'AI model not available. Please try again later.';
        statusCode = 503;
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
        statusCode = 408;
      } else if (error.message.includes('Invalid image payload')) {
        errorMessage = 'Invalid image file. Please try a different image.';
        statusCode = 400;
      } else if (error.message.includes('content policy')) {
        errorMessage = 'Image content not allowed. Please try a different image.';
        statusCode = 400;
      }
    }
    
    return NextResponse.json({ 
      success: false, 
      error: errorMessage,
      debug: debugInfo,
      timestamp: new Date().toISOString(),
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }, { status: statusCode });
  }
}
