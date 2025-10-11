import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { flow_id, logo_url, team_name, players } = body;
    
    console.log('🎨 Asset Pack Generation API: Received request for flow:', flow_id);
    console.log('🎨 Logo URL:', logo_url);
    console.log('🎨 Team Name:', team_name);
    
    // Download the image data from Supabase storage
    let imageData: Buffer;
    try {
      const imageResponse = await fetch(logo_url);
      if (!imageResponse.ok) {
        throw new Error(`Failed to download image: ${imageResponse.status} ${imageResponse.statusText}`);
      }
      imageData = Buffer.from(await imageResponse.arrayBuffer());
      console.log('✅ Image downloaded successfully, size:', imageData.length, 'bytes');
    } catch (error) {
      console.error('❌ Failed to download image:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to download logo image',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 400 }
      );
    }
    
    // Convert image data to base64 for transmission
    const base64Image = imageData.toString('base64');
    const dataUrl = `data:image/png;base64,${base64Image}`;
    
    // Call the Python server with the image data
    const pythonRequestBody = {
      logo_data_url: dataUrl,
      team_name: team_name,
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

