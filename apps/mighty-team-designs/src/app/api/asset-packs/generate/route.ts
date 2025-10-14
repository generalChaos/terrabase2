import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { flow_id, logo_url, team_name, players } = body;
    
    console.log('🎨 Asset Pack Generation API: Received request for flow:', flow_id);
    
    // If no logo_url provided, fetch it from flow data
    let actualLogoUrl = logo_url;
    let actualTeamName = team_name;
    
    if (!actualLogoUrl || !actualTeamName) {
      console.log('📥 Fetching flow data to get logo URL and team name...');
      const flowResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003'}/api/flows/${flow_id}`);
      const flowData = await flowResponse.json();
      
      if (!flowData.success || !flowData.data) {
        throw new Error(`Failed to fetch flow data: ${flowData.error || 'Unknown error'}`);
      }
      
      const flow = flowData.data;
      actualTeamName = flow.team_name || 'Team';
      
      // Get the selected logo or first logo
      const selectedLogo = flow.team_logos?.find((logo: any) => logo.is_selected) || flow.team_logos?.[0];
      if (!selectedLogo?.public_url) {
        throw new Error('No logo found in flow data');
      }
      
      actualLogoUrl = selectedLogo.public_url;
      console.log('✅ Using logo URL from flow data:', actualLogoUrl);
    }
    
    console.log('🎨 Logo URL:', actualLogoUrl);
    console.log('🎨 Team Name:', actualTeamName);
    
    // Call the Python server with the logo URL
    const pythonRequestBody = {
      logo_url: actualLogoUrl,
      team_name: actualTeamName,
      players: players || [
        { number: 1, name: "Captain" },
        { number: 2, name: "Vice Captain" },
        { number: 3, name: "Starter" },
        { number: 4, name: "Starter" },
        { number: 5, name: "Starter" }
      ]
    };
    
    console.log('🎨 Calling Python server with image data...');
    const pythonResponse = await fetch(`${config.imageProcessor.baseUrl}/asset-pack`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pythonRequestBody)
    });
    
    console.log('🎨 Python server response status:', pythonResponse.status);
    
    if (!pythonResponse.ok) {
      const errorText = await pythonResponse.text();
      console.error('❌ Python server error:', errorText);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Asset pack generation failed',
          details: errorText
        },
        { status: 500 }
      );
    }
    
    const result = await pythonResponse.json();
    console.log('✅ Asset pack generated successfully');
    
    return NextResponse.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('❌ Asset Pack Generation API Error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate asset pack',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

