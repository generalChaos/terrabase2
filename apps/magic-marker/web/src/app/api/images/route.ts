import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/images - Get all images
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to retrieve images' }, { status: 500 });
    }

    const images = data?.map(row => ({
      ...row,
      questions: JSON.parse(row.questions),
      answers: row.answers ? JSON.parse(row.answers) : null,
      original_image_path: row.original_image_path, // Already a Supabase Storage URL
      final_image_path: row.final_image_path // Already a Supabase Storage URL
    })) || [];

    return NextResponse.json(images);
  } catch (err) {
    console.error('Route error:', err);
    return NextResponse.json({ error: 'Failed to retrieve images' }, { status: 500 });
  }
}
