import { supabase } from './supabase';
import OpenAI from 'openai';
import { 
  PromptType, 
  PromptInput, 
  PromptOutput, 
  PromptDefinition
} from './promptTypes';

// Lazy initialization of OpenAI client
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OpenAI API key not found in environment variables');
      throw new Error('OpenAI API key not found in environment variables');
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

export class PromptExecutor {
  private static promptCache: Map<string, PromptDefinition> = new Map();
  private static cacheExpiry: Map<string, number> = new Map();
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Execute a prompt with type-safe input/output
   */
  static async execute<T extends PromptType>(
    promptName: string,
    input: PromptInput<T>
  ): Promise<PromptOutput<T>> {
    const requestId = Math.random().toString(36).substring(7);
    console.log(`🚀 [${requestId}] Executing prompt: ${promptName}`);

    try {
      // 1. Fetch prompt definition
      const definition = await this.getPromptDefinition(promptName);
      if (!definition) {
        throw new Error(`Prompt definition not found: ${promptName}. Please ensure the prompt is configured in the database.`);
      }

      console.log(`📋 [${requestId}] Using prompt type: ${definition.type}`);

      // 2. Validate input against input_schema
      const inputValidation = this.validateSchema(input, definition.input_schema);
      if (!inputValidation.valid) {
        console.error(`❌ [${requestId}] Input validation failed:`, inputValidation.errors);
        throw new Error(`Input validation failed: ${inputValidation.errors.join(', ')}`);
      }

      console.log(`✅ [${requestId}] Input validation passed`);

      // 3. Build full prompt with auto-appended return schema
      const fullPrompt = this.buildFullPrompt(definition, input);
      console.log(`📝 [${requestId}] Full prompt length: ${fullPrompt.length}`);

      // 4. Execute with OpenAI
      const response = await this.callOpenAI(fullPrompt, definition, input, requestId);

      // 5. Validate output against return_schema
      console.log(`🔍 [${requestId}] Validating output against schema...`);
      console.log(`📄 [${requestId}] Response to validate:`, JSON.stringify(response, null, 2));
      console.log(`📋 [${requestId}] Expected schema:`, JSON.stringify(definition.return_schema, null, 2));
      
      const outputValidation = this.validateSchema(response, definition.return_schema);
      if (!outputValidation.valid) {
        console.error(`❌ [${requestId}] Output validation failed:`, outputValidation.errors);
        console.error(`❌ [${requestId}] Response that failed validation:`, JSON.stringify(response, null, 2));
        throw new Error(`Output validation failed: ${outputValidation.errors.join(', ')}`);
      }

      console.log(`✅ [${requestId}] Output validation passed`);
      console.log(`🎉 [${requestId}] Prompt execution completed successfully`);

      return response as PromptOutput<T>;
    } catch (error: unknown) {
      console.error(`❌ [${requestId}] Prompt execution failed:`, error);
      
      // Enhanced error handling
      if (error instanceof Error) {
        if (error.message.includes('Prompt definition not found')) {
          throw new Error(`Configuration Error: ${error.message}. Please contact support.`);
        } else if (error.message.includes('validation failed')) {
          throw new Error(`Input Error: ${error.message}. Please check your input data.`);
        } else if (error.message.includes('OpenAI')) {
          throw new Error(`AI Service Error: ${error.message}. Please try again later.`);
        } else {
          throw new Error(`Unexpected Error: ${error.message}. Please contact support.`);
        }
      }
      
      throw new Error('An unexpected error occurred. Please try again later.');
    }
  }

  /**
   * Get prompt definition from database with caching
   */
  private static async getPromptDefinition(name: string): Promise<PromptDefinition | null> {
    try {
      // Check cache first
      const cached = this.getCachedPrompt(name);
      if (cached) {
        console.log(`✅ [PromptExecutor] Using cached prompt: ${name}`);
        return cached;
      }

      console.log(`🗄️ [PromptExecutor] Fetching prompt from database: ${name}`);
      const { data, error } = await supabase
        .from('prompt_definitions')
        .select('*')
        .eq('name', name)
        .eq('active', true)
        .single();

      if (error) {
        console.error(`❌ [PromptExecutor] Error fetching prompt '${name}':`, error);
        return null;
      }

      if (!data) {
        console.warn(`⚠️ [PromptExecutor] No active prompt found for name: ${name}`);
        return null;
      }

      console.log(`✅ [PromptExecutor] Prompt fetched successfully: ${name}`);

      // Cache the result
      this.setCachedPrompt(name, data);
      return data;
    } catch (error) {
      console.error(`❌ [PromptExecutor] Error in getPromptDefinition:`, error);
      return null;
    }
  }

