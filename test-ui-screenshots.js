import puppeteer from "puppeteer";

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testUIWithScreenshots() {
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

    // Test Reports Page
    console.log("📊 Testing Reports page...\n");
    await page.goto("http://localhost:3333/reports", {
      waitUntil: "networkidle0",
    });
    await delay(5000); // Give charts time to render

    // Check for error
    const reportsHasError = await page.evaluate(() => {
      const errorText = document.body.textContent;
      return errorText.includes("Something went wrong");
    });

    if (reportsHasError) {
      console.log("❌ Error found on Reports page");
    } else {
      console.log("✓ Reports page loaded successfully");

      // Check for chart elements
      const hasCharts = await page.evaluate(() => {
        const chartElements = document.querySelectorAll('[class*="recharts"]');
        return chartElements.length > 0;
      });

      if (hasCharts) {
        console.log("✓ Charts are rendering");
      }
    }

    await page.screenshot({
      path: "screenshots/reports-page-final.png",
      fullPage: false,
    });
    console.log("📸 Screenshot saved: reports-page-final.png\n");

    // Test Jobs Page
    console.log("💼 Testing Jobs page...\n");
    await page.goto("http://localhost:3333/jobs", {
      waitUntil: "networkidle0",
    });
    await delay(5000);

    const jobsHasError = await page.evaluate(() => {
      const errorText = document.body.textContent;
      return errorText.includes("Something went wrong");
    });

    if (jobsHasError) {
      console.log("❌ Error found on Jobs page");
    } else {
      console.log("✓ Jobs page loaded successfully");

      // Check for table or list elements
      const hasJobsList = await page.evaluate(() => {
        const tableElements = document.querySelectorAll(
          'table, [role="table"]',
        );
        const listElements = document.querySelectorAll(
          '[class*="list"], [class*="grid"]',
        );
        return tableElements.length > 0 || listElements.length > 0;
      });

      if (hasJobsList) {
        console.log("✓ Jobs list/table is rendering");
      }
    }

    await page.screenshot({
      path: "screenshots/jobs-page-final.png",
      fullPage: false,
    });
    console.log("📸 Screenshot saved: jobs-page-final.png\n");

    // Test Invoices Page
    console.log("📄 Testing Invoices page...\n");
    await page.goto("http://localhost:3333/invoices", {
      waitUntil: "networkidle0",
    });
    await delay(5000);

    const invoicesHasError = await page.evaluate(() => {
      const errorText = document.body.textContent;
      return errorText.includes("Something went wrong");
    });

    if (invoicesHasError) {
      console.log("❌ Error found on Invoices page");
    } else {
      console.log("✓ Invoices page loaded successfully");
    }

    await page.screenshot({
      path: "screenshots/invoices-page-final.png",
      fullPage: false,
    });
    console.log("📸 Screenshot saved: invoices-page-final.png\n");

    console.log(
      "✅ UI testing complete! All screenshots saved in screenshots/ directory",
    );
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    await delay(3000); // Keep browser open briefly for inspection
    await browser.close();
  }
}

testUIWithScreenshots();
