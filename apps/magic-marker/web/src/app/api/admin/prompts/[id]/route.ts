import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Prompt ID is required' 
      }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('prompts')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error deleting prompt:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to delete prompt' 
      }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ 
        success: false, 
        error: 'Prompt not found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Prompt deleted successfully'
    });

  } catch (error: any) {
    console.error('Error in prompt deletion API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
