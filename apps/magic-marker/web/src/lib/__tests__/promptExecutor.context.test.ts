import { PromptExecutor } from '../promptExecutor'
import { ContextManager, StepContext } from '../contextManager'

// Mock the dependencies
jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: {
              id: 'test-prompt-id',
              name: 'test_prompt',
              type: 'questions_generation',
              prompt_text: 'Test prompt text',
              input_schema: { type: 'object', properties: { response: { type: 'string' } } },
              output_schema: { type: 'object', properties: { questions: { type: 'array' } } },
              model: 'gpt-4o',
              response_format: 'json_object',
              max_tokens: 1000,
              temperature: 0.7,
              active: true
            },
            error: null
          }))
        }))
      }))
    }))
  }
}))

jest.mock('../openai', () => ({
  getOpenAIClient: jest.fn(() => ({
    chat: {
      completions: {
        create: jest.fn(() => Promise.resolve({
          choices: [{ message: { content: '{"questions": []}' } }],
          usage: { total_tokens: 100 }
        }))
      }
    }
  }))
}))

describe('PromptExecutor with Context', () => {
  const mockContext: StepContext = {
    flowId: 'test-flow-id',
    sessionId: 'test-session-id',
    currentStep: 'questions_generation',
    stepOrder: 1,
    contextData: {
      imageAnalysis: 'Test image analysis',
      previousAnswers: [],
      artisticDirection: 'Test artistic direction',
      stepResults: {},
      conversationHistory: [],
      userPreferences: {
        stylePreferences: ['Realistic'],
        colorPreferences: ['Warm'],
        moodPreferences: ['Serene'],
        compositionPreferences: ['Centered']
      },
      metadata: {
        totalTokens: 0,
        totalCost: 0,
        lastUpdated: new Date().toISOString(),
        flowId: 'test-flow-id',
        sessionId: 'test-session-id'
      }
    }
  }

  describe('execute with context', () => {
    it('should execute prompt with context when provided', async () => {
      const input = { response: 'Test response' }
      
      const result = await PromptExecutor.execute(
        'questions_generation',
        input,
        mockContext
      )

      expect(result).toBeDefined()
    })

    it('should execute prompt without context when not provided', async () => {
      const input = { response: 'Test response' }
      
      const result = await PromptExecutor.execute(
        'questions_generation',
        input
      )

      expect(result).toBeDefined()
    })

    it('should build context-aware prompt for questions_generation', async () => {
      const input = { response: 'Test response' }
      
      // Mock console.log to capture the prompt building
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      await PromptExecutor.execute(
        'questions_generation',
        input,
        mockContext
      )

      // Check that context-aware prompt building was called
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Building context-aware prompt for step: questions_generation')
      )

      consoleSpy.mockRestore()
    })

    it('should build context-aware prompt for conversational_question', async () => {
      const conversationalContext: StepContext = {
        ...mockContext,
        currentStep: 'conversational_question',
        contextData: {
          ...mockContext.contextData,
          stepResults: {
            questions_generation: {
              input: { response: 'Test analysis' },
              output: { questions: [{ id: 'q1', text: 'Test question?', type: 'multiple_choice', options: ['A', 'B'], required: true }] },
              timestamp: new Date().toISOString(),
              success: true
            }
          }
        }
      }

      const input = { response: 'Test analysis', previousAnswers: [] }
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      await PromptExecutor.execute(
        'questions_generation',
        input,
        conversationalContext
      )

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Building context-aware prompt for step: conversational_question')
      )

      consoleSpy.mockRestore()
    })

    it('should build context-aware prompt for image_generation', async () => {
      const imageGenContext: StepContext = {
        ...mockContext,
        currentStep: 'image_generation',
        contextData: {
          ...mockContext.contextData,
          stepResults: {
            questions_generation: {
              input: { response: 'Test analysis' },
              output: { questions: [] },
              timestamp: new Date().toISOString(),
              success: true
            },
            conversational_question: {
              input: { response: 'Test analysis', previousAnswers: [] },
              output: { questions: [], done: true },
              timestamp: new Date().toISOString(),
              success: true
            }
          }
        }
      }

      const input = { prompt: 'Generate image based on context' }
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      await PromptExecutor.execute(
        'questions_generation',
        input,
        imageGenContext
      )

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Building context-aware prompt for step: image_generation')
      )

      consoleSpy.mockRestore()
    })
  })

  describe('backward compatibility', () => {
    it('should work with existing API without context', async () => {
      const input = { response: 'Test response' }
      
      // This should work exactly as before
      const result = await PromptExecutor.execute(
        'questions_generation',
        input
      )

      expect(result).toBeDefined()
    })
  })
})
