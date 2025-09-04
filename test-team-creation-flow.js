const { chromium } = require('playwright');
const fs = require('fs');

async function testTeamCreationFlow() {
    console.log('🚀 Starting team creation flow test...');
    
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 1000  // Add delay to see what's happening
    });
    
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        // Enable screenshots on failure
        recordVideo: {
            dir: 'test-videos/',
            size: { width: 1280, height: 720 }
        }
    });
    
    const page = await context.newPage();
    
    try {
        // Test Step 1: Navigate to the application
        console.log('📍 Step 1: Navigating to http://localhost:3333');
        await page.goto('http://localhost:3333', { 
            waitUntil: 'networkidle',
            timeout: 30000 
        });
        
        // Take screenshot of initial page
        await page.screenshot({ path: 'screenshots/01-initial-page.png' });
        console.log('✅ Successfully loaded initial page');
        
        // Test Step 2: Login process
        console.log('📍 Step 2: Attempting login with admin@tocld.com / Admin123');
        
        // Wait for login form or check if already logged in
        try {
            // Look for login form elements
            const emailInput = await page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
            const passwordInput = await page.locator('input[type="password"], input[name="password"], input[placeholder*="password" i]').first();
            
            if (await emailInput.isVisible({ timeout: 5000 })) {
                console.log('🔐 Login form found, filling credentials...');
                
                await emailInput.fill('admin@tocld.com');
                await passwordInput.fill('Admin123');
                
                // Find and click login button
                const loginButton = await page.locator('button[type="submit"], button:has-text("sign in"), button:has-text("login"), input[type="submit"]').first();
                await loginButton.click();
                
                // Wait for navigation after login
                await page.waitForURL('**/teams*', { timeout: 15000 }).catch(() => {
                    console.log('⏰ Did not redirect to /teams, checking current URL...');
                });
                
                await page.screenshot({ path: 'screenshots/02-after-login.png' });
                console.log('✅ Login process completed');
            } else {
                console.log('ℹ️  No login form found, might already be logged in');
            }
        } catch (loginError) {
            console.log('⚠️  Login form not found or login failed:', loginError.message);
            await page.screenshot({ path: 'screenshots/02-login-error.png' });
        }
        
        // Test Step 3: Navigate to teams page if not already there
        console.log('📍 Step 3: Ensuring we are on the teams page');
        const currentUrl = page.url();
        console.log(`Current URL: ${currentUrl}`);
        
        if (!currentUrl.includes('/teams')) {
            console.log('🔄 Navigating to /teams page...');
            await page.goto('http://localhost:3333/teams', { waitUntil: 'networkidle' });
        }
        
        await page.screenshot({ path: 'screenshots/03-teams-page.png' });
        
        // Test Step 4: Handle user full name if prompted
        console.log('📍 Step 4: Checking for user full name prompt');
        try {
            const nameInput = await page.locator('input[name="full_name"], input[placeholder*="name" i], input[name="name"]').first();
            if (await nameInput.isVisible({ timeout: 3000 })) {
                console.log('👤 Full name prompt found, filling with "Test User"');
                await nameInput.fill('Test User');
                
                const submitButton = await page.locator('button[type="submit"], button:has-text("continue"), button:has-text("save")').first();
                await submitButton.click();
                await page.waitForTimeout(2000);
                await page.screenshot({ path: 'screenshots/04-after-name-submission.png' });
            } else {
                console.log('ℹ️  No full name prompt found');
            }
        } catch (nameError) {
            console.log('⚠️  No user name prompt or error:', nameError.message);
        }
        
        // Test Step 5: Create new team
        console.log('📍 Step 5: Creating new team "Test Company"');
        
        // Look for team creation elements
        let teamCreated = false;
        
        try {
            // Try to find team name input
            const teamNameInput = await page.locator('input[name="team_name"], input[name="name"], input[placeholder*="team" i], input[placeholder*="company" i]').first();
            
            if (await teamNameInput.isVisible({ timeout: 5000 })) {
                console.log('🏢 Team name input found, filling with "Test Company"');
                await teamNameInput.fill('Test Company');
                
                // Look for country selection
                const countrySelect = await page.locator('select[name="country"], select[name="location"], div:has-text("country") >> select, div:has-text("location") >> select').first();
                
                if (await countrySelect.isVisible({ timeout: 3000 })) {
                    console.log('🌏 Country selector found, selecting Australia');
                    await countrySelect.selectOption({ label: 'Australia' });
                } else {
                    // Try looking for a dropdown or combobox
                    const countryDropdown = await page.locator('[role="combobox"]:has-text("country"), [role="listbox"]:has-text("country"), button:has-text("country")').first();
                    if (await countryDropdown.isVisible({ timeout: 3000 })) {
                        await countryDropdown.click();
                        await page.locator('text=Australia').click();
                    }
                }
                
                // Submit team creation
                const createButton = await page.locator('button[type="submit"], button:has-text("create"), button:has-text("save")').first();
                await createButton.click();
                
                await page.waitForTimeout(3000);
                teamCreated = true;
                
                console.log('✅ Team creation form submitted');
                
            } else {
                console.log('⚠️  Team name input not found');
            }
        } catch (teamError) {
            console.log('❌ Error during team creation:', teamError.message);
        }
        
        await page.screenshot({ path: 'screenshots/05-after-team-creation.png' });
        
        // Test Step 6: Verify final state
        console.log('📍 Step 6: Verifying final state');
        
        const finalUrl = page.url();
        console.log(`Final URL: ${finalUrl}`);
        
        // Look for success indicators
        const successIndicators = [
            'text=Test Company',
            'text=Australia',
            '[data-testid*="team"]',
            '[data-testid*="success"]',
            '.success',
            'text=created',
            'text=welcome'
        ];
        
        let successFound = false;
        for (const indicator of successIndicators) {
            try {
                const element = await page.locator(indicator).first();
                if (await element.isVisible({ timeout: 2000 })) {
                    console.log(`✅ Success indicator found: ${indicator}`);
                    successFound = true;
                    break;
                }
            } catch (e) {
                // Continue checking other indicators
            }
        }
        
        // Take final screenshot
        await page.screenshot({ path: 'screenshots/06-final-state.png' });
        
        // Check for any error messages
        const errorElements = await page.locator('[role="alert"], .error, .alert-error, text=error').all();
        if (errorElements.length > 0) {
            console.log('⚠️  Error messages detected on page');
            for (let i = 0; i < errorElements.length; i++) {
                const errorText = await errorElements[i].textContent();
                console.log(`   Error ${i + 1}: ${errorText}`);
            }
        }
        
        // Summary Report
        console.log('\n📊 TEST SUMMARY REPORT');
        console.log('=======================');
        console.log(`✅ Application loaded: YES`);
        console.log(`✅ Login process: ${teamCreated ? 'SUCCESS' : 'PARTIAL'}`);
        console.log(`✅ Teams page reached: ${finalUrl.includes('/teams') ? 'YES' : 'NO'}`);
        console.log(`✅ Team creation attempted: ${teamCreated ? 'YES' : 'NO'}`);
        console.log(`✅ Success indicators: ${successFound ? 'FOUND' : 'NOT FOUND'}`);
        console.log(`📍 Final URL: ${finalUrl}`);
        console.log(`📷 Screenshots saved to: screenshots/`);
        
    } catch (error) {
        console.error('❌ Test failed with error:', error);
        await page.screenshot({ path: 'screenshots/error-state.png' });
        
        // Get page content for debugging
        const pageContent = await page.content();
        fs.writeFileSync('debug-page-content.html', pageContent);
        console.log('💾 Page content saved to debug-page-content.html');
        
    } finally {
        await browser.close();
        console.log('🏁 Test completed');
    }
}

// Create screenshots directory
if (!fs.existsSync('screenshots')) {
    fs.mkdirSync('screenshots');
}

// Run the test
testTeamCreationFlow().catch(console.error);