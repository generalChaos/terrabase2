import { supabase } from '@/lib/supabase';
import OpenAI from 'openai';
import { 
  PromptType, 
  PromptInput, 
  PromptOutput, 
  PromptDefinition
} from './promptTypes';
import { ContextManager, StepContext } from './contextManager';
import { ContextLogger } from './contextLogger';
import { SchemaEnforcer } from './schemaEnforcer';

// Lazy initialization of OpenAI client
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    // Don't check for API key here - let the actual API call handle auth errors
    // This allows us to distinguish between missing key and invalid key
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'dummy-key', // Use dummy key if not set
      dangerouslyAllowBrowser: true, // Allow browser usage for development
    });
  }
  return openai;
}

export class PromptExecutor {
  private static promptCache: Map<string, PromptDefinition> = new Map();
  private static cacheExpiry: Map<string, number> = new Map();
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Safely log data without exposing base64 image strings
   */
  private static safeLogData(data: unknown, label: string): void {
    if (typeof data === 'object' && data !== null) {
      const sanitized = { ...data } as Record<string, unknown>;
      
      // Remove or truncate base64 image data (check both 'image' and 'image_base64' fields)
      if (sanitized.image && typeof sanitized.image === 'string' && sanitized.image.length > 100) {
        sanitized.image = `[BASE64_IMAGE_DATA:${sanitized.image.length}chars]`;
      }
      
      if (sanitized.image_base64 && typeof sanitized.image_base64 === 'string' && sanitized.image_base64.length > 100) {
        sanitized.image_base64 = `[BASE64_IMAGE_DATA:${sanitized.image_base64.length}chars]`;
      }
      
      // Remove any other potential base64 fields
      Object.keys(sanitized).forEach(key => {
        if (typeof sanitized[key] === 'string' && sanitized[key].length > 1000 && sanitized[key].includes('base64')) {
          sanitized[key] = `[BASE64_DATA:${sanitized[key].length}chars]`;
        }
      });
      
      // Truncate long response text if it's too verbose
      if (sanitized.response && typeof sanitized.response === 'string' && sanitized.response.length > 500) {
        sanitized.response = sanitized.response.substring(0, 500) + `... [truncated, ${sanitized.response.length} chars total]`;
      }
      
      console.log(`${label}:`, JSON.stringify(sanitized, null, 2));
    } else {
      console.log(`${label}:`, data);
    }
  }

