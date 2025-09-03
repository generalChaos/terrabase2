import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, content, active } = body;

    console.log('Update request body:', { id, content: content?.substring(0, 50), active });

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Prompt ID is required' 
      }, { status: 400 });
    }

    // Build update object
    const updateData: any = {};
    if (content !== undefined) updateData.content = content;
    if (active !== undefined) updateData.active = active;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No update data provided' 
      }, { status: 400 });
    }

    // Update the prompt
    console.log('Attempting to update prompt with ID:', id);
    console.log('Update data:', updateData);
    
    const { data, error } = await supabase
      .from('prompts')
      .update(updateData)
      .eq('id', id)
      .select();

    console.log('Update result:', { data, error });

    if (error) {
      console.error('Error updating prompt:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update prompt' 
      }, { status: 500 });
    }

    if (!data || data.length === 0) {
      console.log('No rows updated - prompt not found with ID:', id);
      return NextResponse.json({ 
        success: false, 
        error: 'Prompt not found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      prompt: data[0]
    });

  } catch (error: any) {
    console.error('Error in prompt update API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching prompts:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch prompts' 
      }, { status: 500 });
    }

    console.log('Fetched prompts:', data?.map(p => ({ id: p.id, name: p.name })));

    return NextResponse.json({
      success: true,
      prompts: data || []
    });

  } catch (error: any) {
    console.error('Error in prompt fetch API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
