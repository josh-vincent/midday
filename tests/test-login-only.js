const puppeteer = require('puppeteer');

async function testLogin() {
  console.log('🔐 Testing login functionality...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1400, height: 900 }
  });
  
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Browser error:', msg.text());
    }
  });
  
  try {
    console.log('1. Navigating to login page...');
    await page.goto('http://localhost:3333/login', { waitUntil: 'networkidle2' });
    await page.waitForTimeout ? await new Promise(r => setTimeout(r, 2000) : await new Promise(r => setTimeout(r, 2000));
    
    console.log('2. Looking for input fields...');
    
    // Try different methods to fill the form
    const emailInput = await page.$('input[type="email"]');
    const passwordInput = await page.$('input[type="password"]');
    
    if (!emailInput || !passwordInput) {
      console.log('❌ Could not find email or password inputs');
      return;
    }
    
    console.log('   ✓ Found input fields');
    
    // Method 1: Type directly
    console.log('3. Typing credentials...');
    await emailInput.focus();
    await page.keyboard.type('admin@tocld.com');
    
    await passwordInput.focus();
    await page.keyboard.type('Admin123');
    
    await new Promise(r => setTimeout(r, 1000);
    
    // Check button state
    const button = await page.$('button[type="submit"]');
    if (button) {
      const buttonText = await button.evaluate(el => el.textContent);
      const isDisabled = await button.evaluate(el => el.disabled);
      console.log(`   Button text: "${buttonText}"`);
      console.log(`   Button disabled: ${isDisabled}`);
      
      // Check input values
      const emailValue = await emailInput.evaluate(el => el.value);
      const passwordValue = await passwordInput.evaluate(el => el.value);
      console.log(`   Email value: "${emailValue}"`);
      console.log(`   Password value: "${passwordValue}"`);
      
      if (!emailValue || !passwordValue) {
        console.log('4. Values not set, trying alternative method...');
        
        // Method 2: Set value directly
        await emailInput.evaluate(el => el.value = 'admin@tocld.com');
        await passwordInput.evaluate(el => el.value = 'Admin123');
        
        // Trigger React onChange
        await emailInput.evaluate(el => {
          const event = new Event('input', { bubbles: true });
          el.dispatchEvent(event);
        });
        
        await passwordInput.evaluate(el => {
          const event = new Event('input', { bubbles: true });
          el.dispatchEvent(event);
        });
        
        await new Promise(r => setTimeout(r, 1000);
        
        const emailValue2 = await emailInput.evaluate(el => el.value);
        const passwordValue2 = await passwordInput.evaluate(el => el.value);
        console.log(`   Email value (after direct set): "${emailValue2}"`);
        console.log(`   Password value (after direct set): "${passwordValue2}"`);
      }
      
      // Check button state again
      const isStillDisabled = await button.evaluate(el => el.disabled);
      console.log(`   Button disabled after input: ${isStillDisabled}`);
      
      console.log('5. Attempting to click submit button...');
      
      if (isStillDisabled) {
        // Try to force enable
        await button.evaluate(el => el.disabled = false);
        console.log('   Forced button enabled');
      }
      
      await button.click();
      console.log('   Clicked submit button');
      
      // Wait for response
      console.log('6. Waiting for response...');
      await new Promise(r => setTimeout(r, 5000);
      
      const currentUrl = page.url();
      console.log(`   Current URL: ${currentUrl}`);
      
      // Check for error messages
      const errorElement = await page.$('.text-red-500');
      if (errorElement) {
        const errorText = await errorElement.evaluate(el => el.textContent);
        console.log(`   ❌ Error message: ${errorText}`);
      }
      
      if (!currentUrl.includes('/login')) {
        console.log('   ✅ Login successful!');
      } else {
        console.log('   ❌ Still on login page');
      }
      
    } else {
      console.log('❌ No submit button found');
    }
    
  } catch (error) {
    console.error('Test error:', error.message);
  } finally {
    console.log('\nPress Ctrl+C to close the browser...');
    // Keep browser open to inspect
    await new Promise(() => {});
  }
}

testLogin().catch(console.error);