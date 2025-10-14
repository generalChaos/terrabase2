import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 Testing connection to Python API...');
    
    const imageProcessorUrl = process.env.IMAGE_PROCESSOR_BASE_URL || 'http://localhost:8000/api/v2';
    console.log('🔍 Image processor URL:', imageProcessorUrl);
    
    // Test health endpoint first
    const healthResponse = await fetch(`${imageProcessorUrl}/health`);
    console.log('🔍 Health response status:', healthResponse.status);
    
    if (!healthResponse.ok) {
      throw new Error(`Health check failed: ${healthResponse.status}`);
    }
    
    const healthData = await healthResponse.json();
    console.log('🔍 Health data:', healthData);
    
    // Test color analysis endpoint
    const analysisResponse = await fetch(`${imageProcessorUrl}/analyze-colors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=400&h=300&fit=crop&crop=center',
        mode: 'logo',
        max_edge: 1024,
        k_lo: 4,
        k_hi: 10,
        min_cluster_pct: 0.8,
        dilate_alpha: true
      })
    });
    
    console.log('🔍 Analysis response status:', analysisResponse.status);
    
    if (!analysisResponse.ok) {
      throw new Error(`Analysis failed: ${analysisResponse.status}`);
    }
    
    const analysisData = await analysisResponse.json();
    console.log('🔍 Analysis data keys:', Object.keys(analysisData));
    console.log('🔍 Swatches count:', analysisData.data?.swatches?.length || 0);
    
    return NextResponse.json({
      success: true,
      health: healthData,
      analysis: {
        success: analysisData.success,
        swatchesCount: analysisData.data?.swatches?.length || 0,
        rolesCount: Object.keys(analysisData.data?.roles || {}).length
      }
    });
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
