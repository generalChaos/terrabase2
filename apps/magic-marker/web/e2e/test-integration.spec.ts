import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3002';

test.describe('Magic Marker Integration Tests', () => {
  test('should complete full upload flow with mock data', async ({ page }) => {
    // Mock successful API responses
    await page.route('**/api/upload', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          imageAnalysisId: 'test-id-123',
          questions: [
            {
              id: 'q_0',
              text: 'What do you see in this image?',
              type: 'multiple_choice',
              options: ['Option A', 'Option B', 'Option C', 'Option D'],
              required: true
            }
          ]
        })
      });
    });

    await page.route('**/api/images/generate', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          finalImagePath: 'https://example.com/generated-image.png'
        })
      });
    });

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Upload an image
    const buffer = Buffer.from('fake-image-data');
    const fileInput = page.locator('input[type="file"]');
    
    await fileInput.setInputFiles({
      name: 'test-image.jpg',
      mimeType: 'image/jpeg',
      buffer: buffer
    });

    const uploadButton = page.locator('button[type="submit"]');
    await uploadButton.click();

    // Should show questions
    await expect(page.locator('text=What do you see in this image?')).toBeVisible();
    await expect(page.locator('text=Option A')).toBeVisible();

    // Answer the question
    await page.locator('text=Option A').click();
    
    // Submit answers
    const submitButton = page.locator('button:has-text("Generate Image")');
    await submitButton.click();

    // Should show generating state
    await expect(page.locator('text=Generating')).toBeVisible();

    // Should show final image (check for any img element with generated image)
    await expect(page.locator('img[src*="generated"]')).toBeVisible();
  });

  test('should handle question flow with multiple questions', async ({ page }) => {
    // Mock API with multiple questions
    await page.route('**/api/upload', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          imageAnalysisId: 'test-id-456',
          questions: [
            {
              id: 'q_0',
              text: 'What color is the main object?',
              type: 'multiple_choice',
              options: ['Red', 'Blue', 'Green', 'Yellow'],
              required: true
            },
            {
              id: 'q_1',
              text: 'What is the mood of the image?',
              type: 'multiple_choice',
              options: ['Happy', 'Sad', 'Angry', 'Calm'],
              required: true
            }
          ]
        })
      });
    });

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Upload image
    const buffer = Buffer.from('fake-image-data');
    const fileInput = page.locator('input[type="file"]');
    
    await fileInput.setInputFiles({
      name: 'test-image.jpg',
      mimeType: 'image/jpeg',
      buffer: buffer
    });

    const uploadButton = page.locator('button[type="submit"]');
    await uploadButton.click();

    // Answer first question
    await expect(page.locator('text=What color is the main object?')).toBeVisible();
    await page.locator('text=Red').click();
    
    // Should show next question
    await expect(page.locator('text=What is the mood of the image?')).toBeVisible();
    await page.locator('text=Happy').click();

    // Should be able to submit
    const submitButton = page.locator('button:has-text("Generate Image")');
    await expect(submitButton).toBeEnabled();
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/upload', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'AI service is temporarily unavailable',
          timestamp: new Date().toISOString(),
          requestId: 'test-request-id'
        })
      });
    });

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Upload image
    const buffer = Buffer.from('fake-image-data');
    const fileInput = page.locator('input[type="file"]');
    
    await fileInput.setInputFiles({
      name: 'test-image.jpg',
      mimeType: 'image/jpeg',
      buffer: buffer
    });

    const uploadButton = page.locator('button[type="submit"]');
    await uploadButton.click();

    // Should show error message
    await expect(page.locator('text=AI service is temporarily unavailable')).toBeVisible();
    
    // Should show retry option
    await expect(page.locator('button:has-text("Try Again")')).toBeVisible();
  });

  test('should handle loading states', async ({ page }) => {
    // Mock slow API response
    await page.route('**/api/upload', route => {
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            imageAnalysisId: 'test-id-789',
            questions: []
          })
        });
      }, 2000);
    });

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Upload image
    const buffer = Buffer.from('fake-image-data');
    const fileInput = page.locator('input[type="file"]');
    
    await fileInput.setInputFiles({
      name: 'test-image.jpg',
      mimeType: 'image/jpeg',
      buffer: buffer
    });

    const uploadButton = page.locator('button[type="submit"]');
    await uploadButton.click();

    // Should show loading state
    await expect(page.locator('text=Analyzing')).toBeVisible();
    await expect(page.locator('.animate-spin')).toBeVisible();

    // Should eventually show results
    await expect(page.locator('text=Analysis complete')).toBeVisible({ timeout: 5000 });
  });
});
