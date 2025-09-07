import { PromptExecutor } from '../promptExecutor';
import { supabase } from '../supabase';

// Mock dependencies
jest.mock('../supabase');
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn()
      }
    },
    images: {
      generate: jest.fn()
    }
  }))
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('PromptExecutor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const mockPromptDefinition = {
      id: 'test-prompt-id',
      name: 'test_prompt',
      type: 'image_analysis',
      prompt_text: 'Analyze this image: {prompt}',
      model: 'gpt-4o',
      temperature: 0.7,
      max_tokens: 1000,
      response_format: 'json_object',
      input_schema: {
        type: 'object',
        required: ['image', 'prompt'],
        properties: {
          image: { type: 'string' },
          prompt: { type: 'string' }
        }
      },
      output_schema: {
        type: 'object',
        required: ['response'],
        properties: {
          response: { type: 'string' }
        }
      },
      active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    };

    it('should handle prompt definition not found', async () => {
      const mockQuery = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({
                data: null,
                error: { code: 'PGRST116' }
              }))
            }))
          }))
        }))
      };
      mockSupabase.from.mockReturnValue(mockQuery as jest.MockedFunction<typeof mockSupabase.from>);

      await expect(
        PromptExecutor.execute('nonexistent_prompt', { prompt: 'test' })
      ).rejects.toThrow('Configuration Error: Prompt definition not found: nonexistent_prompt');
    });

    it('should handle input validation failure', async () => {
      const invalidPromptDefinition = {
        ...mockPromptDefinition,
        input_schema: {
          type: 'object',
          required: ['image', 'prompt'],
          properties: {
            image: { type: 'string' },
            prompt: { type: 'string' }
          }
        }
      };

      const mockQuery = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({
                data: invalidPromptDefinition,
                error: null
              }))
            }))
          }))
        }))
      };
      mockSupabase.from.mockReturnValue(mockQuery as jest.MockedFunction<typeof mockSupabase.from>);

      await expect(
        PromptExecutor.execute('test_prompt', { prompt: 'test' })
      ).rejects.toThrow('Input Error: Input validation failed: Missing required field: image');
    });
  });

  describe('clearCache', () => {
    it('should clear cache for specific prompt', () => {
      // This is a static method, so we can't easily test the internal cache
      // But we can test that it doesn't throw
      expect(() => PromptExecutor.clearCache('test_prompt')).not.toThrow();
    });

    it('should clear all cache', () => {
      expect(() => PromptExecutor.clearCache()).not.toThrow();
    });
  });
});