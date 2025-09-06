import { OpenAIService } from '../openai';
import { PromptExecutor } from '../promptExecutor';
import { StepService } from '../stepService';
import { Question } from '../newTypes';

// Mock dependencies
jest.mock('../promptExecutor');
jest.mock('../stepService');

const mockPromptExecutor = PromptExecutor as jest.Mocked<typeof PromptExecutor>;
const mockStepService = StepService as jest.Mocked<typeof StepService>;

describe('OpenAIService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeImage', () => {
    it('should analyze image successfully', async () => {
      const mockResult = { response: 'This is a beautiful landscape' };
      mockPromptExecutor.execute.mockResolvedValue(mockResult);

      const result = await OpenAIService.analyzeImage('base64-image-data', 'test-image-id');

      expect(result).toEqual(mockResult);
      expect(mockPromptExecutor.execute).toHaveBeenCalledWith('image_analysis', {
        image: 'base64-image-data',
        prompt: 'Analyze this image and describe what you see, focusing on artistic elements, composition, colors, and mood.'
      });
      expect(mockStepService.logStep).toHaveBeenCalledWith({
        flow_id: 'test-image-id',
        step_type: 'analysis',
        step_order: 1,
        input_data: {
          image_base64_length: 'base64-image-data'.length,
          prompt: 'Default analysis prompt'
        },
        output_data: mockResult,
        response_time_ms: 0,
        model_used: 'gpt-4o',
        success: true
      });
    });

    it('should analyze image with custom prompt', async () => {
      const mockResult = { response: 'Custom analysis' };
      mockPromptExecutor.execute.mockResolvedValue(mockResult);

      const result = await OpenAIService.analyzeImage(
        'base64-image-data',
        'test-image-id',
        'Custom analysis prompt'
      );

      expect(result).toEqual(mockResult);
      expect(mockPromptExecutor.execute).toHaveBeenCalledWith('image_analysis', {
        image: 'base64-image-data',
        prompt: 'Custom analysis prompt'
      });
    });

    it('should handle analysis failure', async () => {
      const error = new Error('Analysis failed');
      mockPromptExecutor.execute.mockRejectedValue(error);

      await expect(
        OpenAIService.analyzeImage('base64-image-data', 'test-image-id')
      ).rejects.toThrow('Analysis failed');

      expect(mockStepService.logStep).toHaveBeenCalledWith({
        flow_id: 'test-image-id',
        step_type: 'analysis',
        step_order: 1,
        input_data: {
          image_base64_length: 'base64-image-data'.length,
          prompt: 'Default analysis prompt'
        },
        output_data: null,
        response_time_ms: 0,
        model_used: 'gpt-4o',
        success: false,
        error_message: 'Analysis failed'
      });
    });

    it('should work without imageId (no step logging)', async () => {
      const mockResult = { response: 'Analysis without logging' };
      mockPromptExecutor.execute.mockResolvedValue(mockResult);

      const result = await OpenAIService.analyzeImage('base64-image-data');

      expect(result).toEqual(mockResult);
      expect(mockStepService.logStep).not.toHaveBeenCalled();
    });
  });

  describe('generateQuestions', () => {
    it('should generate questions successfully', async () => {
      const mockQuestions: Question[] = [
        {
          id: 'q1',
          text: 'What do you see?',
          type: 'multiple_choice',
          options: ['Option A', 'Option B'],
          required: true
        }
      ];
      const mockResult = { questions: mockQuestions };
      mockPromptExecutor.execute.mockResolvedValue(mockResult);

      const result = await OpenAIService.generateQuestions('Test analysis', 'test-image-id');

      expect(result).toEqual(mockQuestions);
      expect(mockPromptExecutor.execute).toHaveBeenCalledWith('questions_generation', {
        response: 'Test analysis'
      });
      expect(mockStepService.logStep).toHaveBeenCalledWith({
        flow_id: 'test-image-id',
        step_type: 'questions',
        step_order: 2,
        input_data: { prompt: 'Test analysis' },
        output_data: mockResult,
        response_time_ms: 0,
        model_used: 'gpt-4o',
        success: true
      });
    });

    it('should handle question generation failure', async () => {
      const error = new Error('Question generation failed');
      mockPromptExecutor.execute.mockRejectedValue(error);

      await expect(
        OpenAIService.generateQuestions('Test analysis', 'test-image-id')
      ).rejects.toThrow('Question generation failed');

      expect(mockStepService.logStep).toHaveBeenCalledWith({
        flow_id: 'test-image-id',
        step_type: 'questions',
        step_order: 2,
        input_data: { prompt: 'Test analysis' },
        output_data: null,
        response_time_ms: 0,
        model_used: 'gpt-4o',
        success: false,
        error_message: 'Question generation failed'
      });
    });
  });

  describe('generateConversationalQuestion', () => {
    it('should generate conversational question successfully', async () => {
      const mockQuestions: Question[] = [
        {
          id: 'q1',
          text: 'What style do you prefer?',
          type: 'multiple_choice',
          options: ['Realistic', 'Abstract'],
          required: true
        }
      ];
      const mockResult = {
        questions: mockQuestions,
        done: false,
        summary: undefined
      };
      mockPromptExecutor.execute.mockResolvedValue(mockResult);

      const conversationContext = {
        questions: [],
        artisticDirection: 'Landscape painting',
        previousAnswers: []
      };

      const result = await OpenAIService.generateConversationalQuestion(
        'Test analysis',
        ['Answer 1'],
        conversationContext,
        'test-image-id'
      );

      expect(result.question).toBeDefined();
      expect(result.question?.text).toBe('What style do you prefer?');
      expect(result.done).toBe(false);
      expect(result.questions).toEqual(mockQuestions);
      expect(mockPromptExecutor.execute).toHaveBeenCalledWith('conversational_question', {
        response: 'Test analysis',
        previousAnswers: ['Answer 1']
      });
    });

    it('should handle conversation completion', async () => {
      const mockResult = {
        questions: [],
        done: true,
        summary: 'Conversation complete'
      };
      mockPromptExecutor.execute.mockResolvedValue(mockResult);

      const conversationContext = {
        questions: [],
        artisticDirection: 'Landscape painting',
        previousAnswers: []
      };

      const result = await OpenAIService.generateConversationalQuestion(
        'Test analysis',
        ['Answer 1'],
        conversationContext,
        'test-image-id'
      );

      expect(result.question).toBeUndefined();
      expect(result.done).toBe(true);
      expect(result.summary).toBe('Conversation complete');
    });

    it('should handle conversational question failure', async () => {
      const error = new Error('Conversational question failed');
      mockPromptExecutor.execute.mockRejectedValue(error);

      const conversationContext = {
        questions: [],
        artisticDirection: 'Landscape painting',
        previousAnswers: []
      };

      await expect(
        OpenAIService.generateConversationalQuestion(
          'Test analysis',
          ['Answer 1'],
          conversationContext,
          'test-image-id'
        )
      ).rejects.toThrow('Conversational question failed');

      expect(mockStepService.logStep).toHaveBeenCalledWith({
        flow_id: 'test-image-id',
        step_type: 'conversational_question',
        step_order: 3,
        input_data: {
          analysis: 'Test analysis',
          previousAnswers: ['Answer 1'],
          conversationContext
        },
        output_data: null,
        response_time_ms: 0,
        model_used: 'gpt-4o',
        success: false,
        error_message: 'Conversational question failed'
      });
    });
  });

  describe('analyzeImageWithText', () => {
    it('should analyze image with text prompt', async () => {
      const mockResult = { response: 'Text analysis result' };
      mockPromptExecutor.execute.mockResolvedValue(mockResult);

      const result = await OpenAIService.analyzeImageWithText(
        'base64-image-data',
        'Analyze the colors in this image'
      );

      expect(result).toEqual(mockResult);
      expect(mockPromptExecutor.execute).toHaveBeenCalledWith('image_analysis', {
        image: 'base64-image-data',
        prompt: 'Analyze the colors in this image'
      });
    });

    it('should handle text analysis failure', async () => {
      const error = new Error('Text analysis failed');
      mockPromptExecutor.execute.mockRejectedValue(error);

      await expect(
        OpenAIService.analyzeImageWithText('base64-image-data', 'Test prompt')
      ).rejects.toThrow('Text analysis failed');
    });
  });

  describe('generateImage', () => {
    it('should generate image successfully', async () => {
      const mockResult = { image_base64: 'base64-generated-image' };
      mockPromptExecutor.execute.mockResolvedValue(mockResult);

      const result = await OpenAIService.generateImage('Generate a landscape', 'test-image-id');

      expect(result).toBe('base64-generated-image');
      expect(mockPromptExecutor.execute).toHaveBeenCalledWith('image_generation', {
        prompt: 'Generate a landscape'
      });
      expect(mockStepService.logStep).toHaveBeenCalledWith({
        flow_id: 'test-image-id',
        step_type: 'image_generation',
        step_order: 4,
        input_data: { prompt: 'Generate a landscape' },
        output_data: { image_base64: 'base64-generated-image' },
        response_time_ms: expect.any(Number),
        model_used: 'dall-e-3',
        success: true
      });
    });

    it('should handle image generation failure', async () => {
      const error = new Error('Image generation failed');
      mockPromptExecutor.execute.mockRejectedValue(error);

      await expect(
        OpenAIService.generateImage('Generate a landscape', 'test-image-id')
      ).rejects.toThrow('Image generation failed');

      expect(mockStepService.logStep).toHaveBeenCalledWith({
        flow_id: 'test-image-id',
        step_type: 'image_generation',
        step_order: 4,
        input_data: { prompt: 'Generate a landscape' },
        output_data: { error: 'Image generation failed' },
        response_time_ms: expect.any(Number),
        model_used: 'dall-e-3',
        success: false,
        error_message: 'Image generation failed'
      });
    });

    it('should handle missing image data', async () => {
      const mockResult = { response: 'No image data' };
      mockPromptExecutor.execute.mockResolvedValue(mockResult);

      await expect(
        OpenAIService.generateImage('Generate a landscape', 'test-image-id')
      ).rejects.toThrow('Image generation failed: No image data returned');
    });

    it('should work without imageId (no step logging)', async () => {
      const mockResult = { image_base64: 'base64-generated-image' };
      mockPromptExecutor.execute.mockResolvedValue(mockResult);

      const result = await OpenAIService.generateImage('Generate a landscape');

      expect(result).toBe('base64-generated-image');
      expect(mockStepService.logStep).not.toHaveBeenCalled();
    });
  });
});
