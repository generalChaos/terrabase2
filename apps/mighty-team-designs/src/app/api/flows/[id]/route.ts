import { NextRequest, NextResponse } from 'next/server';
import { serviceManager } from '@/lib/services/serviceManager';
import { logError } from '@/lib/debug';

// GET /api/flows/[id] - Get a specific flow
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: flowId } = await params;

    if (!flowId) {
      return NextResponse.json(
        { error: 'Flow ID is required' },
        { status: 400 }
      );
    }

    const flow = await serviceManager.flows.getFlowById(flowId);

    if (!flow) {
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: flowId } = await params;
    const body = await request.json();

    if (!flowId) {
      return NextResponse.json(
        { error: 'Flow ID is required' },
        { status: 400 }
      );
    }

    const updatedFlow = await serviceManager.flows.updateTeamDesignFlow(flowId, body);

    return NextResponse.json({
      success: true,
      data: updatedFlow
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: flowId } = await params;

    if (!flowId) {
      return NextResponse.json(
        { error: 'Flow ID is required' },
        { status: 400 }
      );
    }

    await serviceManager.flows.softDeleteTeamDesignFlow(flowId);

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
