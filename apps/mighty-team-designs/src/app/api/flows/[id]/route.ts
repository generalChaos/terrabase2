import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { logDebug } from '@/lib/debug';

// GET /api/flows/[id] - Get a specific flow
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const flowId = params.id;

    if (!flowId) {
      return NextResponse.json(
        { error: 'Flow ID is required' },
        { status: 400 }
      );
    }

    const { data: flow, error } = await supabase
      .from('team_design_flows')
      .select('*')
      .eq('id', flowId)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching flow:', error);
      return NextResponse.json(
        { error: 'Flow not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: flow
    });

  } catch (error) {
    console.error('Error in GET /api/flows/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/flows/[id] - Update a flow
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const flowId = params.id;
    const body = await request.json();

    if (!flowId) {
      return NextResponse.json(
        { error: 'Flow ID is required' },
        { status: 400 }
      );
    }

    const { data: flow, error } = await supabase
      .from('team_design_flows')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', flowId)
      .eq('is_active', true)
      .select()
      .single();

    if (error) {
      console.error('Error updating flow:', error);
      return NextResponse.json(
        { error: 'Failed to update flow' },
        { status: 500 }
      );
    }

    // Log debug information if enabled
    if (flow.debug_mode) {
      await logDebug(flow.id, 'info', 'flow_update', 'Flow updated', {
        updated_fields: Object.keys(body),
        current_step: flow.current_step
      });
    }

    return NextResponse.json({
      success: true,
      data: flow
    });

  } catch (error) {
    console.error('Error in PUT /api/flows/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/flows/[id] - Soft delete a flow
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const flowId = params.id;

    if (!flowId) {
      return NextResponse.json(
        { error: 'Flow ID is required' },
        { status: 400 }
      );
    }

    const { data: flow, error } = await supabase
      .from('team_design_flows')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', flowId)
      .select()
      .single();

    if (error) {
      console.error('Error deleting flow:', error);
      return NextResponse.json(
        { error: 'Failed to delete flow' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Flow deleted successfully'
    });

  } catch (error) {
    console.error('Error in DELETE /api/flows/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
