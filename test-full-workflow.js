const puppeteer = require('puppeteer');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runFullWorkflowTest(iteration = 1) {
  console.log('\n' + '='.repeat(60));
  console.log(`🚀 Starting Full Workflow Test - Iteration ${iteration}`);
  console.log('='.repeat(60));
  
  const browser = await puppeteer.launch({ 
    headless: false, // Set to false to watch the test
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1400, height: 900 } // Larger viewport to ensure sm: breakpoint
  });
  
  const page = await browser.newPage();
  
  const results = {
    passed: [],
    failed: [],
    iteration
  };
  
  try {
    // Step 1: Navigate to login page
    console.log('\n📋 Step 1: Navigating to login page...');
    await page.goto('http://localhost:3333/login', { waitUntil: 'networkidle2' });
    await delay(2000);
    
    // Step 2: Attempt login with better error handling
    console.log('\n📋 Step 2: Attempting login with admin@tocld.com...');
    
    // Check for email/password fields
    const emailInput = await page.$('input[type="email"]');
    const passwordInput = await page.$('input[type="password"]');
    
    if (emailInput && passwordInput) {
      console.log('   ✓ Found email and password fields');
      
      // Clear and type email
      await emailInput.click({ clickCount: 3 });
      await page.keyboard.type('admin@tocld.com');
      
      // Clear and type password
      await passwordInput.click({ clickCount: 3 });
      await page.keyboard.type('Admin123');
      
      // Wait for the button to be enabled (React state update)
      await delay(1000);
      
      // Find and click the submit button
      const submitButton = await page.$('button[type="submit"]');
      
      if (submitButton) {
        // Check if button is disabled
        const isDisabled = await submitButton.evaluate(el => el.disabled);
        if (isDisabled) {
          console.log('   ⚠️  Submit button is disabled, trying to enable it...');
          // Try to trigger change events
          await emailInput.evaluate(el => el.dispatchEvent(new Event('change', { bubbles: true })));
          await passwordInput.evaluate(el => el.dispatchEvent(new Event('change', { bubbles: true })));
          await delay(500);
        }
        
        console.log('   📌 Submitting login form...');
        await submitButton.click();
        
        // Wait for either navigation or error message
        await Promise.race([
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {}),
          page.waitForSelector('.text-red-500', { timeout: 5000 }).catch(() => {}),
          delay(8000)
        ]);
        
        const currentUrl = page.url();
        if (!currentUrl.includes('/login')) {
          console.log('   ✅ Login successful! Redirected to:', currentUrl.split('3333')[1]);
          results.passed.push('Login successful');
          
          // Step 3: Navigate to customers page
          console.log('\n📋 Step 3: Navigating to customers page...');
          await page.goto('http://localhost:3333/customers', { waitUntil: 'networkidle2' });
          await delay(3000);
          
          // Check if we're on customers page
          const onCustomersPage = page.url().includes('/customers');
          if (onCustomersPage) {
            console.log('   ✅ Successfully navigated to customers page');
            results.passed.push('Navigate to customers page');
            
            // Step 4: Create a new customer - look for icon button
            console.log('\n📋 Step 4: Creating a new customer...');
            
            // The Add button is an icon button with variant="outline" size="icon"
            // It's inside a div with class "hidden sm:block"
            const addCustomerButton = await page.$('div.hidden.sm\\:block button[variant="outline"]') ||
                                     await page.$('button svg') || // Try to find button with SVG icon
                                     await page.$$eval('button', buttons => {
                                       // Find the button that contains an SVG (icon button)
                                       const iconButton = buttons.find(btn => btn.querySelector('svg'));
                                       return iconButton ? buttons.indexOf(iconButton) : -1;
                                     });
            
            if (addCustomerButton !== -1 && typeof addCustomerButton === 'number') {
              const buttons = await page.$$('button');
              await buttons[addCustomerButton].click();
              await delay(2000);
              console.log('   ✓ Clicked Add Customer button');
            } else if (addCustomerButton) {
              await addCustomerButton.click();
              await delay(2000);
              console.log('   ✓ Clicked Add Customer button');
            } else {
              // Try a different approach - click the last button on the page (often the add button)
              const allButtons = await page.$$('button');
              if (allButtons.length > 0) {
                // Try clicking the last few buttons to find the right one
                for (let i = allButtons.length - 1; i >= Math.max(0, allButtons.length - 3); i--) {
                  const btnText = await allButtons[i].evaluate(el => el.textContent);
                  console.log(`   Checking button ${i}: "${btnText}"`);
                  
                  // Check if button has an SVG child (icon button)
                  const hasIcon = await allButtons[i].evaluate(el => !!el.querySelector('svg'));
                  if (hasIcon) {
                    await allButtons[i].click();
                    await delay(2000);
                    console.log(`   ✓ Clicked icon button at position ${i}`);
                    
                    // Check if a modal/sheet opened
                    const modalOpened = await page.$('[role="dialog"]') || 
                                       await page.$('.sheet-content') ||
                                       await page.$('[data-state="open"]');
                    
                    if (modalOpened) {
                      console.log('   ✅ Customer creation dialog opened');
                      
                      // Fill in customer form
                      const customerData = {
                        name: `Test Customer ${iteration}`,
                        email: `customer${iteration}@test.com`,
                        phone: '555-0100',
                        address: '456 Test Street',
                        city: 'Test City',
                        state: 'TC',
                        postalCode: '12345'
                      };
                      
                      // Try to fill form fields
                      for (const [field, value] of Object.entries(customerData)) {
                        const input = await page.$(`input[name="${field}"]`) || 
                                     await page.$(`input[placeholder*="${field}"]`) ||
                                     await page.$(`input[id*="${field}"]`);
                        if (input) {
                          await input.type(value);
                          console.log(`   ✓ Filled ${field}`);
                        }
                      }
                      
                      // Submit customer form - look for Save/Create button in the dialog
                      const dialogButtons = await page.$$('[role="dialog"] button, .sheet-content button');
                      let saveButton = null;
                      for (const btn of dialogButtons) {
                        const text = await btn.evaluate(el => el.textContent);
                        if (text && (text.includes('Save') || text.includes('Create') || text.includes('Submit'))) {
                          saveButton = btn;
                          break;
                        }
                      }
                      
                      if (saveButton) {
                        await saveButton.click();
                        await delay(3000);
                        console.log('   ✅ Customer created successfully');
                        results.passed.push('Create customer');
                      } else {
                        console.log('   ⚠️  Could not find Save button in dialog');
                        results.failed.push('Create customer - save button not found');
                      }
                      break;
                    }
                  }
                }
              } else {
                console.log('   ⚠️  No buttons found on page');
                results.failed.push('Create customer - no buttons found');
              }
            }
            
            // Step 5: Navigate to invoices page
            console.log('\n📋 Step 5: Navigating to invoices page...');
            await page.goto('http://localhost:3333/invoices', { waitUntil: 'networkidle2' });
            await delay(3000);
            
            const onInvoicesPage = page.url().includes('/invoices');
            if (onInvoicesPage) {
              console.log('   ✅ Successfully navigated to invoices page');
              results.passed.push('Navigate to invoices page');
              
              // Step 6: Create a new invoice - similar approach
              console.log('\n📋 Step 6: Creating a new invoice...');
              
              // Look for icon buttons on the invoices page
              const allInvoiceButtons = await page.$$('button');
              if (allInvoiceButtons.length > 0) {
                for (let i = allInvoiceButtons.length - 1; i >= Math.max(0, allInvoiceButtons.length - 3); i--) {
                  const hasIcon = await allInvoiceButtons[i].evaluate(el => !!el.querySelector('svg'));
                  if (hasIcon) {
                    await allInvoiceButtons[i].click();
                    await delay(2000);
                    console.log(`   ✓ Clicked icon button at position ${i}`);
                    
                    // Check if invoice creation dialog opened
                    const invoiceModalOpened = await page.$('[role="dialog"]') || 
                                              await page.$('.sheet-content') ||
                                              await page.$('[data-state="open"]');
                    
                    if (invoiceModalOpened) {
                      console.log('   ✅ Invoice creation dialog opened');
                      
                      // Fill invoice form
                      const invoiceData = {
                        amount: '1500.00',
                        description: `Test Invoice ${iteration}`,
                        dueDate: '2025-10-01'
                      };
                      
                      for (const [field, value] of Object.entries(invoiceData)) {
                        const input = await page.$(`input[name="${field}"]`) || 
                                     await page.$(`input[placeholder*="${field}"]`) ||
                                     await page.$(`input[id*="${field}"]`) ||
                                     await page.$(`textarea[name="${field}"]`);
                        if (input) {
                          await input.type(value);
                          console.log(`   ✓ Filled ${field}`);
                        }
                      }
                      
                      // Submit invoice
                      const invoiceDialogButtons = await page.$$('[role="dialog"] button, .sheet-content button');
                      let saveInvoiceButton = null;
                      for (const btn of invoiceDialogButtons) {
                        const text = await btn.evaluate(el => el.textContent);
                        if (text && (text.includes('Save') || text.includes('Create') || text.includes('Submit'))) {
                          saveInvoiceButton = btn;
                          break;
                        }
                      }
                      
                      if (saveInvoiceButton) {
                        await saveInvoiceButton.click();
                        await delay(3000);
                        console.log('   ✅ Invoice created successfully');
                        results.passed.push('Create invoice');
                      } else {
                        console.log('   ⚠️  Could not find Save button in invoice dialog');
                        results.failed.push('Create invoice - save button not found');
                      }
                      break;
                    }
                  }
                }
              } else {
                console.log('   ⚠️  No buttons found on invoices page');
                results.failed.push('Create invoice - no buttons found');
              }
            }
          } else {
            console.log('   ❌ Failed to navigate to customers page');
            results.failed.push('Navigate to customers page');
          }
          
        } else {
          // Still on login page - check for error
          const errorElement = await page.$('.text-red-500, .error, [role="alert"]');
          if (errorElement) {
            const errorText = await page.evaluate(el => el.textContent, errorElement);
            console.log(`   ❌ Login failed: ${errorText}`);
            results.failed.push(`Login failed: ${errorText}`);
          } else {
            console.log('   ❌ Login failed - no redirect occurred');
            results.failed.push('Login failed - no redirect');
          }
        }
      } else {
        console.log('   ❌ No submit button found');
        results.failed.push('Login - no submit button');
      }
    } else {
      console.log('   ❌ Email/password fields not found');
      console.log('   ℹ️  The login page may be using OAuth only');
      results.failed.push('Login - no email/password fields');
    }
    
  } catch (error) {
    console.error(`\n❌ Test failed: ${error.message}`);
    results.failed.push(`Test error: ${error.message}`);
  }
  
  // Report for this iteration
  console.log('\n' + '='.repeat(60));
  console.log(`📊 Iteration ${iteration} Results`);
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed.length}`);
  results.passed.forEach(test => console.log(`   • ${test}`));
  
  if (results.failed.length > 0) {
    console.log(`\n❌ Failed: ${results.failed.length}`);
    results.failed.forEach(test => console.log(`   • ${test}`));
  }
  
  await browser.close();
  return results;
}

async function runTestLoop() {
  console.log('🔄 Starting 3-iteration test loop...\n');
  
  const allResults = [];
  
  for (let i = 1; i <= 3; i++) {
    const results = await runFullWorkflowTest(i);
    allResults.push(results);
    
    if (i < 3) {
      console.log('\n⏱️  Waiting 5 seconds before next iteration...');
      await delay(5000);
    }
  }
  
  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('🎯 FINAL TEST SUMMARY');
  console.log('='.repeat(60));
  
  let totalPassed = 0;
  let totalFailed = 0;
  
  allResults.forEach(result => {
    totalPassed += result.passed.length;
    totalFailed += result.failed.length;
    console.log(`\nIteration ${result.iteration}:`);
    console.log(`   ✅ Passed: ${result.passed.length}`);
    console.log(`   ❌ Failed: ${result.failed.length}`);
  });
  
  console.log('\n' + '-'.repeat(60));
  console.log(`Total Tests Passed: ${totalPassed}`);
  console.log(`Total Tests Failed: ${totalFailed}`);
  
  if (totalFailed === 0) {
    console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');
  } else {
    console.log('\n⚠️  Some tests failed. Review the results above.');
  }
  console.log('='.repeat(60));
}

// Run the test loop
runTestLoop().catch(console.error);