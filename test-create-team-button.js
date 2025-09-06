const { chromium } = require("playwright");

async function testCreateTeamButton() {
  console.log("🚀 Testing Create Team button flow...");

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });

  const page = await context.newPage();

  try {
    // Navigate and login
    console.log("📍 Navigating to teams page...");
    await page.goto("http://localhost:3333/teams", {
      waitUntil: "networkidle",
    });

    // Check if we need to login
    const emailInput = await page.locator('input[type="email"]').first();
    if (await emailInput.isVisible({ timeout: 3000 })) {
      console.log("🔐 Logging in...");
      await emailInput.fill("admin@tocld.com");
      await page.locator('input[type="password"]').fill("Admin123");
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(3000);
    }

    // Now click "Create team" button
    console.log("🏢 Clicking Create team button...");
    const createTeamButton = await page
      .locator('button:has-text("Create team"), a:has-text("Create team")')
      .first();
    await createTeamButton.click();

    await page.waitForTimeout(2000);
    await page.screenshot({ path: "screenshots/create-team-form.png" });

    // Look for team creation form
    const teamNameInput = await page
      .locator(
        'input[name="name"], input[placeholder*="team"], input[placeholder*="company"]',
      )
      .first();

    if (await teamNameInput.isVisible({ timeout: 5000 })) {
      console.log("✅ Team creation form appeared");

      // Fill the form
      await teamNameInput.fill("Test Company");

      // Look for country selector
      try {
        const countrySelect = await page
          .locator('select[name="country"], [role="combobox"]')
          .first();
        if (await countrySelect.isVisible({ timeout: 3000 })) {
          await countrySelect.click();
          await page.locator("text=Australia").click();
          console.log("🌏 Selected Australia");
        }
      } catch (e) {
        console.log("⚠️  Country selection not found or failed");
      }

      await page.screenshot({ path: "screenshots/team-form-filled.png" });

      // Submit the form
      const submitButton = await page
        .locator(
          'button[type="submit"], button:has-text("Create"), button:has-text("Save")',
        )
        .first();
      await submitButton.click();

      await page.waitForTimeout(3000);
      await page.screenshot({ path: "screenshots/after-team-submit.png" });

      console.log(`✅ Final URL: ${page.url()}`);
    } else {
      console.log("❌ Team creation form not found");
      const currentUrl = page.url();
      console.log(`Current URL: ${currentUrl}`);
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    await page.screenshot({ path: "screenshots/create-team-error.png" });
  } finally {
    await browser.close();
  }
}

testCreateTeamButton().catch(console.error);
