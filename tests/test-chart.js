import puppeteer from "puppeteer";

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testChart() {
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
    console.log("📊 Testing Reports page with chart...\n");
    await page.goto("http://localhost:3333/reports", {
      waitUntil: "networkidle0",
    });
    await delay(5000); // Give charts time to render

    // Check for error
    const hasError = await page.evaluate(() => {
      const errorText = document.body.textContent;
      return errorText.includes("Something went wrong");
    });

    if (hasError) {
      console.log("❌ Error found on Reports page");
    } else {
      console.log("✓ Reports page loaded successfully");

      // Check for chart elements
      const hasCharts = await page.evaluate(() => {
        const chartElements = document.querySelectorAll('[class*="recharts"]');
        const svgElements = document.querySelectorAll("svg");
        return {
          recharts: chartElements.length,
          svgs: svgElements.length,
          hasRevenue: document.body.textContent.includes("Revenue"),
        };
      });

      console.log("Chart elements found:", hasCharts);
    }

    await page.screenshot({
      path: "screenshots/reports-with-chart.png",
      fullPage: false,
    });
    console.log("📸 Screenshot saved: reports-with-chart.png\n");
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    await delay(3000);
    await browser.close();
  }
}

testChart();
