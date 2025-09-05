import { supabase } from '@/lib/supabase'

export interface QuestionSessionState {
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

export interface QuestionSession {
  id: string
  image_id: string
  session_id: string
  conversation_state: QuestionSessionState
  current_question_index: number
  total_questions: number
  context_data: QuestionSessionState['contextData']
  is_active: boolean

  created_at: string
  updated_at: string
}

export class QuestionSessionService {
  /**
   * Generate a unique session ID
   */
  static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Create a new question session for an image
   */
  static async createQuestionSession(
    imageId: string,
    sessionId: string,
    imageAnalysis: string
  ): Promise<QuestionSession> {
    console.log('🔄 [QuestionSessionService] Creating question session:', {
      imageId: imageId.substring(0, 8) + '...',
      sessionId: sessionId.substring(0, 8) + '...',
      imageAnalysisLength: imageAnalysis.length
    });

    const questionSessionState: QuestionSessionState = {
      currentQuestionIndex: 0,
      totalQuestions: 0,
      questions: [],
      contextData: {
        imageAnalysis,
        previousAnswers: [],
        artisticDirection: ''
      }
    }

    console.log('📝 [QuestionSessionService] Initial state created:', {
      totalQuestions: questionSessionState.totalQuestions,
      questionsCount: questionSessionState.questions.length,
      contextDataKeys: Object.keys(questionSessionState.contextData)
    });

    console.log('🔄 [QuestionSessionService] Creating new question session:', {
      imageId: imageId.substring(0, 8) + '...',
      sessionId: sessionId.substring(0, 8) + '...',
      isActive: true
    });

    // Create a new question session - each session is treated as completely separate
    const { data, error } = await supabase
      .from('question_sessions')
      .insert({
        image_id: imageId,
        session_id: sessionId,
        conversation_state: questionSessionState,
        current_question_index: 0,
        total_questions: 0,
        context_data: questionSessionState.contextData,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('❌ [QuestionSessionService] Error creating question session:', error);
      console.error('❌ [QuestionSessionService] Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw new Error(`Failed to create question session: ${error.message}`)
    }

    console.log('✅ [QuestionSessionService] Question session created successfully:', {
      sessionId: data.id,
      imageId: data.image_id.substring(0, 8) + '...',
      sessionId: data.session_id.substring(0, 8) + '...'
    });

    return data
  }

  /**
   * Clean up broken question sessions (active sessions with 0 questions)
   */
  static async cleanupBrokenQuestionSessions(imageId: string): Promise<void> {
    console.log('🧹 [QuestionSessionService] Cleaning up broken question sessions for image:', imageId.substring(0, 8) + '...');
    
    const { data, error } = await supabase
      .from('question_sessions')
      .update({ is_active: false })
      .eq('image_id', imageId)
      .eq('is_active', true)
      .eq('total_questions', 0)
      .select();

    if (error) {
      console.error('❌ [QuestionSessionService] Error cleaning up broken question sessions:', error);
    } else {
      console.log('✅ [QuestionSessionService] Cleaned up broken question sessions:', data);
    }
  }

  /**
   * Get active question session for an image
   */
  static async getActiveQuestionSession(imageId: string): Promise<QuestionSession | null> {
    console.log('🔍 [QuestionSessionService] Getting active question session for image:', imageId.substring(0, 8) + '...');

    const { data, error } = await supabase
      .from('question_sessions')
      .select('*')
      .eq('image_id', imageId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('ℹ️ [QuestionSessionService] No active question session found');
        return null
      }
      console.error('❌ [QuestionSessionService] Error getting active question session:', error);
      return null
    }

    // Check if this is a broken session (active but has 0 questions)
    if (data.total_questions === 0) {
      console.log('🧹 [QuestionSessionService] Found broken question session, cleaning up...');
      await this.cleanupBrokenQuestionSessions(imageId);
      return null
    }

    console.log('✅ [QuestionSessionService] Found active question session:', {
      sessionId: data.id,
      totalQuestions: data.total_questions,
      currentQuestionIndex: data.current_question_index
    });

    return data
  }

  /**
   * Update question session state
   */
  static async updateQuestionSession(
    sessionId: string,
    updates: Partial<QuestionSessionState>
  ): Promise<QuestionSession> {
    console.log('🔄 [QuestionSessionService] Updating question session:', sessionId.substring(0, 8) + '...');

    const { data, error } = await supabase
      .from('question_sessions')
      .update({
        conversation_state: updates,
        current_question_index: updates.currentQuestionIndex,
        total_questions: updates.totalQuestions,
        context_data: updates.contextData,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .select()
      .single()

    if (error) {
      console.error('❌ [QuestionSessionService] Error updating question session:', error);
      throw new Error(`Failed to update question session: ${error.message}`)
    }

    console.log('✅ [QuestionSessionService] Question session updated successfully');

    return data
  }

  /**
   * Deactivate question session
   */
  static async deactivateQuestionSession(sessionId: string): Promise<void> {
    console.log('🔄 [QuestionSessionService] Deactivating question session:', sessionId.substring(0, 8) + '...');

    const { error } = await supabase
      .from('question_sessions')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)

    if (error) {
      console.error('❌ [QuestionSessionService] Error deactivating question session:', error);
      throw new Error(`Failed to deactivate question session: ${error.message}`)
    }

    console.log('✅ [QuestionSessionService] Question session deactivated successfully');
  }

  /**
   * Get question session by ID
   */
  static async getQuestionSession(sessionId: string): Promise<QuestionSession | null> {
    console.log('🔍 [QuestionSessionService] Getting question session:', sessionId.substring(0, 8) + '...');

    const { data, error } = await supabase
      .from('question_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('ℹ️ [QuestionSessionService] Question session not found');
        return null
      }
      console.error('❌ [QuestionSessionService] Error getting question session:', error);
      return null
    }

    console.log('✅ [QuestionSessionService] Question session found:', {
      sessionId: data.id,
      totalQuestions: data.total_questions,
      isActive: data.is_active
    });

    return data
  }

  /**
   * Get all question sessions for an image
   */
  static async getQuestionSessionsForImage(imageId: string): Promise<QuestionSession[]> {
    console.log('🔍 [QuestionSessionService] Getting all question sessions for image:', imageId.substring(0, 8) + '...');

    const { data, error } = await supabase
      .from('question_sessions')
      .select('*')
      .eq('image_id', imageId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ [QuestionSessionService] Error getting question sessions:', error);
      return []
    }

    console.log('✅ [QuestionSessionService] Found question sessions:', data.length);

    return data
  }

  /**
   * Add a question to a question session
   */
  static async addQuestion(
    sessionId: string,
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
  ): Promise<QuestionSession> {
    console.log('🔄 [QuestionSessionService] Adding question to session:', sessionId.substring(0, 8) + '...');

    // Get current session
    const currentSession = await this.getQuestionSession(sessionId)
    if (!currentSession) {
      throw new Error('Question session not found')
    }

    // Update the session state
    const updatedState = {
      ...currentSession.conversation_state,
      questions: [...currentSession.conversation_state.questions, question],
      totalQuestions: currentSession.conversation_state.totalQuestions + 1
    }

    return this.updateQuestionSession(sessionId, updatedState)
  }

  /**
   * Add an answer to a question in a question session
   */
  static async addAnswer(
    sessionId: string,
    questionId: string,
    answer: string
  ): Promise<QuestionSession> {
    console.log('🔄 [QuestionSessionService] Adding answer to question:', questionId.substring(0, 8) + '...');

    // Get current session
    const currentSession = await this.getQuestionSession(sessionId)
    if (!currentSession) {
      throw new Error('Question session not found')
    }

    // Update the question with the answer
    const updatedQuestions = currentSession.conversation_state.questions.map(q => 
      q.id === questionId ? { ...q, answer } : q
    )

    const updatedState = {
      ...currentSession.conversation_state,
      questions: updatedQuestions,
      currentQuestionIndex: currentSession.conversation_state.currentQuestionIndex + 1
    }

    return this.updateQuestionSession(sessionId, updatedState)
  }

  /**
   * End a question session (alias for deactivate)
   */
  static async endQuestionSession(sessionId: string): Promise<void> {
    return this.deactivateQuestionSession(sessionId)
  }
}
