const puppeteer = require('puppeteer');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testLogin() {
  console.log('🔐 Testing login functionality...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1400, height: 900 }
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('1. Navigating to login page...');
    await page.goto('http://localhost:3333/login', { waitUntil: 'networkidle2' });
    await delay(2000);
    
    console.log('2. Filling form fields...');
    
    // Type in email field
    await page.type('input[type="email"]', 'admin@tocld.com');
    await delay(500);
    
    // Type in password field  
    await page.type('input[type="password"]', 'Admin123');
    await delay(500);
    
    // Get button info
    const buttonInfo = await page.evaluate(() => {
      const btn = document.querySelector('button[type="submit"]');
      return btn ? {
        text: btn.textContent,
        disabled: btn.disabled,
        className: btn.className
      } : null;
    });
    
    console.log('3. Button state:', buttonInfo);
    
    // Click submit
    console.log('4. Clicking submit button...');
    await page.click('button[type="submit"]');
    
    // Wait for navigation or error
    console.log('5. Waiting for response...');
    await delay(5000);
    
    const currentUrl = page.url();
    console.log('6. Current URL:', currentUrl);
    
    if (!currentUrl.includes('/login')) {
      console.log('✅ Login successful! Redirected to:', currentUrl);
      
      // Now test navigation
      console.log('\n7. Testing navigation to customers...');
      await page.goto('http://localhost:3333/customers', { waitUntil: 'networkidle2' });
      await delay(2000);
      console.log('   Current URL:', page.url());
      
      console.log('\n8. Testing navigation to invoices...');
      await page.goto('http://localhost:3333/invoices', { waitUntil: 'networkidle2' });
      await delay(2000);
      console.log('   Current URL:', page.url());
      
    } else {
      console.log('❌ Login failed - still on login page');
      
      // Check for errors
      const errorText = await page.evaluate(() => {
        const error = document.querySelector('.text-red-500');
        return error ? error.textContent : null;
      });
      
      if (errorText) {
        console.log('   Error message:', errorText);
      }
    }
    
  } catch (error) {
    console.error('Test error:', error.message);
  } finally {
    await delay(3000);
    await browser.close();
    console.log('\nTest completed.');
  }
}

testLogin().catch(console.error);