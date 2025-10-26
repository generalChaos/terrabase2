import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || (process.env.NODE_ENV === 'production' ? 'https://csjzzhibbavtelupqugc.supabase.co' : 'http://127.0.0.1:54321');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Admin Logos API: Fetching logos for upscaling tool');

    // Fetch logos from the team_logos table
    const { data: logos, error } = await supabase
      .from('team_logos')
      .select(`
        id,
        public_url,
        variant_number,
        created_at,
        flows!inner(
          team_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50); // Limit to 50 most recent logos

    if (error) {
      console.error('❌ Error fetching logos:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch logos',
          details: error.message
        },
        { status: 500 }
      );
    }

    // Transform the data to include team_name directly
    const transformedLogos = logos?.map(logo => ({
      id: logo.id,
      public_url: logo.public_url,
      team_name: logo.flows?.[0]?.team_name || 'Unknown Team',
      variant_number: logo.variant_number,
      created_at: logo.created_at
    })) || [];

    console.log(`✅ Fetched ${transformedLogos.length} logos for upscaling tool`);

    return NextResponse.json({
      success: true,
      logos: transformedLogos
    });

  } catch (error) {
    console.error('❌ Admin Logos API Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch logos',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
