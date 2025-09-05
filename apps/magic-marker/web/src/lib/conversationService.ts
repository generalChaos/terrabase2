import { supabase } from '@/lib/supabase'

export interface ConversationState {
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

export interface Conversation {
  id: string
  image_id: string
  session_id: string
  conversation_state: ConversationState
  current_question_index: number
  total_questions: number
  context_data: ConversationState['contextData']
  is_active: boolean
  created_at: string
  updated_at: string
}

export class ConversationService {
  /**
   * Create a new conversation for an image
   */
  static async createConversation(
    imageId: string,
    sessionId: string,
    imageAnalysis: string
  ): Promise<Conversation> {
    console.log('🔄 [ConversationService] Creating conversation:', {
      imageId: imageId.substring(0, 8) + '...',
      sessionId: sessionId.substring(0, 8) + '...',
      imageAnalysisLength: imageAnalysis.length
    });

    const conversationState: ConversationState = {
      currentQuestionIndex: 0,
      totalQuestions: 0,
      questions: [],
      contextData: {
        imageAnalysis,
        previousAnswers: [],
        artisticDirection: ''
      }
    }

    console.log('📝 [ConversationService] Initial state created:', {
      totalQuestions: conversationState.totalQuestions,
      questionsCount: conversationState.questions.length,
      contextDataKeys: Object.keys(conversationState.contextData)
    });

    console.log('🔄 [ConversationService] Creating new conversation:', {
      imageId: imageId.substring(0, 8) + '...',
      sessionId: sessionId.substring(0, 8) + '...',
      isActive: true
    });

    // Create a new conversation - each conversation is treated as completely separate
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        image_id: imageId,
        session_id: sessionId,
        conversation_state: conversationState,
        current_question_index: 0,
        total_questions: 0,
        context_data: conversationState.contextData,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('❌ [ConversationService] Error creating conversation:', error);
      console.error('❌ [ConversationService] Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw new Error(`Failed to create conversation: ${error.message}`)
    }

    console.log('✅ [ConversationService] Conversation created/updated successfully:', {
      conversationId: data.id,
      imageId: data.image_id.substring(0, 8) + '...',
      sessionId: data.session_id.substring(0, 8) + '...'
    });

    return data
  }

  /**
   * Clean up broken conversations (active conversations with 0 questions)
   */
  static async cleanupBrokenConversations(imageId: string): Promise<void> {
    console.log('🧹 [ConversationService] Cleaning up broken conversations for image:', imageId.substring(0, 8) + '...');
    
    const { error } = await supabase
      .from('conversations')
      .update({ is_active: false })
      .eq('image_id', imageId)
      .eq('is_active', true)
      .eq('total_questions', 0);

    if (error) {
      console.error('❌ [ConversationService] Error cleaning up broken conversations:', error);
    } else {
      console.log('✅ [ConversationService] Broken conversations cleaned up');
    }
  }

  /**
   * Get active conversation for an image
   */
  static async getActiveConversation(imageId: string): Promise<Conversation | null> {
    console.log('🔍 [ConversationService] Getting active conversation for image:', imageId.substring(0, 8) + '...');
    
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('image_id', imageId)
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('ℹ️ [ConversationService] No active conversation found');
        return null // No active conversation found
      }
      console.error('❌ [ConversationService] Error fetching active conversation:', error);
      throw new Error(`Failed to get conversation: ${error.message}`)
    }

    console.log('🔍 [ConversationService] Found conversation:', {
      conversationId: data.id,
      totalQuestions: data.total_questions,
      questionsCount: data.conversation_state?.questions?.length || 0,
      isActive: data.is_active
    });

    // Check if this is a broken conversation (0 questions)
    if (data.total_questions === 0 || (data.conversation_state?.questions?.length || 0) === 0) {
      console.log('🧹 [ConversationService] Found broken conversation, cleaning up...');
      await this.cleanupBrokenConversations(imageId);
      return null; // Return null so a new conversation can be created
    }

    console.log('✅ [ConversationService] Found valid active conversation:', {
      conversationId: data.id,
      questionsCount: data.conversation_state?.questions?.length || 0,
      totalQuestions: data.conversation_state?.totalQuestions || 0
    });

