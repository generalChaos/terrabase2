import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || (process.env.NODE_ENV === 'production' ? 'https://csjzzhibbavtelupqugc.supabase.co' : 'http://127.0.0.1:54321');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    // Skip authentication in local development
    const isLocal = process.env.NODE_ENV === 'development' || 
                   process.env.NEXT_PUBLIC_APP_URL?.includes('localhost') ||
                   process.env.NEXT_PUBLIC_APP_URL?.includes('127.0.0.1');

    if (!isLocal) {
      // Check for admin authentication
      const adminPassword = request.headers.get('x-admin-password');
      const expectedPassword = process.env.ADMIN_PASSWORD;

      if (!expectedPassword || adminPassword !== expectedPassword) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    console.log('🖼️ Admin Gallery API: Fetching flows with logos and asset packs');

    // First, let's check if there are any flows at all
    const { data: flowCount, error: countError } = await supabase
      .from('team_design_flows')
      .select('id', { count: 'exact', head: true });

    console.log('📊 Total flows in database:', flowCount?.length || 0);
    if (countError) {
      console.error('❌ Error counting flows:', countError);
    }

    // Fetch flows with their associated logos and asset packs
    const { data: flows, error: flowsError } = await supabase
      .from('team_design_flows')
      .select(`
        id,
        team_name,
        sport,
        current_step,
        created_at,
        team_logos!team_logos_flow_id_fkey(
          id,
          file_path,
          storage_bucket,
          variant_number,
          is_selected,
          created_at,
          logo_asset_packs!logo_asset_packs_logo_id_fkey(
            id,
            asset_pack_id,
            clean_logo_url,
            tshirt_front_url,
            tshirt_back_url,
            banner_url,
            processing_time_ms,
            created_at
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50); // Limit to 50 most recent flows

    if (flowsError) {
      console.error('❌ Error fetching flows:', flowsError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch flows',
          details: flowsError.message
        },
        { status: 500 }
      );
    }

    console.log('📊 Raw flows data:', flows?.length || 0, 'flows found');
    if (flows && flows.length > 0) {
      console.log('📊 First flow sample:', {
        id: flows[0].id,
        team_name: flows[0].team_name,
        team_logos: flows[0].team_logos?.length || 0,
        first_logo_asset_packs: flows[0].team_logos?.[0]?.logo_asset_packs?.length || 0
      });
    }

    // Transform the data to flatten logos with flow info
    const transformedLogos = flows?.flatMap(flow => 
      (flow.team_logos || []).map(logo => {
        // Generate public URL from file_path and storage_bucket
        const { data: urlData } = supabase.storage
          .from(logo.storage_bucket || 'team-logos')
          .getPublicUrl(logo.file_path);
        
        return {
          id: logo.id,
          public_url: urlData.publicUrl,
          variant_number: logo.variant_number,
          is_selected: logo.is_selected,
          created_at: logo.created_at,
          flow: {
            id: flow.id,
            team_name: flow.team_name || 'Unknown Team',
            sport: flow.sport || 'Unknown Sport',
            current_step: flow.current_step || 'unknown'
          },
          asset_packs: logo.logo_asset_packs || []
        };
      })
    ) || [];

    console.log(`✅ Fetched ${transformedLogos.length} logos from ${flows?.length || 0} flows for gallery`);
    
    if (transformedLogos.length > 0) {
      console.log('📊 First transformed logo sample:', {
        id: transformedLogos[0].id,
        public_url: transformedLogos[0].public_url,
        flow: transformedLogos[0].flow,
        asset_packs: transformedLogos[0].asset_packs?.length || 0
      });
    }

    return NextResponse.json({
      success: true,
      data: transformedLogos
    });

  } catch (error) {
    console.error('❌ Admin Gallery API Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch gallery data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
