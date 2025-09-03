import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get analytics from the view we created
    const { data, error } = await supabase
      .from('prompt_analytics')
      .select('*')
      .order('total_requests', { ascending: false });

    if (error) {
      console.error('Error fetching analytics:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch analytics' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      analytics: data || []
    });

  } catch (error: any) {
    console.error('Error in analytics API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
