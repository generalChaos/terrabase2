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

    return NextResponse.json({
      steps: data || [],
      total: count || 0,
      limit,
      offset
    });
  } catch (err) {
    console.error('Route error:', err);
    return NextResponse.json({ error: 'Failed to retrieve steps' }, { status: 500 });
  }
}
