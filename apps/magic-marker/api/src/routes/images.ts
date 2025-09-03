import { Router } from 'express';
import { OpenAIService } from '../services/openai';
import { supabase } from '../database/supabase';
import { ImageGenerationRequest, ImageGenerationResponse } from '../shared/types';

const router: Router = Router();

// GET /api/images - Get all images
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to retrieve images' });
    }

    const images = data?.map(row => ({
      ...row,
      questions: JSON.parse(row.questions),
      answers: row.answers ? JSON.parse(row.answers) : null,
      original_image_path: row.original_image_path, // Already a Supabase Storage URL
      final_image_path: row.final_image_path // Already a Supabase Storage URL
    })) || [];

    res.json(images);
  } catch (err) {
    console.error('Route error:', err);
    res.status(500).json({ error: 'Failed to retrieve images' });
  }
});

// GET /api/images/:id - Get specific image
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('images')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to retrieve image' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const image = {
      ...data,
      questions: JSON.parse(data.questions),
      answers: data.answers ? JSON.parse(data.answers) : null,
      original_image_path: data.original_image_path, // Already a Supabase Storage URL
      final_image_path: data.final_image_path // Already a Supabase Storage URL
    };

    res.json(image);
  } catch (err) {
    console.error('Route error:', err);
    res.status(500).json({ error: 'Failed to retrieve image' });
  }
});

// POST /api/images/generate - Generate new image based on answers
router.post('/generate', async (req, res) => {
  try {
    const { imageAnalysisId, answers }: ImageGenerationRequest = req.body;

    if (!imageAnalysisId || !answers || answers.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    // Get the original image data
    const { data: imageData, error: fetchError } = await supabase
      .from('images')
      .select('questions, analysis_result')
      .eq('id', imageAnalysisId)
      .single();

    if (fetchError) {
      console.error('Supabase error:', fetchError);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to retrieve image data' 
      });
    }

    if (!imageData) {
      return res.status(404).json({ 
        success: false, 
        error: 'Image not found' 
      });
    }

    try {
      const questions = JSON.parse(imageData.questions);
      
      // Create image prompt from questions and answers
      const answerStrings = answers.map(a => a.answer);
      const prompt = await OpenAIService.createImagePrompt(questions, answerStrings);
      
      // Generate new image
      const imageUrl = await OpenAIService.generateImage(prompt);
      
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
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to upload generated image to storage' 
        });
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
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to save generated image' 
        });
      }

      const response: ImageGenerationResponse = {
        success: true,
        finalImagePath: publicUrl
      };

      res.json(response);

    } catch (error) {
      console.error('Image generation error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to generate image' 
      });
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
    
    res.status(statusCode).json({ 
      success: false, 
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

export { router as imagesRouter };
