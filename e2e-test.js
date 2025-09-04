const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function runE2ETest() {
  let browser;
  
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: false,
      slowMo: 100,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 800 });
    
    // Create screenshots directory
    const screenshotsDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir);
    }
    
    console.log('🚀 Starting E2E Test Flow');
    
    // Step 1: Navigate to application
    console.log('📍 Step 1: Navigating to http://localhost:3333');
    await page.goto('http://localhost:3333', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: path.join(screenshotsDir, '01-initial-load.png') });
    
    // Check for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log('❌ Console Error:', msg.text());
      }
    });
    
    // Step 2: Look for login form or elements
    console.log('🔍 Step 2: Looking for login elements');
    
    // Wait for page to be ready and look for common login elements
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Try to find email/username input
    const emailInputs = await page.$$('input[type="email"], input[name="email"], input[placeholder*="email" i], input[id*="email" i]');
    const passwordInputs = await page.$$('input[type="password"], input[name="password"], input[placeholder*="password" i], input[id*="password" i]');
    
    console.log(`Found ${emailInputs.length} email inputs and ${passwordInputs.length} password inputs`);
    
    if (emailInputs.length > 0 && passwordInputs.length > 0) {
      console.log('✅ Found login form, attempting to login');
      
      // Fill in login credentials
      await emailInputs[0].type('admin@tocld.com');
      await passwordInputs[0].type('Admin123');
      
      await page.screenshot({ path: path.join(screenshotsDir, '02-login-filled.png') });
      
      // Look for and click login/submit button
      const loginButtons = await page.$$('button[type="submit"], input[type="submit"]');
      
      if (loginButtons.length > 0) {
        await loginButtons[0].click();
        console.log('🔑 Clicked login button');
        
        // Wait for navigation or response
        await new Promise(resolve => setTimeout(resolve, 3000));
        await page.screenshot({ path: path.join(screenshotsDir, '03-after-login.png') });
        
        console.log('Current URL after login:', page.url());
      } else {
        console.log('⚠️  No login button found');
        await page.screenshot({ path: path.join(screenshotsDir, '02-no-login-button.png') });
      }
    } else {
      console.log('⚠️  No login form found on initial load');
      await page.screenshot({ path: path.join(screenshotsDir, '02-no-login-form.png') });
    }
    
    // Step 3: Look for team creation functionality
    console.log('🏢 Step 3: Looking for team creation functionality');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Common selectors for team creation
    const teamCreateSelectors = [
      'a[href*="team"]',
      'button[data-testid*="team"]'
    ];
    
    let teamButton = null;
    for (const selector of teamCreateSelectors) {
      try {
        teamButton = await page.$(selector);
        if (teamButton) break;
      } catch (e) {
        // Selector might not be valid, continue
      }
    }
    
    // Also try to find any buttons or links that might lead to team creation
    const allButtons = await page.$$eval('button, a', elements => 
      elements.map(el => ({
        text: el.innerText.trim(),
        href: el.href || null,
        className: el.className || null,
        id: el.id || null
      })).filter(item => item.text.length > 0)
    );
    
    console.log('Available buttons/links:', allButtons);
    
    if (teamButton) {
      console.log('✅ Found team creation button');
      await teamButton.click();
      await new Promise(resolve => setTimeout(resolve, 2000));
      await page.screenshot({ path: path.join(screenshotsDir, '04-team-creation-page.png') });
      
      // Look for team name input
      const teamNameInputs = await page.$$('input[name*="team"], input[placeholder*="team" i], input[placeholder*="company" i]');
      
      if (teamNameInputs.length > 0) {
        console.log('📝 Found team name input, filling "Test Company"');
        await teamNameInputs[0].clear();
        await teamNameInputs[0].type('Test Company');
        
        await page.screenshot({ path: path.join(screenshotsDir, '05-team-name-filled.png') });
        
        // Look for create/submit button
        const createButtons = await page.$$('button[type="submit"]');
        
        if (createButtons.length > 0) {
          await createButtons[0].click();
          console.log('✅ Clicked create team button');
          
          // Wait for creation and navigation
          await new Promise(resolve => setTimeout(resolve, 3000));
          await page.screenshot({ path: path.join(screenshotsDir, '06-after-team-creation.png') });
          
          console.log('Current URL after team creation:', page.url());
        } else {
          console.log('⚠️  No create button found');
        }
      } else {
        console.log('⚠️  No team name input found');
      }
    } else {
      console.log('⚠️  No team creation functionality found');
      await page.screenshot({ path: path.join(screenshotsDir, '04-no-team-creation.png') });
    }
    
    // Step 4: Look for invoices or other navigation
    console.log('🧾 Step 4: Looking for invoices and navigation');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Look for navigation menu items
    const navItems = await page.$$eval('nav a, [role="navigation"] a, .navigation a, .menu a', elements => 
      elements.map(el => ({
        text: el.innerText.trim(),
        href: el.href
      })).filter(item => item.text.length > 0)
    );
    
    console.log('Navigation items found:', navItems);
    
    // Look specifically for invoices
    const invoiceLinks = navItems.filter(item => 
      item.text.toLowerCase().includes('invoice') || 
      item.href.toLowerCase().includes('invoice')
    );
    
    if (invoiceLinks.length > 0) {
      console.log('✅ Found invoice navigation');
      await page.goto(invoiceLinks[0].href);
      await new Promise(resolve => setTimeout(resolve, 2000));
      await page.screenshot({ path: path.join(screenshotsDir, '07-invoices-page.png') });
    } else {
      console.log('⚠️  No invoice navigation found');
      
      // Try to click on common navigation items
      const commonNavSelectors = ['a[href*="dashboard"]', 'a[href*="home"]', 'a[href*="overview"]'];
      
      for (const selector of commonNavSelectors) {
        try {
          const navLink = await page.$(selector);
          if (navLink) {
            await navLink.click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log(`Clicked on ${selector}`);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      
      await page.screenshot({ path: path.join(screenshotsDir, '07-final-state.png') });
    }
    
    // Step 5: Check for any errors in network requests
    console.log('🌐 Step 5: Checking network activity and errors');
    
    const performanceEntries = await page.evaluate(() => {
      return JSON.stringify(performance.getEntries().filter(entry => 
        entry.entryType === 'navigation' || entry.entryType === 'resource'
      ).map(entry => ({
        name: entry.name,
        duration: entry.duration,
        transferSize: entry.transferSize || 'N/A'
      })));
    });
    
    console.log('Performance entries:', performanceEntries);
    
    // Final screenshot
    await page.screenshot({ path: path.join(screenshotsDir, '08-final-screenshot.png') });
    
    console.log('✅ E2E Test completed successfully!');
    console.log(`📷 Screenshots saved to: ${screenshotsDir}`);
    
  } catch (error) {
    console.error('❌ E2E Test failed:', error);
    
    if (browser) {
      const page = (await browser.pages())[0];
      if (page) {
        await page.screenshot({ path: path.join(__dirname, 'screenshots', 'error-screenshot.png') });
      }
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

runE2ETest();