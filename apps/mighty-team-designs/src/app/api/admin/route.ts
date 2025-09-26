import { NextRequest, NextResponse } from 'next/server';
import { serviceManager } from '@/lib/services/serviceManager';
import { logError } from '@/lib/debug';

// GET /api/admin - Get admin dashboard data
export async function GET(request: NextRequest) {
  try {
    // Check for admin authentication (simple env var check)
    const adminPassword = request.headers.get('x-admin-password');
    const expectedPassword = process.env.ADMIN_PASSWORD;

    if (!expectedPassword || adminPassword !== expectedPassword) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const debugInfo = await serviceManager.getDebugInfo();

    return NextResponse.json({
      success: true,
      data: debugInfo
    });

  } catch (error) {
    await logError('system', 'api', 'Failed to get admin data', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/maintenance - Run system maintenance
export async function POST(request: NextRequest) {
  try {
    // Check for admin authentication
    const adminPassword = request.headers.get('x-admin-password');
    const expectedPassword = process.env.ADMIN_PASSWORD;

    if (!expectedPassword || adminPassword !== expectedPassword) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const maintenanceResults = await serviceManager.performMaintenance();

    return NextResponse.json({
      success: true,
      data: maintenanceResults
    });

  } catch (error) {
    await logError('system', 'api', 'Failed to run maintenance', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}