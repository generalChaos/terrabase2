import { supabase } from '@/lib/supabase'
import { AnalysisFlow, Question, QuestionAnswer } from './newTypes'

// Re-export types for external use
export type { AnalysisFlow, Question, QuestionAnswer }

export interface AnalysisFlowState {
  currentQuestionIndex: number
  totalQuestions: number
  questions: Question[]
  answers: QuestionAnswer[]
  contextData: {
    imageAnalysis: string
    previousAnswers: string[]
    artisticDirection: string
  }
}

export class AnalysisFlowService {
  /**
   * Generate a unique session ID
   */
  static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Create a new analysis flow for an image
   */
  static async createAnalysisFlow(
    originalImageId: string,
    sessionId: string,
    imageAnalysis: string
  ): Promise<AnalysisFlow> {
    console.log('🔄 [AnalysisFlowService] Creating analysis flow:', {
      originalImageId: originalImageId.substring(0, 8) + '...',
      sessionId: sessionId.substring(0, 8) + '...',
      imageAnalysisLength: imageAnalysis.length
    });

    const questions: Question[] = [];
    const answers: QuestionAnswer[] = [];

    console.log('📝 [AnalysisFlowService] Initial state created:', {
      totalQuestions: 0,
      questionsCount: questions.length,
      answersCount: answers.length
    });

    console.log('🔄 [AnalysisFlowService] Creating new analysis flow:', {
      originalImageId: originalImageId.substring(0, 8) + '...',
      sessionId: sessionId.substring(0, 8) + '...',
      isActive: true
    });

    // Create a new analysis flow using the new hybrid schema
    const { data, error } = await supabase
      .from('analysis_flows')
      .insert({
        session_id: sessionId,
        original_image_id: originalImageId,
        additional_image_ids: [],
        final_image_id: null,
        total_questions: 0,
        total_answers: 0,
        current_step: 'analysis',
        questions: questions,
        answers: answers,
        context_data: {
          imageAnalysis,
          previousAnswers: [],
          artisticDirection: ''
        },
        total_cost_usd: 0,
        total_tokens: 0,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('❌ [AnalysisFlowService] Error creating analysis flow:', error);
      console.error('❌ [AnalysisFlowService] Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw new Error(`Failed to create analysis flow: ${error.message}`)
    }

    console.log('✅ [AnalysisFlowService] Analysis flow created successfully:', {
      flowId: data.id,
      originalImageId: data.original_image_id.substring(0, 8) + '...',
      sessionId: data.session_id.substring(0, 8) + '...'
    });

    return data
  }

  /**
   * Clean up broken analysis flows (active flows with 0 questions)
   */
  static async cleanupBrokenAnalysisFlows(originalImageId: string): Promise<void> {
    console.log('🧹 [AnalysisFlowService] Cleaning up broken analysis flows for image:', originalImageId.substring(0, 8) + '...');
    
    const { data, error } = await supabase
      .from('analysis_flows')
      .update({ is_active: false })
      .eq('original_image_id', originalImageId)
      .eq('is_active', true)
      .eq('total_questions', 0)
      .select();

    if (error) {
      console.error('❌ [AnalysisFlowService] Error cleaning up broken analysis flows:', error);
    } else {
      console.log('✅ [AnalysisFlowService] Cleaned up broken analysis flows:', data);
    }
  }

  /**
   * Get active analysis flow for an image
   */
  static async getActiveAnalysisFlow(originalImageId: string): Promise<AnalysisFlow | null> {
    console.log('🔍 [AnalysisFlowService] Getting active analysis flow for image:', originalImageId.substring(0, 8) + '...');

    const { data, error } = await supabase
      .from('analysis_flows')
      .select('*')
      .eq('original_image_id', originalImageId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('ℹ️ [AnalysisFlowService] No active analysis flow found');
        return null
      }
      console.error('❌ [AnalysisFlowService] Error getting active analysis flow:', error);
      return null
    }

    // Check if this is a broken flow (active but has 0 questions)
    if (data.total_questions === 0) {
      console.log('🧹 [AnalysisFlowService] Found broken analysis flow, cleaning up...');
      await this.cleanupBrokenAnalysisFlows(originalImageId);
      return null
    }

    console.log('✅ [AnalysisFlowService] Found active analysis flow:', {
      flowId: data.id,
      totalQuestions: data.total_questions,
      totalAnswers: data.total_answers
    });

    return data
  }

  /**
   * Update analysis flow state
   */
  static async updateAnalysisFlow(
    flowId: string,
    updates: {
      questions?: Question[]
      answers?: QuestionAnswer[]
      totalQuestions?: number
      totalAnswers?: number
      currentStep?: string
      contextData?: Record<string, unknown>
      totalCostUsd?: number
      totalTokens?: number
      final_image_id?: string
    }
  ): Promise<AnalysisFlow> {
    console.log('🔄 [AnalysisFlowService] Updating analysis flow:', flowId.substring(0, 8) + '...');

    const updateData: Partial<AnalysisFlow> = {
      updated_at: new Date().toISOString()
    };

    if (updates.questions !== undefined) {
      updateData.questions = updates.questions;
    }
    if (updates.answers !== undefined) {
      updateData.answers = updates.answers;
    }
    if (updates.totalQuestions !== undefined) {
      updateData.total_questions = updates.totalQuestions;
    }
    if (updates.totalAnswers !== undefined) {
      updateData.total_answers = updates.totalAnswers;
    }
    if (updates.currentStep !== undefined) {
      updateData.current_step = updates.currentStep;
    }
    if (updates.contextData !== undefined) {
      updateData.context_data = updates.contextData;
    }
    if (updates.totalCostUsd !== undefined) {
      updateData.total_cost_usd = updates.totalCostUsd;
    }
    if (updates.totalTokens !== undefined) {
      updateData.total_tokens = updates.totalTokens;
    }
    if (updates.final_image_id !== undefined) {
      updateData.final_image_id = updates.final_image_id;
    }

    const { data, error } = await supabase
      .from('analysis_flows')
      .update(updateData)
      .eq('id', flowId)
      .select()
      .single()

    if (error) {
      console.error('❌ [AnalysisFlowService] Error updating analysis flow:', error);
      throw new Error(`Failed to update analysis flow: ${error.message}`)
    }

    console.log('✅ [AnalysisFlowService] Analysis flow updated successfully:', {
      flowId: data.id,
      totalQuestions: data.total_questions,
      totalAnswers: data.total_answers,
      totalTokens: data.total_tokens,
      questionsCount: data.questions?.length || 0,
      answersCount: data.answers?.length || 0
    });

    return data
  }

  /**
   * Deactivate analysis flow
   */
  static async deactivateAnalysisFlow(flowId: string): Promise<void> {
    console.log('🔄 [AnalysisFlowService] Deactivating analysis flow:', flowId.substring(0, 8) + '...');

    const { error } = await supabase
      .from('analysis_flows')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', flowId)

    if (error) {
      console.error('❌ [AnalysisFlowService] Error deactivating analysis flow:', error);
      throw new Error(`Failed to deactivate analysis flow: ${error.message}`)
    }

    console.log('✅ [AnalysisFlowService] Analysis flow deactivated successfully');
  }

  /**
   * Get analysis flow by ID
   */
  static async getAnalysisFlow(flowId: string): Promise<AnalysisFlow | null> {
    console.log('🔍 [AnalysisFlowService] Getting analysis flow:', flowId.substring(0, 8) + '...');

    const { data, error } = await supabase
      .from('analysis_flows')
      .select('*')
      .eq('id', flowId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('ℹ️ [AnalysisFlowService] Analysis flow not found');
        return null
      }
      console.error('❌ [AnalysisFlowService] Error getting analysis flow:', error);
      return null
    }

    console.log('✅ [AnalysisFlowService] Analysis flow found:', {
      flowId: data.id,
      totalQuestions: data.total_questions,
      totalAnswers: data.total_answers,
      totalTokens: data.total_tokens,
      questionsCount: data.questions?.length || 0,
      answersCount: data.answers?.length || 0,
      isActive: data.is_active
    });

    return data
  }

