import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3002';

test.describe('Magic Marker E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('should load the main page', async ({ page }) => {
    await expect(page).toHaveTitle(/Magic Marker 🎨/);
    await expect(page.locator('h1')).toContainText('Magic Marker');
  });

  test('should display upload interface', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check if upload interface is visible
    const uploadButton = page.locator('input[type="file"]');
    await expect(uploadButton).toBeVisible();
  });

  test('should handle file upload validation', async ({ page }) => {
    // Test invalid file type
    const fileInput = page.locator('input[type="file"]');
    
    // Create a test file with invalid type
    const buffer = Buffer.from('test content');
    await fileInput.setInputFiles({
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: buffer
    });

    // Try to upload
    const uploadButton = page.locator('button[type="submit"]');
    await uploadButton.click();

    // Should show error message
    await expect(page.locator('text=Invalid file type')).toBeVisible();
  });

  test('should handle file size validation', async ({ page }) => {
    // Create a large file (simulate > 10MB)
    const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
    const fileInput = page.locator('input[type="file"]');
    
    await fileInput.setInputFiles({
      name: 'large-image.jpg',
      mimeType: 'image/jpeg',
      buffer: largeBuffer
    });

    const uploadButton = page.locator('button[type="submit"]');
    await uploadButton.click();

    // Should show file too large error
    await expect(page.locator('text=File too large')).toBeVisible();
  });

  test('should display image gallery', async ({ page }) => {
    // Check if image gallery is present
    const gallery = page.locator('[data-testid="image-gallery"]');
    await expect(gallery).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API to return error
    await page.route('**/api/upload', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Test error message'
        })
      });
    });

    // Try to upload a valid image
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
    await expect(page.locator('text=Test error message')).toBeVisible();
  });

  test('should handle network errors', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/upload', route => {
      route.abort('failed');
    });

    const buffer = Buffer.from('fake-image-data');
    const fileInput = page.locator('input[type="file"]');
    
    await fileInput.setInputFiles({
      name: 'test-image.jpg',
      mimeType: 'image/jpeg',
      buffer: buffer
    });

    const uploadButton = page.locator('button[type="submit"]');
    await uploadButton.click();

    // Should show network error
    await expect(page.locator('text=Network error')).toBeVisible();
  });
});
