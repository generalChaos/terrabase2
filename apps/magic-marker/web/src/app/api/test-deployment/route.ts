import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('Test deployment endpoint called');
    
    // Check environment variables
    const envCheck = {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
      supabaseKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
      openAIKeyLength: process.env.OPENAI_API_KEY?.length || 0,
    };

    console.log('Environment check:', envCheck);

    // Test Supabase connection
    let supabaseTest: { connected: boolean; error: string | null } = { connected: false, error: null };
    try {
      const { data, error } = await supabase
        .from('images')
        .select('count')
        .limit(1);
      
      if (error) {
        supabaseTest.error = error.message;
      } else {
        supabaseTest.connected = true;
      }
    } catch (error: any) {
      supabaseTest.error = error.message;
    }

    // Test Supabase storage
    let storageTest: { accessible: boolean; error: string | null } = { accessible: false, error: null };
    try {
      const { data, error } = await supabase.storage
        .from('images')
        .list('', { limit: 1 });
      
      if (error) {
        storageTest.error = error.message;
      } else {
        storageTest.accessible = true;
      }
    } catch (error: any) {
      storageTest.error = error.message;
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: envCheck,
      supabase: supabaseTest,
      storage: storageTest,
      deployment: {
        nodeEnv: process.env.NODE_ENV,
        vercel: process.env.VERCEL ? 'Yes' : 'No',
        region: process.env.VERCEL_REGION || 'Unknown',
      }
    });

  } catch (error: any) {
    console.error('Test deployment error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
