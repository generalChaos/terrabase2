import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import { OpenAIService } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    console.log('Upload API called');
    console.log('Environment check:', {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    });

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
    
    if (!file) {
      return NextResponse.json({ 
        success: false, 
        error: 'No image file provided. Please select an image to upload.' 
      }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!file.type || !allowedTypes.includes(file.type.toLowerCase())) {
      return NextResponse.json({ 
        success: false, 
        error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}` 
      }, { status: 400 });
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        success: false, 
        error: `File too large. Maximum size is ${Math.round(maxSize / (1024 * 1024))}MB` 
      }, { status: 400 });
    }

    // Validate file size (minimum 1KB)
    if (file.size < 1024) {
      return NextResponse.json({ 
        success: false, 
        error: 'File too small. Please upload a valid image file.' 
      }, { status: 400 });
    }

    const imageId = uuidv4();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `${imageId}.${fileExtension}`;
    
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Upload image to Supabase Storage
    console.log('Uploading to Supabase storage:', fileName);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('images')
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Supabase storage error:', uploadError);
      console.error('Supabase error details:', {
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
      console.error('Supabase database error:', insertError);
      
      // Handle specific database errors
      if (insertError.message.includes('duplicate key')) {
        return NextResponse.json({ 
          success: false, 
          error: 'Image with this ID already exists. Please try again.' 
        }, { status: 409 });
      } else if (insertError.message.includes('foreign key')) {
        return NextResponse.json({ 
          success: false, 
          error: 'Database constraint violation. Please try again.' 
        }, { status: 400 });
      } else if (insertError.message.includes('permission')) {
        return NextResponse.json({ 
          success: false, 
          error: 'Database permission denied. Please contact support.' 
        }, { status: 403 });
      } else {
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to save image data to database. Please try again.' 
        }, { status: 500 });
      }
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
      timestamp: new Date().toISOString(),
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }, { status: statusCode });
  }
}
