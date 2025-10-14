#!/usr/bin/env node
/**
 * Test script to verify the V2 color analysis integration
 */

const fetch = require('node-fetch');

async function testV2Integration() {
  console.log('🧪 Testing V2 Color Analysis Integration...\n');
  
  try {
    // Test with a simple image
    const testImageUrl = 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=400&h=300&fit=crop&crop=center';
    
    console.log('📷 Testing with image:', testImageUrl);
    
    const response = await fetch('http://localhost:3000/api/color-analyzer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: testImageUrl,
        max_colors: 15
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ V2 Integration Test PASSED!');
      console.log('\n📊 Results:');
      console.log(`  - Colors found: ${result.data.colors.length}`);
      console.log(`  - Dominant color: ${result.data.dominant_color}`);
      console.log(`  - Clusters: ${result.data.systematic_analysis?.k_clusters || 'N/A'}`);
      console.log(`  - Processing time: ${result.data.systematic_analysis?.processing_time?.toFixed(2)}s`);
      
      if (result.data.roles) {
        console.log('\n🎯 Role Assignments:');
        Object.entries(result.data.roles).forEach(([role, swatch]) => {
          console.log(`  - ${role}: ${swatch.hex} (${swatch.percent}%)`);
        });
      }
      
      if (result.data.confidence_scores) {
        console.log('\n📈 Confidence Scores:');
        Object.entries(result.data.confidence_scores).forEach(([role, score]) => {
          console.log(`  - ${role}: ${(score * 100).toFixed(0)}%`);
        });
      }
      
      console.log('\n🎨 Color Palette:');
      result.data.color_palette.slice(0, 5).forEach((color, index) => {
        console.log(`  ${index + 1}. ${color}`);
      });
      
    } else {
      console.log('❌ V2 Integration Test FAILED!');
      console.log('Error:', result.error);
    }
    
  } catch (error) {
    console.log('❌ V2 Integration Test FAILED!');
    console.log('Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the frontend server is running:');
      console.log('   cd apps/mighty-team-designs && npm run dev');
    }
  }
}

if (require.main === module) {
  testV2Integration();
}

module.exports = { testV2Integration };
