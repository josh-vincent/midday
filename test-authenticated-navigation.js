const puppeteer = require('puppeteer');

async function testAuthenticatedNavigation() {
  const browser = await puppeteer.launch({ 
    headless: false, // Set to false to see the browser
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  console.log('Starting authenticated navigation test...\n');
  
  try {
    // 1. Navigate to login page
    console.log('1. Navigating to login page...');
    await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle2' });
    
    // Take screenshot of login page
    await page.screenshot({ path: 'screenshots/01-login-page.png', fullPage: true });
    console.log('   ✓ Login page loaded and screenshot saved');
    
    // 2. Check if we have email/password fields (from PasswordSignIn component)
    const emailField = await page.$('input[type="email"]');
    const passwordField = await page.$('input[type="password"]');
    
    if (!emailField || !passwordField) {
      console.log('   ⚠️  Traditional login fields not found - OAuth login only');
      console.log('   📝 The application uses OAuth authentication (Google Sign-In)');
      console.log('   📝 To test authenticated pages, you need to:');
      console.log('      1. Set up a test user in Supabase Dashboard');
      console.log('      2. Or implement email/password authentication');
      
      // Test that protected routes redirect to login
      console.log('\n2. Testing protected route redirects...');
      
      const protectedRoutes = [
        '/invoices',
        '/customers', 
        '/settings',
        '/settings/general',
        '/settings/team'
      ];
      
      for (const route of protectedRoutes) {
        await page.goto(`http://localhost:3001${route}`, { waitUntil: 'networkidle2' });
        const currentUrl = page.url();
        
        if (currentUrl.includes('/login')) {
          console.log(`   ✓ ${route} redirected to login (secured)`);
        } else {
          console.log(`   ✗ ${route} did not redirect - may be accessible!`);
        }
      }
    } else {
      console.log('   ✓ Email/password fields found');
      
      // 3. Try to log in with test credentials
      console.log('\n3. Attempting login with test credentials...');
      console.log('   📝 Note: You need to create a test user first');
      console.log('   Run: npm run db:seed or create user via Supabase dashboard');
      
      // Fill in test credentials
      await emailField.type('admin@tocld.com');
      await passwordField.type('password123'); // You'll need to set this
      
      // Take screenshot before submitting
      await page.screenshot({ path: 'screenshots/02-login-filled.png', fullPage: true });
      
      // Find and click submit button
      const submitButton = await page.$('button[type="submit"]');
      if (submitButton) {
        await submitButton.click();
        
        // Wait for navigation or error
        await page.waitForTimeout(3000);
        
        const currentUrl = page.url();
        if (currentUrl.includes('/login')) {
          // Still on login page - check for error
          const errorElement = await page.$('.text-red-500');
          if (errorElement) {
            const errorText = await page.evaluate(el => el.textContent, errorElement);
            console.log(`   ✗ Login failed: ${errorText}`);
            console.log('   📝 Create user with: npm run db:seed');
          }
        } else {
          console.log(`   ✓ Login successful! Redirected to: ${currentUrl}`);
          
          // 4. Test authenticated navigation
          console.log('\n4. Testing authenticated navigation...');
          
          // Navigate to different pages
          const pages = [
            { url: '/', name: 'Dashboard' },
            { url: '/invoices', name: 'Invoices' },
            { url: '/customers', name: 'Customers' },
            { url: '/settings', name: 'Settings' }
          ];
          
          for (const pageInfo of pages) {
            await page.goto(`http://localhost:3001${pageInfo.url}`, { waitUntil: 'networkidle2' });
            await page.waitForTimeout(1000);
            
            const screenshotName = pageInfo.name.toLowerCase().replace(/ /g, '-');
            await page.screenshot({ 
              path: `screenshots/authenticated-${screenshotName}.png`, 
              fullPage: true 
            });
            
            console.log(`   ✓ ${pageInfo.name} page loaded and screenshot saved`);
            
            // Check for any console errors
            const errors = [];
            page.on('console', msg => {
              if (msg.type() === 'error') {
                errors.push(msg.text());
              }
            });
            
            if (errors.length > 0) {
              console.log(`   ⚠️  Console errors found: ${errors.join(', ')}`);
            }
          }
        }
      }
    }
    
    console.log('\n✅ Test completed!');
    console.log('📸 Screenshots saved in ./screenshots/');
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
  } finally {
    // Keep browser open for manual inspection if needed
    console.log('\n📝 Browser will remain open for 10 seconds for inspection...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

// Run the test
testAuthenticatedNavigation().catch(console.error);