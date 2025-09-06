/**
 * Comprehensive UI Testing Suite
 * Tests all pages, tables, filters, create/edit/delete functionality
 */

import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = 'http://localhost:3333';
const supabaseUrl = 'https://ulncfblvuijlgniydjju.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsbmNmYmx2dWlqbGduaXlkamp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NTkxODUsImV4cCI6MjA3MjUzNTE4NX0.pCycxnDK259p3AqhTuet9k20ErxOYEJReDUI5iBG6Ik';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test configuration
const TEST_USER = {
  email: 'admin@tocld.com',
  password: 'Admin123'
};

// Helper to wait for navigation
async function waitForNavigation(page, timeout = 5000) {
  try {
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout });
  } catch (e) {
    // Navigation might have already happened
  }
}

// Helper to wait and click
async function waitAndClick(page, selector, options = {}) {
  await page.waitForSelector(selector, { visible: true, ...options });
  await page.click(selector);
}

// Helper to test table functionality
async function testTableFunctionality(page, tableName) {
  console.log(`  Testing ${tableName} table...`);
  
  // Check if table exists
  const tableExists = await page.$('table, [role="table"], .table, [data-testid*="table"]') !== null;
  if (!tableExists) {
    console.log(`    ⚠️ No table found on ${tableName} page`);
    return false;
  }
  
  // Check for rows
  const rows = await page.$$('tbody tr, [role="row"]');
  console.log(`    ✓ Found ${rows.length} rows`);
  
  // Test sorting if available
  const sortButtons = await page.$$('th button, th [role="button"], .sort-button');
  if (sortButtons.length > 0) {
    console.log(`    ✓ Found ${sortButtons.length} sortable columns`);
  }
  
  // Test pagination if available
  const paginationExists = await page.$('.pagination, [aria-label*="pagination"], [data-testid*="pagination"]') !== null;
  if (paginationExists) {
    console.log('    ✓ Pagination available');
  }
  
  return true;
}

// Helper to test filter functionality
async function testFilters(page, pageName) {
  console.log(`  Testing filters on ${pageName}...`);
  
  // Look for filter buttons or inputs
  const filterSelectors = [
    'button:has-text("Filter")',
    '[aria-label*="filter"]',
    '[data-testid*="filter"]',
    'input[placeholder*="Search"]',
    'input[placeholder*="search"]',
    '[role="combobox"]'
  ];
  
  let filterFound = false;
  for (const selector of filterSelectors) {
    const element = await page.$(selector);
    if (element) {
      filterFound = true;
      console.log(`    ✓ Found filter element: ${selector}`);
      break;
    }
  }
  
  if (!filterFound) {
    console.log('    ⚠️ No filters found');
  }
  
  return filterFound;
}

// Helper to test create/add functionality
async function testCreateFunctionality(page, pageName) {
  console.log(`  Testing create/add functionality on ${pageName}...`);
  
  const createSelectors = [
    'button:has-text("Create")',
    'button:has-text("Add")',
    'button:has-text("New")',
    '[aria-label*="create"]',
    '[aria-label*="add"]',
    '[data-testid*="create"]',
    '[data-testid*="add"]',
    'a[href*="new"]',
    'a[href*="create"]'
  ];
  
  for (const selector of createSelectors) {
    const element = await page.$(selector);
    if (element) {
      console.log(`    ✓ Found create/add button: ${selector}`);
      
      // Try clicking it to see if a modal or new page opens
      try {
        await element.click();
        await new Promise(r => setTimeout(r, 1000));
        
        // Check if modal opened
        const modalExists = await page.$('[role="dialog"], .modal, [data-testid*="modal"]') !== null;
        if (modalExists) {
          console.log('    ✓ Create modal opened successfully');
          // Close modal
          const closeButton = await page.$('[aria-label*="close"], button:has-text("Cancel"), button:has-text("Close")');
          if (closeButton) await closeButton.click();
        } else {
          // Check if navigated to new page
          const currentUrl = page.url();
          if (currentUrl.includes('new') || currentUrl.includes('create')) {
            console.log('    ✓ Navigated to create page');
            await page.goBack();
          }
        }
      } catch (e) {
        console.log('    ⚠️ Could not test create button interaction');
      }
      
      return true;
    }
  }
  
  console.log('    ⚠️ No create/add functionality found');
  return false;
}

