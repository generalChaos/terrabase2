import { supabase } from '@/lib/supabase'

export interface AnalysisFlowState {
  currentQuestionIndex: number
  totalQuestions: number
  questions: Array<{
    id: string
    text: string
    options: string[]
    answer?: string
    context?: {
      reasoning: string
      builds_on: string
      artistic_focus: string
    }
  }>
  contextData: {
    imageAnalysis: string
    previousAnswers: string[]
    artisticDirection: string
  }
}

export interface AnalysisFlow {
  id: string
  image_id: string
  session_id: string
  conversation_state: AnalysisFlowState
  current_question_index: number
  total_questions: number
  context_data: AnalysisFlowState['contextData']
  is_active: boolean

  created_at: string
  updated_at: string
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
    imageId: string,
    sessionId: string,
    imageAnalysis: string
  ): Promise<AnalysisFlow> {
    console.log('🔄 [AnalysisFlowService] Creating analysis flow:', {
      imageId: imageId.substring(0, 8) + '...',
      sessionId: sessionId.substring(0, 8) + '...',
      imageAnalysisLength: imageAnalysis.length
    });

    const analysisFlowState: AnalysisFlowState = {
      currentQuestionIndex: 0,
      totalQuestions: 0,
      questions: [],
      contextData: {
        imageAnalysis,
        previousAnswers: [],
        artisticDirection: ''
      }
    }

    console.log('📝 [AnalysisFlowService] Initial state created:', {
      totalQuestions: analysisFlowState.totalQuestions,
      questionsCount: analysisFlowState.questions.length,
      contextDataKeys: Object.keys(analysisFlowState.contextData)
    });

    console.log('🔄 [AnalysisFlowService] Creating new analysis flow:', {
      imageId: imageId.substring(0, 8) + '...',
      sessionId: sessionId.substring(0, 8) + '...',
      isActive: true
    });

    // Create a new analysis flow - each flow is treated as completely separate
    const { data, error } = await supabase
      .from('analysis_flows')
      .insert({
        image_id: imageId,
        session_id: sessionId,
        conversation_state: analysisFlowState,
        current_question_index: 0,
        total_questions: 0,
        context_data: analysisFlowState.contextData,
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
      imageId: data.image_id.substring(0, 8) + '...',
      sessionId: data.session_id.substring(0, 8) + '...'
    });

    return data
  }

  /**
   * Clean up broken analysis flows (active flows with 0 questions)
   */
  static async cleanupBrokenAnalysisFlows(imageId: string): Promise<void> {
    console.log('🧹 [AnalysisFlowService] Cleaning up broken analysis flows for image:', imageId.substring(0, 8) + '...');
    
    const { data, error } = await supabase
      .from('analysis_flows')
      .update({ is_active: false })
      .eq('image_id', imageId)
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
  static async getActiveAnalysisFlow(imageId: string): Promise<AnalysisFlow | null> {
    console.log('🔍 [AnalysisFlowService] Getting active analysis flow for image:', imageId.substring(0, 8) + '...');

    const { data, error } = await supabase
      .from('analysis_flows')
      .select('*')
      .eq('image_id', imageId)
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
      await this.cleanupBrokenAnalysisFlows(imageId);
      return null
    }

    console.log('✅ [AnalysisFlowService] Found active analysis flow:', {
      flowId: data.id,
      totalQuestions: data.total_questions,
      currentQuestionIndex: data.current_question_index
    });

    return data
  }

  /**
   * Update analysis flow state
   */
  static async updateAnalysisFlow(
    flowId: string,
    updates: Partial<AnalysisFlowState>
  ): Promise<AnalysisFlow> {
    console.log('🔄 [AnalysisFlowService] Updating analysis flow:', flowId.substring(0, 8) + '...');

    const { data, error } = await supabase
      .from('analysis_flows')
      .update({
        conversation_state: updates,
        current_question_index: updates.currentQuestionIndex,
        total_questions: updates.totalQuestions,
        context_data: updates.contextData,
        updated_at: new Date().toISOString()
      })
      .eq('id', flowId)
      .select()
      .single()

    if (error) {
      console.error('❌ [AnalysisFlowService] Error updating analysis flow:', error);
      throw new Error(`Failed to update analysis flow: ${error.message}`)
    }

    console.log('✅ [AnalysisFlowService] Analysis flow updated successfully');

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
      isActive: data.is_active
    });

    return data
  }

  /**
   * Get all analysis flows for an image
   */
  static async getAnalysisFlowsForImage(imageId: string): Promise<AnalysisFlow[]> {
    console.log('🔍 [AnalysisFlowService] Getting all analysis flows for image:', imageId.substring(0, 8) + '...');

    const { data, error } = await supabase
      .from('analysis_flows')
      .select('*')
      .eq('image_id', imageId)
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
    question: {
      id: string
      text: string
      options: string[]
      context?: {
        reasoning: string
        builds_on: string
        artistic_focus: string
      }
    }
  ): Promise<AnalysisFlow> {
    console.log('🔄 [AnalysisFlowService] Adding question to flow:', flowId.substring(0, 8) + '...');

    // Get current flow
    const currentFlow = await this.getAnalysisFlow(flowId)
    if (!currentFlow) {
      throw new Error('Analysis flow not found')
    }

    // Update the flow state
    const updatedState = {
      ...currentFlow.conversation_state,
      questions: [...currentFlow.conversation_state.questions, question],
      totalQuestions: currentFlow.conversation_state.totalQuestions + 1
    }

    return this.updateAnalysisFlow(flowId, updatedState)
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

    // Update the question with the answer
    const updatedQuestions = currentFlow.conversation_state.questions.map(q => 
      q.id === questionId ? { ...q, answer } : q
    )

    const updatedState = {
      ...currentFlow.conversation_state,
      questions: updatedQuestions,
      currentQuestionIndex: currentFlow.conversation_state.currentQuestionIndex + 1
    }

    return this.updateAnalysisFlow(flowId, updatedState)
  }

  /**
   * End an analysis flow (alias for deactivate)
   */
  static async endAnalysisFlow(flowId: string): Promise<void> {
    return this.deactivateAnalysisFlow(flowId)
  }
}