  /**
   * Get all analysis flows for an image
   */
  static async getAnalysisFlowsForImage(originalImageId: string): Promise<AnalysisFlow[]> {
    console.log('🔍 [AnalysisFlowService] Getting all analysis flows for image:', originalImageId.substring(0, 8) + '...');

    const { data, error } = await supabase
      .from('analysis_flows')
      .select('*')
      .eq('original_image_id', originalImageId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ [AnalysisFlowService] Error getting analysis flows:', error);
      return []
    }

    console.log('✅ [AnalysisFlowService] Found analysis flows:', data.length);

    return data
  }

  /**
   * Add a question to an analysis flow
   */
  static async addQuestion(
    flowId: string,
    question: Question
  ): Promise<AnalysisFlow> {
    console.log('🔄 [AnalysisFlowService] Adding question to flow:', flowId.substring(0, 8) + '...');

    // Get current flow
    const currentFlow = await this.getAnalysisFlow(flowId)
    if (!currentFlow) {
      throw new Error('Analysis flow not found')
    }

    // Add the new question
    const updatedQuestions = [...currentFlow.questions, question]

    return this.updateAnalysisFlow(flowId, {
      questions: updatedQuestions,
      totalQuestions: updatedQuestions.length
    })
  }

  /**
   * Add an answer to a question in an analysis flow
   */
  static async addAnswer(
    flowId: string,
    questionId: string,
    answer: string
  ): Promise<AnalysisFlow> {
    console.log('🔄 [AnalysisFlowService] Adding answer to question:', questionId.substring(0, 8) + '...');

    // Get current flow
    const currentFlow = await this.getAnalysisFlow(flowId)
    if (!currentFlow) {
      throw new Error('Analysis flow not found')
    }

    // Add the new answer
    const newAnswer: QuestionAnswer = {
      questionId,
      answer
    }
    const updatedAnswers = [...currentFlow.answers, newAnswer]

    return this.updateAnalysisFlow(flowId, {
      answers: updatedAnswers,
      totalAnswers: updatedAnswers.length
    })
  }

