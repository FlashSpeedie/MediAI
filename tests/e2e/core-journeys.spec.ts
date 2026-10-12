import { test, expect } from '@playwright/test';

test.describe('AI Doctor - Core User Journeys', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test.describe('Landing Page', () => {
    test('should display landing page with hero section', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('Know what to do');
      await expect(page.locator('text=when you feel unwell')).toBeVisible();
    });

    test('should have CTA buttons', async ({ page }) => {
      // Use specific selector for the hero "Start for free" button
      await expect(page.getByRole('link', { name: 'Start for free' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'See how it works' })).toBeVisible();
    });

    test('should show urgency level preview', async ({ page }) => {
      await expect(page.locator('text=LOW')).toBeVisible();
      await expect(page.locator('text=MEDIUM')).toBeVisible();
      await expect(page.locator('text=HIGH')).toBeVisible();
      await expect(page.locator('text=CRITICAL')).toBeVisible();
    });
  });

  test.describe('Authentication Flow', () => {
    test('should navigate to login page', async ({ page }) => {
      await page.getByRole('link', { name: 'Sign in' }).click();
      await page.waitForURL(/\/login/);
      await expect(page.locator('h1')).toContainText('Welcome back');
    });

    test('should navigate to register page', async ({ page }) => {
      // Use the navbar "Get Started" link (first one)
      await page.getByRole('link', { name: 'Get Started' }).first().click();
      await page.waitForURL(/\/register/);
      await expect(page.locator('h1')).toContainText('Create your account');
    });
  });

  test.describe('Chat Page (Unauthenticated)', () => {
    test('should allow access to chat page without auth', async ({ page }) => {
      // The chat page is publicly accessible; API calls require auth
      await page.goto('/chat');
      await expect(page).toHaveURL(/\/chat/);
      // Chat input should be visible - use the actual placeholder text
      await expect(page.getByPlaceholder('Describe your symptoms…')).toBeVisible();
    });
  });
});

test.describe('Accessibility', () => {
  test('should have skip to content link', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeVisible();
    
    // Verify it links to main content - use keyboard to activate
    await skipLink.focus();
    await page.keyboard.press('Enter');
    
    // The main content should receive focus
    // Use a more specific check - the main element should be focused
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeFocused();
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
  });
});