import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/test-prompt-definitions - Test the new prompt_definitions table
export async function GET() {
  try {
    console.log('🧪 Testing prompt_definitions table...');
    
    // Check if the table exists and has data
    const { data, error } = await supabase
      .from('prompt_definitions')
      .select('name, type, active')
      .limit(10);
    
    if (error) {
      console.error('❌ Error querying prompt_definitions:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        message: 'Failed to query prompt_definitions table'
      }, { status: 500 });
    }
    
    console.log('✅ prompt_definitions query successful:', data);
    
    return NextResponse.json({
      success: true,
      message: 'prompt_definitions table is working!',
      data: data,
      count: data?.length || 0
    });
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'prompt_definitions test failed'
    }, { status: 500 });
  }
}
