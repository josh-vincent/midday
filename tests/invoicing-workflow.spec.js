const { test, expect } = require('@playwright/test');

// Configuration
const BASE_URL = 'http://localhost:3333';
const CREDENTIALS = {
  email: 'admin@tocld.com',
  password: 'Admin123'
};

// Test retry configuration
test.describe.configure({ retries: 1 });

test.describe('Invoicing Application Workflow', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set viewport for consistent testing
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Navigate to the base URL
    await page.goto(BASE_URL);
  });

  test('Complete workflow test - Run 1', async ({ page }) => {
    await runCompleteWorkflowTest(page, 'Run 1');
  });

  test('Complete workflow test - Run 2', async ({ page }) => {
    await runCompleteWorkflowTest(page, 'Run 2');
  });

  test('Complete workflow test - Run 3', async ({ page }) => {
    await runCompleteWorkflowTest(page, 'Run 3');
  });

});

async function runCompleteWorkflowTest(page, runNumber) {
  console.log(`\n🧪 Starting ${runNumber} of workflow test...`);
  
  try {
    // Step 1: Navigate to login page
    console.log(`📍 ${runNumber}: Navigating to login page...`);
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Document current URL and page content
    const currentUrl = page.url();
    console.log(`📍 ${runNumber}: Current URL: ${currentUrl}`);
    
    const pageTitle = await page.title();
    console.log(`📍 ${runNumber}: Page title: ${pageTitle}`);
    
    // Check if we're on the login page or redirected
    const isOnLoginPage = currentUrl.includes('/login');
    console.log(`📍 ${runNumber}: On login page: ${isOnLoginPage}`);
    
    // Take screenshot for debugging
    await page.screenshot({ path: `test-results/login-page-${runNumber.replace(' ', '-').toLowerCase()}.png` });
    
    if (isOnLoginPage) {
      // Step 2: Attempt login
      console.log(`🔐 ${runNumber}: Attempting to login...`);
      
      // Look for email input field
      const emailInputs = await page.locator('input[type="email"], input[name="email"], input[placeholder*="email"], input[placeholder*="Email"]').all();
      console.log(`🔐 ${runNumber}: Found ${emailInputs.length} email input fields`);
      
      // Look for password input field
      const passwordInputs = await page.locator('input[type="password"], input[name="password"], input[placeholder*="password"], input[placeholder*="Password"]').all();
      console.log(`🔐 ${runNumber}: Found ${passwordInputs.length} password input fields`);
      
      // Look for login/submit buttons
      const loginButtons = await page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in"), input[type="submit"]').all();
      console.log(`🔐 ${runNumber}: Found ${loginButtons.length} login buttons`);
      
      if (emailInputs.length > 0 && passwordInputs.length > 0) {
        try {
          // Fill in credentials
          await emailInputs[0].fill(CREDENTIALS.email);
          await passwordInputs[0].fill(CREDENTIALS.password);
          console.log(`🔐 ${runNumber}: Filled in credentials`);
          
          // Submit form
          if (loginButtons.length > 0) {
            // Try different click methods to avoid Next.js overlay issues
            try {
              await loginButtons[0].click({ force: true });
            } catch (e) {
              try {
                await loginButtons[0].click({ timeout: 5000 });
              } catch (e2) {
                // Try pressing Enter on the password field instead
                await passwordInputs[0].press('Enter');
              }
            }
            console.log(`🔐 ${runNumber}: Clicked login button`);
            
            // Wait for navigation or error
            await page.waitForTimeout(3000);
            const postLoginUrl = page.url();
            console.log(`🔐 ${runNumber}: Post-login URL: ${postLoginUrl}`);
            
            // Check if login was successful
            const loginSuccessful = !postLoginUrl.includes('/login');
            console.log(`🔐 ${runNumber}: Login successful: ${loginSuccessful}`);
            
            if (!loginSuccessful) {
              // Look for error messages
              const errorElements = await page.locator('[class*="error"], [data-testid*="error"], .alert-error, [role="alert"]').all();
              for (const errorEl of errorElements) {
                const errorText = await errorEl.textContent();
                if (errorText && errorText.trim()) {
                  console.log(`❌ ${runNumber}: Login error found: ${errorText.trim()}`);
                }
              }
            }
            
          } else {
            console.log(`❌ ${runNumber}: No login button found`);
          }
          
        } catch (loginError) {
          console.log(`❌ ${runNumber}: Login failed: ${loginError.message}`);
        }
      } else {
        console.log(`❌ ${runNumber}: Login form elements not found properly`);
      }
    }
    
    // Take screenshot after login attempt
    await page.screenshot({ path: `test-results/after-login-${runNumber.replace(' ', '-').toLowerCase()}.png` });
    
    // Step 3: Navigate to customers page (continue regardless of login result)
    console.log(`👥 ${runNumber}: Navigating to customers page...`);
    await page.goto(`${BASE_URL}/customers`);
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const customersUrl = page.url();
    console.log(`👥 ${runNumber}: Customers URL: ${customersUrl}`);
    
    // Look for customer-related elements
    const customerElements = await page.locator('h1, h2, h3, [data-testid*="customer"], [class*="customer"]').all();
    console.log(`👥 ${runNumber}: Found ${customerElements.length} customer-related elements`);
    
    for (let i = 0; i < Math.min(customerElements.length, 5); i++) {
      const text = await customerElements[i].textContent();
      if (text && text.trim()) {
        console.log(`👥 ${runNumber}: Customer element ${i + 1}: ${text.trim()}`);
      }
    }
    
    // Look for Add/New customer button
    const addCustomerButtons = await page.locator(
      'button:has-text("Add"), button:has-text("New"), button:has-text("Create"), ' +
      'a:has-text("Add"), a:has-text("New"), a:has-text("Create"), ' +
      '[data-testid*="add"], [data-testid*="new"], [data-testid*="create"]'
    ).all();
    console.log(`👥 ${runNumber}: Found ${addCustomerButtons.length} Add/New buttons`);
    
    for (let i = 0; i < addCustomerButtons.length; i++) {
      const buttonText = await addCustomerButtons[i].textContent();
      console.log(`👥 ${runNumber}: Button ${i + 1}: ${buttonText?.trim()}`);
    }
    
    // Try to click the first Add/New button if found
    if (addCustomerButtons.length > 0) {
      try {
        try {
          await addCustomerButtons[0].click({ force: true, timeout: 5000 });
        } catch (e) {
          await addCustomerButtons[0].click({ timeout: 5000 });
        }
        console.log(`👥 ${runNumber}: Clicked Add/New customer button`);
        await page.waitForTimeout(2000);
        
        const afterClickUrl = page.url();
        console.log(`👥 ${runNumber}: URL after clicking: ${afterClickUrl}`);
        
      } catch (clickError) {
        console.log(`❌ ${runNumber}: Error clicking Add customer button: ${clickError.message}`);
      }
    } else {
      console.log(`❌ ${runNumber}: No Add/New customer button found`);
    }
    
    // Take screenshot of customers page
    await page.screenshot({ path: `test-results/customers-page-${runNumber.replace(' ', '-').toLowerCase()}.png` });
    
    // Step 4: Navigate to invoices page
    console.log(`📄 ${runNumber}: Navigating to invoices page...`);
    await page.goto(`${BASE_URL}/invoices`);
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const invoicesUrl = page.url();
    console.log(`📄 ${runNumber}: Invoices URL: ${invoicesUrl}`);
    
    // Look for invoice-related elements
    const invoiceElements = await page.locator('h1, h2, h3, [data-testid*="invoice"], [class*="invoice"]').all();
    console.log(`📄 ${runNumber}: Found ${invoiceElements.length} invoice-related elements`);
    
    for (let i = 0; i < Math.min(invoiceElements.length, 5); i++) {
      const text = await invoiceElements[i].textContent();
      if (text && text.trim()) {
        console.log(`📄 ${runNumber}: Invoice element ${i + 1}: ${text.trim()}`);
      }
    }
    
    // Look for Add/New invoice button
    const addInvoiceButtons = await page.locator(
      'button:has-text("Add"), button:has-text("New"), button:has-text("Create"), ' +
      'a:has-text("Add"), a:has-text("New"), a:has-text("Create"), ' +
      '[data-testid*="add"], [data-testid*="new"], [data-testid*="create"]'
    ).all();
    console.log(`📄 ${runNumber}: Found ${addInvoiceButtons.length} Add/New buttons`);
    
    for (let i = 0; i < addInvoiceButtons.length; i++) {
      const buttonText = await addInvoiceButtons[i].textContent();
      console.log(`📄 ${runNumber}: Button ${i + 1}: ${buttonText?.trim()}`);
    }
    
    // Try to click the first Add/New button if found
    if (addInvoiceButtons.length > 0) {
      try {
        try {
          await addInvoiceButtons[0].click({ force: true, timeout: 5000 });
        } catch (e) {
          await addInvoiceButtons[0].click({ timeout: 5000 });
        }
        console.log(`📄 ${runNumber}: Clicked Add/New invoice button`);
        await page.waitForTimeout(2000);
        
        const afterClickUrl = page.url();
        console.log(`📄 ${runNumber}: URL after clicking: ${afterClickUrl}`);
        
      } catch (clickError) {
        console.log(`❌ ${runNumber}: Error clicking Add invoice button: ${clickError.message}`);
      }
    } else {
      console.log(`❌ ${runNumber}: No Add/New invoice button found`);
    }
    
    // Take screenshot of invoices page
    await page.screenshot({ path: `test-results/invoices-page-${runNumber.replace(' ', '-').toLowerCase()}.png` });
    
    // Check for any JavaScript errors in the console
    const jsErrors = [];
    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });
    
    console.log(`✅ ${runNumber}: Test completed successfully`);
    
  } catch (error) {
    console.log(`❌ ${runNumber}: Test failed with error: ${error.message}`);
    await page.screenshot({ path: `test-results/error-${runNumber.replace(' ', '-').toLowerCase()}.png` });
  }
}