import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('🔐 Logging in...');
    await page.goto('http://localhost:3333/login', { waitUntil: 'networkidle2' });
    
    // Login
    await page.click('input[placeholder="Email"]');
    await page.keyboard.type('admin@tocld.com');
    await page.click('input[placeholder="Password"]');
    await page.keyboard.type('Admin123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
    
    console.log('📊 Navigating to reports page...');
    await page.goto('http://localhost:3333/reports', { waitUntil: 'networkidle2' });
    
    // Wait for charts to load
    await new Promise(r => setTimeout(r, 2000));
    
    // Set viewport for better screenshot
    await page.setViewport({ width: 1440, height: 900 });
    
    // Take screenshot
    await page.screenshot({ path: 'reports-page-with-charts.png', fullPage: true });
    console.log('✅ Screenshot saved as reports-page-with-charts.png');
    
    // Check for any chart elements
    const chartElements = await page.$$('canvas'); // Charts typically render in canvas
    console.log(`📈 Found ${chartElements.length} chart canvas elements`);
    
    // Check for chart containers
    const chartContainers = await page.$$('[class*="chart"]');
    console.log(`📊 Found ${chartContainers.length} chart container elements`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'reports-error.png' });
  } finally {
    await browser.close();
  }
})();