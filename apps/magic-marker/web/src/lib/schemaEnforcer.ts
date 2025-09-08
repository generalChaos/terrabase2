/**
 * Schema Enforcement Utilities
 * Provides guaranteed schema compliance for AI responses
 */

import { PromptDefinition, PromptType } from './promptTypes';
import { StepContext } from './contextManager';

export interface SchemaEnforcementResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  attempts?: number;
}

export class SchemaEnforcer {
  /**
   * Execute with guaranteed schema compliance using function calling
   */
  static async executeWithFunctionCalling<T extends PromptType>(
    definition: PromptDefinition<T>,
    promptText: string,
    context?: StepContext,
    input?: Record<string, unknown>
  ): Promise<SchemaEnforcementResult<T>> {
    
    // Remove schema instructions since function calling handles schema enforcement
    const cleanPromptText = this.removeSchemaFromPrompt(promptText);
    const { OpenAI } = await import('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log('🎯 [SchemaEnforcer] Starting function calling method:', {
      type: definition.type,
      model: definition.model,
      promptLength: cleanPromptText.length,
      hasContext: !!context,
      hasInput: !!input
    });

    // Log the actual prompt (truncated for readability)
    const truncatedPrompt = cleanPromptText.length > 200 
      ? cleanPromptText.substring(0, 200) + '... [truncated]'
      : cleanPromptText;
    console.log('📝 [SchemaEnforcer] Clean prompt text:', truncatedPrompt);

    try {
      console.log('📤 [SchemaEnforcer] Sending function calling request:', {
        model: definition.model,
        functionName: this.getFunctionName(definition.type),
        maxTokens: definition.max_tokens
      });

      // Check if this is an image analysis request
      const isImageAnalysis = definition.type === 'image_analysis';
      let messages: Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }> = [];
      
