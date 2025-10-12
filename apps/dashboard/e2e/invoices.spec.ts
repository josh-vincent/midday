import { test, expect } from '@playwright/test';

/**
 * E2E tests for Invoices UI with Mock Mode
 *
 * Prerequisites:
 * 1. Start API in mock mode: MOCK_MODE=true npm run dev:api
 * 2. Start dashboard: npm run dev:dashboard
 * 3. Run tests: npx playwright test
 */

test.describe('Invoices DataTable with Mock Data', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to invoices page
    await page.goto('http://localhost:3333/invoices');
  });

  test('should display invoices datatable from mock data', async ({ page }) => {
    // Wait for invoices table to load
    await page.waitForSelector('[data-testid="invoices-list"]', { timeout: 15000 });

    // Verify invoices list is visible
    const invoicesList = page.getByTestId('invoices-list');
    await expect(invoicesList).toBeVisible();

    // Check that invoice items are rendered
    const invoiceItems = page.locator('[data-testid="invoice-item"]');
    const count = await invoiceItems.count();

    // Verify we have at least 1 invoice from mock data
    expect(count).toBeGreaterThan(0);
    console.log(`Found ${count} invoice items in the table`);
  });

  test('should click on invoice row to open details', async ({ page }) => {
    await page.waitForSelector('[data-testid="invoices-list"]', { timeout: 15000 });

    // Wait for table to be stable after hydration
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Get first invoice item
    const firstInvoiceRow = page.locator('[data-testid="invoice-item"]').first();
    await expect(firstInvoiceRow).toBeVisible();

    // Click on the row (avoid checkbox and action buttons)
    const secondCell = firstInvoiceRow.locator('td').nth(2);
    await secondCell.click({ timeout: 10000 });

    // Wait a moment for potential navigation or sheet to open
    await page.waitForTimeout(1000);

    console.log('Successfully clicked invoice row');
  });

  test('should display invoice information in rows', async ({ page }) => {
    await page.waitForSelector('[data-testid="invoices-list"]', { timeout: 15000 });

    // Wait for table to be stable
    await page.waitForLoadState('networkidle');

    // Get first invoice row
    const firstInvoiceRow = page.locator('[data-testid="invoice-item"]').first();
    await expect(firstInvoiceRow).toBeVisible();

    // Verify row has content (invoice number, customer, amount, status, etc.)
    const cells = firstInvoiceRow.locator('td');
    const cellCount = await cells.count();

    // Should have multiple cells with data
    expect(cellCount).toBeGreaterThan(0);
    console.log(`Invoice row has ${cellCount} cells with data`);
  });

  test('should have table headers', async ({ page }) => {
    await page.waitForSelector('[data-testid="invoices-list"]', { timeout: 15000 });

    // Wait for table to load
    await page.waitForLoadState('networkidle');

    // Check for table headers
    const table = page.locator('table').first();
    await expect(table).toBeVisible();

    // Verify table has a header row
    const headerRow = table.locator('thead tr').first();
    await expect(headerRow).toBeVisible();

    console.log('Table headers are displayed');
  });
});
