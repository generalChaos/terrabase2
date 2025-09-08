import { ContextManager } from '../contextManager'
import { AnalysisFlowService } from '../analysisFlowService'

describe('ContextManager Integration', () => {
  // Mock Supabase to avoid actual database calls
  jest.mock('../supabase', () => ({
    supabase: {
      from: jest.fn(() => ({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => ({
              data: {
                id: 'test-flow-id',
                session_id: 'test-session-id',
                context_data: {}
              },
              error: null
            }))
          }))
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => ({
                data: {
                  id: 'test-flow-id',
                  context_data: {}
                },
                error: null
              }))
            }))
          }))
        }))
      }))
    }
  }))

  describe('Integration with AnalysisFlowService', () => {
    it('should work with existing context_data structure', async () => {
      // Test that ContextManager can work with the existing context_data format
      const existingContextData = {
        imageAnalysis: 'Test image analysis',
        previousAnswers: ['Answer 1', 'Answer 2'],
        artisticDirection: 'Test artistic direction'
      }

      // Build context for a step
      const stepContext = ContextManager.buildContextForStep(
        'test-flow-id',
        'test-session-id',
        'questions_generation',
        1,
        existingContextData
      )

      expect(stepContext.contextData.imageAnalysis).toBe('Test image analysis')
      expect(stepContext.contextData.previousAnswers).toEqual(['Answer 1', 'Answer 2'])
      expect(stepContext.contextData.artisticDirection).toBe('Test artistic direction')
    })

    it('should maintain backward compatibility', () => {
      // Test that the enhanced context can be converted back to the original format
      const originalContext = {
        imageAnalysis: 'Test analysis',
        previousAnswers: ['Answer 1'],
        artisticDirection: 'Test direction'
      }

      const enhancedContext = ContextManager.buildContextForStep(
        'test-flow-id',
        'test-session-id',
        'questions_generation',
        1,
        originalContext
      )

      // The enhanced context should contain all original fields
      expect(enhancedContext.contextData.imageAnalysis).toBe(originalContext.imageAnalysis)
      expect(enhancedContext.contextData.previousAnswers).toEqual(originalContext.previousAnswers)
      expect(enhancedContext.contextData.artisticDirection).toBe(originalContext.artisticDirection)
    })

    it('should handle step result updates', () => {
      const contextData = {
        imageAnalysis: 'Test analysis',
        previousAnswers: [],
        artisticDirection: ''
      }

      // Update with step result
      const updatedContext = ContextManager.updateContextWithStepResult(
        contextData,
        'questions_generation',
        {
          input: { response: 'Test analysis' },
          output: { questions: [] },
          success: true,
          tokensUsed: 150,
          costUsd: 0.02
        }
      )

      expect(updatedContext.stepResults.questions_generation).toBeDefined()
      expect(updatedContext.stepResults.questions_generation.success).toBe(true)
      expect(updatedContext.stepResults.questions_generation.tokensUsed).toBe(150)
      expect(updatedContext.metadata.totalTokens).toBe(150)
      expect(updatedContext.metadata.totalCost).toBe(0.02)
    })
  })

  describe('Context Requirements', () => {
    it('should provide correct context for questions_generation', () => {
      const contextData = {
        imageAnalysis: 'Test analysis',
        artisticDirection: 'Test direction',
        stepResults: {}
      }

      const relevantContext = ContextManager.getRelevantContextForStep(
        contextData,
        'questions_generation'
      )

      expect(relevantContext.imageAnalysis).toBe('Test analysis')
      expect(relevantContext.artisticDirection).toBe('Test direction')
    })

    it('should provide correct context for conversational_question', () => {
      const contextData = {
        imageAnalysis: 'Test analysis',
        stepResults: {
          questions_generation: {
            input: { response: 'Test analysis' },
            output: { questions: [] },
            timestamp: '2023-01-01T00:00:00Z',
            success: true
          }
        },
        conversationHistory: []
      }

      const relevantContext = ContextManager.getRelevantContextForStep(
        contextData,
        'conversational_question'
      )

      expect(relevantContext.imageAnalysis).toBe('Test analysis')
      expect(relevantContext.stepResults.questions_generation).toBeDefined()
    })

    it('should provide correct context for image_generation', () => {
      const contextData = {
        imageAnalysis: 'Test analysis',
        stepResults: {
          questions_generation: {
            input: { response: 'Test analysis' },
            output: { questions: [] },
            timestamp: '2023-01-01T00:00:00Z',
            success: true
          },
          conversational_question: {
            input: { response: 'Test analysis', previousAnswers: [] },
            output: { questions: [], done: true },
            timestamp: '2023-01-01T00:00:00Z',
            success: true
          }
        }
      }

      const relevantContext = ContextManager.getRelevantContextForStep(
        contextData,
        'image_generation'
      )

      expect(relevantContext.imageAnalysis).toBe('Test analysis')
      expect(relevantContext.stepResults.questions_generation).toBeDefined()
      expect(relevantContext.stepResults.conversational_question).toBeDefined()
    })
  })
})
