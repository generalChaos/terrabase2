import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/admin/steps - Get all processing steps with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('image_id');
    const stepType = searchParams.get('step_type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('image_processing_steps')
      .select(`
        *,
        images!inner(original_image_path, final_image_path)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (imageId) {
      query = query.eq('image_id', imageId);
    }
    if (stepType) {
      query = query.eq('step_type', stepType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to retrieve steps' }, { status: 500 });
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('image_processing_steps')
      .select('*', { count: 'exact', head: true });

    if (imageId) {
      countQuery = countQuery.eq('image_id', imageId);
    }
    if (stepType) {
      countQuery = countQuery.eq('step_type', stepType);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Count error:', countError);
    }

    // Get unique step types to fetch schemas
    const stepTypes = [...new Set((data || []).map(step => step.step_type))];
    
    // Fetch schemas for all step types
    const { data: schemas, error: schemaError } = await supabase
      .from('prompt_definitions')
      .select('type, input_schema, output_schema')
      .in('type', stepTypes);

    if (schemaError) {
      console.error('Schema fetch error:', schemaError);
    }

    // Create a map of step type to schema
    const schemaMap = new Map();
    (schemas || []).forEach(schema => {
      schemaMap.set(schema.type, {
        input_schema: schema.input_schema,
        output_schema: schema.output_schema
      });
    });

    // Process the data to include schema information
    const processedSteps = (data || []).map(step => {
      const schema = schemaMap.get(step.step_type);
      return {
        ...step,
        input_schema: schema?.input_schema,
        output_schema: schema?.output_schema
      };
    });

    return NextResponse.json({
      steps: processedSteps,
      total: count || 0,
      limit,
      offset
    });
  } catch (err) {
    console.error('Route error:', err);
    return NextResponse.json({ error: 'Failed to retrieve steps' }, { status: 500 });
  }
}
