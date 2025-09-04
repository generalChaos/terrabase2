import { supabase } from './supabase';

/**
 * @deprecated This service is deprecated. Use the new prompt system with PromptExecutor and prompt_definitions table instead.
 * See: /admin/prompt-definitions for the new interface
 * See: /lib/promptExecutor.ts for the new execution system
 * See: /lib/openaiNew.ts for the new OpenAI service
 */

export interface Prompt {
  id: string;
  name: string;
  content: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConversationLog {
  prompt_id: string;
  input_data: unknown;
  output_data: unknown;
  response_time_ms: number;
  tokens_used?: number;
  model_used: string;
  success: boolean;
  error_message?: string;
}

export class PromptService {
  private static promptCache: Map<string, Prompt> = new Map();
  private static cacheExpiry: Map<string, number> = new Map();
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get a prompt by name with caching
   */
  static async getPrompt(name: string): Promise<Prompt | null> {
    try {
      console.log(`🔍 [PromptService] Fetching prompt: ${name}`);
      
      // Check cache first
      const cached = this.getCachedPrompt(name);
      if (cached) {
        console.log(`✅ [PromptService] Using cached prompt: ${name}`);
        console.log(`📝 [PromptService] Cached prompt content length: ${cached.content.length}`);
        return cached;
      }

      console.log(`🗄️ [PromptService] Fetching prompt from database: ${name}`);
      // Fetch from database
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('name', name)
        .eq('active', true)
        .single();

      if (error) {
        console.error(`❌ [PromptService] Error fetching prompt '${name}':`, error);
        return null;
      }

      if (!data) {
        console.warn(`⚠️ [PromptService] No active prompt found for name: ${name}`);
        return null;
      }

      console.log(`✅ [PromptService] Prompt fetched successfully: ${name}`);
      console.log(`📝 [PromptService] Prompt content length: ${data.content.length}`);
      console.log(`🆔 [PromptService] Prompt ID: ${data.id}`);
      console.log(`📊 [PromptService] Prompt active: ${data.active}`);
      console.log(`🔢 [PromptService] Prompt sort order: ${data.sort_order}`);

      // Cache the result
      this.setCachedPrompt(name, data);
      return data;
    } catch (error) {
      console.error(`💥 [PromptService] Unexpected error fetching prompt '${name}':`, error);
      return null;
    }
  }

  /**
   * Get all active prompts
   */
  static async getAllActivePrompts(): Promise<Prompt[]> {
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) {
        console.error('Error fetching all prompts:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Unexpected error fetching all prompts:', error);
      return [];
    }
  }

  /**
   * Log a conversation to the database
   */
  static async logConversation(log: ConversationLog): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_conversations')
        .insert({
          prompt_id: log.prompt_id,
          input_data: log.input_data,
          output_data: log.output_data,
          response_time_ms: log.response_time_ms,
          tokens_used: log.tokens_used,
          model_used: log.model_used,
          success: log.success,
          error_message: log.error_message
        });

      if (error) {
        console.error('Error logging conversation:', error);
        // Don't throw - logging failures shouldn't break the main flow
      }
    } catch (error) {
      console.error('Unexpected error logging conversation:', error);
      // Don't throw - logging failures shouldn't break the main flow
    }
  }

  /**
   * Clear the prompt cache (useful for testing or when prompts are updated)
   */
  static clearCache(): void {
    this.promptCache.clear();
    this.cacheExpiry.clear();
  }

  /**
   * Get cached prompt if still valid
   */
  private static getCachedPrompt(name: string): Prompt | null {
    const expiry = this.cacheExpiry.get(name);
    if (!expiry || Date.now() > expiry) {
      this.promptCache.delete(name);
      this.cacheExpiry.delete(name);
      return null;
    }
    return this.promptCache.get(name) || null;
  }

  /**
   * Cache a prompt with expiry
   */
  private static setCachedPrompt(name: string, prompt: Prompt): void {
    this.promptCache.set(name, prompt);
    this.cacheExpiry.set(name, Date.now() + this.CACHE_TTL);
  }

  /**
   * Replace template variables in prompt content
   * Simple template replacement for {variable_name} patterns
   */
  static replaceTemplateVariables(content: string, variables: Record<string, unknown>): string {
    let result = content;
    
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{${key}}`;
      const replacement = typeof value === 'string' ? value : JSON.stringify(value);
      result = result.replace(new RegExp(placeholder, 'g'), replacement);
    }
    
    return result;
  }
}
