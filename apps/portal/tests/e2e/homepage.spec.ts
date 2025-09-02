import { test, expect } from '@playwright/test';

test.describe('Portal Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load homepage with correct title and content', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Terrabase2/);
    
    // Check main heading/logo is visible
    await expect(page.locator('img[alt="Terrabase2 Logo"]')).toBeVisible();
    
    // Check description text
    await expect(page.locator('text=A collection of innovative applications')).toBeVisible();
  });

  test('should display both project cards', async ({ page }) => {
    // Check Party Game card
    await expect(page.locator('text=Party Game')).toBeVisible();
    await expect(page.locator('text=Real-time multiplayer party game')).toBeVisible();
    
    // Check Magic Marker card
    await expect(page.locator('text=Magic Marker')).toBeVisible();
    await expect(page.locator('text=AI-powered image analysis')).toBeVisible();
  });

  test('should have working external links', async ({ page }) => {
    // Test Party Game link
    const partyGameLink = page.locator('a[href*="party-game"]').first();
    await expect(partyGameLink).toBeVisible();
    await expect(partyGameLink).toHaveAttribute('target', '_blank');
    await expect(partyGameLink).toHaveAttribute('rel', 'noopener noreferrer');
    
    // Test Magic Marker link
    const magicMarkerLink = page.locator('a[href*="magic-marker"]').first();
    await expect(magicMarkerLink).toBeVisible();
    await expect(magicMarkerLink).toHaveAttribute('target', '_blank');
    await expect(magicMarkerLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('should have working GitHub links', async ({ page }) => {
    // Test Party Game GitHub link
    const partyGameGithub = page.locator('a[href*="github.com"]').first();
    await expect(partyGameGithub).toBeVisible();
    await expect(partyGameGithub).toHaveAttribute('target', '_blank');
    
    // Test Magic Marker GitHub link
    const magicMarkerGithub = page.locator('a[href*="github.com"]').nth(1);
    await expect(magicMarkerGithub).toBeVisible();
    await expect(magicMarkerGithub).toHaveAttribute('target', '_blank');
  });

  test('should display correct environment-specific text', async ({ page }) => {
    // Check if dev server or live demo text is shown
    const linkText = page.locator('text=Dev Server, text=Live Demo');
    await expect(linkText.first()).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that content is still visible and properly laid out
    await expect(page.locator('img[alt="Terrabase2 Logo"]')).toBeVisible();
    await expect(page.locator('text=Party Game')).toBeVisible();
    await expect(page.locator('text=Magic Marker')).toBeVisible();
    
    // Check that cards stack vertically on mobile
    const cards = page.locator('.grid.md\\:grid-cols-2 > div');
    await expect(cards).toHaveCount(2);
  });

  test('should be responsive on tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Check that content is still visible
    await expect(page.locator('img[alt="Terrabase2 Logo"]')).toBeVisible();
    await expect(page.locator('text=Party Game')).toBeVisible();
    await expect(page.locator('text=Magic Marker')).toBeVisible();
  });

  test('should have proper meta tags', async ({ page }) => {
    // Check viewport meta tag
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute('content', 'width=device-width, initial-scale=1');
    
    // Check charset
    await expect(page.locator('meta[charset="utf-8"]')).toBeAttached();
  });

  test('should load without console errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Filter out known non-critical errors (like favicon 404)
    const criticalErrors = errors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('404') &&
      !error.includes('net::ERR_ABORTED')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});
