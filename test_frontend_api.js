#!/usr/bin/env node
/**
 * Test the frontend API endpoint
 */

const fetch = require('node-fetch');

async function testFrontendAPI() {
  console.log('🔍 Testing Frontend API...\n');
  
  const testImageUrl = 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=400&h=300&fit=crop&crop=center';
  
  try {
    console.log('1️⃣ Testing frontend color analyzer API...');
    const response = await fetch('http://localhost:3003/api/color-analyzer', {
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
    console.log('✅ Frontend API response received');
    console.log(`   - Success: ${result.success}`);
    console.log(`   - Colors: ${result.data?.colors?.length || 0}`);
    console.log(`   - Swatches: ${result.data?.systematic_analysis?.k_clusters || 0}`);
    console.log(`   - Roles: ${Object.keys(result.data?.roles || {}).length}`);
    
    if (result.success && result.data?.colors?.length > 0) {
      console.log('\n🎉 Frontend API Test PASSED!');
      console.log('   The frontend API is working correctly.');
      console.log('\n🎨 Sample colors:');
      result.data.colors.slice(0, 3).forEach((color, i) => {
        console.log(`   ${i+1}. ${color.hex} - ${color.percentage}% (${color.name})`);
      });
    } else {
      console.log('\n❌ Frontend API Test FAILED!');
      console.log('   The frontend API returned empty data.');
      console.log('   Response:', JSON.stringify(result, null, 2));
    }
    
  } catch (error) {
    console.log('\n❌ Frontend API Test FAILED!');
    console.log('Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the frontend server is running:');
      console.log('   cd apps/mighty-team-designs && pnpm dev');
    }
  }
}

if (require.main === module) {
  testFrontendAPI();
}

module.exports = { testFrontendAPI };