  /**
   * Build full prompt with auto-appended return schema
   */
  private static buildFullPrompt<T extends PromptType>(
    definition: PromptDefinition<T>,
    input: PromptInput<T>
  ): string {
    let promptText = definition.prompt_text;

    // Add context from input if available
    if ('context' in input && input.context) {
      promptText += `\n\nContext: ${input.context}`;
    }

    if ('analysis_type' in input && input.analysis_type) {
      promptText += `\n\nAnalysis Type: ${input.analysis_type}`;
    }

    if ('focus_areas' in input && input.focus_areas) {
      promptText += `\n\nFocus Areas: ${input.focus_areas.join(', ')}`;
    }

    if ('user_instructions' in input && input.user_instructions) {
      promptText += `\n\nUser Instructions: ${input.user_instructions}`;
    }

    // Auto-append return schema
    const returnSchema = JSON.stringify(definition.return_schema, null, 2);
    promptText += `\n\nReturn ONLY JSON with this exact schema:\n${returnSchema}\n\nRules:\n- No extra keys. No preamble. No markdown. Only JSON.\n- Follow the schema exactly.`;

    return promptText;
  }

  /**
   * Call OpenAI API with proper model and format
   */
  private static async callOpenAI<T extends PromptType>(
    prompt: string,
    definition: PromptDefinition<T>,
    input: PromptInput<T>,
    requestId: string
  ): Promise<unknown> {
    const startTime = Date.now();

    try {
      console.log(`🔑 [${requestId}] Checking OpenAI API key...`);
      console.log(`🔑 [${requestId}] OPENAI_API_KEY exists:`, !!process.env.OPENAI_API_KEY);
      console.log(`🔑 [${requestId}] OPENAI_API_KEY length:`, process.env.OPENAI_API_KEY?.length || 0);
      
      const openai = getOpenAIClient();
      console.log(`🤖 [${requestId}] Making OpenAI API call...`);
      console.log(`📝 [${requestId}] PROMPT:`, prompt);
      console.log(`📊 [${requestId}] INPUT:`, JSON.stringify(input, null, 2));

      const messageContent = this.buildMessageContent(definition, prompt, input);
      
      const response = await openai.chat.completions.create({
        model: definition.model,
        messages: [
          {
            role: "user",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            content: messageContent as any
          }
        ],
        response_format: definition.response_format === 'json_object' 
          ? { type: "json_object" } 
          : undefined,
        max_tokens: definition.max_tokens,
        temperature: definition.temperature,
      });

      const tokensUsed = response.usage?.total_tokens;
      const rawResponse = response.choices[0]?.message?.content;
      
      console.log(`📄 [${requestId}] RESPONSE:`, rawResponse);
      console.log(`🔢 [${requestId}] Tokens used:`, tokensUsed);

      if (!rawResponse) {
        throw new Error('No response content from OpenAI');
      }

      // Parse JSON if needed
      if (definition.response_format === 'json_object') {
        try {
          return JSON.parse(rawResponse);
        } catch (parseError) {
          console.error(`❌ [${requestId}] JSON parsing failed:`, parseError);
          throw new Error('Failed to parse JSON response from OpenAI');
        }
      }

      return rawResponse;
    } catch (error: unknown) {
      console.error(`❌ [${requestId}] OpenAI API error:`, error);
      console.error(`❌ [${requestId}] Error type:`, typeof error);
      console.error(`❌ [${requestId}] Error constructor:`, error?.constructor?.name);
      console.error(`❌ [${requestId}] Error message:`, error instanceof Error ? error.message : 'Unknown error');
      
      // Enhanced OpenAI error handling
      const errorObj = error as { code?: string; message?: string; status?: number };
      if (errorObj.code === 'rate_limit_exceeded') {
        throw new Error('OpenAI rate limit exceeded. Please try again in a moment.');
      } else if (errorObj.code === 'insufficient_quota') {
        throw new Error('OpenAI quota exceeded. Please check your account billing.');
      } else if (errorObj.code === 'model_not_found') {
        throw new Error('OpenAI model not available. Please try again later.');
      } else if (errorObj.code === 'timeout') {
        throw new Error('OpenAI request timed out. Please try again.');
      } else if (errorObj.status === 401) {
        throw new Error('OpenAI API key is invalid or expired.');
      } else if (errorObj.status === 429) {
        throw new Error('Too many requests to OpenAI. Please wait and try again.');
      } else if (errorObj.status && errorObj.status >= 500) {
        throw new Error('OpenAI service is temporarily unavailable. Please try again later.');
      } else {
        // Preserve the original error message instead of generic message
        const originalMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`OpenAI API error: ${originalMessage}`);
      }
    }
  }

  /**
   * Build message content based on prompt type
   */
  private static buildMessageContent<T extends PromptType>(
    definition: PromptDefinition<T>,
    prompt: string,
    input: PromptInput<T>
  ): string | Array<{ type: "text" | "image_url"; text?: string; image_url?: { url: string } }> {
    // For image analysis, we need to handle image input and optional text fields
    if (definition.type === 'image_analysis' && 'image' in input) {
      // Build enhanced prompt with optional text fields
      let enhancedPrompt = prompt;
      
      // Add context if provided
      if ('context' in input && input.context) {
        enhancedPrompt += `\n\nContext: ${input.context}`;
      }
      
      // Add user instructions if provided
      if ('user_instructions' in input && input.user_instructions) {
        enhancedPrompt += `\n\nUser Instructions: ${input.user_instructions}`;
      }
      
      // Add analysis type if provided
      if ('analysis_type' in input && input.analysis_type) {
        enhancedPrompt += `\n\nAnalysis Type: ${input.analysis_type}`;
      }
      
      // Add focus areas if provided
      if ('focus_areas' in input && input.focus_areas && input.focus_areas.length > 0) {
        enhancedPrompt += `\n\nFocus Areas: ${input.focus_areas.join(', ')}`;
      }
      
      return [
        {
          type: "text" as const,
          text: enhancedPrompt
        },
        {
          type: "image_url" as const,
          image_url: { 
            url: `data:image/jpeg;base64,${input.image}` 
          }
        }
      ];
    }

    // For image + text analysis, we need to handle both image and text input
    if (definition.type === 'image_text_analysis' && 'image' in input && 'text' in input) {
      // Build enhanced prompt with text input and optional fields
      let enhancedPrompt = prompt;
      
      // Add the main text prompt
      enhancedPrompt += `\n\nText Prompt: ${input.text}`;
      
      // Add context if provided
      if ('context' in input && input.context) {
        enhancedPrompt += `\n\nContext: ${input.context}`;
      }
      
      // Add instructions if provided
      if ('instructions' in input && input.instructions) {
        enhancedPrompt += `\n\nInstructions: ${input.instructions}`;
      }
      
      return [
        {
          type: "text" as const,
          text: enhancedPrompt
        },
        {
          type: "image_url" as const,
          image_url: { 
            url: `data:image/jpeg;base64,${input.image}` 
          }
        }
      ];
    }

    // For text-only prompts
    return prompt;
  }

  /**
   * Validate data against JSON schema (simplified version)
   */
  private static validateSchema(data: unknown, schema: unknown): { valid: boolean; errors: string[] } {
    // For now, just do basic validation
    // In a real implementation, you'd use a proper JSON schema validator like ajv
    const errors: string[] = [];

    if (typeof schema === 'object' && schema !== null) {
      const schemaObj = schema as Record<string, unknown>;
      
      if (schemaObj.type === 'object') {
        if (typeof data !== 'object' || data === null) {
          errors.push(`Expected object, got ${typeof data}`);
          return { valid: false, errors };
        }

        // Check required fields
        if (Array.isArray(schemaObj.required)) {
          for (const field of schemaObj.required) {
            if (typeof field === 'string' && !(field in (data as Record<string, unknown>))) {
              errors.push(`Missing required field: ${field}`);
            }
          }
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Cache management
   */
  private static getCachedPrompt(name: string): PromptDefinition | null {
    const cached = this.promptCache.get(name);
    const expiry = this.cacheExpiry.get(name);
    
    if (cached && expiry && Date.now() < expiry) {
      return cached;
    }
    
    return null;
  }

  private static setCachedPrompt(name: string, definition: PromptDefinition): void {
    this.promptCache.set(name, definition);
    this.cacheExpiry.set(name, Date.now() + this.CACHE_TTL);
  }
}
