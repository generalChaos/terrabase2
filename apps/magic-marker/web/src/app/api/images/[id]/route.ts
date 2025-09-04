import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/images/[id] - Get specific image
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from('images')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to retrieve image' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    const image = {
      ...data,
      questions: JSON.parse(data.questions),
      answers: data.answers ? JSON.parse(data.answers) : null,
      original_image_path: data.original_image_path, // Already a Supabase Storage URL
      final_image_path: data.final_image_path // Already a Supabase Storage URL
    };

    console.log('📸 Serving image data:', {
      id: image.id,
      original_image_path: image.original_image_path,
      final_image_path: image.final_image_path
    });

    return NextResponse.json(image);
  } catch (err) {
    console.error('Route error:', err);
    return NextResponse.json({ error: 'Failed to retrieve image' }, { status: 500 });
  }
}
