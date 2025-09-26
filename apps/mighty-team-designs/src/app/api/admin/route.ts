import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { getDebugLogs, getSystemMetrics, getErrorPatterns } from '@/lib/debug';

// Validation schemas
const AdminAuthSchema = z.object({
  password: z.string().min(1, 'Password is required')
});

const GetLogsSchema = z.object({
  flow_id: z.string().uuid().optional(),
  level: z.enum(['debug', 'info', 'warn', 'error']).optional(),
  category: z.string().optional(),
  limit: z.number().min(1).max(1000).optional().default(50)
});

const GetMetricsSchema = z.object({
  time_period: z.enum(['hour', 'day', 'week']).optional().default('hour'),
  limit: z.number().min(1).max(1000).optional().default(100)
});

const GetErrorsSchema = z.object({
  resolved: z.boolean().optional().default(false),
  limit: z.number().min(1).max(1000).optional().default(50)
});

// Helper function to verify admin password
function verifyAdminPassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    console.error('ADMIN_PASSWORD environment variable not set');
    return false;
  }
  return password === adminPassword;
}

// GET /api/admin - Get admin dashboard data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const password = searchParams.get('password');

    if (!password || !verifyAdminPassword(password)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get recent flows
    const { data: recentFlows, error: flowsError } = await supabase
      .from('team_design_flows')
      .select(`
        id,
        team_name,
        sport,
        age_group,
        current_step,
        created_at,
        updated_at,
        debug_mode
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(20);

    if (flowsError) {
      console.error('Error fetching recent flows:', flowsError);
    }

    // Get system metrics
    const metrics = await getSystemMetrics('hour', 10);

    // Get error patterns
    const errorPatterns = await getErrorPatterns(false, 10);

    // Get total counts
    const { data: flowCount, error: flowCountError } = await supabase
      .from('team_design_flows')
      .select('id', { count: 'exact' })
      .eq('is_active', true);

    const { data: logoCount, error: logoCountError } = await supabase
      .from('team_logos')
      .select('id', { count: 'exact' });

    return NextResponse.json({
      success: true,
      data: {
        recent_flows: recentFlows || [],
        metrics: metrics,
        error_patterns: errorPatterns,
        counts: {
          total_flows: flowCount?.length || 0,
          total_logos: logoCount?.length || 0
        }
      }
    });

  } catch (error) {
    console.error('Error in GET /api/admin:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/logs - Get debug logs
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password, ...queryParams } = body;

    if (!password || !verifyAdminPassword(password)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const validatedData = GetLogsSchema.parse(queryParams);

    let query = supabase
      .from('debug_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(validatedData.limit);

    if (validatedData.flow_id) {
      query = query.eq('flow_id', validatedData.flow_id);
    }

    if (validatedData.level) {
      query = query.eq('log_level', validatedData.level);
    }

    if (validatedData.category) {
      query = query.eq('category', validatedData.category);
    }

    const { data: logs, error } = await query;

    if (error) {
      console.error('Error fetching debug logs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch debug logs' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: logs || []
    });

  } catch (error) {
    console.error('Error in POST /api/admin/logs:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/admin/metrics - Get system metrics
export async function GET_METRICS(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const password = searchParams.get('password');

    if (!password || !verifyAdminPassword(password)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const validatedData = GetMetricsSchema.parse({
      time_period: searchParams.get('time_period'),
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
    });

    const metrics = await getSystemMetrics(validatedData.time_period, validatedData.limit);

    return NextResponse.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    console.error('Error in GET /api/admin/metrics:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/admin/errors - Get error patterns
export async function GET_ERRORS(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const password = searchParams.get('password');

    if (!password || !verifyAdminPassword(password)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const validatedData = GetErrorsSchema.parse({
      resolved: searchParams.get('resolved') === 'true',
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
    });

    const errorPatterns = await getErrorPatterns(validatedData.resolved, validatedData.limit);

    return NextResponse.json({
      success: true,
      data: errorPatterns
    });

  } catch (error) {
    console.error('Error in GET /api/admin/errors:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
