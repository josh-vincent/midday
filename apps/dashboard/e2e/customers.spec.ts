import { test, expect } from '@playwright/test';

/**
 * E2E tests for Customers Page - Permission Error Investigation
 *
 * This test suite is designed to identify the root cause of:
 * TRPCClientError "No permission to access this team"
 *
 * Prerequisites:
 * 1. Start API: npm run dev:api
 * 2. Start dashboard: npm run dev:dashboard
 * 3. Run setup: npx playwright test --project=setup
 * 4. Run tests: npx playwright test customers.spec.ts --project=chromium
 */

test.describe('Customers Page - Permission Error Investigation', () => {
  // Track all tRPC requests and responses
  const trpcRequests: Array<{
    url: string;
    path: string;
    type: string;
    timestamp: number;
    status?: number;
    error?: any;
  }> = [];

  test.beforeEach(async ({ page }) => {
    // Clear request tracking
    trpcRequests.length = 0;

    // Monitor all network requests
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/trpc')) {
        trpcRequests.push({
          url,
          path: extractTrpcPath(url),
          type: 'request',
          timestamp: Date.now(),
        });
        console.log(`[tRPC Request] ${extractTrpcPath(url)} at ${new Date().toISOString()}`);
      }
    });

    // Monitor all network responses
    page.on('response', async response => {
      const url = response.url();
      if (url.includes('/trpc')) {
        const status = response.status();
        let error = null;

        try {
          if (status !== 200) {
            const body = await response.text();
            error = body;
            console.error(`[tRPC Error Response] ${extractTrpcPath(url)} - Status: ${status}`);
            console.error(`[tRPC Error Body] ${body}`);
          } else {
            const body = await response.json();
            if (body.error || body[0]?.error) {
              error = body.error || body[0]?.error;
              console.error(`[tRPC Error in 200] ${extractTrpcPath(url)}`);
              console.error(`[tRPC Error Details]`, JSON.stringify(error, null, 2));
            } else {
              console.log(`[tRPC Success] ${extractTrpcPath(url)} - Status: ${status}`);
            }
          }
        } catch (e) {
          // Ignore parse errors
        }

        trpcRequests.push({
          url,
          path: extractTrpcPath(url),
          type: 'response',
          timestamp: Date.now(),
          status,
          error,
        });
      }
    });

    // Monitor console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (text.includes('tRPC') || text.includes('permission') || text.includes('team')) {
          console.error(`[Browser Console Error] ${text}`);
        }
      }
    });

    // Monitor page errors
    page.on('pageerror', error => {
      if (error.message.includes('tRPC') || error.message.includes('permission') || error.message.includes('team')) {
        console.error(`[Page Error] ${error.message}`);
      }
    });
  });

  test('should identify permission errors during initial page load', async ({ page }) => {
    console.log('\n========== TEST: Initial Page Load ==========\n');

    // Navigate to customers page
    await page.goto('http://localhost:3333/customers', { waitUntil: 'domcontentloaded' });

    // Wait for initial hydration
    await page.waitForTimeout(2000);

    // Wait for customers table to appear (or error state)
    try {
      await page.waitForSelector('[data-testid="customers-list"], [role="alert"]', { timeout: 10000 });
    } catch (e) {
      console.log('No customers list or error alert found');
    }

    // Check for any tRPC errors
    const errors = trpcRequests.filter(req => req.error || (req.status && req.status !== 200));

    console.log('\n========== tRPC Request Summary ==========');
    console.log(`Total tRPC requests: ${trpcRequests.filter(r => r.type === 'request').length}`);
    console.log(`Total tRPC responses: ${trpcRequests.filter(r => r.type === 'response').length}`);
    console.log(`Total tRPC errors: ${errors.length}`);

    if (errors.length > 0) {
      console.log('\n========== tRPC Errors Found ==========');
      errors.forEach(error => {
        console.log(`Path: ${error.path}`);
        console.log(`Status: ${error.status}`);
        console.log(`Error: ${JSON.stringify(error.error, null, 2)}`);
        console.log('---');
      });
    }

    // Verify page loaded successfully
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Report findings
    if (errors.length > 0) {
      console.error(`\n⚠️  Found ${errors.length} permission errors during initial load`);
      errors.forEach(err => {
        console.error(`   - ${err.path}: ${err.error?.message || 'Unknown error'}`);
      });
    } else {
      console.log('\n✓ No permission errors during initial load');
    }
  });

  test('should identify permission errors during background refetch', async ({ page }) => {
    console.log('\n========== TEST: Background Refetch ==========\n');

    // Navigate to customers page
    await page.goto('http://localhost:3333/customers', { waitUntil: 'networkidle' });

    // Wait for initial load
    await page.waitForTimeout(2000);

    console.log('\n⏳ Waiting 35 seconds for background refetch (interval is 30s)...\n');

    // Clear initial requests
    const initialRequestCount = trpcRequests.length;

    // Wait for background refetch to occur (refetchInterval: 30000)
    await page.waitForTimeout(35000);

    // Get new requests after initial load
    const refetchRequests = trpcRequests.slice(initialRequestCount);
    const refetchErrors = refetchRequests.filter(req => req.error || (req.status && req.status !== 200));

    console.log('\n========== Background Refetch Summary ==========');
    console.log(`Refetch requests: ${refetchRequests.filter(r => r.type === 'request').length}`);
    console.log(`Refetch errors: ${refetchErrors.length}`);

    if (refetchErrors.length > 0) {
      console.log('\n========== Background Refetch Errors ==========');
      refetchErrors.forEach(error => {
        console.log(`Path: ${error.path}`);
        console.log(`Status: ${error.status}`);
        console.log(`Error: ${JSON.stringify(error.error, null, 2)}`);
        console.log('---');
      });

      console.error(`\n⚠️  Found ${refetchErrors.length} permission errors during background refetch`);
      refetchErrors.forEach(err => {
        console.error(`   - ${err.path}: ${err.error?.message || 'Unknown error'}`);
      });
    } else {
      console.log('\n✓ No permission errors during background refetch');
    }
  });

  test('should identify which analytics component causes permission errors', async ({ page }) => {
    console.log('\n========== TEST: Analytics Components ==========\n');

    // Navigate to customers page
    await page.goto('http://localhost:3333/customers', { waitUntil: 'domcontentloaded' });

    // Wait for analytics components to load
    await page.waitForTimeout(3000);

    // Check each analytics component
    const analyticsComponents = [
      { name: 'MostActiveClient', testId: 'most-active-client', query: 'invoice.mostActiveClient' },
      { name: 'InactiveClients', testId: 'inactive-clients', query: 'invoice.inactiveClientsCount' },
      { name: 'TopRevenueClient', testId: 'top-revenue-client', query: 'invoice.topRevenueClient' },
      { name: 'NewCustomersThisMonth', testId: 'new-customers', query: 'invoice.newCustomersCount' },
    ];

    console.log('\n========== Analytics Components Status ==========');
    for (const component of analyticsComponents) {
      const errors = trpcRequests.filter(req =>
        req.path.includes(component.query) && (req.error || (req.status && req.status !== 200))
      );

      if (errors.length > 0) {
        console.error(`❌ ${component.name} (${component.query}): ${errors.length} errors`);
        errors.forEach(err => {
          console.error(`   Status: ${err.status}`);
          console.error(`   Error: ${JSON.stringify(err.error, null, 2)}`);
        });
      } else {
        const requests = trpcRequests.filter(req => req.path.includes(component.query));
        if (requests.length > 0) {
          console.log(`✓ ${component.name} (${component.query}): No errors`);
        } else {
          console.log(`⚠️  ${component.name} (${component.query}): No requests found`);
        }
      }
    }

    // Check customers.get query
    const customersGetErrors = trpcRequests.filter(req =>
      req.path.includes('customers.get') && (req.error || (req.status && req.status !== 200))
    );

    console.log('\n========== Customers Query Status ==========');
    if (customersGetErrors.length > 0) {
      console.error(`❌ customers.get: ${customersGetErrors.length} errors`);
      customersGetErrors.forEach(err => {
        console.error(`   Status: ${err.status}`);
        console.error(`   Error: ${JSON.stringify(err.error, null, 2)}`);
      });
    } else {
      const customersRequests = trpcRequests.filter(req => req.path.includes('customers.get'));
      console.log(`✓ customers.get: ${customersRequests.filter(r => r.type === 'request').length} requests, no errors`);
    }
  });

  test('should verify authentication state persists after hydration', async ({ page }) => {
    console.log('\n========== TEST: Auth State After Hydration ==========\n');

    // Check cookies BEFORE navigation
    const cookies = await page.context().cookies();
    console.log('Cookies before navigation:', cookies.map(c => ({ name: c.name, domain: c.domain })));

    const authCookie = cookies.find(c => c.name.includes('sb-'));
    if (authCookie) {
      console.log('✓ Supabase auth cookie found:', authCookie.name);
    } else {
      console.error('❌ No Supabase auth cookie found!');
    }

    // Navigate to customers page
    await page.goto('http://localhost:3333/customers', { waitUntil: 'domcontentloaded' });

    // Check cookies AFTER navigation
    const cookiesAfter = await page.context().cookies();
    const authCookieAfter = cookiesAfter.find(c => c.name.includes('sb-'));
    if (authCookieAfter) {
      console.log('✓ Supabase auth cookie still present after navigation');
    } else {
      console.error('❌ Supabase auth cookie missing after navigation!');
    }

    // Check auth state in browser
    const authState = await page.evaluate(() => {
      // Check for Supabase session in localStorage
      const keys = Object.keys(localStorage);
      const supabaseKey = keys.find(k => k.includes('supabase.auth.token'));

      if (supabaseKey) {
        const data = localStorage.getItem(supabaseKey);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            return {
              hasSession: !!parsed,
              hasAccessToken: !!parsed.access_token,
              expiresAt: parsed.expires_at,
              currentTime: Math.floor(Date.now() / 1000),
            };
          } catch (e) {
            return { error: 'Failed to parse auth token' };
          }
        }
      }

      return { hasSession: false };
    });

    console.log('Auth State:', JSON.stringify(authState, null, 2));

    if (authState.hasAccessToken && authState.expiresAt) {
      const timeUntilExpiry = authState.expiresAt - authState.currentTime;
      console.log(`Token expires in ${Math.floor(timeUntilExpiry / 60)} minutes`);

      if (timeUntilExpiry < 60) {
        console.warn('⚠️  Token expiring within 60 seconds!');
      }
    }

    // Wait for hydration
    await page.waitForTimeout(2000);

    // Check if auth state is still valid
    const postHydrationAuth = await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      const supabaseKey = keys.find(k => k.includes('supabase.auth.token'));

      if (supabaseKey) {
        const data = localStorage.getItem(supabaseKey);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            return {
              hasSession: !!parsed,
              hasAccessToken: !!parsed.access_token,
            };
          } catch (e) {
            return { error: 'Failed to parse auth token' };
          }
        }
      }

      return { hasSession: false };
    });

    console.log('Post-Hydration Auth State:', JSON.stringify(postHydrationAuth, null, 2));

    if (!postHydrationAuth.hasSession) {
      console.error('❌ Auth session lost after hydration!');
    } else {
      console.log('✓ Auth session persists after hydration');
    }
  });

  test('should check if cookies are sent to server during SSR', async ({ page, context }) => {
    console.log('\n========== TEST: Cookie Transmission During SSR ==========\n');

    // Get all cookies from context
    const cookies = await context.cookies();
    console.log('Total cookies in context:', cookies.length);
    cookies.forEach(c => {
      console.log(`  - ${c.name} (domain: ${c.domain}, path: ${c.path})`);
    });

    // Track requests to the page itself (SSR)
    let ssrRequestHeaders: any = null;
    page.on('request', request => {
      if (request.url() === 'http://localhost:3333/customers') {
        ssrRequestHeaders = request.headers();
        console.log('\n[SSR Request Headers]');
        console.log('  Cookie header:', ssrRequestHeaders.cookie || '(none)');
      }
    });

    // Navigate to customers page
    await page.goto('http://localhost:3333/customers', { waitUntil: 'domcontentloaded' });

    // Wait a moment
    await page.waitForTimeout(1000);

    if (ssrRequestHeaders) {
      if (ssrRequestHeaders.cookie) {
        console.log('\n✓ Cookies are being sent to server during SSR');

        // Check if Supabase auth cookie is in the Cookie header
        const hasSbCookie = ssrRequestHeaders.cookie.includes('sb-');
        if (hasSbCookie) {
          console.log('✓ Supabase auth cookie is in Cookie header');
        } else {
          console.error('❌ Supabase auth cookie NOT in Cookie header!');
          console.error('   Cookie header:', ssrRequestHeaders.cookie);
        }
      } else {
        console.error('❌ No Cookie header sent to server during SSR!');
      }
    }
  });
});

// Helper function to extract tRPC path from URL
function extractTrpcPath(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathParam = urlObj.searchParams.get('batch');
    if (pathParam) {
      const batch = JSON.parse(pathParam);
      if (Array.isArray(batch)) {
        return batch.map((b: any) => `${b.procedure} [BATCH]`).join(', ');
      }
    }

    const input = urlObj.searchParams.get('input');
    if (input) {
      return urlObj.pathname.replace('/trpc/', '') + ' (single)';
    }

    return urlObj.pathname.replace('/trpc/', '');
  } catch (e) {
    return url;
  }
}
