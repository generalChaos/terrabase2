import { PromptExecutor } from './promptExecutor';
import { ImageAnalysis, Question } from './types';
import { StepService } from './stepService';
import { StepContext } from './contextManager';

export class OpenAIService {
  /**
   * Analyze an image using the prompt system
   */
  static async analyzeImage(
    imageBase64: string, 
    prompt?: string,
    context?: StepContext
  ): Promise<{ response: string }> {
    const requestId = Math.random().toString(36).substring(7);
    console.log(`🤖 [${requestId}] Analyzing image with schema enforcement`);

    try {
      const result = await PromptExecutor.executeWithSchemaEnforcement('image_analysis', {
        image: imageBase64,
        prompt: prompt || 'Analyze this image and describe what you see, focusing on artistic elements, composition, colors, and mood.'
      }, context) as { response: string };

      return result;
    } catch (error: unknown) {
      console.error(`❌ [${requestId}] Image analysis failed:`, error);
      
      throw error;
    }
  }

  /**
   * Generate questions using the prompt system
   */
  static async generateQuestions(
    prompt: string, 
    imageId?: string,
    context?: StepContext
  ): Promise<Question[]> {
    const requestId = Math.random().toString(36).substring(7);
    console.log(`❓ [${requestId}] Generating questions with schema enforcement`);

    try {
      const result = await PromptExecutor.executeWithSchemaEnforcement('questions_generation', {
        analysis: prompt,
        prompt: ''
      }, context) as { questions: Question[] };

      return result.questions;
    } catch (error: unknown) {
      console.error(`❌ [${requestId}] Questions generation failed:`, error);
      
      throw error;
    }
  }



  /**
   * Analyze image with text prompt using the prompt system
   */
  static async analyzeImageWithText(
    imageBase64: string,
    textPrompt: string,
    _context?: string,
    _instructions?: string
  ): Promise<{ response: string }> {
    const requestId = Math.random().toString(36).substring(7);
    console.log(`🖼️📝 [${requestId}] Analyzing image with text prompt using prompt system`);

    try {
      // Removed deprecated image_text_analysis prompt type
      const result = await PromptExecutor.executeWithSchemaEnforcement('image_analysis', {
        image: imageBase64,
        prompt: textPrompt
      }) as { response: string };

      return result;
    } catch (error: unknown) {
      console.error(`❌ [${requestId}] Image + text analysis failed:`, error);
      throw error;
    }
  }

  /**
   * Create an image prompt from questions and answers with context from previous steps
   */
  static async createImagePrompt(
    imageAnalysis: string,
    questions: Question[], 
    imageGenPrompt?: string
  ): Promise<string> {
    const prompt = `
      ORIGINAL IMAGE ANALYSIS:
      ${imageAnalysis || 'Analysis not available'}

      USER PREFERENCES FROM QUESTIONS:
      ${questions.map((q, index) => `- ${q.text}: ${answers[index] || 'Not specified'}`).join('\n')}

      ARTISTIC VISION: Create a professional, artistic image that enhances the original drawing with the user's specific clarifications. Maintain the playful, imaginative nature while incorporating all the detailed preferences. Focus on preserving the original elements while adding professional details based on the user's responses.

      Generate an image that brings together the original analysis with the user's creative input.
    `;
          
          return prompt;
  }

  /**
   * Generate an image from a prompt (DALL-E) with proper step logging
   */
  static async generateImage(
    prompt: string,
    imageId?: string
  ): Promise<string> {
    const requestId = Math.random().toString(36).substring(7);
    console.log(`🖼️ [${requestId}] Generating image with DALL-E...`);
    console.log(`📝 [${requestId}] Image prompt:`, prompt);

    const startTime = Date.now();

    try {
      // Use PromptExecutor for image generation
      const result = await PromptExecutor.executeWithSchemaEnforcement('image_generation', { 
        prompt,
        flow_summary: {}
      });
      
      // Type guard to ensure we have the image_base64 property
      if (!('image_base64' in result)) {
        throw new Error('Image generation failed: No image data returned');
      }
      
      const imageBase64 = result.image_base64;

      const responseTime = Date.now() - startTime;
      console.log(`✅ [${requestId}] Image generated (base64 length: ${imageBase64.length})`);

      // Log the step if imageId is provided
      if (imageId) {
        await StepService.logStep({
          flow_id: imageId,
          step_type: 'image_generation',
          step_order: 4,
          input_data: { prompt },
          output_data: { image_base64: imageBase64 },
          response_time_ms: responseTime,
          model_used: 'dall-e-3',
          success: true
        });
      }

      return imageBase64;
    } catch (error: unknown) {
      const responseTime = Date.now() - startTime;
      console.error(`❌ [${requestId}] DALL-E image generation failed:`, error);
      
      // Log the error step if imageId is provided
      if (imageId) {
        await StepService.logStep({
          flow_id: imageId,
          step_type: 'image_generation',
          step_order: 4,
          input_data: { prompt },
          output_data: { error: (error as Error).message },
          response_time_ms: responseTime,
          model_used: 'dall-e-3',
          success: false,
          error_message: (error as Error).message
        });
      }
      
      throw error;
    }
  }
}
