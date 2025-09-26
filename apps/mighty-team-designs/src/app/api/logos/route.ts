import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { openai } from '@/lib/openai';
import { logDebug } from '@/lib/debug';

// Validation schemas
const GenerateLogoSchema = z.object({
  flow_id: z.string().uuid(),
  team_name: z.string(),
  sport: z.string(),
  age_group: z.string(),
  round1_answers: z.record(z.any()),
  round2_answers: z.array(z.any()),
  variant_count: z.number().min(1).max(3).optional().default(1)
});

// POST /api/logos/generate - Generate team logo(s)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = GenerateLogoSchema.parse(body);

    // Get the logo generation prompt
    const { data: prompt, error: promptError } = await supabase
      .from('logo_prompts')
      .select('*')
      .eq('name', 'team_logo_generation')
      .eq('active', true)
      .single();

    if (promptError || !prompt) {
      console.error('Logo generation prompt not found:', promptError);
      return NextResponse.json(
        { error: 'Logo generation not available' },
        { status: 500 }
      );
    }

    // Extract answers for prompt generation
    const style = validatedData.round2_answers.find(a => a.id === 'style')?.selected || 0;
    const colors = validatedData.round2_answers.find(a => a.id === 'colors')?.selected || 0;
    const mascot = validatedData.round2_answers.find(a => a.id === 'mascot')?.selected || 0;

    // Get the options for each answer
    const styleOptions = validatedData.round2_answers.find(a => a.id === 'style')?.options || ['Fun', 'Professional', 'Tough', 'Friendly'];
    const colorOptions = validatedData.round2_answers.find(a => a.id === 'colors')?.options || ['Team colors', 'Custom colors', 'Classic colors'];
    const mascotOptions = validatedData.round2_answers.find(a => a.id === 'mascot')?.options || ['Yes', 'No', 'Text only'];

    // Prepare the prompt with team data
    const promptText = prompt.prompt_text
      .replace('{team}', validatedData.team_name)
      .replace('{sport}', validatedData.sport)
      .replace('{age}', validatedData.age_group)
      .replace('{style}', styleOptions[style])
      .replace('{colors}', colorOptions[colors])
      .replace('{mascot}', mascotOptions[mascot]);

    const startTime = Date.now();
    const generatedLogos = [];

    // Generate the requested number of logo variants
    for (let i = 0; i < validatedData.variant_count; i++) {
      try {
        // Generate logo using gpt-image-1 for high resolution
        const imageResponse = await openai.images.generate({
          model: 'gpt-image-1',
          prompt: promptText,
          n: 1,
          size: '1024x1024', // Use supported size
          quality: 'hd',
          response_format: 'b64_json'
        });

        const imageData = imageResponse.data?.[0];
        if (!imageData?.b64_json) {
          throw new Error('No image data received from OpenAI');
        }

        // Upload to Supabase Storage
        const fileName = `${validatedData.flow_id}/variant_${i + 1}_${Date.now()}.png`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('team-logos')
          .upload(fileName, Buffer.from(imageData!.b64_json, 'base64'), {
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

        // Save logo metadata to database
        const { data: logo, error: logoError } = await supabase
          .from('team_logos')
          .insert({
            flow_id: validatedData.flow_id,
            file_path: fileName,
            file_size: Buffer.from(imageData!.b64_json, 'base64').length,
            mime_type: 'image/png',
            storage_bucket: 'team-logos',
            variant_number: i + 1,
            is_selected: i === 0, // First variant is selected by default
            generation_prompt: promptText,
            model_used: 'gpt-image-1',
            generation_time_ms: Date.now() - startTime,
            generation_cost_usd: 0.08 // Approximate cost for gpt-image-1
          })
          .select()
          .single();

        if (logoError) {
          console.error('Error saving logo metadata:', logoError);
          throw new Error('Failed to save logo metadata');
        }

        generatedLogos.push({
          id: logo.id,
          variant_number: i + 1,
          file_path: fileName,
          public_url: urlData.publicUrl,
          is_selected: i === 0
        });

      } catch (variantError) {
        console.error(`Error generating variant ${i + 1}:`, variantError);
        // Continue with other variants even if one fails
      }
    }

    if (generatedLogos.length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate any logo variants' },
        { status: 500 }
      );
    }

    // Update the flow with logo data
    const { data: updatedFlow, error: updateError } = await supabase
      .from('team_design_flows')
      .update({
        logo_prompt: promptText,
        logo_variants: generatedLogos,
        selected_logo_id: generatedLogos[0].id,
        logo_generated_at: new Date().toISOString(),
        current_step: 'completed'
      })
      .eq('id', validatedData.flow_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating flow with logo data:', updateError);
      return NextResponse.json(
        { error: 'Failed to update flow with logo data' },
        { status: 500 }
      );
    }

    // Log debug information
    await logDebug(validatedData.flow_id, 'info', 'logo_generation', 'Logos generated successfully', {
      variant_count: generatedLogos.length,
      generation_time_ms: Date.now() - startTime,
      team_name: validatedData.team_name,
      sport: validatedData.sport,
      age_group: validatedData.age_group
    });

    return NextResponse.json({
      success: true,
      data: {
        flow_id: validatedData.flow_id,
        logos: generatedLogos,
        selected_logo_id: generatedLogos[0].id,
        generation_time_ms: Date.now() - startTime
      }
    });

  } catch (error) {
    console.error('Error in POST /api/logos/generate:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/logos/select - Select a logo variant
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { flow_id, logo_id } = z.object({
      flow_id: z.string().uuid(),
      logo_id: z.string().uuid()
    }).parse(body);

    // Update the selected logo
    const { data: flow, error: updateError } = await supabase
      .from('team_design_flows')
      .update({
        selected_logo_id: logo_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', flow_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating selected logo:', updateError);
      return NextResponse.json(
        { error: 'Failed to update selected logo' },
        { status: 500 }
      );
    }

    // Update logo selection status
    await supabase
      .from('team_logos')
      .update({ is_selected: false })
      .eq('flow_id', flow_id);

    await supabase
      .from('team_logos')
      .update({ is_selected: true })
      .eq('id', logo_id);

    return NextResponse.json({
      success: true,
      data: { selected_logo_id: logo_id }
    });

  } catch (error) {
    console.error('Error in PUT /api/logos/select:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
