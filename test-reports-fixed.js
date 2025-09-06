import puppeteer from "puppeteer";

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testReports() {
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
    await delay(3000);

    // Check for error
    const hasError = await page.evaluate(() => {
      const errorText = document.body.textContent;
      return errorText.includes("Something went wrong");
    });

    if (hasError) {
      console.log("❌ Error found on Reports page");
    } else {
      console.log("✅ Reports page loaded successfully!");

      // Check page content
      const pageContent = await page.evaluate(() => {
        const heading = document.querySelector("h1");
        const cards = document.querySelectorAll(".p-4.border");
        return {
          heading: heading ? heading.textContent : "No heading",
          cardCount: cards.length,
        };
      });

      console.log(`   - Heading: ${pageContent.heading}`);
      console.log(`   - Cards found: ${pageContent.cardCount}`);
    }

    await page.screenshot({
      path: "screenshots/reports-page-fixed.png",
      fullPage: false,
    });

    // Test main overview page
    console.log("\n🏠 Testing Overview page...\n");
    await page.goto("http://localhost:3333/", { waitUntil: "networkidle0" });
    await delay(2000);

    const overviewHasError = await page.evaluate(() => {
      const errorText = document.body.textContent;
      return errorText.includes("Something went wrong");
    });

    if (overviewHasError) {
      console.log("❌ Error found on Overview page");
    } else {
      console.log("✅ Overview page loaded successfully!");
    }

    await page.screenshot({
      path: "screenshots/overview-page-fixed.png",
      fullPage: false,
    });
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    await delay(3000);
    await browser.close();
  }
}

testReports();
