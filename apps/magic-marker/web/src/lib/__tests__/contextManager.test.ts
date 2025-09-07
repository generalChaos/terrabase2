import { ContextManager, EnhancedContextData, ConversationEntry } from '../contextManager'
import { Question } from '../newTypes'

describe('ContextManager', () => {
  const mockFlowId = 'test-flow-id'
  const mockSessionId = 'test-session-id'
  const mockQuestion: Question = {
    id: 'test-question-id',
    text: 'Test question?',
    type: 'multiple_choice',
    options: ['Option 1', 'Option 2'],
    required: true
  }

  describe('buildContextForStep', () => {
    it('should build context with existing data', () => {
      const existingContext = {
        imageAnalysis: 'Test analysis',
        previousAnswers: ['Answer 1'],
        artisticDirection: 'Test direction'
      }

      const result = ContextManager.buildContextForStep(
        mockFlowId,
        mockSessionId,
        'questions_generation',
        1,
        existingContext
      )

      expect(result.flowId).toBe(mockFlowId)
      expect(result.sessionId).toBe(mockSessionId)
      expect(result.currentStep).toBe('questions_generation')
      expect(result.stepOrder).toBe(1)
      expect(result.contextData.imageAnalysis).toBe('Test analysis')
      expect(result.contextData.previousAnswers).toEqual(['Answer 1'])
      expect(result.contextData.artisticDirection).toBe('Test direction')
    })

    it('should build context with empty data', () => {
      const result = ContextManager.buildContextForStep(
        mockFlowId,
        mockSessionId,
        'questions_generation',
        1,
        {}
      )

      expect(result.contextData.imageAnalysis).toBe('')
      expect(result.contextData.previousAnswers).toEqual([])
      expect(result.contextData.artisticDirection).toBe('')
      expect(result.contextData.stepResults).toEqual({})
    })
  })

  describe('updateContextWithStepResult', () => {
    it('should update context with step result', () => {
      const existingContext = {
        imageAnalysis: 'Test analysis',
        previousAnswers: [],
        artisticDirection: ''
      }

      const stepResult = {
        input: { response: 'Test input' },
        output: { questions: [mockQuestion] },
        success: true,
        tokensUsed: 100,
        costUsd: 0.01
      }

      const result = ContextManager.updateContextWithStepResult(
        existingContext,
        'questions_generation',
        stepResult
      )

      expect(result.stepResults.questions_generation).toEqual({
        input: stepResult.input,
        output: stepResult.output,
        timestamp: expect.any(String),
        success: true,
        tokensUsed: 100,
        costUsd: 0.01
      })
      expect(result.metadata.totalTokens).toBe(100)
      expect(result.metadata.totalCost).toBe(0.01)
    })
  })

  describe('getRelevantContextForStep', () => {
    it('should return relevant context for questions_generation', () => {
      const contextData = {
        imageAnalysis: 'Test analysis',
        artisticDirection: 'Test direction',
        stepResults: {
          image_analysis: {
            input: { image: 'base64' },
            output: { response: 'Test analysis' },
            timestamp: '2023-01-01T00:00:00Z',
            success: true
          }
        }
      }

      const result = ContextManager.getRelevantContextForStep(
        contextData,
        'questions_generation'
      )

      expect(result.imageAnalysis).toBe('Test analysis')
      expect(result.artisticDirection).toBe('Test direction')
    })

    it('should return relevant context for conversational_question', () => {
      const contextData = {
        imageAnalysis: 'Test analysis',
        stepResults: {
          questions_generation: {
            input: { response: 'Test analysis' },
            output: { questions: [mockQuestion] },
            timestamp: '2023-01-01T00:00:00Z',
            success: true
          }
        },
        conversationHistory: []
      }

      const result = ContextManager.getRelevantContextForStep(
        contextData,
        'conversational_question'
      )

      expect(result.imageAnalysis).toBe('Test analysis')
      expect(result.stepResults.questions_generation).toBeDefined()
    })

    it('should return relevant context for image_generation', () => {
      const contextData = {
        imageAnalysis: 'Test analysis',
        stepResults: {
          questions_generation: {
            input: { response: 'Test analysis' },
            output: { questions: [mockQuestion] },
            timestamp: '2023-01-01T00:00:00Z',
            success: true
          },
          conversational_question: {
            input: { response: 'Test analysis', previousAnswers: [] },
            output: { questions: [mockQuestion], done: true },
            timestamp: '2023-01-01T00:00:00Z',
            success: true
          }
        }
      }

      const result = ContextManager.getRelevantContextForStep(
        contextData,
        'image_generation'
      )

      expect(result.imageAnalysis).toBe('Test analysis')
      expect(result.stepResults.questions_generation).toBeDefined()
      expect(result.stepResults.conversational_question).toBeDefined()
    })
  })

  describe('addConversationEntry', () => {
    it('should add conversation entry to context', () => {
      const existingContext = {
        imageAnalysis: 'Test analysis',
        previousAnswers: [],
        artisticDirection: '',
        conversationHistory: []
      }

      const result = ContextManager.addConversationEntry(
        existingContext,
        'conversational_question',
        mockQuestion,
        'Test answer'
      )

      expect(result.conversationHistory).toHaveLength(1)
      expect(result.conversationHistory[0].step).toBe('conversational_question')
      expect(result.conversationHistory[0].question).toBe(mockQuestion)
      expect(result.conversationHistory[0].answer).toBe('Test answer')
    })
  })

  describe('updateUserPreferences', () => {
    it('should update user preferences in context', () => {
      const existingContext = {
        imageAnalysis: 'Test analysis',
        previousAnswers: [],
        artisticDirection: '',
        userPreferences: {
          stylePreferences: [],
          colorPreferences: [],
          moodPreferences: [],
          compositionPreferences: []
        }
      }

      const preferences = {
        stylePreferences: ['Realistic', 'Cartoon'],
        colorPreferences: ['Warm', 'Cool']
      }

      const result = ContextManager.updateUserPreferences(
        existingContext,
        preferences
      )

      expect(result.userPreferences.stylePreferences).toEqual(['Realistic', 'Cartoon'])
      expect(result.userPreferences.colorPreferences).toEqual(['Warm', 'Cool'])
    })
  })

  describe('getContextSummary', () => {
    it('should return context summary', () => {
      const contextData = {
        imageAnalysis: 'Test analysis',
        previousAnswers: [],
        artisticDirection: '',
        stepResults: {
          image_analysis: {
            input: {},
            output: {},
            timestamp: '2023-01-01T00:00:00Z',
            success: true,
            tokensUsed: 100,
            costUsd: 0.01
          }
        },
        conversationHistory: [],
        metadata: {
          totalTokens: 100,
          totalCost: 0.01,
          lastUpdated: '2023-01-01T00:00:00Z'
        }
      }

      const result = ContextManager.getContextSummary(contextData)

      expect(result.hasImageAnalysis).toBe(true)
      expect(result.stepCount).toBe(1)
      expect(result.conversationCount).toBe(0)
      expect(result.totalTokens).toBe(100)
      expect(result.totalCost).toBe(0.01)
    })
  })
})