  /**
   * Execute a prompt with type-safe input/output and optional context
   */
  static async execute<T extends PromptType>(
    promptName: string,
    input: PromptInput<T>,
    context?: StepContext
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

      // 3. Build context-aware prompt
      const fullPrompt = context 
        ? this.buildContextAwarePrompt(definition, input, context, requestId)
        : this.buildFullPrompt(definition, input);
      console.log(`📝 [${requestId}] Full prompt length: ${fullPrompt.length}`);

      // 4. Execute with OpenAI
      const response = await this.callOpenAI(fullPrompt, definition, input, requestId);

      // 5. Validate output against output_schema
      console.log(`🔍 [${requestId}] Validating output against schema...`);
      this.safeLogData(response, `📄 [${requestId}] Response to validate`);
      console.log(`📋 [${requestId}] Expected schema:`, JSON.stringify(definition.output_schema, null, 2));
      
      const outputValidation = this.validateSchema(response, definition.output_schema);
      if (!outputValidation.valid) {
        console.error(`❌ [${requestId}] Output validation failed:`, outputValidation.errors);
        this.safeLogData(response, `❌ [${requestId}] Response that failed validation`);
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
   * Execute a prompt with guaranteed schema compliance
   */
  static async executeWithSchemaEnforcement<T extends PromptType>(
    promptName: string,
    input: PromptInput<T>,
    context?: StepContext
  ): Promise<PromptOutput<T>> {
    const requestId = Math.random().toString(36).substring(7);
    console.log(`🔒 [${requestId}] Executing with schema enforcement: ${promptName}`);

    try {
      // 1. Fetch prompt definition
      const definition = await this.getPromptDefinition(promptName);
      if (!definition) {
        throw new Error(`Prompt definition not found: ${promptName}`);
      }

      // 2. Validate input
      const inputValidation = this.validateSchema(input, definition.input_schema);
      if (!inputValidation.valid) {
        throw new Error(`Input validation failed: ${inputValidation.errors.join(', ')}`);
      }

      // 3. Build prompt (without schema in text)
      const promptText = context 
        ? this.buildContextAwarePrompt(definition, input, context, requestId)
        : this.buildFullPrompt(definition, input);

      // Remove schema from prompt text since we're using schema enforcement
      const cleanPromptText = this.removeSchemaFromPrompt(promptText);

      // 4. Execute with schema enforcement
      const result = await SchemaEnforcer.executeWithSchemaEnforcement(
        definition,
        cleanPromptText,
        context
      );

      if (!result.success) {
        throw new Error(`Schema enforcement failed: ${result.error}`);
      }

      console.log(`✅ [${requestId}] Schema-enforced execution completed successfully`);
      if (!result.data) {
        throw new Error('Schema enforcement succeeded but no data returned');
      }
      return result.data as unknown as PromptOutput<T>;

    } catch (error: unknown) {
      console.error(`❌ [${requestId}] Schema-enforced execution failed:`, error);
      throw error instanceof Error ? error : new Error('Unknown error occurred');
    }
  }

  /**
   * Remove schema instructions from prompt text
   */
  private static removeSchemaFromPrompt(promptText: string): string {
    // Remove the schema section that we normally add
    const schemaRegex = /\n\nReturn ONLY JSON with this exact schema:[\s\S]*?Follow the schema exactly\./;
    return promptText.replace(schemaRegex, '\n\nReturn your response as valid JSON.');
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

    // Replace {prompt} placeholder if it exists
    if ('prompt' in input) {
      if (input.prompt) {
        promptText = promptText.replace('{prompt}', input.prompt);
      } else {
        // If prompt field exists but is empty, replace with empty string
        promptText = promptText.replace('{prompt}', '');
      }
    }

    // Add context from input if available
    if ('context' in input && input.context) {
      promptText += `\n\nContext: ${input.context}`;
    }

    if ('analysis_type' in input && input.analysis_type) {
      promptText += `\n\nAnalysis Type: ${input.analysis_type}`;
    }

    if ('focus_areas' in input && input.focus_areas && Array.isArray(input.focus_areas)) {
      promptText += `\n\nFocus Areas: ${input.focus_areas.join(', ')}`;
    }

    if ('user_instructions' in input && input.user_instructions) {
      promptText += `\n\nUser Instructions: ${input.user_instructions}`;
    }

    // Auto-append output schema
    const outputSchema = JSON.stringify(definition.output_schema, null, 2);
    promptText += `\n\nReturn ONLY JSON with this exact schema:\n${outputSchema}\n\nRules:\n- No extra keys. No preamble. No markdown. Only JSON.\n- Follow the schema exactly.`;

    return promptText;
  }

  /**
   * Build context-aware prompt with enhanced context information
   */
  private static buildContextAwarePrompt<T extends PromptType>(
    definition: PromptDefinition<T>,
    input: PromptInput<T>,
    context: StepContext,
    requestId: string
  ): string {
    ContextLogger.log('debug', 'prompt', context.currentStep, context.flowId, context.sessionId, requestId,
      `Building context-aware prompt for step: ${context.currentStep}`);
    
    // Get relevant context for this step
    const relevantContext = ContextManager.getRelevantContextForStep(
      context.contextData as unknown as Record<string, unknown>,
      context.currentStep,
      context.flowId,
      context.sessionId
    );
    
    ContextLogger.logPromptConstruction(
      context.flowId,
      context.sessionId,
      requestId,
      context.currentStep,
      definition.prompt_text,
      input as Record<string, unknown>,
      relevantContext
    );
    
    // Start with base prompt
    let promptText = definition.prompt_text;
    
    // Replace {prompt} placeholder if it exists
    if ('prompt' in input) {
      if (input.prompt) {
        promptText = promptText.replace('{prompt}', input.prompt);
      } else {
        promptText = promptText.replace('{prompt}', '');
      }
    }

    // Add context information based on step type
    promptText = this.addContextToPrompt(promptText, context.currentStep, relevantContext, requestId);

    // Add existing input context if available
    if ('context' in input && input.context) {
      promptText += `\n\nAdditional Context: ${input.context}`;
    }

    if ('analysis_type' in input && input.analysis_type) {
      promptText += `\n\nAnalysis Type: ${input.analysis_type}`;
    }

    if ('focus_areas' in input && input.focus_areas && Array.isArray(input.focus_areas)) {
      promptText += `\n\nFocus Areas: ${input.focus_areas.join(', ')}`;
    }

    if ('user_instructions' in input && input.user_instructions) {
      promptText += `\n\nUser Instructions: ${input.user_instructions}`;
    }

    // Auto-append output schema
    const outputSchema = JSON.stringify(definition.output_schema, null, 2);
    promptText += `\n\nReturn ONLY JSON with this exact schema:\n${outputSchema}\n\nRules:\n- No extra keys. No preamble. No markdown. Only JSON.\n- Follow the schema exactly.`;

    return promptText;
  }

  /**
   * Add context information to prompt based on step type
   * NOTE: This adds DATA context only, not schema or rules
   */
  private static addContextToPrompt(
    promptText: string,
    stepName: string,
    relevantContext: Record<string, unknown>,
    requestId: string
  ): string {
    let contextInfo = '';

    // Add image analysis context for all steps that need it
    if (relevantContext.imageAnalysis) {
      contextInfo += `\n\nImage Analysis:\n${relevantContext.imageAnalysis}`;
    }

    // Add step-specific context
    switch (stepName) {
      case 'questions_generation':
        if (relevantContext.artisticDirection) {
          contextInfo += `\n\nArtistic Direction: ${relevantContext.artisticDirection}`;
        }
        if (relevantContext.userPreferences) {
          const prefs = relevantContext.userPreferences as Record<string, unknown>;
          if (Array.isArray(prefs.stylePreferences) && prefs.stylePreferences.length > 0) {
            contextInfo += `\n\nUser Style Preferences: ${(prefs.stylePreferences as string[]).join(', ')}`;
          }
          if (Array.isArray(prefs.colorPreferences) && prefs.colorPreferences.length > 0) {
            contextInfo += `\n\nUser Color Preferences: ${(prefs.colorPreferences as string[]).join(', ')}`;
          }
        }
        break;

      case 'conversational_question':
        // Add previous questions and answers context
        const stepResults = relevantContext.stepResults as Record<string, unknown>;
        if (stepResults?.questions_generation) {
          const qGen = stepResults.questions_generation as Record<string, unknown>;
          const output = qGen.output as Record<string, unknown>;
          if (output?.questions) {
            const questions = output.questions as Array<Record<string, unknown>>;
            contextInfo += `\n\nPreviously Generated Questions:\n`;
            questions.forEach((q: Record<string, unknown>, index: number) => {
              contextInfo += `${index + 1}. ${q.text}\n`;
            });
          }
        }
        
        // Add conversation history
        const conversationHistory = relevantContext.conversationHistory as Array<Record<string, unknown>> | undefined;
        if (conversationHistory && conversationHistory.length > 0) {
          contextInfo += `\n\nConversation History:\n`;
          conversationHistory.forEach((entry: Record<string, unknown>, index: number) => {
            const question = entry.question as Record<string, unknown>;
            contextInfo += `Q${index + 1}: ${question.text}\n`;
            if (entry.answer) {
              contextInfo += `A${index + 1}: ${entry.answer}\n`;
            }
            contextInfo += `\n`;
          });
        }
        
        if (relevantContext.artisticDirection) {
          contextInfo += `\n\nCurrent Artistic Direction: ${relevantContext.artisticDirection}`;
        }
        break;

      case 'image_generation':
        // Add all previous step results for comprehensive context
        // NOTE: Only include actual data, not schemas or rules
        const imageStepResults = relevantContext.stepResults as Record<string, unknown> | undefined;
        if (imageStepResults) {
          contextInfo += `\n\nPrevious Step Results:\n`;
          
          if (imageStepResults.questions_generation) {
            const qGen = imageStepResults.questions_generation as Record<string, unknown>;
            contextInfo += `Questions Generation:\n`;
            // Only include the actual questions data, not full input/output
            const output = qGen.output as Record<string, unknown>;
            if (output?.questions) {
              contextInfo += `- Generated Questions: ${JSON.stringify(output.questions)}\n\n`;
            }
          }
          
          if (imageStepResults.conversational_question) {
            const conv = imageStepResults.conversational_question as Record<string, unknown>;
            contextInfo += `Conversational Questions:\n`;
            // Only include the actual conversation data
            const output = conv.output as Record<string, unknown>;
            if (output?.questions) {
              contextInfo += `- Conversation Questions: ${JSON.stringify(output.questions)}\n\n`;
            }
          }
        }
        
        // Add user preferences
        if (relevantContext.userPreferences) {
          const prefs = relevantContext.userPreferences as Record<string, unknown>;
          contextInfo += `\n\nUser Preferences:\n`;
          if (Array.isArray(prefs.stylePreferences) && prefs.stylePreferences.length > 0) {
            contextInfo += `- Style: ${(prefs.stylePreferences as string[]).join(', ')}\n`;
          }
          if (Array.isArray(prefs.colorPreferences) && prefs.colorPreferences.length > 0) {
            contextInfo += `- Colors: ${(prefs.colorPreferences as string[]).join(', ')}\n`;
          }
          if (Array.isArray(prefs.moodPreferences) && prefs.moodPreferences.length > 0) {
            contextInfo += `- Mood: ${(prefs.moodPreferences as string[]).join(', ')}\n`;
          }
          if (Array.isArray(prefs.compositionPreferences) && prefs.compositionPreferences.length > 0) {
            contextInfo += `- Composition: ${(prefs.compositionPreferences as string[]).join(', ')}\n`;
          }
        }
        
        if (relevantContext.artisticDirection) {
          contextInfo += `\n\nFinal Artistic Direction: ${relevantContext.artisticDirection}`;
        }
        break;
    }

    console.log(`📝 [${requestId}] Added context info length: ${contextInfo.length}`);
    return promptText + contextInfo;
  }

  /**
   * Call OpenAI API with proper model and format
   * Routes to DALL-E for image generation, chat completions for everything else
   */
  private static async callOpenAI<T extends PromptType>(
    prompt: string,
    definition: PromptDefinition<T>,
    input: PromptInput<T>,
    requestId: string
  ): Promise<unknown> {
    try {
      const openai = getOpenAIClient();
      console.log(`🤖 [${requestId}] Making OpenAI API call...`);
      console.log(`📝 [${requestId}] PROMPT:`, prompt);
      this.safeLogData(input, `📊 [${requestId}] INPUT`);

      // Special handling for image generation (DALL-E API)
      if (definition.type === 'image_generation') {
        console.log(`🖼️ [${requestId}] Using DALL-E API for image generation`);
        
        // Extract prompt from input (should be { prompt: string })
        const imagePrompt = (input as { prompt: string }).prompt;
        if (!imagePrompt || typeof imagePrompt !== 'string') {
          throw new Error('Image generation requires a prompt string');
        }

        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt: imagePrompt,
          n: 1,
          size: "1024x1024",
          quality: "standard",
          response_format: "b64_json" // Return base64 instead of URL
        });

        const imageBase64 = response.data?.[0]?.b64_json;
        if (!imageBase64) {
          throw new Error('No image generated by DALL-E');
        }

        console.log(`✅ [${requestId}] DALL-E generated image (base64 length: ${imageBase64.length})`);
        
        // Return in the expected schema format
        return {
          image_base64: imageBase64
        };
      }

      // Default handling for text-based prompts (Chat Completions API)
      console.log(`💬 [${requestId}] Using Chat Completions API for text generation`);
      
      const messageContent = this.buildMessageContent(definition, prompt, input);
      
      // Log the complete message structure being sent to OpenAI
      const fullMessage = {
        role: "user" as const,
        content: messageContent
      };
      console.log(`📤 [${requestId}] COMPLETE MESSAGE TO OPENAI:`, JSON.stringify(fullMessage, null, 2));
      
      const apiParams = {
        model: definition.model,
        messages: [fullMessage],
        response_format: definition.response_format === 'json_object' 
          ? { type: "json_object" } 
          : undefined,
        max_tokens: definition.max_tokens,
        temperature: definition.temperature,
      };
      console.log(`🔧 [${requestId}] API PARAMETERS:`, JSON.stringify(apiParams, null, 2));
      
      const response = await openai.chat.completions.create(apiParams as Parameters<typeof openai.chat.completions.create>[0]);

      // Handle both streaming and non-streaming responses
      if ('usage' in response) {
        const tokensUsed = response.usage?.total_tokens;
        const rawResponse = response.choices[0]?.message?.content;
        const finishReason = response.choices[0]?.finish_reason;
        
        console.log(`📄 [${requestId}] RESPONSE:`, rawResponse);
        console.log(`🔢 [${requestId}] Tokens used:`, tokensUsed);
        console.log(`🏁 [${requestId}] Finish reason:`, finishReason);

        if (!rawResponse) {
        const errorDetails = {
          finishReason,
          choicesLength: response.choices?.length,
          firstChoice: response.choices?.[0],
          usage: response.usage
        };
        console.error(`❌ [${requestId}] Empty response details:`, errorDetails);
        
        // Provide more specific error messages based on finish reason
        if (finishReason === 'content_filter') {
          throw new Error('Content filtered by OpenAI safety system. Please try a different image.');
        } else if (finishReason === 'length') {
          throw new Error('Response was truncated due to length limits. Please try a simpler prompt.');
        } else if (finishReason === 'stop') {
          throw new Error('OpenAI stopped generating unexpectedly. Please try again.');
        } else {
          throw new Error(`No response content from OpenAI. Finish reason: ${finishReason || 'unknown'}`);
        }
      }

      // Check for refusal responses
      if (rawResponse.includes("I'm sorry, I can't help with that") || 
          rawResponse.includes("I can't help with that") ||
          rawResponse.includes("I'm not able to help") ||
          rawResponse.includes("I cannot help")) {
        console.error(`❌ [${requestId}] AI refused to process the request:`, rawResponse);
        throw new Error('AI refused to process the request. This may be due to content filtering or prompt issues.');
      }

      // Parse JSON if needed
      if (definition.response_format === 'json_object') {
        try {
          return JSON.parse(rawResponse);
        } catch (parseError) {
          console.error(`❌ [${requestId}] JSON parsing failed:`, parseError);
          console.error(`❌ [${requestId}] Raw response was:`, rawResponse);
          throw new Error('Failed to parse JSON response from OpenAI');
        }
      }

        return rawResponse;
      } else {
        // Handle streaming response (should not happen in our case)
        throw new Error('Unexpected streaming response received');
      }
    } catch (error: unknown) {
      console.error(`❌ [${requestId}] OpenAI API error:`, error);
      console.error(`❌ [${requestId}] Error type:`, typeof error);
      console.error(`❌ [${requestId}] Error constructor:`, error?.constructor?.name);
      console.error(`❌ [${requestId}] Error message:`, error instanceof Error ? error.message : 'Unknown error');
      
      // Enhanced OpenAI error handling
      const errorObj = error as { code?: string; message?: string; status?: number };
      
      // Check for missing API key first
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'dummy-key') {
        throw new Error('OpenAI API key not found in environment variables. Please check your configuration.');
      }
      
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
    console.log(`🔨 [buildMessageContent] Building message for type: ${definition.type}`);
    console.log(`🔨 [buildMessageContent] Input keys:`, Object.keys(input));
    console.log(`🔨 [buildMessageContent] Prompt length:`, prompt.length);
    // For image analysis, we need to handle image input and prompt field
    if (definition.type === 'image_analysis' && 'image' in input) {
      // Use the prompt from input if provided, otherwise use the default prompt
      let enhancedPrompt = 'prompt' in input && input.prompt ? input.prompt : prompt;
      
      // Add JSON schema instructions for proper response format
      const outputSchema = JSON.stringify(definition.output_schema, null, 2);
      enhancedPrompt += `\n\nReturn ONLY JSON with this exact schema:\n${outputSchema}\n\nRules:\n- No extra keys. No preamble. No markdown. Only JSON.\n- Follow the schema exactly.`;
      
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
    // Removed deprecated image_text_analysis prompt type
    if ('text' in input && 'image' in input) {
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
    console.log(`🔨 [buildMessageContent] Returning text-only prompt (length: ${prompt.length})`);
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
            if (typeof field === 'string') {
              const dataObj = data as Record<string, unknown>;
              if (!(field in dataObj)) {
                errors.push(`Missing required field: ${field}`);
              }
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

  /**
   * Clear cache for a specific prompt or all prompts
   */
  static clearCache(promptName?: string): void {
    if (promptName) {
      this.promptCache.delete(promptName);
      this.cacheExpiry.delete(promptName);
      console.log(`🗑️ [PromptExecutor] Cache cleared for: ${promptName}`);
    } else {
      this.promptCache.clear();
      this.cacheExpiry.clear();
      console.log(`🗑️ [PromptExecutor] All cache cleared`);
    }
  }
}
