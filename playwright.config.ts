import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for E2E testing with Mock Mode
 *
 * Usage:
 * 1. Start servers: MOCK_MODE=true npm run dev:dirtworks
 * 2. Run tests: npx playwright test
 * 3. Run with UI: npx playwright test --ui
 * 4. Run headed: npx playwright test --headed
 */
export default defineConfig({
  testDir: './apps/dashboard/e2e',

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: [
    ['html'],
    ['list']
  ],

  use: {
    // Base URL for tests
    baseURL: 'http://localhost:3333',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',
  },

  // Configure projects for major browsers
  projects: [
    // Setup project for authentication
    { name: 'setup', testMatch: /.*\.setup\.ts/ },

    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Test against mobile viewports
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Run your local dev server before starting the tests
  // Uncomment if you want Playwright to start the servers automatically
  // webServer: [
  //   {
  //     command: 'cd apps/api && PORT=3334 MOCK_MODE=true bun run --hot src/index.ts',
  //     url: 'http://localhost:3334',
  //     reuseExistingServer: !process.env.CI,
  //   },
  //   {
  //     command: 'cd apps/dashboard && npm run dev',
  //     url: 'http://localhost:3333',
  //     reuseExistingServer: !process.env.CI,
  //   },
  // ],
});
