import OpenAI from 'openai';
import { Question } from './types';
import { supabase } from './supabase';

import { imageAnalysisSystemPrompt, questionsGenerationSystemPrompt, imageGenerationSystemPrompt } from './prompts/system_prompts';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class SimplePromptService {
  /**
   * Analyze an image using OpenAI Vision
   */
  static async analyzeImage(imageBase64: string): Promise<string> {
    try {
      console.log('🔍 [SIMPLE_PROMPT] Starting analyzeImage with base64 length:', imageBase64.length);
      
      // Get the prompt from the database
      const { data: promptData, error: promptError } = await supabase
        .from('prompt_definitions')
        .select('prompt_text')
        .eq('name', 'image_analysis')
        .single();

      if (promptError || !promptData) {
        console.error('🔍 [SIMPLE_PROMPT] Prompt error:', promptError);
        throw new Error('Image analysis prompt not found in database');
      }

      const prompt = promptData.prompt_text;
      console.log('🔍 [SIMPLE_PROMPT] Using prompt:', prompt.substring(0, 200) + '...');
      
      console.log('🔍 [SIMPLE_PROMPT] Making OpenAI request with GPT-5...');
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
              role: "system",
              content: imageAnalysisSystemPrompt,
            },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `${prompt}`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/png;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        response_format: { type: "text" },
        max_completion_tokens: 10000,
      });

      console.log('🔍 [SIMPLE_PROMPT] OpenAI response:', {
        usage: response.usage,
        finishReason: response.choices[0]?.finish_reason,
        hasContent: !!response.choices[0]?.message?.content
      });
      
      console.log('🔍 [SIMPLE_PROMPT] Full response object:', JSON.stringify(response, null, 2));
      console.log('🔍 [SIMPLE_PROMPT] Choices array:', response.choices);
      console.log('🔍 [SIMPLE_PROMPT] First choice:', response.choices[0]);
      console.log('🔍 [SIMPLE_PROMPT] Message object:', response.choices[0]?.message);
      console.log('🔍 [SIMPLE_PROMPT] Content value:', response.choices[0]?.message?.content);
      console.log('🔍 [SIMPLE_PROMPT] Content type:', typeof response.choices[0]?.message?.content);
      
      const content = response.choices[0].message.content || 'Analysis not available';
      console.log('🔍 [SIMPLE_PROMPT] Final analysis content:', content);
      return content;
    } catch (error) {
      console.error('🔍 [SIMPLE_PROMPT] Error in analyzeImage:', error);
      return 'Analysis failed: ' + (error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Generate questions based on analysis
   */
  static async generateQuestions(analysis: string): Promise<Question[]> {
    // Get the prompt from the database
    const { data: promptData, error: promptError } = await supabase
      .from('prompt_definitions')
      .select('prompt_text')
      .eq('name', 'questions_generation')
      .single();

    if (promptError || !promptData) {
      throw new Error('Questions generation prompt not found in database');
    }

    const prompt = promptData.prompt_text;
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: questionsGenerationSystemPrompt,
        },
        {
          role: "user",
          content: `${prompt}\n\nStep 1: ${analysis}`
        }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "generate_questions",
            description: "Generate kid-friendly questions to clarify ambiguous parts of a child's character drawing",
            parameters: {
              type: "object",
              properties: {
                questions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: {
                        type: "string",
                        description: "Unique identifier for the question"
                      },
                      text: {
                        type: "string",
                        description: "The question text (max 12 words)"
                      },
                      type: {
                        type: "string",
                        enum: ["multiple_choice"],
                        description: "Type of question"
                      },
                      options: {
                        type: "array",
                        items: {
                          type: "string"
                        },
                        minItems: 2,
                        maxItems: 3,
                        description: "Answer options for the question"
                      },
                      required: {
                        type: "boolean",
                        description: "Whether the question is required"
                      }
                    },
                    required: ["id", "text", "type", "options", "required"]
                  },
                  minItems: 3,
                  maxItems: 12,
                  description: "Array of questions to clarify the character drawing"
                }
              },
              required: ["questions"]
            }
          }
        }
      ],
      tool_choice: { type: "function", function: { name: "generate_questions" } },
      max_completion_tokens: 10000,
      // GPT-5 only supports default temperature (1), custom values not supported
    });

    console.log('🔍 [QUESTIONS] Full response:', JSON.stringify(response, null, 2));
    console.log('🔍 [QUESTIONS] Choices:', response.choices);
    console.log('🔍 [QUESTIONS] First choice:', response.choices[0]);
    console.log('🔍 [QUESTIONS] Message:', response.choices[0]?.message);
    console.log('🔍 [QUESTIONS] Tool calls:', response.choices[0]?.message?.tool_calls);
    
    const toolCall = response.choices[0].message.tool_calls?.[0];
    console.log('🔍 [QUESTIONS] Tool call:', toolCall);
    
    if (!toolCall || toolCall.function.name !== 'generate_questions') {
      console.error('🔍 [QUESTIONS] Invalid tool call:', {
        hasToolCall: !!toolCall,
        toolCallName: toolCall?.function?.name,
        expectedName: 'generate_questions'
      });
      
      // Fallback: try to parse the content as JSON if tool calling failed
      const content = response.choices[0].message.content;
      if (content) {
        console.log('🔍 [QUESTIONS] Trying to parse content as JSON:', content);
        try {
          const parsed = JSON.parse(content);
          if (parsed.questions) {
            console.log('🔍 [QUESTIONS] Successfully parsed questions from content');
            return parsed.questions;
          }
        } catch (e) {
          console.error('🔍 [QUESTIONS] Failed to parse content as JSON:', e);
        }
      }
   
      throw new Error('Failed to generate questions: Invalid response format');
    }

    const result = JSON.parse(toolCall.function.arguments);
    return result.questions || [];
  }

  /**
   * Generate DALL-E prompt for image generation
   */
  static async generateImagePrompt(context: string): Promise<{ templatePrompt: string; finalComposedPrompt: string; dallEPrompt: string }> {
    // Get the prompt from the database
    const { data: promptData, error: promptError } = await supabase
      .from('prompt_definitions')
      .select('prompt_text')
      .eq('name', 'image_generation')
      .single();

    if (promptError || !promptData) {
      throw new Error('Image generation prompt not found in database');
    }

    const templatePrompt = promptData.prompt_text;
    const finalComposedPrompt = `${templatePrompt}\n\n${context}`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: imageGenerationSystemPrompt,
        },
        {
          role: "user",
          content: finalComposedPrompt
        }
      ],
      response_format: { type: "text" },
      max_completion_tokens: 10000,
    });

    const dallEPrompt = response.choices[0].message.content || '';

    return {
      templatePrompt,
      finalComposedPrompt,
      dallEPrompt
    };
  }
}
