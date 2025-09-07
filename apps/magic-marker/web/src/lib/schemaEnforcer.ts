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
    context?: StepContext
  ): Promise<SchemaEnforcementResult<T>> {
    const { OpenAI } = await import('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    try {
      const response = await openai.chat.completions.create({
        model: definition.model,
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that generates structured responses. Always use the provided function to return your response."
          },
          {
            role: "user",
            content: promptText
          }
        ],
        functions: [{
          name: "generate_response",
          description: `Generate a response for ${definition.type}`,
          parameters: definition.output_schema as unknown as Record<string, unknown>
        }],
        function_call: { name: "generate_response" },
        max_tokens: definition.max_tokens,
        temperature: definition.temperature || 0.7
      });

      const functionCall = response.choices[0].message.function_call;
      if (!functionCall || functionCall.name !== "generate_response") {
        return {
          success: false,
          error: "No function call returned"
        };
      }

      const result = JSON.parse(functionCall.arguments);
      
      // Validate the result against the schema (double-check)
      const validation = this.validateSchema(result, definition.output_schema as unknown as Record<string, unknown>);
      if (!validation.valid) {
        return {
          success: false,
          error: `Schema validation failed: ${validation.errors.join(', ')}`
        };
      }

      return {
        success: true,
        data: result as T
      };

    } catch (error) {
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
    maxAttempts: number = 3
  ): Promise<SchemaEnforcementResult<T>> {
    const { OpenAI } = await import('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    let attempts = 0;
    let currentPrompt = promptText;

    while (attempts < maxAttempts) {
      attempts++;

      try {
        const response = await openai.chat.completions.create({
          model: definition.model,
          messages: [
            {
              role: "user",
              content: currentPrompt
            }
          ],
          response_format: { type: "json_object" },
          max_tokens: definition.max_tokens,
          temperature: definition.temperature || 0.7
        });

        const rawResponse = response.choices[0].message.content;
        if (!rawResponse) {
          throw new Error('No response content');
        }

        const result = JSON.parse(rawResponse);
        
        // Validate against schema
        const validation = this.validateSchema(result, definition.output_schema as unknown as Record<string, unknown>);
        if (validation.valid) {
          return {
            success: true,
            data: result as T,
            attempts
          };
        }

        // If validation failed and we have more attempts, retry with more specific instructions
        if (attempts < maxAttempts) {
          currentPrompt = this.addValidationFeedback(currentPrompt, validation.errors, definition.output_schema as unknown as Record<string, unknown>);
        }

      } catch (error) {
        if (attempts >= maxAttempts) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            attempts
          };
        }
      }
    }

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

      // Check properties
      if (schemaObj.properties && typeof schemaObj.properties === 'object') {
        const properties = schemaObj.properties as Record<string, unknown>;
        for (const [key, value] of Object.entries(dataObj)) {
          if (!(key in properties)) {
            errors.push(`Unexpected field: ${key}`);
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
   * Choose the best enforcement method based on model and requirements
   */
  static async executeWithSchemaEnforcement<T extends PromptType>(
    definition: PromptDefinition<T>,
    promptText: string,
    context?: StepContext
  ): Promise<SchemaEnforcementResult<T>> {
    // Use function calling for models that support it
    if (definition.model === 'gpt-4o' || definition.model === 'gpt-4') {
      const functionResult = await this.executeWithFunctionCalling(definition, promptText, context);
      if (functionResult.success) {
        return functionResult;
      }
      
      // Fallback to retry method if function calling fails
      console.warn('Function calling failed, falling back to retry method');
    }

    // Use retry method for other models or as fallback
    return await this.executeWithRetry(definition, promptText, context);
  }
}
