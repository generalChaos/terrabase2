import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Get analytics from the new image_processing_steps table
    const { data, error } = await supabase
      .from('image_processing_steps')
      .select(`
        prompt_id,
        step_type,
        success,
        response_time_ms,
        tokens_used,
        model_used,
        created_at,
        prompts!inner(name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching step analytics:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch analytics' 
      }, { status: 500 });
    }

    // Process the data to create analytics by prompt and step type
    const analyticsMap = new Map();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?.forEach((step: any) => {
      const key = `${step.prompt_id}-${step.step_type}`;
      if (!analyticsMap.has(key)) {
        analyticsMap.set(key, {
          prompt_id: step.prompt_id,
          prompt_name: step.prompts?.name || 'Unknown',
          step_type: step.step_type,
          total_requests: 0,
          successful_requests: 0,
          success_rate: 0,
          avg_response_time_ms: 0,
          total_tokens_used: 0,
          first_used: step.created_at,
          last_used: step.created_at
        });
      }
      
      const analytics = analyticsMap.get(key);
      analytics.total_requests++;
      if (step.success) {
        analytics.successful_requests++;
      }
      analytics.avg_response_time_ms += step.response_time_ms || 0;
      analytics.total_tokens_used += step.tokens_used || 0;
      analytics.last_used = step.created_at;
    });

    // Calculate final metrics
    const analytics = Array.from(analyticsMap.values()).map(item => ({
      ...item,
      success_rate: item.total_requests > 0 ? (item.successful_requests / item.total_requests) * 100 : 0,
      avg_response_time_ms: item.total_requests > 0 ? item.avg_response_time_ms / item.total_requests : 0
    })).sort((a, b) => b.total_requests - a.total_requests);

    return NextResponse.json({
      success: true,
      analytics: analytics
    });

  } catch (error: unknown) {
    console.error('Error in analytics API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
