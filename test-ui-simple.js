/**
 * Simple UI Testing - Test all pages and main functionality
 */

import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = 'http://localhost:3333';
const API_URL = 'http://localhost:3334';
const supabaseUrl = 'https://ulncfblvuijlgniydjju.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsbmNmYmx2dWlqbGduaXlkamp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NTkxODUsImV4cCI6MjA3MjUzNTE4NX0.pCycxnDK259p3AqhTuet9k20ErxOYEJReDUI5iBG6Ik';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUI() {
  console.log('🚀 Starting UI Tests\n');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  
  const testResults = {
    passed: [],
    failed: [],
    warnings: []
  };
  
  try {
    // 1. Authenticate
    console.log('1. Authenticating...');
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: 'admin@tocld.com',
      password: 'Admin123'
    });
    
    if (error) throw new Error(`Auth failed: ${error.message}`);
    console.log('✅ Authenticated\n');
    
    // Set auth in browser
    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.evaluate((authData) => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token
      }));
    }, authData);
    
    // Test pages
    const pages = [
      { name: 'Dashboard', path: '/', tests: ['charts', 'metrics'] },
      { name: 'Jobs', path: '/jobs', tests: ['table', 'create', 'filter'] },
      { name: 'Invoices', path: '/invoices', tests: ['table', 'create', 'status'] },
      { name: 'Customers', path: '/customers', tests: ['table', 'create', 'search'] },
      { name: 'Reports', path: '/reports', tests: ['charts', 'dateRange'] },
      { name: 'Settings', path: '/settings', tests: ['navigation', 'forms'] }
    ];
    
    for (const pageInfo of pages) {
      console.log(`\nTesting ${pageInfo.name} Page (${pageInfo.path})`);
      
      try {
        await page.goto(`${BASE_URL}${pageInfo.path}`, { 
          waitUntil: 'networkidle2', 
          timeout: 10000 
        });
        await new Promise(r => setTimeout(r, 2000));
        
        // Check if page loaded
        const title = await page.title();
        console.log(`  ✓ Page loaded: ${title}`);
        testResults.passed.push(`${pageInfo.name} page loads`);
        
        // Test specific elements based on page
        if (pageInfo.tests.includes('table')) {
          // Check for table
          const hasTable = await page.$('table') !== null;
          const hasDataGrid = await page.$('[role="grid"]') !== null;
          const hasListView = await page.$('[role="list"]') !== null;
          
          if (hasTable || hasDataGrid || hasListView) {
            console.log('  ✓ Data display found (table/grid/list)');
            testResults.passed.push(`${pageInfo.name} data display`);
            
            // Count rows
            let rowCount = 0;
            if (hasTable) {
              const rows = await page.$$('tbody tr');
              rowCount = rows.length;
            } else if (hasDataGrid) {
              const rows = await page.$$('[role="row"]');
              rowCount = rows.length;
            }
            console.log(`  ✓ Found ${rowCount} data rows`);
          } else {
            console.log('  ⚠️ No data display found');
            testResults.warnings.push(`${pageInfo.name} - no data display`);
          }
        }
        
        if (pageInfo.tests.includes('create')) {
          // Look for create/add buttons
          const createButtons = await page.$$('button');
          let foundCreate = false;
          
          for (const button of createButtons) {
            const text = await button.evaluate(el => el.textContent);
            if (text && (text.includes('Create') || text.includes('Add') || text.includes('New'))) {
              console.log(`  ✓ Found create button: "${text.trim()}"`);
              testResults.passed.push(`${pageInfo.name} create button`);
              foundCreate = true;
              break;
            }
          }
          
          if (!foundCreate) {
            // Check for links
            const links = await page.$$('a');
            for (const link of links) {
              const text = await link.evaluate(el => el.textContent);
              const href = await link.evaluate(el => el.href);
              if ((text && (text.includes('Create') || text.includes('Add'))) || 
                  (href && (href.includes('/new') || href.includes('/create')))) {
                console.log(`  ✓ Found create link`);
                testResults.passed.push(`${pageInfo.name} create link`);
                foundCreate = true;
                break;
              }
            }
          }
          
          if (!foundCreate) {
            console.log('  ⚠️ No create/add functionality found');
            testResults.warnings.push(`${pageInfo.name} - no create button`);
          }
        }
        
        if (pageInfo.tests.includes('filter')) {
          // Check for filter elements
          const hasSearchInput = await page.$('input[type="search"], input[placeholder*="Search"], input[placeholder*="search"]') !== null;
          const hasSelect = await page.$('select') !== null;
          const hasFilterButtons = (await page.$$('button')).length > 2; // Assume multiple buttons might be filters
          
          if (hasSearchInput || hasSelect || hasFilterButtons) {
            console.log('  ✓ Filter/search functionality found');
            testResults.passed.push(`${pageInfo.name} filters`);
          } else {
            console.log('  ⚠️ No filter functionality found');
            testResults.warnings.push(`${pageInfo.name} - no filters`);
          }
        }
        
        if (pageInfo.tests.includes('charts')) {
          // Check for charts/visualizations
          const hasCanvas = await page.$('canvas') !== null;
          const hasSvgCharts = await page.$('svg') !== null;
          const hasChartDiv = await page.$('[class*="chart"]') !== null;
          
          if (hasCanvas || hasSvgCharts || hasChartDiv) {
            console.log('  ✓ Charts/visualizations found');
            testResults.passed.push(`${pageInfo.name} charts`);
          } else {
            console.log('  ⚠️ No charts found');
            testResults.warnings.push(`${pageInfo.name} - no charts`);
          }
        }
        
        if (pageInfo.tests.includes('forms')) {
          // Check for form elements
          const hasForm = await page.$('form') !== null;
          const hasInputs = await page.$('input') !== null;
          
          if (hasForm || hasInputs) {
            console.log('  ✓ Form elements found');
            testResults.passed.push(`${pageInfo.name} forms`);
          } else {
            console.log('  ⚠️ No forms found');
            testResults.warnings.push(`${pageInfo.name} - no forms`);
          }
        }
        
      } catch (error) {
        console.log(`  ❌ Failed to test ${pageInfo.name}: ${error.message}`);
        testResults.failed.push(`${pageInfo.name} - ${error.message}`);
      }
    }
    
    // Test API endpoints
    console.log('\n\nTesting API Endpoints');
    const token = authData.session.access_token;
    
    const apiTests = [
      { name: 'Jobs List', endpoint: '/trpc/job.list' },
      { name: 'Invoices List', endpoint: '/trpc/invoice.get' },
      { name: 'Customers List', endpoint: '/trpc/customers.get' },
      { name: 'Invoice Summary', endpoint: '/trpc/invoice.invoiceSummary' }
    ];
    
    for (const test of apiTests) {
      try {
        const response = await fetch(`${API_URL}${test.endpoint}?batch=1&input=${encodeURIComponent(JSON.stringify({"0":{"json":null}}))}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          console.log(`  ✓ ${test.name} API works`);
          testResults.passed.push(`API: ${test.name}`);
        } else {
          console.log(`  ❌ ${test.name} API failed: ${response.status}`);
          testResults.failed.push(`API: ${test.name}`);
        }
      } catch (error) {
        console.log(`  ❌ ${test.name} API error: ${error.message}`);
        testResults.failed.push(`API: ${test.name}`);
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Passed: ${testResults.passed.length}`);
    console.log(`❌ Failed: ${testResults.failed.length}`);
    console.log(`⚠️  Warnings: ${testResults.warnings.length}`);
    
    if (testResults.passed.length > 0) {
      console.log('\nPassed Tests:');
      testResults.passed.forEach(test => console.log(`  ✓ ${test}`));
    }
    
    if (testResults.failed.length > 0) {
      console.log('\nFailed Tests:');
      testResults.failed.forEach(test => console.log(`  ✗ ${test}`));
    }
    
    if (testResults.warnings.length > 0) {
      console.log('\nWarnings:');
      testResults.warnings.forEach(warning => console.log(`  ⚠ ${warning}`));
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'ui-test-final.png', fullPage: true });
    console.log('\n📸 Final screenshot saved as ui-test-final.png');
    
  } catch (error) {
    console.error('Fatal error:', error);
    await page.screenshot({ path: 'ui-test-error.png', fullPage: true });
    console.log('📸 Error screenshot saved as ui-test-error.png');
  } finally {
    await browser.close();
    await supabase.auth.signOut();
  }
}

testUI().catch(console.error);