    return data
  }

  /**
   * Update conversation state
   */
  static async updateConversation(
    conversationId: string, 
    updates: Partial<ConversationState>
  ): Promise<Conversation> {
    console.log('🔄 [ConversationService] Updating conversation:', {
      conversationId: conversationId.substring(0, 8) + '...',
      updates: {
        questionsCount: updates.questions?.length,
        totalQuestions: updates.totalQuestions,
        currentQuestionIndex: updates.currentQuestionIndex,
        previousAnswersCount: updates.contextData?.previousAnswers?.length
      }
    });

    const { data, error } = await supabase
      .from('conversations')
      .update({
        conversation_state: updates,
        current_question_index: updates.currentQuestionIndex,
        total_questions: updates.totalQuestions,
        context_data: updates.contextData,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId)
      .select()
      .single()

    if (error) {
      console.error('❌ [ConversationService] Error updating conversation:', error);
      throw new Error(`Failed to update conversation: ${error.message}`)
    }

    console.log('✅ [ConversationService] Conversation updated successfully');
    return data
  }

  /**
   * Add a question to the conversation
   */
  static async addQuestion(
    conversationId: string,
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
  ): Promise<Conversation> {
    console.log('➕ [ConversationService] Adding question to conversation:', {
      conversationId: conversationId.substring(0, 8) + '...',
      questionId: question.id,
      questionText: question.text.substring(0, 50) + '...',
      optionsCount: question.options.length
    });

    const conversation = await this.getConversationById(conversationId)
    if (!conversation) {
      console.error('❌ [ConversationService] Conversation not found:', conversationId);
      throw new Error('Conversation not found')
    }

    const updatedState = {
      ...conversation.conversation_state,
      questions: [...conversation.conversation_state.questions, question],
      totalQuestions: conversation.conversation_state.totalQuestions + 1
    }

    console.log('📝 [ConversationService] Updated conversation state:', {
      questionsCount: updatedState.questions.length,
      totalQuestions: updatedState.totalQuestions
    });

    const result = await this.updateConversation(conversationId, updatedState);
    console.log('✅ [ConversationService] Question added successfully');
    return result;
  }

  /**
   * Add an answer to the conversation
   */
  static async addAnswer(
    conversationId: string,
    questionId: string,
    answer: string
  ): Promise<Conversation> {
    console.log('💬 [ConversationService] Adding answer to conversation:', {
      conversationId: conversationId.substring(0, 8) + '...',
      questionId: questionId,
      answer: answer
    });

    const conversation = await this.getConversationById(conversationId)
    if (!conversation) {
      console.error('❌ [ConversationService] Conversation not found:', conversationId);
      throw new Error('Conversation not found')
    }

    const updatedState = {
      ...conversation.conversation_state,
      questions: conversation.conversation_state.questions.map(q => 
        q.id === questionId ? { ...q, answer } : q
      ),
      contextData: {
        ...conversation.conversation_state.contextData,
        previousAnswers: [...conversation.conversation_state.contextData.previousAnswers, answer]
      }
    }

    console.log('📝 [ConversationService] Updated conversation state with answer:', {
      questionsCount: updatedState.questions.length,
      previousAnswersCount: updatedState.contextData.previousAnswers.length
    });

    const result = await this.updateConversation(conversationId, updatedState);
    console.log('✅ [ConversationService] Answer added successfully');
    return result;
  }

  /**
   * Get conversation by ID
   */
  static async getConversationById(conversationId: string): Promise<Conversation | null> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to get conversation: ${error.message}`)
    }

    return data
  }

  /**
   * End conversation (mark as inactive)
   */
  static async endConversation(conversationId: string): Promise<void> {
    console.log('🏁 [ConversationService] Ending conversation:', {
      conversationId: conversationId.substring(0, 8) + '...'
    });

    const { error } = await supabase
      .from('conversations')
      .update({ is_active: false })
      .eq('id', conversationId)

    if (error) {
      console.error('❌ [ConversationService] Error ending conversation:', error);
      throw new Error(`Failed to end conversation: ${error.message}`)
    }

    console.log('✅ [ConversationService] Conversation ended successfully');
  }

  /**
   * Generate a unique session ID
   */
  static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
  }
}