  /**
   * Add additional image to analysis flow
   */
  static async addAdditionalImage(
    flowId: string,
    imageId: string
  ): Promise<AnalysisFlow> {
    console.log('🖼️ [AnalysisFlowService] Adding additional image to flow:', flowId.substring(0, 8) + '...');

    const currentFlow = await this.getAnalysisFlow(flowId)
    if (!currentFlow) {
      throw new Error('Analysis flow not found')
    }

    const updatedAdditionalImages = [...currentFlow.additional_image_ids, imageId]

    return this.updateAnalysisFlow(flowId, {
      additional_image_ids: updatedAdditionalImages
    } as Partial<AnalysisFlow>)
  }

  /**
   * Set final image for analysis flow
   */
  static async setFinalImage(
    flowId: string,
    imageId: string
  ): Promise<AnalysisFlow> {
    console.log('🎨 [AnalysisFlowService] Setting final image for flow:', flowId.substring(0, 8) + '...');

    return this.updateAnalysisFlow(flowId, {
      final_image_id: imageId
    })
  }

  /**
   * Update cost tracking
   */
  static async updateCosts(
    flowId: string,
    costUsd: number,
    tokens: number
  ): Promise<AnalysisFlow> {
    console.log('💰 [AnalysisFlowService] Updating costs for flow:', flowId.substring(0, 8) + '...');

    const currentFlow = await this.getAnalysisFlow(flowId)
    if (!currentFlow) {
      throw new Error('Analysis flow not found')
    }

    return this.updateAnalysisFlow(flowId, {
      totalCostUsd: currentFlow.total_cost_usd + costUsd,
      totalTokens: currentFlow.total_tokens + tokens
    })
  }

  /**
   * Get all analysis flows (for admin purposes)
   */
  static async getAllAnalysisFlows(): Promise<AnalysisFlow[]> {
    console.log('🔍 [AnalysisFlowService] Getting all analysis flows');

    const { data, error } = await supabase
      .from('analysis_flows')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ [AnalysisFlowService] Error getting all analysis flows:', error);
      return []
    }

    console.log('✅ [AnalysisFlowService] Found analysis flows:', data.length);
    return data || []
  }

  /**
   * End an analysis flow (alias for deactivate)
   */
  static async endAnalysisFlow(flowId: string): Promise<void> {
    return this.deactivateAnalysisFlow(flowId)
  }
}
