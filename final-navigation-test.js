const puppeteer = require('puppeteer');

async function finalNavigationTest() {
  console.log('🚀 Starting Final Navigation Test\n');
  console.log('=' .repeat(60));
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  const results = {
    passed: [],
    failed: [],
    warnings: []
  };
  
  try {
    // Test 1: Login page loads
    console.log('\n📋 Test 1: Login Page Load');
    await page.goto('http://localhost:3333/login', { waitUntil: 'networkidle2' });
    const loginTitle = await page.title();
    console.log(`   Title: ${loginTitle}`);
    
    // Check for login form elements
    const hasGoogleButton = await page.$eval('button', el => el.textContent.includes('Continue with Google')).catch(() => false);
    const hasOtherOptions = await page.$eval('button', el => el.textContent.includes('Other options')).catch(() => false);
    
    if (hasGoogleButton || hasOtherOptions) {
      results.passed.push('Login page loads with authentication options');
      console.log('   ✅ Login page loaded successfully');
    } else {
      results.failed.push('Login page missing authentication options');
      console.log('   ❌ Login page missing expected elements');
    }
    
    // Test 2: Protected routes redirect to login
    console.log('\n📋 Test 2: Protected Route Security');
    const protectedRoutes = [
      { path: '/', name: 'Homepage' },
      { path: '/invoices', name: 'Invoices' },
      { path: '/customers', name: 'Customers' },
      { path: '/settings', name: 'Settings' },
      { path: '/settings/general', name: 'General Settings' },
      { path: '/settings/team', name: 'Team Settings' }
    ];
    
    for (const route of protectedRoutes) {
      await page.goto(`http://localhost:3333${route.path}`, { waitUntil: 'networkidle2' });
      const currentUrl = page.url();
      
      if (currentUrl.includes('/login')) {
        results.passed.push(`${route.name} redirects to login when unauthenticated`);
        console.log(`   ✅ ${route.name}: Secured (redirects to login)`);
        
        // Check if return URL is preserved
        if (currentUrl.includes('return_to')) {
          console.log(`      └─ Preserves return URL: ${currentUrl.split('return_to=')[1]}`);
        }
      } else {
        results.failed.push(`${route.name} accessible without authentication`);
        console.log(`   ❌ ${route.name}: NOT SECURED (accessible without login)`);
      }
    }
    
    // Test 3: Check for console errors
    console.log('\n📋 Test 3: Console Error Check');
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto('http://localhost:3333/login', { waitUntil: 'networkidle2' });
    await page.waitForTimeout(1000);
    
    if (consoleErrors.length === 0) {
      results.passed.push('No console errors on login page');
      console.log('   ✅ No console errors detected');
    } else {
      results.warnings.push(`Console errors: ${consoleErrors.join(', ')}`);
      console.log(`   ⚠️  Console errors found: ${consoleErrors.length}`);
      consoleErrors.forEach(err => console.log(`      └─ ${err}`));
    }
    
    // Test 4: Network requests
    console.log('\n📋 Test 4: Network Request Analysis');
    const failedRequests = [];
    page.on('requestfailed', request => {
      failedRequests.push({
        url: request.url(),
        failure: request.failure().errorText
      });
    });
    
    await page.goto('http://localhost:3333/login', { waitUntil: 'networkidle2' });
    
    if (failedRequests.length === 0) {
      results.passed.push('All network requests successful');
      console.log('   ✅ All network requests successful');
    } else {
      results.warnings.push(`Failed requests: ${failedRequests.length}`);
      console.log(`   ⚠️  Failed requests: ${failedRequests.length}`);
      failedRequests.forEach(req => console.log(`      └─ ${req.url}: ${req.failure}`));
    }
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    results.failed.push(`Test suite error: ${error.message}`);
  }
  
  // Final Report
  console.log('\n' + '=' .repeat(60));
  console.log('📊 FINAL TEST REPORT');
  console.log('=' .repeat(60));
  
  console.log(`\n✅ Passed Tests: ${results.passed.length}`);
  results.passed.forEach(test => console.log(`   • ${test}`));
  
  if (results.warnings.length > 0) {
    console.log(`\n⚠️  Warnings: ${results.warnings.length}`);
    results.warnings.forEach(warning => console.log(`   • ${warning}`));
  }
  
  if (results.failed.length > 0) {
    console.log(`\n❌ Failed Tests: ${results.failed.length}`);
    results.failed.forEach(test => console.log(`   • ${test}`));
  }
  
  // Overall Result
  console.log('\n' + '=' .repeat(60));
  if (results.failed.length === 0) {
    console.log('🎉 ALL CRITICAL TESTS PASSED!');
    console.log('✅ The application navigation and security are working correctly.');
  } else {
    console.log('⚠️  SOME TESTS FAILED - Review required');
  }
  console.log('=' .repeat(60));
  
  await browser.close();
}

// Run the test
finalNavigationTest().catch(console.error);