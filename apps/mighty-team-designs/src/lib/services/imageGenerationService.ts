import { openai } from '@/lib/openai';
import { supabase } from '@/lib/supabase';
import { logDebug, logError, recordMetric } from '@/lib/debug';

export interface LogoGenerationOptions {
  teamName: string;
  sport: string;
  ageGroup: string;
  style: string;
  colors: string;
  mascot: string;
  variantCount?: number;
}

export interface GeneratedLogo {
  id: string;
  variant_number: number;
  file_path: string;
  public_url: string;
  is_selected: boolean;
  generation_time_ms: number;
  generation_cost_usd: number;
  generation_prompt: string;
  model_used: string;
  created_at: string;
}

export class ImageGenerationService {
  /**
   * Generate team logos using OpenAI's gpt-image-1
   */
  static async generateTeamLogos(
    flowId: string,
    options: LogoGenerationOptions
  ): Promise<GeneratedLogo[]> {
    const startTime = Date.now();
    const generatedLogos: GeneratedLogo[] = [];

    try {
      // Get the logo generation prompt
      const { data: prompt, error: promptError } = await supabase
        .from('logo_prompts')
        .select('*')
        .eq('name', 'team_logo_generation')
        .eq('active', true)
        .single();

      if (promptError || !prompt) {
        throw new Error('Logo generation prompt not found');
      }

      // Prepare the prompt with team data
      const promptText = prompt.prompt_text
        .replace('{team}', options.teamName)
        .replace('{sport}', options.sport)
        .replace('{style}', options.style)
        .replace('{colors}', options.colors)
        .replace('{mascot}', options.mascot);

      // Generate the requested number of logo variants
      for (let i = 0; i < (options.variantCount || 1); i++) {
        try {
          const logo = await this.generateSingleLogo(
            flowId,
            promptText,
            i + 1,
            startTime
          );
          generatedLogos.push(logo);
        } catch (variantError) {
          console.error(`Error generating variant ${i + 1}:`, variantError);
          await logError(flowId, 'logo_generation', `Failed to generate variant ${i + 1}`, variantError as Error);
          // Continue with other variants even if one fails
        }
      }

      if (generatedLogos.length === 0) {
        throw new Error('Failed to generate any logo variants');
      }

      // Record success metrics
      const totalTime = Date.now() - startTime;
      await recordMetric('logo_generation_success', 1, 'count', 'hour');
      await recordMetric('logo_generation_time', totalTime, 'milliseconds', 'hour');
      await recordMetric('logo_generation_cost', generatedLogos.reduce((sum, logo) => sum + logo.generation_cost_usd, 0), 'usd', 'hour');

      await logDebug(flowId, 'info', 'logo_generation', 'Logos generated successfully', {
        variant_count: generatedLogos.length,
        generation_time_ms: totalTime,
        team_name: options.teamName,
        sport: options.sport,
        age_group: options.ageGroup
      });

      return generatedLogos;

    } catch (error) {
      console.error('Error in generateTeamLogos:', error);
      await logError(flowId, 'logo_generation', 'Failed to generate team logos', error as Error);
      await recordMetric('logo_generation_error', 1, 'count', 'hour');
      throw error;
    }
  }

