import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import { OpenAIService } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json({ success: false, error: 'No image file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ success: false, error: 'Only image files are allowed' }, { status: 400 });
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'File too large. Maximum size is 10MB' }, { status: 400 });
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
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to upload image to storage' 
      }, { status: 500 });
    }

    // Get public URL for the uploaded image
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);

    // Convert image to base64 for OpenAI API
    const base64Image = buffer.toString('base64');

    // Analyze image with OpenAI
    const { analysis, questions } = await OpenAIService.analyzeImage(base64Image);

    // Store in database
    const { error: insertError } = await supabase
      .from('images')
      .insert({
        id: imageId,
        original_image_path: publicUrl,
        analysis_result: analysis,
        questions: JSON.stringify(questions)
      });

    if (insertError) {
      console.error('Supabase error:', insertError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to save image data' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      imageAnalysisId: imageId,
      questions
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    let errorMessage = 'Upload failed';
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
      }
    }
    
    return NextResponse.json({ 
      success: false, 
      error: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: statusCode });
  }
}
