import { test as setup } from '@playwright/test';

/**
 * Authentication setup for Playwright tests
 * This runs once before all tests and saves the auth state
 */

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Go to login page
  await page.goto('http://localhost:3333/login');

  // Fill in login form with test credentials
  await page.fill('input[name="email"], input[type="email"]', 'admin@tocld.com');
  await page.fill('input[name="password"], input[type="password"]', 'Admin123');

  // Click sign in button
  await page.click('button[type="submit"], button:has-text("Sign in")');

  // Wait for navigation to dashboard home
  await page.waitForURL('**/', { timeout: 15000 });

  // Navigate to jobs page to ensure it's accessible
  await page.goto('http://localhost:3333/jobs');
  await page.waitForLoadState('networkidle');

  // Save auth state
  await page.context().storageState({ path: authFile });

  console.log('✓ Authentication successful - auth state saved');
});
