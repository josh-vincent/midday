import puppeteer from "puppeteer";

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testAuthNavigation() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1600, height: 1000 },
    args: ["--window-size=1600,1000"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1600, height: 1000 });

    console.log("🔐 Logging in with credentials...\n");

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

    // Check current URL
    const currentUrl = page.url();
    console.log(`After login, redirected to: ${currentUrl}`);

    // Take screenshot of where we ended up
    await page.screenshot({
      path: "screenshots/after-login-page.png",
      fullPage: false,
    });

    // Try to navigate to reports page
    console.log("\n📊 Navigating to Reports page...\n");
    await page.goto("http://localhost:3333/reports", {
      waitUntil: "networkidle0",
    });
    await delay(3000);

    // Check if we're still on reports or redirected
    const reportsUrl = page.url();
    console.log(`Reports page URL: ${reportsUrl}`);

    // Check for error messages
    const hasError = await page.evaluate(() => {
      const errorText = document.body.textContent;
      return (
        errorText.includes("Something went wrong") ||
        errorText.includes("error")
      );
    });

    if (hasError) {
      console.log("❌ Error found on page");

      // Get console errors
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          console.log("Console error:", msg.text());
        }
      });

      // Check for specific error elements
      const errorDetails = await page.evaluate(() => {
        const errorElements = document.querySelectorAll(
          '[class*="error"], [class*="Error"]',
        );
        return Array.from(errorElements).map((el) => el.textContent);
      });

      if (errorDetails.length > 0) {
        console.log("Error details found:", errorDetails);
      }
    } else {
      console.log("✓ No errors visible on page");
    }

    // Take screenshot
    await page.screenshot({
      path: "screenshots/reports-page-state.png",
      fullPage: false,
    });
    console.log("Screenshot saved: reports-page-state.png");

    // Try jobs page
    console.log("\n💼 Navigating to Jobs page...\n");
    await page.goto("http://localhost:3333/jobs", {
      waitUntil: "networkidle0",
    });
    await delay(3000);

    const jobsUrl = page.url();
    console.log(`Jobs page URL: ${jobsUrl}`);

    const jobsHasError = await page.evaluate(() => {
      const errorText = document.body.textContent;
      return (
        errorText.includes("Something went wrong") ||
        errorText.includes("error")
      );
    });

    if (jobsHasError) {
      console.log("❌ Error found on jobs page");
    } else {
      console.log("✓ Jobs page loaded successfully");
    }

    await page.screenshot({
      path: "screenshots/jobs-page-state.png",
      fullPage: false,
    });

    // Try to check what's in localStorage
    const authToken = await page.evaluate(() => {
      const token = localStorage.getItem("sb-ulncfblvuijlgniydjju-auth-token");
      return token ? "Token exists" : "No token";
    });

    console.log(`\nAuth status: ${authToken}`);
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    await delay(5000); // Keep browser open for inspection
    await browser.close();
  }
}

testAuthNavigation();
