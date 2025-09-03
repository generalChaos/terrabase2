import { Router } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { OpenAIService } from '../services/openai';
import { supabase } from '../database/supabase';
import { UploadResponse } from '../shared/types';

const router: Router = Router();

// Configure multer for in-memory storage (we'll upload to Supabase)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// POST /api/upload - Upload and analyze image
router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file provided' });
    }

    const imageId = uuidv4();
    const fileExtension = req.file.originalname.split('.').pop() || 'jpg';
    const fileName = `${imageId}.${fileExtension}`;
    
    // Upload image to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('images')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Supabase storage error:', uploadError);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to upload image to storage' 
      });
    }

    // Get public URL for the uploaded image
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);

    // Convert image to base64 for OpenAI API
    const base64Image = req.file.buffer.toString('base64');

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
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to save image data' 
      });
    }

    const response: UploadResponse = {
      success: true,
      imageAnalysisId: imageId,
      questions
    };

    res.json(response);

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
    
    res.status(statusCode).json({ 
      success: false, 
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

export { router as uploadRouter };
