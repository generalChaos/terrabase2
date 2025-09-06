import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

interface UpdatePromptData {
  content?: string;
  active?: boolean;
}

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
    const updateData: UpdatePromptData = {};
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

  } catch (error: unknown) {
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
    const { name, content, active = true, sort_order } = body;

    if (!name || !content) {
      return NextResponse.json({ 
        success: false, 
        error: 'Name and content are required' 
      }, { status: 400 });
    }

    // If no sort_order provided, get the highest sort_order and add 10
    let finalSortOrder = sort_order;
    if (finalSortOrder === undefined) {
      const { data: maxOrderData } = await supabaseAdmin
        .from('prompts')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1);
      
      finalSortOrder = maxOrderData?.[0]?.sort_order ? maxOrderData[0].sort_order + 10 : 10;
    }

    const { data, error } = await supabaseAdmin
      .from('prompts')
      .insert([{ name, content, active, sort_order: finalSortOrder }])
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

  } catch (error: unknown) {
    console.error('Error in prompt creation API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { promptId, direction } = body; // direction: 'up' or 'down'

    if (!promptId || !direction) {
      return NextResponse.json({ 
        success: false, 
        error: 'Prompt ID and direction are required' 
      }, { status: 400 });
    }

    // Get current prompt
    const { data: currentPrompt, error: currentError } = await supabaseAdmin
      .from('prompts')
      .select('*')
      .eq('id', promptId)
      .single();

    if (currentError || !currentPrompt) {
      return NextResponse.json({ 
        success: false, 
        error: 'Prompt not found' 
      }, { status: 404 });
    }

    // Get all prompts ordered by sort_order
    const { data: allPrompts, error: allError } = await supabaseAdmin
      .from('prompts')
      .select('*')
      .order('sort_order', { ascending: true });

    if (allError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch prompts' 
      }, { status: 500 });
    }

    const currentIndex = allPrompts.findIndex(p => p.id === promptId);
    if (currentIndex === -1) {
      return NextResponse.json({ 
        success: false, 
        error: 'Prompt not found in list' 
      }, { status: 404 });
    }

    let targetIndex;
    if (direction === 'up') {
      targetIndex = currentIndex - 1;
    } else if (direction === 'down') {
      targetIndex = currentIndex + 1;
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid direction. Use "up" or "down"' 
      }, { status: 400 });
    }

    // Check bounds
    if (targetIndex < 0 || targetIndex >= allPrompts.length) {
      return NextResponse.json({ 
        success: false, 
        error: 'Cannot move prompt in that direction' 
      }, { status: 400 });
    }

    const targetPrompt = allPrompts[targetIndex];
    
    // Check if all prompts have the same sort_order (common issue after migration)
    const allSameOrder = allPrompts.every(p => p.sort_order === allPrompts[0].sort_order);
    
    if (allSameOrder) {
      // Assign proper sort orders to all prompts
      const updates = allPrompts.map((prompt, index) => ({
        id: prompt.id,
        sort_order: (index + 1) * 10 // 10, 20, 30, etc.
      }));
      
      // Update all prompts with new sort orders
      for (const update of updates) {
        const { error } = await supabaseAdmin
          .from('prompts')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);
        
        if (error) {
          console.error('Error updating sort order:', error);
          return NextResponse.json({ 
            success: false, 
            error: 'Failed to initialize sort orders' 
          }, { status: 500 });
        }
      }
      
      // Now perform the actual swap with the new sort orders
      const newCurrentOrder = (currentIndex + 1) * 10;
      const newTargetOrder = (targetIndex + 1) * 10;
      
      const { error: updateError1 } = await supabaseAdmin
        .from('prompts')
        .update({ sort_order: newTargetOrder })
        .eq('id', currentPrompt.id);

      const { error: updateError2 } = await supabaseAdmin
        .from('prompts')
        .update({ sort_order: newCurrentOrder })
        .eq('id', targetPrompt.id);

      if (updateError1 || updateError2) {
        console.error('Error reordering prompts:', { updateError1, updateError2 });
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to reorder prompts' 
        }, { status: 500 });
      }
    } else {
      // Normal case: swap sort_order values
      const { error: updateError1 } = await supabaseAdmin
        .from('prompts')
        .update({ sort_order: targetPrompt.sort_order })
        .eq('id', currentPrompt.id);

      const { error: updateError2 } = await supabaseAdmin
        .from('prompts')
        .update({ sort_order: currentPrompt.sort_order })
        .eq('id', targetPrompt.id);

      if (updateError1 || updateError2) {
        console.error('Error reordering prompts:', { updateError1, updateError2 });
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to reorder prompts' 
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Prompts reordered successfully'
    });

  } catch (error: unknown) {
    console.error('Error in prompt reorder API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET(_request: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('prompts')
      .select('*')
      .order('sort_order', { ascending: true });

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

  } catch (error: unknown) {
    console.error('Error in prompt fetch API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
