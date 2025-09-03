import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, content, active } = body;



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

    // Update the prompt using admin client (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from('prompts')
      .update(updateData)
      .eq('id', id)
      .select();

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, content, active = true } = body;

    if (!name || !content) {
      return NextResponse.json({ 
        success: false, 
        error: 'Name and content are required' 
      }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('prompts')
      .insert([{ name, content, active }])
      .select()
      .single();

    if (error) {
      console.error('Error creating prompt:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create prompt' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      prompt: data
    });

  } catch (error: any) {
    console.error('Error in prompt creation API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
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
