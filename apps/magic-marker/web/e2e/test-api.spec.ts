import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3002';

test.describe('Magic Marker API Tests', () => {
  test('should test error handling endpoints', async ({ request }) => {
    // Test validation error
    const validationResponse = await request.get(`${BASE_URL}/api/debug/test-errors?type=validation`);
    expect(validationResponse.status()).toBe(500);
    const validationData = await validationResponse.json();
    expect(validationData.success).toBe(false);
    expect(validationData.error).toContain('Invalid input provided');
    expect(validationData.requestId).toBeDefined();

    // Test OpenAI error
    const openaiResponse = await request.get(`${BASE_URL}/api/debug/test-errors?type=openai`);
    expect(openaiResponse.status()).toBe(429);
    const openaiData = await openaiResponse.json();
    expect(openaiData.success).toBe(false);
    expect(openaiData.error).toContain('AI service is busy');

    // Test Supabase error
    const supabaseResponse = await request.get(`${BASE_URL}/api/debug/test-errors?type=supabase`);
    expect(supabaseResponse.status()).toBe(413);
    const supabaseData = await supabaseResponse.json();
    expect(supabaseData.success).toBe(false);
    expect(supabaseData.error).toContain('File too large');

    // Test timeout error
    const timeoutResponse = await request.get(`${BASE_URL}/api/debug/test-errors?type=timeout`);
    expect(timeoutResponse.status()).toBe(500);
    const timeoutData = await timeoutResponse.json();
    expect(timeoutData.success).toBe(false);
    expect(timeoutData.error).toContain('Request timeout');
  });

  test('should handle upload validation', async ({ request }) => {
    // Test invalid content type
    const invalidContentTypeResponse = await request.post(`${BASE_URL}/api/upload`, {
      headers: { 'Content-Type': 'application/json' },
      data: { test: 'data' }
    });
    expect(invalidContentTypeResponse.status()).toBe(400);
    const invalidContentTypeData = await invalidContentTypeResponse.json();
    expect(invalidContentTypeData.success).toBe(false);
    expect(invalidContentTypeData.error).toContain('Invalid content type');

    // Test missing file
    const formData = new FormData();
    const missingFileResponse = await request.post(`${BASE_URL}/api/upload`, {
      data: formData
    });
    expect(missingFileResponse.status()).toBe(400);
    const missingFileData = await missingFileResponse.json();
    expect(missingFileData.success).toBe(false);
    expect(missingFileData.error).toContain('No image file provided');
  });

  test('should handle images endpoint', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/images`);
    // Should return 200 with empty array or error
    expect([200, 500]).toContain(response.status());
    const data = await response.json();
    if (response.status() === 200) {
      expect(Array.isArray(data)).toBe(true);
    } else {
      expect(data.error).toBeDefined();
    }
  });

  test('should handle invalid image ID', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/images/invalid-id`);
    expect(response.status()).toBe(500);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  test('should handle generate endpoint validation', async ({ request }) => {
    // Test missing required fields
    const response = await request.post(`${BASE_URL}/api/images/generate`, {
      headers: { 'Content-Type': 'application/json' },
      data: {}
    });
    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('Missing required fields');
  });
});
