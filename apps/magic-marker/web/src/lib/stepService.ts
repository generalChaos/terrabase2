import { supabase } from '@/lib/supabase';
import { ProcessingStep } from './newTypes';

export class StepService {
  /**
   * Log a processing step to the database
   */
  static async logStep(step: Omit<ProcessingStep, 'id' | 'created_at'>): Promise<void> {
    try {
      // First, check if the analysis flow exists in the database with retry logic
      console.log(`🔍 [StepService] Checking if analysis flow exists: ${step.flow_id}`);
      
      let flowData = null;
      let flowError = null;
      let retries = 3;
      
      while (retries > 0) {
        const result = await supabase
          .from('analysis_flows')
          .select('id')
          .eq('id', step.flow_id)
          .single();
          
        flowData = result.data;
        flowError = result.error;
        
        if (flowData || (flowError && flowError.code !== 'PGRST116')) {
          break; // Found the flow or got a different error
        }
        
        // Flow not found, wait a bit and retry
        console.log(`⏳ [StepService] Flow not found, retrying in 100ms... (${4-retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 100));
        retries--;
      }

      if (flowError || !flowData) {
        console.error(`❌ [StepService] Analysis flow ${step.flow_id} not found in database after retries:`, flowError);
        console.log(`⚠️ [StepService] Skipping step logging for non-existent flow`);
        return;
      }

      console.log(`✅ [StepService] Analysis flow ${step.flow_id} exists, proceeding with step logging`);

      const { error } = await supabase
        .from('image_processing_steps')
        .insert({
          flow_id: step.flow_id,
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
        console.log(`✅ Logged ${step.step_type} step for flow ${step.flow_id}`);
      }
    } catch (error) {
      console.error('Unexpected error logging processing step:', error);
      // Don't throw - logging failures shouldn't break the main flow
    }
  }

  /**
   * Get all steps for a specific analysis flow
   */
  static async getStepsForFlow(flowId: string): Promise<ProcessingStep[]> {
    try {
      const { data, error } = await supabase
        .from('image_processing_steps')
        .select('*')
        .eq('flow_id', flowId)
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
   * Get all steps for a specific image (legacy method - now uses analysis flows)
   */
  static async getStepsForImage(imageId: string): Promise<ProcessingStep[]> {
    try {
      // First find the analysis flow for this image
      const { data: flowData, error: flowError } = await supabase
        .from('analysis_flows')
        .select('id')
        .eq('original_image_id', imageId)
        .eq('is_active', true)
        .single();

      if (flowError || !flowData) {
        console.log('No active analysis flow found for image:', imageId);
        return [];
      }

      return this.getStepsForFlow(flowData.id);
    } catch (error) {
      console.error('Unexpected error fetching processing steps for image:', error);
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
