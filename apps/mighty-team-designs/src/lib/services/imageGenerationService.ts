import { openai } from '@/lib/openai';
import { supabase } from '@/lib/supabase'
import { storage } from '@/lib/storage';
import { logDebug, logError, recordMetric } from '@/lib/debug';

export interface LogoGenerationOptions {
  teamName: string;
  sport: string;
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
      // For now, use a simple hardcoded prompt to test AI generation
      const promptText = `Create a ${options.style} ${options.sport} team logo for "${options.teamName}" that includes both a mascot/icon and the team name text.

STYLE: ${options.style}
COLORS: ${options.colors}
MASCOT: ${options.mascot}

ART STYLE REQUIREMENTS:
- Use illustrative art style with bold, clean lines
- Minimize visual artifacts and noise
- Sharp, crisp edges and defined shapes
- Clean vector-style appearance
- Professional illustration quality
- Avoid blurry or pixelated elements

TEXT REQUIREMENTS:
- MUST include the team name "${options.teamName}" prominently in the logo
- Use bold, readable fonts that work at small sizes
- High-contrast colors for text
- Text should complement the mascot/icon
- Clean typography with sharp edges

BACKGROUND GUIDELINES:
- Always include a solid background color for the logo
- The logo design should be contained within a solid background shape
- Only the area outside the logo background should be transparent
- Clean, solid background with no texture or noise

REQUIREMENTS:
- High contrast for uniforms and jerseys
- Single color capable (text and mascot must work in black/white)
- Scalable design (readable from 1 inch to 12 inches)
- Professional quality suitable for team uniforms
- Sport-specific elements appropriate for ${options.sport}
- Clean, illustrative style with minimal artifacts

Generate detailed prompt for gpt-image-1.`;

      console.log('=== PROMPT GENERATION DEBUG ===');
      console.log('📝 Generated prompt text:');
      console.log(promptText);
      console.log('📏 Prompt length:', promptText.length, 'characters');


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
          console.error(`❌ Error generating variant ${i + 1}:`, variantError);
          console.error('Error details:', variantError instanceof Error ? variantError.message : 'Unknown error');
          console.error('Error stack:', variantError instanceof Error ? variantError.stack : 'No stack trace');
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
        age_group: 'youth'
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

      console.log('=== OPENAI API CALL DEBUG ===');
      console.log('🤖 Model:', 'gpt-image-1');
      console.log('📝 Prompt:', promptText.substring(0, 200) + '...');
      console.log('🔢 N (count):', n);
      console.log('📐 Size:', size);
      console.log('⭐ Quality:', quality);
      
      // Generate logo using gpt-image-1 for testing (reduced quality)
      console.log('🚀 Making OpenAI API call...');
      const imageResponse = await openai.images.generate({
        model: 'gpt-image-1',
        prompt: promptText,
        n,
        size,
        quality
        // Note: gpt-image-1 doesn't support response_format parameter
      });
      
      console.log('✅ OpenAI API response received');
      console.log('📊 Response data length:', imageResponse.data?.length || 0);
      console.log('📊 Full response:', JSON.stringify(imageResponse, null, 2));

      const imageData = imageResponse.data?.[0];
      if (!imageData) {
        throw new Error('No image data received from OpenAI');
      }

      // gpt-image-1 returns URL format, not base64
      console.log('🖼️ Processing image data...');
      console.log('Image data keys:', Object.keys(imageData));
      console.log('Has URL:', !!imageData.url);
      console.log('Has b64_json:', !!imageData.b64_json);
      
      let imageBuffer: Buffer;
      if (imageData.url) {
        console.log('📥 Fetching image from URL:', imageData.url);
        // If URL format, fetch the image
        const imageResponse = await fetch(imageData.url);
        if (!imageResponse.ok) {
          console.error('❌ Failed to fetch image, status:', imageResponse.status);
          throw new Error(`Failed to fetch generated image: ${imageResponse.status}`);
        }
        imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
        console.log('✅ Image fetched successfully, size:', imageBuffer.length, 'bytes');
      } else if (imageData.b64_json) {
        console.log('📥 Using base64 data');
        // If base64 format (fallback)
        imageBuffer = Buffer.from(imageData.b64_json, 'base64');
        console.log('✅ Base64 decoded, size:', imageBuffer.length, 'bytes');
      } else {
        console.error('❌ No valid image data found');
        throw new Error('No valid image data received from OpenAI');
      }

      // Upload to storage (local or Supabase based on environment)
      const fileName = `variant_${variantNumber}_${Date.now()}.png`;
      const storageFile = await storage.uploadFile(
        imageBuffer,
        fileName,
        'team-logos',
        {
          contentType: 'image/png',
          cacheControl: '3600'
        }
      );

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
        public_url: storageFile.publicUrl,
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
      // Generate mock logos for testing (without database for now)
      for (let i = 0; i < (options.variantCount || 1); i++) {
        const fileName = `${flowId}/variant_${i + 1}_${Date.now()}.png`;
        
        // Create a more descriptive mock URL that includes team info
        const teamText = encodeURIComponent(options.teamName);
        const sportText = encodeURIComponent(options.sport);
        const styleText = encodeURIComponent(options.style);
        const mockPublicUrl = `https://via.placeholder.com/512x512/1E3A8A/FFFFFF?text=${teamText}`;

        // Create mock logo object without database insert for now
        const mockLogo = {
          id: `mock-${flowId}-${i + 1}`,
          variant_number: i + 1,
          is_selected: i === 0,
          file_path: fileName,
          generation_prompt: `Mock logo for ${options.teamName} (${options.sport}) - Style: ${options.style}, Colors: ${options.colors}, Mascot: ${options.mascot}`,
          model_used: 'mock-fallback',
          generation_time_ms: Date.now() - startTime,
          generation_cost_usd: 0.00,
          created_at: new Date().toISOString(),
          public_url: mockPublicUrl
        };

        generatedLogos.push(mockLogo);
      }

      await logDebug(flowId, 'info', 'logo_generation', 'Mock logos generated for testing', {
        variant_count: generatedLogos.length,
        team_name: options.teamName,
        sport: options.sport,
        age_group: 'youth'
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
    console.log('=== LOGO GENERATION DEBUG ===');
    console.log('OpenAI Available:', this.isOpenAIAvailable());
    console.log('Options:', options);
    
    if (this.isOpenAIAvailable()) {
      try {
        console.log('=== ATTEMPTING AI GENERATION ===');
        console.log('Flow ID:', flowId);
        console.log('Options:', JSON.stringify(options, null, 2));
        const result = await this.generateTeamLogos(flowId, options);
        console.log('✅ AI generation successful, generated', result.length, 'logos');
        console.log('First logo model:', result[0]?.model_used);
        return result;
      } catch (error) {
        console.error('❌ AI generation failed with error:', error);
        console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        
        // Check if it's a quota/rate limit error
        if (error instanceof Error && (error.message.includes('quota') || error.message.includes('insufficient') || error.message.includes('429'))) {
          console.warn('⚠️ API quota/rate limit exceeded, using mock logos');
        } else {
          console.warn('🔄 Other error, falling back to mock logos');
        }
        
        return this.generateMockLogos(flowId, options);
      }
    } else {
      console.warn('OpenAI API key not available, using mock logos for testing');
      return this.generateMockLogos(flowId, options);
    }
  }
}