  /**
   * Generate a single logo variant
   */
  private static async generateSingleLogo(
    flowId: string,
    promptText: string,
    variantNumber: number,
    startTime: number
  ): Promise<GeneratedLogo> {
    try {
      // Generate logo using gpt-image-1 for high resolution
      const imageResponse = await openai.images.generate({
        model: 'gpt-image-1',
        prompt: promptText,
        n: 1,
        size: '1024x1024',
        quality: 'high'
        // Note: gpt-image-1 doesn't support response_format parameter
      });

      const imageData = imageResponse.data?.[0];
      if (!imageData) {
        throw new Error('No image data received from OpenAI');
      }

      // gpt-image-1 returns URL format, not base64
      let imageBuffer: Buffer;
      if (imageData.url) {
        // If URL format, fetch the image
        const imageResponse = await fetch(imageData.url);
        if (!imageResponse.ok) {
          throw new Error('Failed to fetch generated image');
        }
        imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      } else if (imageData.b64_json) {
        // If base64 format (fallback)
        imageBuffer = Buffer.from(imageData.b64_json, 'base64');
      } else {
        throw new Error('No valid image data received from OpenAI');
      }

      // Upload to Supabase Storage
      const fileName = `${flowId}/variant_${variantNumber}_${Date.now()}.png`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('team-logos')
        .upload(fileName, imageBuffer, {
          contentType: 'image/png',
          cacheControl: '3600'
        });

      if (uploadError) {
        console.error('Error uploading logo to storage:', uploadError);
        throw new Error('Failed to upload logo to storage');
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('team-logos')
        .getPublicUrl(fileName);

      // Calculate generation metrics
      const generationTime = Date.now() - startTime;
      const generationCost = 0.08; // Approximate cost for gpt-image-1

      // Save logo metadata to database
      const { data: logo, error: logoError } = await supabase
        .from('team_logos')
        .insert({
          flow_id: flowId,
          file_path: fileName,
          file_size: Buffer.from(imageData.b64_json, 'base64').length,
          mime_type: 'image/png',
          storage_bucket: 'team-logos',
          variant_number: variantNumber,
          is_selected: variantNumber === 1, // First variant is selected by default
          generation_prompt: promptText,
          model_used: 'gpt-image-1',
          generation_time_ms: generationTime,
          generation_cost_usd: generationCost
        })
        .select()
        .single();

      if (logoError) {
        console.error('Error saving logo metadata:', logoError);
        throw new Error('Failed to save logo metadata');
      }

      return {
        id: logo.id,
        variant_number: variantNumber,
        file_path: fileName,
        public_url: urlData.publicUrl,
        is_selected: variantNumber === 1,
        generation_time_ms: generationTime,
        generation_cost_usd: generationCost,
        generation_prompt: promptText,
        model_used: 'gpt-image-1',
        created_at: logo.created_at
      };

    } catch (error) {
      console.error(`Error generating logo variant ${variantNumber}:`, error);
      throw error;
    }
  }

  /**
   * Generate a mock logo for testing (when OpenAI API key is not available)
   */
  static async generateMockLogos(
    flowId: string,
    options: LogoGenerationOptions
  ): Promise<GeneratedLogo[]> {
    const startTime = Date.now();
    const generatedLogos: GeneratedLogo[] = [];

    try {
      // Generate mock logos for testing
      for (let i = 0; i < (options.variantCount || 1); i++) {
        const fileName = `${flowId}/variant_${i + 1}_${Date.now()}.png`;
        const mockPublicUrl = `https://via.placeholder.com/1024x1024/4F46E5/FFFFFF?text=${encodeURIComponent(options.teamName)}`;

        // Save mock logo metadata to database
        const { data: logo, error: logoError } = await supabase
          .from('team_logos')
          .insert({
            flow_id: flowId,
            file_path: fileName,
            file_size: 1024000, // Mock file size
            mime_type: 'image/png',
            storage_bucket: 'team-logos',
            variant_number: i + 1,
            is_selected: i === 0,
            generation_prompt: `Mock logo for ${options.teamName} (${options.sport}, ${options.ageGroup})`,
            model_used: 'mock',
            generation_time_ms: Date.now() - startTime,
            generation_cost_usd: 0.00
          })
          .select()
          .single();

        if (logoError) {
          console.error('Error saving mock logo metadata:', logoError);
          continue;
        }

        generatedLogos.push({
          id: logo.id,
          variant_number: i + 1,
          file_path: fileName,
          public_url: mockPublicUrl,
          is_selected: i === 0,
          generation_time_ms: Date.now() - startTime,
          generation_cost_usd: 0.00,
          generation_prompt: `Mock logo for ${options.teamName} (${options.sport}, ${options.ageGroup})`,
          model_used: 'mock',
          created_at: logo.created_at
        });
      }

      await logDebug(flowId, 'info', 'logo_generation', 'Mock logos generated for testing', {
        variant_count: generatedLogos.length,
        team_name: options.teamName,
        sport: options.sport,
        age_group: options.ageGroup
      });

      return generatedLogos;

    } catch (error) {
      console.error('Error in generateMockLogos:', error);
      throw error;
    }
  }

  /**
   * Check if OpenAI API key is available
   */
  static isOpenAIAvailable(): boolean {
    return !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here');
  }

  /**
   * Get generation method based on API availability
   */
  static async generateLogos(
    flowId: string,
    options: LogoGenerationOptions
  ): Promise<GeneratedLogo[]> {
    if (this.isOpenAIAvailable()) {
      return this.generateTeamLogos(flowId, options);
    } else {
      console.warn('OpenAI API key not available, using mock logos for testing');
      return this.generateMockLogos(flowId, options);
    }
  }
}
