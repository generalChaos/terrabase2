import { openai } from '@/lib/openai';
import { supabase } from '@/lib/supabase';
import { logDebug, logError, recordMetric } from '@/lib/debug';

export interface LogoGenerationOptions {
  teamName: string;
  sport: string;
  ageGroup: string;
  style: string;
  colors: string;
  customColors?: string;
  mascot: string;
  mascotType?: string;
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
        .replace('{age_group}', options.ageGroup)
        .replace('{style}', options.style)
        .replace('{colors}', this.optimizeColorsForPrint(options.colors, options.customColors))
        .replace('{custom_colors}', options.customColors || '')
        .replace('{mascot}', options.mascot)
        .replace('{mascot_type}', options.mascotType || '');

      // Debug logging
      console.log('=== PROMPT DEBUG ===');
      console.log('Original prompt from DB:', prompt.prompt_text.substring(0, 200) + '...');
      console.log('Final prompt text:', promptText.substring(0, 200) + '...');
      console.log('===================');

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
   * Optimize colors for print compatibility
   */
  private static optimizeColorsForPrint(colors: string, customColors?: string): string {
    // If user selected "Input custom colors" and provided custom colors, use them
    if (colors === 'Input custom colors' && customColors && customColors.trim()) {
      return this.optimizeCustomColors(customColors);
    }

    // If custom colors are provided (fallback), optimize them
    if (customColors && customColors.trim()) {
      return this.optimizeCustomColors(customColors);
    }

    // For "Use team colors", return optimized team colors
    if (colors === 'Use team colors') {
      return 'print-optimized team colors (navy blue, royal blue, red, maroon, forest green, gold, silver, black, white)';
    }

    // For other color options, return as-is with print optimization note
    return `print-optimized ${colors.toLowerCase()}`;
  }

  /**
   * Optimize custom color input for print
   */
  private static optimizeCustomColors(customColors: string): string {
    const colorMap: Record<string, string> = {
      // Common color variations to print-safe equivalents
      'blue': 'navy blue',
      'light blue': 'royal blue',
      'dark blue': 'navy blue',
      'bright blue': 'royal blue',
      'sky blue': 'royal blue',
      'red': 'red',
      'bright red': 'red',
      'dark red': 'maroon',
      'green': 'forest green',
      'bright green': 'forest green',
      'lime green': 'forest green',
      'yellow': 'gold',
      'bright yellow': 'gold',
      'orange': 'gold',
      'bright orange': 'gold',
      'purple': 'maroon',
      'violet': 'maroon',
      'pink': 'red',
      'gray': 'silver',
      'grey': 'silver',
      'black': 'black',
      'white': 'white'
    };

    // Convert to lowercase for matching
    const lowerColors = customColors.toLowerCase();
    
    // Try to find and replace common color variations
    let optimizedColors = customColors;
    for (const [variation, printSafe] of Object.entries(colorMap)) {
      const regex = new RegExp(`\\b${variation}\\b`, 'gi');
      optimizedColors = optimizedColors.replace(regex, printSafe);
    }

    return `print-optimized colors: ${optimizedColors}`;
  }

  /**
   * Calculate cost based on image generation parameters
   */
  private static calculateImageGenerationCost(
    size: string,
    quality: string,
    n: number = 1
  ): number {
    // gpt-image-1 pricing as of 2024 (per image)
    const pricing = {
      '1024x1024': {
        'low': 0.04,
        'standard': 0.08,
        'high': 0.12
      },
      '1024x1792': {
        'low': 0.08,
        'standard': 0.12,
        'high': 0.16
      },
      '1792x1024': {
        'low': 0.08,
        'standard': 0.12,
        'high': 0.16
      }
    };

    const sizePricing = pricing[size as keyof typeof pricing];
    if (!sizePricing) {
      console.warn(`Unknown size ${size}, using default pricing`);
      return 0.04 * n; // Default to low quality 1024x1024 pricing
    }

    const qualityPricing = sizePricing[quality as keyof typeof sizePricing];
    if (qualityPricing === undefined) {
      console.warn(`Unknown quality ${quality}, using low quality pricing`);
      return sizePricing.low * n;
    }

    return qualityPricing * n;
  }

  /**
   * Get cost analytics for logo generation
   */
  static async getCostAnalytics(timeframe: 'day' | 'week' | 'month' = 'day'): Promise<{
    totalCost: number;
    totalImages: number;
    averageCostPerImage: number;
    costByQuality: Record<string, number>;
    costBySize: Record<string, number>;
  }> {
    const { data: logos, error } = await supabase
      .from('team_logos')
      .select('generation_cost_usd, generation_params, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching cost analytics:', error);
      throw new Error('Failed to fetch cost analytics');
    }

    // Filter by timeframe
    const now = new Date();
    const filteredLogos = logos?.filter(logo => {
      const logoDate = new Date(logo.created_at);
      const diffInDays = (now.getTime() - logoDate.getTime()) / (1000 * 60 * 60 * 24);
      
      switch (timeframe) {
        case 'day': return diffInDays <= 1;
        case 'week': return diffInDays <= 7;
        case 'month': return diffInDays <= 30;
        default: return true;
      }
    }) || [];

    // Calculate analytics
    const totalCost = filteredLogos.reduce((sum, logo) => sum + (logo.generation_cost_usd || 0), 0);
    const totalImages = filteredLogos.length;
    const averageCostPerImage = totalImages > 0 ? totalCost / totalImages : 0;

    // Group by quality and size
    const costByQuality: Record<string, number> = {};
    const costBySize: Record<string, number> = {};

    filteredLogos.forEach(logo => {
      const params = logo.generation_params as any;
      const cost = logo.generation_cost_usd || 0;
      
      if (params?.quality) {
        costByQuality[params.quality] = (costByQuality[params.quality] || 0) + cost;
      }
      
      if (params?.size) {
        costBySize[params.size] = (costBySize[params.size] || 0) + cost;
      }
    });

    return {
      totalCost,
      totalImages,
      averageCostPerImage,
      costByQuality,
      costBySize
    };
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
      const size = '1024x1024';
      const quality = 'low';
      const n = 1;

      // Generate logo using gpt-image-1 for testing (reduced quality)
      const imageResponse = await openai.images.generate({
        model: 'gpt-image-1',
        prompt: promptText,
        n,
        size,
        quality
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
      
      // Calculate actual cost based on generation parameters
      const generationCost = this.calculateImageGenerationCost(size, quality, n);

      // Save logo metadata to database
      const { data: logo, error: logoError } = await supabase
        .from('team_logos')
        .insert({
          flow_id: flowId,
          file_path: fileName,
          file_size: Buffer.from(imageData.b64_json || '', 'base64').length,
          mime_type: 'image/png',
          storage_bucket: 'team-logos',
          variant_number: variantNumber,
          is_selected: variantNumber === 1, // First variant is selected by default
          generation_prompt: promptText,
          model_used: 'gpt-image-1',
          generation_time_ms: generationTime,
          generation_cost_usd: generationCost,
          // Store pricing parameters for cost tracking
          generation_params: {
            size,
            quality,
            n,
            model: 'gpt-image-1'
          }
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
