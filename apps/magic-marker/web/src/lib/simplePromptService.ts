import OpenAI from 'openai';
import { Question } from './types';
import { supabase } from './supabase';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class SimplePromptService {
  /**
   * Analyze an image using OpenAI Vision
   */
  static async analyzeImage(imageBase64: string): Promise<string> {
    // Get the prompt from the database
    const { data: promptData, error: promptError } = await supabase
      .from('prompt_definitions')
      .select('prompt_text')
      .eq('name', 'image_analysis')
      .single();

    if (promptError || !promptData) {
      throw new Error('Image analysis prompt not found in database');
    }

    const prompt = promptData.prompt_text;
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
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
      max_tokens: 4000,
    });

    const content = response.choices[0].message.content || 'Analysis not available';
    return content;
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
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: `${prompt}\n\nAnalysis: ${analysis}`
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
      max_tokens: 4000,
    });

    const toolCall = response.choices[0].message.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== 'generate_questions') {
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
    const finalComposedPrompt = `${context}\n\n${templatePrompt}`;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: finalComposedPrompt
        }
      ],
      response_format: { type: "text" },
      max_tokens: 2000,
    });

    const dallEPrompt = response.choices[0].message.content || '';

    return {
      templatePrompt,
      finalComposedPrompt,
      dallEPrompt
    };
  }
}
