import { supabase } from './supabase';

export interface ProcessingStep {
  id?: string;
  image_id: string;
  step_type: 'analysis' | 'questions' | 'conversational_question' | 'answer_analysis' | 'image_generation';
  step_order: number;
  prompt_id?: string;
  prompt_content?: string;
  input_data: unknown;
  output_data: unknown;
  response_time_ms: number;
  tokens_used?: number;
  model_used: string;
  success: boolean;
  error_message?: string;
  created_at?: string;
}

export class StepService {
  /**
   * Log a processing step to the database
   */
  static async logStep(step: Omit<ProcessingStep, 'id' | 'created_at'>): Promise<void> {
    try {
      // First, check if the image exists in the database
      console.log(`🔍 [StepService] Checking if image exists: ${step.image_id}`);
      const { data: imageData, error: imageError } = await supabase
        .from('images')
        .select('id')
        .eq('id', step.image_id)
        .single();

      if (imageError || !imageData) {
        console.error(`❌ [StepService] Image ${step.image_id} not found in database:`, imageError);
        console.log(`⚠️ [StepService] Skipping step logging for non-existent image`);
        return;
      }

      console.log(`✅ [StepService] Image ${step.image_id} exists, proceeding with step logging`);

      const { error } = await supabase
        .from('image_processing_steps')
        .insert({
          image_id: step.image_id,
          step_type: step.step_type,
          step_order: step.step_order,
          prompt_id: step.prompt_id,
          prompt_content: step.prompt_content,
          input_data: step.input_data,
          output_data: step.output_data,
          response_time_ms: step.response_time_ms,
          tokens_used: step.tokens_used,
          model_used: step.model_used,
          success: step.success,
          error_message: step.error_message
        });

      if (error) {
        console.error('Error logging processing step:', error);
        // Don't throw - logging failures shouldn't break the main flow
      } else {
        console.log(`✅ Logged ${step.step_type} step for image ${step.image_id}`);
      }
    } catch (error) {
      console.error('Unexpected error logging processing step:', error);
      // Don't throw - logging failures shouldn't break the main flow
    }
  }

  /**
   * Get all steps for a specific image
   */
  static async getStepsForImage(imageId: string): Promise<ProcessingStep[]> {
    try {
      const { data, error } = await supabase
        .from('image_processing_steps')
        .select('*')
        .eq('image_id', imageId)
        .order('step_order', { ascending: true });

      if (error) {
        console.error('Error fetching processing steps:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Unexpected error fetching processing steps:', error);
      return [];
    }
  }

  /**
   * Get steps by type for analytics
   */
  static async getStepsByType(stepType: ProcessingStep['step_type']): Promise<ProcessingStep[]> {
    try {
      const { data, error } = await supabase
        .from('image_processing_steps')
        .select('*')
        .eq('step_type', stepType)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching steps by type:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Unexpected error fetching steps by type:', error);
      return [];
    }
  }
}
