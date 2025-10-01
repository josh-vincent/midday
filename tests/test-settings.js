import puppeteer from "puppeteer";

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testSettings() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1600, height: 1000 },
    args: ["--window-size=1600,1000"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1600, height: 1000 });

    console.log("🔐 Logging in...\n");

    // Navigate to login page
    await page.goto("http://localhost:3333/login", {
      waitUntil: "networkidle0",
    });
    await delay(2000);

    // Fill in login form
    await page.type('input[type="email"]', "admin@tocld.com");
    await page.type('input[type="password"]', "Admin123");

    // Click sign in button
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForNavigation({ waitUntil: "networkidle0" });
    await delay(3000);

    // Test Settings Page (which we haven't modified)
    console.log("⚙️ Testing Settings page...\n");
    await page.goto("http://localhost:3333/settings", {
      waitUntil: "networkidle0",
    });
    await delay(3000);

    // Check for error
    const hasError = await page.evaluate(() => {
      const errorText = document.body.textContent;
      return errorText.includes("Something went wrong");
    });

    if (hasError) {
      console.log("❌ Error found on Settings page");
    } else {
      console.log("✓ Settings page loaded successfully");
    }

    await page.screenshot({
      path: "screenshots/settings-page.png",
      fullPage: false,
    });

    // Now test customers page
    console.log("\n👥 Testing Customers page...\n");
    await page.goto("http://localhost:3333/customers", {
      waitUntil: "networkidle0",
    });
    await delay(3000);

    const customersHasError = await page.evaluate(() => {
      const errorText = document.body.textContent;
      return errorText.includes("Something went wrong");
    });

    if (customersHasError) {
      console.log("❌ Error found on Customers page");
    } else {
      console.log("✓ Customers page loaded successfully");
    }

    await page.screenshot({
      path: "screenshots/customers-page.png",
      fullPage: false,
    });
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    await delay(3000);
    await browser.close();
  }
}

testSettings();