      if (isImageAnalysis && input?.image) {
        console.log('🖼️ [SchemaEnforcer] Setting up image analysis with function calling:', {
          imageLength: typeof input.image === 'string' ? input.image.length : 0,
          imageType: typeof input.image
        });
        
        const imageUrl = `data:image/jpeg;base64,${input.image}`;
        messages = [
          {
            role: "system",
            content: "You are a helpful assistant that generates structured responses. Always use the provided function to return your response."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: cleanPromptText
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ];
      } else {
        messages = [
          {
            role: "system",
            content: "You are a helpful assistant that generates structured responses. Always use the provided function to return your response."
          },
          {
            role: "user",
            content: cleanPromptText
          }
        ];
      }

      // Log the complete messages array that will be sent to AI (truncated for performance)
      const truncatedMessages = messages.map(msg => ({
        ...msg,
        content: typeof msg.content === 'string' && msg.content.length > 200 
          ? msg.content.substring(0, 200) + '... [truncated]'
          : msg.content
      }));
      console.log('🤖 [SchemaEnforcer] Complete AI Request Messages:', JSON.stringify(truncatedMessages, null, 2));

      const functionName = this.getFunctionName(definition.type);
      const response = await openai.chat.completions.create({
        model: definition.model,
        messages: messages,
        functions: [{
          name: functionName,
          description: this.getFunctionDescription(definition.type),
          parameters: definition.output_schema as unknown as Record<string, unknown>
        }],
        function_call: { name: functionName },
        max_completion_tokens: definition.max_tokens
      });

      console.log('📥 [SchemaEnforcer] Received function calling response:', {
        model: definition.model,
        usage: response.usage,
        finishReason: response.choices[0]?.finish_reason,
        hasFunctionCall: !!response.choices[0]?.message?.function_call
      });

      // Log the complete AI response
      console.log('🤖 [SchemaEnforcer] Complete AI Response:', JSON.stringify(response, null, 2));

      const functionCall = response.choices[0].message.function_call;
      if (!functionCall || functionCall.name !== functionName) {
        console.error('❌ [SchemaEnforcer] No function call returned:', {
          functionCall,
          expectedName: functionName
        });
        return {
          success: false,
          error: "No function call returned"
        };
      }

      console.log('✅ [SchemaEnforcer] Function call received:', {
        functionName: functionCall.name,
        argumentsLength: functionCall.arguments?.length || 0
      });

      const result = JSON.parse(functionCall.arguments);
      
      console.log('🔍 [SchemaEnforcer] Parsed function call arguments:', {
        resultKeys: Object.keys(result),
        resultType: typeof result
      });
      
      // Validate the result against the schema (double-check)
      const validation = this.validateSchema(result, definition.output_schema as unknown as Record<string, unknown>);
      if (!validation.valid) {
        console.error('❌ [SchemaEnforcer] Function calling schema validation failed:', {
          errors: validation.errors,
          resultKeys: Object.keys(result),
          schemaKeys: Object.keys(definition.output_schema as unknown as Record<string, unknown>)
        });
        return {
          success: false,
          error: `Schema validation failed: ${validation.errors.join(', ')}`
        };
      }

      console.log('✅ [SchemaEnforcer] Function calling succeeded:', {
        resultKeys: Object.keys(result)
      });

      return {
        success: true,
        data: result as T
      };

    } catch (error) {
      console.error('❌ [SchemaEnforcer] Function calling failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        model: definition.model,
        type: definition.type
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Execute with retry-based schema enforcement
   */
  static async executeWithRetry<T extends PromptType>(
    definition: PromptDefinition<T>,
    promptText: string,
    context?: StepContext,
    maxAttempts: number = 3,
    input?: Record<string, unknown>
  ): Promise<SchemaEnforcementResult<T>> {
    const { OpenAI } = await import('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    let attempts = 0;
    let currentPrompt = promptText;

    console.log('🚀 [SchemaEnforcer] Starting retry-based schema enforcement:', {
      type: definition.type,
      model: definition.model,
      promptLength: promptText.length,
      maxAttempts,
      hasContext: !!context,
      hasInput: !!input,
      inputKeys: input ? Object.keys(input) : []
    });

    // Note: Context is already added by PromptExecutor, so we don't add it again here
    // to avoid duplication during retries

    // Log the actual prompt (truncated for readability)
    const truncatedPrompt = currentPrompt.length > 200 
      ? currentPrompt.substring(0, 200) + '... [truncated]'
      : currentPrompt;
    console.log('📝 [SchemaEnforcer] Initial prompt text:', truncatedPrompt);

    while (attempts < maxAttempts) {
      attempts++;

      try {
        console.log(`🔄 [SchemaEnforcer] Attempt ${attempts}/${maxAttempts}:`, {
          model: definition.model,
          promptLength: currentPrompt.length,
          maxTokens: definition.max_tokens,
          isImageAnalysis: definition.type === 'image_analysis'
        });
        
        // Check if this is an image analysis request
        const isImageAnalysis = definition.type === 'image_analysis';
        
        let messages: Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }> = [];
        
        if (isImageAnalysis) {
          // For image analysis, we need to get the image data from the input
          // The image should be passed as base64 in the input, not in the prompt
          console.log('🔍 [SchemaEnforcer] Setting up image analysis with GPT-4o...');
          console.log('🔍 [SchemaEnforcer] Input keys:', input ? Object.keys(input) : []);
          console.log('🔍 [SchemaEnforcer] Has image property:', input ? 'image' in input : false);
          console.log('🔍 [SchemaEnforcer] Input type:', typeof input);
          
          // Extract the image data from the input (not from the prompt)
          const imageData = input?.image;
          if (imageData && typeof imageData === 'string') {
            console.log('✅ [SchemaEnforcer] Found image data in input:', {
              length: imageData.length,
              type: typeof imageData,
              startsWith: imageData.substring(0, 20),
              endsWith: imageData.substring(imageData.length - 20),
              sizeKB: Math.round(imageData.length / 1024)
            });
            
            const imageUrl = `data:image/jpeg;base64,${imageData}`;
            console.log('✅ [SchemaEnforcer] Full image URL length:', imageUrl.length);
            
            messages = [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: currentPrompt
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: imageUrl
                    }
                  }
                ]
              }
            ];
            console.log('✅ [SchemaEnforcer] Created vision message with image data');
          } else {
            // Fallback to text-only if no image found
            console.log('❌ [SchemaEnforcer] No image data found in input, using text-only');
            console.log('❌ [SchemaEnforcer] Input object keys:', input ? Object.keys(input) : []);
            messages = [
              {
                role: "user",
                content: currentPrompt
              }
            ];
          }
        } else {
          // For non-image requests, use text-only
          messages = [
            {
              role: "user",
              content: currentPrompt
            }
          ];
        }
        
        console.log('📤 [SchemaEnforcer] Sending request to OpenAI:', {
          model: definition.model,
          messageCount: messages.length,
          maxTokens: definition.max_tokens,
          isImageAnalysis: isImageAnalysis
        });

        // Log the complete messages array that will be sent to AI (truncated for performance)
        const truncatedMessages = messages.map(msg => ({
          ...msg,
          content: typeof msg.content === 'string' && msg.content.length > 200 
            ? msg.content.substring(0, 200) + '... [truncated]'
            : msg.content
        }));
        console.log('🤖 [SchemaEnforcer] Complete AI Request Messages (Retry):', JSON.stringify(truncatedMessages, null, 2));

        const response = await openai.chat.completions.create({
          model: definition.model,
          messages: messages,
          response_format: { type: "json_object" },
          max_completion_tokens: definition.max_tokens
        });

        const rawResponse = response.choices[0].message.content;
        console.log('📥 [SchemaEnforcer] Received response from OpenAI:', {
          model: definition.model,
          usage: response.usage,
          finishReason: response.choices[0]?.finish_reason,
          responseLength: rawResponse?.length || 0,
          responsePreview: rawResponse?.substring(0, 200) + (rawResponse && rawResponse.length > 200 ? '...' : ''),
          fullResponse: rawResponse // Log the full response for debugging
        });

        // Log the complete AI response
        console.log('🤖 [SchemaEnforcer] Complete AI Response (Retry):', JSON.stringify(response, null, 2));

        if (!rawResponse) {
          console.error('❌ [SchemaEnforcer] No response content from OpenAI:', {
            model: definition.model,
            response: response,
            choices: response.choices,
            usage: response.usage
          });
          throw new Error('No response content');
        }

        console.log('🔍 [SchemaEnforcer] Parsing JSON response:', {
          responseLength: rawResponse.length,
          responseStart: rawResponse.substring(0, 100),
          responseEnd: rawResponse.substring(rawResponse.length - 100)
        });

        const result = JSON.parse(rawResponse);
        
        console.log('✅ [SchemaEnforcer] Successfully parsed JSON response:', {
          resultKeys: Object.keys(result),
          resultType: typeof result,
          attempt: attempts
        });
        
        // Validate against schema
        console.log('🔍 [SchemaEnforcer] Validating against schema:', {
          schemaKeys: Object.keys(definition.output_schema as unknown as Record<string, unknown>),
          resultKeys: Object.keys(result)
        });
        
        const validation = this.validateSchema(result, definition.output_schema as unknown as Record<string, unknown>);
        
        if (validation.valid) {
          console.log('✅ [SchemaEnforcer] Schema validation passed:', {
            attempt: attempts,
            resultKeys: Object.keys(result)
          });
          return {
            success: true,
            data: result as T,
            attempts
          };
        }

        console.warn('⚠️ [SchemaEnforcer] Schema validation failed:', {
          attempt: attempts,
          errors: validation.errors,
          resultKeys: Object.keys(result),
          schemaKeys: Object.keys(definition.output_schema as unknown as Record<string, unknown>)
        });

        // If validation failed and we have more attempts, retry with more specific instructions
        if (attempts < maxAttempts) {
          console.log('🔄 [SchemaEnforcer] Adding validation feedback for retry:', {
            attempt: attempts,
            maxAttempts,
            errors: validation.errors
          });
          currentPrompt = this.addValidationFeedback(currentPrompt, validation.errors, definition.output_schema as unknown as Record<string, unknown>);
          console.log('📝 [SchemaEnforcer] Updated prompt for retry:', {
            newLength: currentPrompt.length,
            promptPreview: currentPrompt.substring(0, 200) + (currentPrompt.length > 200 ? '... [truncated]' : '')
          });
        } else {
          console.error('❌ [SchemaEnforcer] Max attempts reached, validation still failing:', {
            attempts,
            errors: validation.errors
          });
        }

      } catch (error) {
        console.error(`❌ [SchemaEnforcer] Error in attempt ${attempts}:`, {
          error: error instanceof Error ? error.message : 'Unknown error',
          errorType: error instanceof Error ? error.constructor.name : typeof error,
          attempt: attempts,
          maxAttempts
        });

        if (attempts >= maxAttempts) {
          console.error('💥 [SchemaEnforcer] Max attempts reached, giving up:', {
            attempts,
            maxAttempts,
            finalError: error instanceof Error ? error.message : 'Unknown error'
          });
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            attempts
          };
        } else {
          console.log('🔄 [SchemaEnforcer] Will retry after error:', {
            attempt: attempts,
            maxAttempts,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    console.error('💥 [SchemaEnforcer] All attempts exhausted:', {
      maxAttempts,
      finalAttempt: attempts
    });
    
    return {
      success: false,
      error: `Failed to generate valid response after ${maxAttempts} attempts`,
      attempts
    };
  }

  /**
   * Add validation feedback to prompt for retry
   */
  private static addValidationFeedback(
    prompt: string,
    errors: string[],
    schema: Record<string, unknown>
  ): string {
    const schemaStr = JSON.stringify(schema, null, 2);
    
    return `${prompt}

IMPORTANT: Your previous response failed validation. Please fix these issues:
${errors.map(error => `- ${error}`).join('\n')}

You MUST return JSON that exactly matches this schema:
${schemaStr}

Rules:
- No extra keys beyond what's in the schema
- All required fields must be present
- Data types must match exactly
- Return ONLY the JSON, no other text`;
  }

  /**
   * Validate data against JSON schema
   */
  private static validateSchema(
    data: unknown,
    schema: Record<string, unknown>
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      // Basic validation - this could be enhanced with a proper JSON schema validator
      if (typeof data !== 'object' || data === null) {
        errors.push('Response must be an object');
        return { valid: false, errors };
      }

      const dataObj = data as Record<string, unknown>;
      const schemaObj = schema as Record<string, unknown>;

      // Check required fields
      if (schemaObj.required && Array.isArray(schemaObj.required)) {
        const required = schemaObj.required as string[];
        for (const field of required) {
          if (!(field in dataObj)) {
            errors.push(`Missing required field: ${field}`);
          }
        }
      }

      // Check properties with proper validation
      if (schemaObj.properties && typeof schemaObj.properties === 'object') {
        const properties = schemaObj.properties as Record<string, unknown>;
        
        for (const [key, value] of Object.entries(dataObj)) {
          if (!(key in properties)) {
            errors.push(`Unexpected field: ${key}`);
          } else {
            // Validate the field according to its schema
            const fieldSchema = properties[key] as Record<string, unknown>;
            const fieldErrors = this.validateField(dataObj[key], fieldSchema, key);
            errors.push(...fieldErrors);
          }
        }
      }

      return { valid: errors.length === 0, errors };

    } catch (error) {
      errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { valid: false, errors };
    }
  }

  /**
   * Validate a single field according to its schema (simplified for function calling)
   */
  private static validateField(
    value: unknown,
    fieldSchema: Record<string, unknown>,
    fieldPath: string
  ): string[] {
    const errors: string[] = [];

    // Basic type checking only - function calling handles the rest
    if (fieldSchema.type) {
      const expectedType = fieldSchema.type as string;
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      
      if (expectedType === 'array' && !Array.isArray(value)) {
        errors.push(`${fieldPath}: Expected array, got ${actualType}`);
      } else if (expectedType !== 'array' && actualType !== expectedType) {
        errors.push(`${fieldPath}: Expected ${expectedType}, got ${actualType}`);
      }
    }

    return errors;
  }

  /**
   * Remove schema instructions from prompt text
   */
  private static removeSchemaFromPrompt(promptText: string): string {
    // Remove the schema section that we normally add
    const schemaRegex = /\n\nReturn ONLY JSON with this exact schema:[\s\S]*?Follow the schema exactly\./;
    let cleaned = promptText.replace(schemaRegex, '\n\nReturn your response as valid JSON.');
    
    // Remove conflicting JSON instructions when using function calling
    cleaned = cleaned.replace(/\n\nReturn your response as a JSON object with an "analysis" field containing the full text analysis\./, '');
    cleaned = cleaned.replace(/\n\nReturn your response as valid JSON\./, '');
    
    return cleaned;
  }

  /**
   * Build context information string from StepContext
   */
  private static buildContextInfo(context: StepContext): string | null {
    try {
      const contextData = context.contextData as Record<string, unknown>;
      const relevantInfo: string[] = [];

      // Add flow information
      relevantInfo.push(`Flow ID: ${context.flowId}`);
      relevantInfo.push(`Current Step: ${context.currentStep}`);
      relevantInfo.push(`Step Order: ${context.stepOrder}`);

      // Add relevant context data
      if (contextData.imageAnalysis) {
        relevantInfo.push(`Previous Analysis: ${JSON.stringify(contextData.imageAnalysis)}`);
      }
      
      if (contextData.stepResults) {
        const stepResults = contextData.stepResults as Record<string, unknown>;
        Object.entries(stepResults).forEach(([step, result]) => {
          relevantInfo.push(`${step}: ${JSON.stringify(result)}`);
        });
      }

      if (contextData.conversationHistory) {
        const history = contextData.conversationHistory as Array<{question: string, answer: string}>;
        relevantInfo.push(`Conversation History: ${JSON.stringify(history)}`);
      }

      return relevantInfo.length > 0 ? relevantInfo.join('\n') : null;
    } catch (error) {
      console.warn('⚠️ [SchemaEnforcer] Failed to build context info:', error);
      return null;
    }
  }

  /**
   * Choose the best enforcement method based on model and requirements
   */
  static async executeWithSchemaEnforcement<T extends PromptType>(
    definition: PromptDefinition<T>,
    promptText: string,
    context?: StepContext,
    input?: Record<string, unknown>
  ): Promise<SchemaEnforcementResult<T>> {
    console.log('🔒 [SchemaEnforcer] Choosing enforcement method:', {
      model: definition.model,
      type: definition.type,
      hasContext: !!context,
      hasInput: !!input
    });

    // Use function calling for models that support it (exclude image generation which uses DALL-E)
    if ((definition.model === 'gpt-4o' || definition.model === 'gpt-4' || definition.model === 'gpt-5') && definition.type !== 'image_generation') {
      console.log('🎯 [SchemaEnforcer] Using function calling method');
      const functionResult = await this.executeWithFunctionCalling(definition, promptText, context, input);
      if (functionResult.success) {
        console.log('✅ [SchemaEnforcer] Function calling succeeded');
        return functionResult;
      }
      
      // Fallback to retry method if function calling fails
      console.warn('⚠️ [SchemaEnforcer] Function calling failed, falling back to retry method:', functionResult.error);
    }

    // Use retry method for other models or as fallback
    console.log('🔄 [SchemaEnforcer] Using retry method');
    return await this.executeWithRetry(definition, promptText, context, 3, input);
  }

  /**
   * Get appropriate function name for prompt type
   */
  private static getFunctionName(type: string): string {
    switch (type) {
      case 'image_analysis':
        return 'analyze_character_drawing';
      case 'questions_generation':
        return 'generate_questions';
      case 'image_generation':
        return 'generate_image_prompt';
      default:
        return 'generate_response';
    }
  }

  /**
   * Get appropriate function description for prompt type
   */
  private static getFunctionDescription(type: string): string {
    switch (type) {
      case 'image_analysis':
        return 'Analyze a child\'s character drawing and provide conversational analysis';
      case 'questions_generation':
        return 'Generate engaging questions to clarify character details';
      case 'image_generation':
        return 'Generate a DALL-E prompt for character illustration';
      default:
        return `Generate a response for ${type}`;
    }
  }
}
