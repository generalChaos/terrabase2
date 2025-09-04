import { PromptExecutor } from './promptExecutor';
import { Question } from './types';
import { StepService } from './stepService';

export class OpenAIService {
  /**
   * Analyze an image using the new prompt system
   */
  static async analyzeImage(
    imageBase64: string, 
    imageId?: string,
    context?: string,
    analysisType?: 'general' | 'artistic' | 'technical' | 'child_drawing',
    focusAreas?: string[],
    userInstructions?: string
  ): Promise<{ analysis: string; response?: string; confidence_score?: number; identified_elements?: string[]; artistic_notes?: string; technical_notes?: string }> {
    const requestId = Math.random().toString(36).substring(7);
    console.log(`🤖 [${requestId}] Analyzing image with new prompt system`);

    try {
      const result = await PromptExecutor.execute('image_analysis', {
        image: imageBase64,
        context,
        analysis_type: analysisType,
        focus_areas: focusAreas,
        user_instructions: userInstructions
      }) as { analysis: string; response?: string; confidence_score?: number; identified_elements?: string[]; artistic_notes?: string; technical_notes?: string };

      // Log the step if imageId is provided
      if (imageId) {
        await StepService.logStep({
          image_id: imageId,
          step_type: 'analysis',
          step_order: 1,
          input_data: { 
            image_base64_length: imageBase64.length,
            context,
            analysis_type: analysisType,
            focus_areas: focusAreas,
            user_instructions: userInstructions
          },
          output_data: result,
          response_time_ms: 0, // Will be calculated by StepService
          model_used: 'gpt-4o',
          success: true
        });
      }

      return result;
    } catch (error: unknown) {
      console.error(`❌ [${requestId}] Image analysis failed:`, error);
      
      // Log the error step if imageId is provided
      if (imageId) {
        await StepService.logStep({
          image_id: imageId,
          step_type: 'analysis',
          step_order: 1,
          input_data: { 
            image_base64_length: imageBase64.length,
            context,
            analysis_type: analysisType,
            focus_areas: focusAreas,
            user_instructions: userInstructions
          },
          output_data: null,
          response_time_ms: 0,
          model_used: 'gpt-4o',
          success: false,
          error_message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      
      throw error;
    }
  }

  /**
   * Generate questions using the new prompt system
   */
  static async generateQuestions(
    analysis: string, 
    imageId?: string
  ): Promise<Question[]> {
    const requestId = Math.random().toString(36).substring(7);
    console.log(`❓ [${requestId}] Generating questions with new prompt system`);

    try {
      const result = await PromptExecutor.execute('questions_generation', {
        analysis
      }) as { questions: Question[]; response?: string };

      // Log the step if imageId is provided
      if (imageId) {
        await StepService.logStep({
          image_id: imageId,
          step_type: 'questions',
          step_order: 2,
          input_data: { analysis },
          output_data: result,
          response_time_ms: 0,
          model_used: 'gpt-4o',
          success: true
        });
      }

      return result.questions;
    } catch (error: unknown) {
      console.error(`❌ [${requestId}] Questions generation failed:`, error);
      
      // Log the error step if imageId is provided
      if (imageId) {
        await StepService.logStep({
          image_id: imageId,
          step_type: 'questions',
          step_order: 2,
          input_data: { analysis },
          output_data: null,
          response_time_ms: 0,
          model_used: 'gpt-4o',
          success: false,
          error_message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      
      throw error;
    }
  }

  /**
   * Generate a conversational question using the new prompt system
   */
  static async generateConversationalQuestion(
    analysis: string,
    previousAnswers: string[],
    conversationContext: {
      questions: Question[];
      artisticDirection?: string;
      previousAnswers: string[];
    },
    imageId?: string
  ): Promise<{ question: Question; context: { reasoning: string; builds_on: string; artistic_focus: string }; response?: string }> {
    const requestId = Math.random().toString(36).substring(7);
    console.log(`💬 [${requestId}] Generating conversational question with new prompt system`);

    try {
      const result = await PromptExecutor.execute('conversational_question', {
        analysis,
        previousAnswers,
        conversationContext
      }) as { question: Question; context: { reasoning: string; builds_on: string; artistic_focus: string }; response?: string };

      // Log the step if imageId is provided
      if (imageId) {
        await StepService.logStep({
          image_id: imageId,
          step_type: 'conversational_question',
          step_order: 3,
          input_data: { 
            analysis,
            previousAnswers,
            conversationContext
          },
          output_data: result,
          response_time_ms: 0,
          model_used: 'gpt-4o',
          success: true
        });
      }

      return result;
    } catch (error: unknown) {
      console.error(`❌ [${requestId}] Conversational question generation failed:`, error);
      
      // Log the error step if imageId is provided
      if (imageId) {
        await StepService.logStep({
          image_id: imageId,
          step_type: 'conversational_question',
          step_order: 3,
          input_data: { 
            analysis,
            previousAnswers,
            conversationContext
          },
          output_data: null,
          response_time_ms: 0,
          model_used: 'gpt-4o',
          success: false,
          error_message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      
      throw error;
    }
  }

  /**
   * Create image prompt using the new prompt system
   */
  static async createImagePrompt(
    questions: Question[], 
    answers: string[],
    imageId?: string
  ): Promise<string> {
    const requestId = Math.random().toString(36).substring(7);
    console.log(`🎨 [${requestId}] Creating image prompt with new prompt system`);

    try {
      const result = await PromptExecutor.execute('image_prompt_creation', {
        questions,
        answers
      }) as { prompt: string; response?: string };

      // Log the step if imageId is provided
      if (imageId) {
        await StepService.logStep({
          image_id: imageId,
          step_type: 'image_generation',
          step_order: 4,
          input_data: { questions, answers },
          output_data: result,
          response_time_ms: 0,
          model_used: 'gpt-4o',
          success: true
        });
      }

      return result.prompt;
    } catch (error: unknown) {
      console.error(`❌ [${requestId}] Image prompt creation failed:`, error);
      
      // Log the error step if imageId is provided
      if (imageId) {
        await StepService.logStep({
          image_id: imageId,
          step_type: 'image_generation',
          step_order: 4,
          input_data: { questions, answers },
          output_data: null,
          response_time_ms: 0,
          model_used: 'gpt-4o',
          success: false,
          error_message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      
      throw error;
    }
  }

  /**
   * Analyze image with text prompt using the new prompt system
   */
  static async analyzeImageWithText(
    imageBase64: string,
    textPrompt: string,
    context?: string,
    instructions?: string
  ): Promise<{ analysis: string; response?: string }> {
    const requestId = Math.random().toString(36).substring(7);
    console.log(`🖼️📝 [${requestId}] Analyzing image with text prompt using new prompt system`);

    try {
      const result = await PromptExecutor.execute('image_text_analysis', {
        image: imageBase64,
        text: textPrompt,
        context,
        instructions
      }) as { analysis: string; response?: string };

      return result;
    } catch (error: unknown) {
      console.error(`❌ [${requestId}] Image + text analysis failed:`, error);
      throw error;
    }
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
      // Use the old OpenAI service for DALL-E (since it's not in our prompt system yet)
      const { OpenAIService: OpenAIServiceOld } = await import('./openai');
      const imageUrl = await OpenAIServiceOld.generateImage(prompt);

      const responseTime = Date.now() - startTime;
      console.log(`✅ [${requestId}] Image generated:`, imageUrl);

      // Log the step if imageId is provided
      if (imageId) {
        await StepService.logStep({
          image_id: imageId,
          step_type: 'image_generation',
          step_order: 4,
          input_data: { prompt },
          output_data: { image_url: imageUrl },
          response_time_ms: responseTime,
          model_used: 'dall-e-3',
          success: true
        });
      }

      return imageUrl;
    } catch (error: unknown) {
      const responseTime = Date.now() - startTime;
      console.error(`❌ [${requestId}] DALL-E image generation failed:`, error);
      
      // Log the error step if imageId is provided
      if (imageId) {
        await StepService.logStep({
          image_id: imageId,
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
