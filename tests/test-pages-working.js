import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('🔐 Logging in...');
    await page.goto('http://localhost:3333/login', { waitUntil: 'networkidle2' });
    
    // Type email using placeholder
    await page.click('input[placeholder="Email"]');
    await page.keyboard.type('admin@tocld.com');
    
    // Type password
    await page.click('input[placeholder="Password"]');
    await page.keyboard.type('Admin123');
    
    // Click sign in button
    await page.click('button:has-text("Sign in")', { timeout: 5000 }).catch(() => 
      page.click('button[type="submit"]')
    );
    
    // Wait for navigation
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
    
    const currentUrl = page.url();
    console.log('✅ Logged in, redirected to:', currentUrl);
    
    // Test different pages
    const pages = [
      { name: 'Overview', path: '/' },
      { name: 'Reports', path: '/reports' },
      { name: 'Jobs', path: '/jobs' },
      { name: 'Invoices', path: '/invoices' },
      { name: 'Customers', path: '/customers' }
    ];
    
    console.log('\n📄 Testing pages:');
    for (const pageInfo of pages) {
      await page.goto('http://localhost:3333' + pageInfo.path, { waitUntil: 'networkidle2' });
      const title = await page.title();
      const hasError = await page.$('text=/Element type is invalid/i') !== null;
      
      if (hasError) {
        console.log(`❌ ${pageInfo.name}: Error - Element type is invalid`);
        // Take screenshot
        await page.screenshot({ path: `error-${pageInfo.name.toLowerCase()}.png` });
      } else {
        console.log(`✅ ${pageInfo.name}: OK (${title})`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'test-error.png' });
  } finally {
    await browser.close();
  }
})();