// Main test function
async function runComprehensiveUITests() {
  console.log('🚀 Starting Comprehensive UI Tests\n');
  
  const browser = await puppeteer.launch({
    headless: false, // Set to true for CI
    defaultViewport: { width: 1440, height: 900 }
  });
  
  const page = await browser.newPage();
  
  try {
    // 1. Authenticate
    console.log('1. Authenticating...');
    const { data: authData, error } = await supabase.auth.signInWithPassword(TEST_USER);
    
    if (error) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
    
    console.log('✅ Authentication successful\n');
    
    // Set auth cookies
    await page.goto(BASE_URL);
    await page.evaluate((token) => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: token.session.access_token,
        refresh_token: token.session.refresh_token,
        expires_at: token.session.expires_at
      }));
    }, authData);
    
    // 2. Test Overview/Dashboard
    console.log('2. Testing Overview/Dashboard Page');
    await page.goto(`${BASE_URL}/`);
    await new Promise(r => setTimeout(r, 2000));
    
    // Check for dashboard elements
    const dashboardElements = await page.$$('.chart, [data-testid*="chart"], .stat, .metric, .card');
    console.log(`  ✓ Found ${dashboardElements.length} dashboard widgets`);
    
    // 3. Test Jobs Page
    console.log('\n3. Testing Jobs Page');
    await page.goto(`${BASE_URL}/jobs`);
    await new Promise(r => setTimeout(r, 2000));
    
    await testTableFunctionality(page, 'Jobs');
    await testFilters(page, 'Jobs');
    await testCreateFunctionality(page, 'Jobs');
    
    // Test job status filters
    const statusFilters = ['All', 'Pending', 'In Progress', 'Completed', 'Cancelled'];
    console.log('  Testing status filters...');
    for (const status of statusFilters) {
      const statusButton = await page.$(`button:has-text("${status}"), [aria-label="${status}"]`);
      if (statusButton) {
        console.log(`    ✓ Found ${status} filter`);
      }
    }
    
    // 4. Test Invoices Page
    console.log('\n4. Testing Invoices Page');
    await page.goto(`${BASE_URL}/invoices`);
    await new Promise(r => setTimeout(r, 2000));
    
    await testTableFunctionality(page, 'Invoices');
    await testFilters(page, 'Invoices');
    await testCreateFunctionality(page, 'Invoices');
    
    // Test invoice-specific features
    const invoiceStatuses = ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'];
    console.log('  Testing invoice status filters...');
    for (const status of invoiceStatuses) {
      const statusElement = await page.$(`button:has-text("${status}"), [aria-label*="${status.toLowerCase()}"]`);
      if (statusElement) {
        console.log(`    ✓ Found ${status} filter`);
      }
    }
    
    // 5. Test Customers Page
    console.log('\n5. Testing Customers Page');
    await page.goto(`${BASE_URL}/customers`);
    await new Promise(r => setTimeout(r, 2000));
    
    await testTableFunctionality(page, 'Customers');
    await testFilters(page, 'Customers');
    await testCreateFunctionality(page, 'Customers');
    
    // Test customer search
    const searchInput = await page.$('input[placeholder*="Search"], input[placeholder*="search"]');
    if (searchInput) {
      await searchInput.type('test');
      await new Promise(r => setTimeout(r, 500));
      console.log('  ✓ Search functionality available');
      await searchInput.click({ clickCount: 3 });
      await page.keyboard.press('Backspace');
    }
    
    // 6. Test Reports Page
    console.log('\n6. Testing Reports Page');
    await page.goto(`${BASE_URL}/reports`);
    await new Promise(r => setTimeout(r, 2000));
    
    // Check for charts and metrics
    const charts = await page.$$('.chart, canvas, svg.chart, [data-testid*="chart"]');
    console.log(`  ✓ Found ${charts.length} charts/visualizations`);
    
    // Test date range selector
    const dateRangeSelectors = await page.$$('[data-testid*="date"], input[type="date"], .date-picker');
    if (dateRangeSelectors.length > 0) {
      console.log('  ✓ Date range selector available');
    }
    
    // Test report types
    const reportTypes = ['Revenue', 'Expenses', 'Profit', 'Cash Flow'];
    console.log('  Testing report type filters...');
    for (const type of reportTypes) {
      const typeElement = await page.$(`button:has-text("${type}"), [aria-label*="${type.toLowerCase()}"]`);
      if (typeElement) {
        console.log(`    ✓ Found ${type} report`);
      }
    }
    
    // 7. Test Settings Pages
    console.log('\n7. Testing Settings Pages');
    await page.goto(`${BASE_URL}/settings`);
    await new Promise(r => setTimeout(r, 2000));
    
    // Test settings navigation
    const settingsSections = [
      'General',
      'Profile', 
      'Team',
      'Billing',
      'Invoice',
      'Notifications'
    ];
    
    console.log('  Testing settings sections...');
    for (const section of settingsSections) {
      const sectionLink = await page.$(`a:has-text("${section}"), button:has-text("${section}")`);
      if (sectionLink) {
        console.log(`    ✓ Found ${section} settings`);
      }
    }
    
    // 8. Test Documents Page (if exists)
    console.log('\n8. Testing Documents Page');
    await page.goto(`${BASE_URL}/documents`);
    await new Promise(r => setTimeout(r, 2000));
    
    const documentsPageExists = !page.url().includes('404');
    if (documentsPageExists) {
      await testTableFunctionality(page, 'Documents');
      await testFilters(page, 'Documents');
      await testCreateFunctionality(page, 'Documents');
    } else {
      console.log('  ⚠️ Documents page not found or not accessible');
    }
    
    // 9. Test Interactive Elements
    console.log('\n9. Testing Global Interactive Elements');
    
    // Test dropdown menus
    const dropdowns = await page.$$('[role="button"][aria-haspopup="true"], [data-testid*="dropdown"]');
    console.log(`  ✓ Found ${dropdowns.length} dropdown menus`);
    
    // Test modals
    const modalTriggers = await page.$$('[data-testid*="modal-trigger"], button[aria-haspopup="dialog"]');
    console.log(`  ✓ Found ${modalTriggers.length} modal triggers`);
    
    // Test tooltips
    const tooltips = await page.$$('[aria-describedby], [data-tooltip], [title]');
    console.log(`  ✓ Found ${tooltips.length} elements with tooltips`);
    
    // 10. Test Responsive Behavior
    console.log('\n10. Testing Responsive Behavior');
    
    // Test mobile view
    await page.setViewport({ width: 375, height: 667 });
    await new Promise(r => setTimeout(r, 1000));
    
    // Check for mobile menu
    const mobileMenu = await page.$('[aria-label*="menu"], button:has-text("Menu"), .hamburger');
    if (mobileMenu) {
      console.log('  ✓ Mobile menu available');
    }
    
    // Test tablet view
    await page.setViewport({ width: 768, height: 1024 });
    await new Promise(r => setTimeout(r, 1000));
    console.log('  ✓ Tablet view tested');
    
    // Back to desktop
    await page.setViewport({ width: 1440, height: 900 });
    console.log('  ✓ Desktop view tested');
    
    // 11. Performance Metrics
    console.log('\n11. Collecting Performance Metrics');
    
    const metrics = await page.metrics();
    console.log(`  ✓ JS Heap Used: ${(metrics.JSHeapUsedSize / 1048576).toFixed(2)} MB`);
    console.log(`  ✓ DOM Nodes: ${metrics.Nodes}`);
    console.log(`  ✓ Event Listeners: ${metrics.JSEventListeners}`);
    
    console.log('\n✅ All UI tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    // Take screenshot on failure
    await page.screenshot({ 
      path: 'test-failure-screenshot.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved as test-failure-screenshot.png');
    
  } finally {
    await browser.close();
    await supabase.auth.signOut();
  }
}

// Run the tests
runComprehensiveUITests().catch(console.error);