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

    // Get comprehensive admin data
    const [flows, questions, logos, debugLogs, systemMetrics] = await Promise.all([
      getFlowsData(),
      getQuestionsData(),
      getLogosData(),
      getDebugLogsData(),
      getSystemMetricsData()
    ]);

    const adminData = {
      flows,
      questions,
      logos,
      debug_logs: debugLogs,
      system_metrics: systemMetrics
    };

    return NextResponse.json({
      success: true,
      data: adminData
    });

  } catch (error) {
    await logError('system', 'api', 'Failed to get admin data', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to get flows data
async function getFlowsData() {
  try {
    const total = await serviceManager.flows.count();
    const recent = await serviceManager.flows.findMany(
      {},
      'id, team_name, sport, age_group, current_step, created_at',
      'created_at',
      'desc',
      10
    );
    
    return {
      total,
      recent: recent || []
    };
  } catch (error) {
    console.error('Error getting flows data:', error);
    return { total: 0, recent: [] };
  }
}

// Helper function to get questions data
async function getQuestionsData() {
  try {
    const total = await serviceManager.questions.count();
    
    // Get questions by sport and age group
    const { data: questions } = await serviceManager.questions.findMany({}, 'sport, age_group');
    
    const bySport: Record<string, number> = {};
    const byAgeGroup: Record<string, number> = {};
    
    if (questions) {
      questions.forEach((q: any) => {
        bySport[q.sport] = (bySport[q.sport] || 0) + 1;
        byAgeGroup[q.age_group] = (byAgeGroup[q.age_group] || 0) + 1;
      });
    }
    
    return {
      total,
      by_sport: bySport,
      by_age_group: byAgeGroup
    };
  } catch (error) {
    console.error('Error getting questions data:', error);
    return { total: 0, by_sport: {}, by_age_group: {} };
  }
}

// Helper function to get logos data
async function getLogosData() {
  try {
    const total = await serviceManager.logos.count();
    const recent = await serviceManager.logos.findMany(
      {},
      'id, flow_id, variant_number, created_at, model_used',
      'created_at',
      'desc',
      10
    );
    
    return {
      total,
      recent: recent || []
    };
  } catch (error) {
    console.error('Error getting logos data:', error);
    return { total: 0, recent: [] };
  }
}

// Helper function to get debug logs data
async function getDebugLogsData() {
  try {
    const total = await serviceManager.debug.count();
    const recent = await serviceManager.debug.findMany(
      {},
      'id, log_level, category, message, created_at',
      'created_at',
      'desc',
      20
    );
    
    return {
      total,
      recent: recent || []
    };
  } catch (error) {
    console.error('Error getting debug logs data:', error);
    return { total: 0, recent: [] };
  }
}

// Helper function to get system metrics data
async function getSystemMetricsData() {
  try {
    const { data: metrics } = await serviceManager.metrics.findMany(
      {},
      'metric_name, metric_value, created_at',
      'created_at',
      'desc',
      100
    );
    
    let questionGenerationTimeAvg = 0;
    let logoGenerationTimeAvg = 0;
    let errorRate = 0;
    
    if (metrics) {
      // Calculate average question generation time
      const questionTimes = metrics
        .filter((m: any) => m.metric_name === 'question_generation_time')
        .map((m: any) => m.metric_value);
      
      if (questionTimes.length > 0) {
        questionGenerationTimeAvg = questionTimes.reduce((a: number, b: number) => a + b, 0) / questionTimes.length;
      }
      
      // Calculate average logo generation time
      const logoTimes = metrics
        .filter((m: any) => m.metric_name === 'logo_generation_time')
        .map((m: any) => m.metric_value);
      
      if (logoTimes.length > 0) {
        logoGenerationTimeAvg = logoTimes.reduce((a: number, b: number) => a + b, 0) / logoTimes.length;
      }
      
      // Calculate error rate
      const totalLogs = await serviceManager.debug.count();
      const errorLogs = await serviceManager.debug.count({ log_level: 'error' });
      
      if (totalLogs > 0) {
        errorRate = errorLogs / totalLogs;
      }
    }
    
    return {
      question_generation_time_avg: Math.round(questionGenerationTimeAvg),
      logo_generation_time_avg: Math.round(logoGenerationTimeAvg),
      error_rate: errorRate
    };
  } catch (error) {
    console.error('Error getting system metrics data:', error);
    return {
      question_generation_time_avg: 0,
      logo_generation_time_avg: 0,
      error_rate: 0
    };
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