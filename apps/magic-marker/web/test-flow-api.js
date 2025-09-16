#!/usr/bin/env node

/**
 * Test script for the new flow API endpoints
 * Tests the complete flow: upload -> analyze -> questions -> generate
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3002';

// Test data
const TEST_IMAGE_PATH = path.join(__dirname, 'test_image.jpg');

async function testFlowAPI() {
  console.log('🧪 Testing Flow API Endpoints...\n');

  try {
    // Step 1: Upload image and create flow
    console.log('1️⃣ Testing upload endpoint...');
    
    if (!fs.existsSync(TEST_IMAGE_PATH)) {
      console.log('❌ Test image not found. Please add test_image.jpg to the web directory.');
      return;
    }

    const formData = new FormData();
    const imageBuffer = fs.readFileSync(TEST_IMAGE_PATH);
    const imageBlob = new Blob([imageBuffer], { type: 'image/jpeg' });
    formData.append('image', imageBlob, 'test_image.jpg');

    const uploadResponse = await fetch(`${BASE_URL}/api/flow/upload`, {
      method: 'POST',
      body: formData
    });

    const uploadResult = await uploadResponse.json();
    console.log('Upload result:', uploadResult);

    if (!uploadResult.success) {
      console.log('❌ Upload failed:', uploadResult.error);
      return;
    }

    const flowId = uploadResult.data.flowId;
    console.log('✅ Upload successful! Flow ID:', flowId);

    // Step 2: Analyze image
    console.log('\n2️⃣ Testing analyze endpoint...');
    
    const analyzeResponse = await fetch(`${BASE_URL}/api/flow/${flowId}/analyze`, {
      method: 'POST'
    });

    const analyzeResult = await analyzeResponse.json();
    console.log('Analyze result:', analyzeResult);

    if (!analyzeResult.success) {
      console.log('❌ Analysis failed:', analyzeResult.error);
      return;
    }

    console.log('✅ Analysis successful!');

    // Step 3: Generate questions
    console.log('\n3️⃣ Testing questions endpoint...');
    
    const questionsResponse = await fetch(`${BASE_URL}/api/flow/${flowId}/questions`, {
      method: 'POST'
    });

    const questionsResult = await questionsResponse.json();
    console.log('Questions result:', questionsResult);

    if (!questionsResult.success) {
      console.log('❌ Questions generation failed:', questionsResult.error);
      return;
    }

    console.log('✅ Questions generated successfully!');
    console.log('Questions count:', questionsResult.data.questions?.length || 0);

    // Step 4: Generate final image (with mock answers)
    console.log('\n4️⃣ Testing generate endpoint...');
    
    const mockAnswers = questionsResult.data.questions?.map((q, index) => ({
      questionId: q.id,
      answer: q.options?.[0] || 'Test answer'
    })) || [];

    const generateResponse = await fetch(`${BASE_URL}/api/flow/${flowId}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ answers: mockAnswers })
    });

    const generateResult = await generateResponse.json();
    console.log('Generate result:', generateResult);

    if (!generateResult.success) {
      console.log('❌ Image generation failed:', generateResult.error);
      return;
    }

    console.log('✅ Final image generated successfully!');
    console.log('Final image path:', generateResult.finalImagePath);

    console.log('\n🎉 All tests passed! Flow API is working correctly.');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testFlowAPI();
