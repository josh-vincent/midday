const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

async function completeFlow() {
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: false,
      slowMo: 100,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    const screenshotsDir = path.join(__dirname, "screenshots");
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir);
    }

    // Enable request interception to monitor network activity
    await page.setRequestInterception(true);
    const failedRequests = [];

    page.on("request", (request) => {
      request.continue();
    });

    page.on("response", (response) => {
      if (response.status() >= 400) {
        failedRequests.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
        });
      }
    });

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        console.log("❌ Console Error:", msg.text());
      }
    });

    console.log("🚀 Starting complete flow test");

    // Step 1: Navigate and login
    console.log("📍 Step 1: Navigating to login page");
    await page.goto("http://localhost:3333", { waitUntil: "networkidle2" });
    await page.screenshot({
      path: path.join(screenshotsDir, "flow-01-initial.png"),
    });

    // Fill login form
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.type('input[type="email"]', "admin@tocld.com");
    await page.type('input[type="password"]', "Admin123");

    await page.screenshot({
      path: path.join(screenshotsDir, "flow-02-login-filled.png"),
    });

    // Click login button
    await page.click('button[type="submit"]');
    console.log("🔑 Clicked login button");

    // Wait for navigation
    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 10000 });
    await page.screenshot({
      path: path.join(screenshotsDir, "flow-03-after-login.png"),
    });

    console.log("Current URL after login:", page.url());

    // Step 2: Complete team setup
    console.log("🏢 Step 2: Setting up team");

    // Check if we're on team setup page
    const isTeamSetup =
      (await page.$('input[placeholder*="Acme Marketing" i]')) !== null;

    if (isTeamSetup) {
      console.log("✅ On team setup page, filling form");

      // Clear and fill company name
      const companyInput = await page.$(
        'input[placeholder*="Acme Marketing" i]',
      );
      await companyInput.click({ clickCount: 3 }); // Select all text
      await companyInput.type("Test Company");

      await page.screenshot({
        path: path.join(screenshotsDir, "flow-04-team-filled.png"),
      });

      // Click create button
      const createButton = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll("button"));
        return buttons.find((button) => button.textContent.includes("Create"));
      });

      if (createButton.asElement()) {
        await createButton.asElement().click();
        console.log("✅ Clicked Create button");
      } else {
        console.log("⚠️ Create button not found");
      }

      // Wait for team creation to complete
      await new Promise((resolve) => setTimeout(resolve, 3000));

      try {
        await page.waitForNavigation({
          waitUntil: "networkidle2",
          timeout: 10000,
        });
        console.log("✅ Team creation completed, navigated to new page");
      } catch (e) {
        console.log("⚠️ No navigation detected, checking current state");
      }

      await page.screenshot({
        path: path.join(screenshotsDir, "flow-05-after-team-creation.png"),
      });
      console.log("Current URL after team creation:", page.url());
    } else {
      console.log("⚠️ Not on team setup page, checking current page content");

      const pageContent = await page.evaluate(() => {
        return {
          title: document.title,
          headings: Array.from(document.querySelectorAll("h1, h2, h3")).map(
            (h) => h.textContent.trim(),
          ),
          buttons: Array.from(document.querySelectorAll("button"))
            .map((b) => b.textContent.trim())
            .filter((t) => t.length > 0),
          links: Array.from(document.querySelectorAll("a"))
            .map((a) => ({ text: a.textContent.trim(), href: a.href }))
            .filter((l) => l.text.length > 0),
        };
      });

      console.log("Page content:", JSON.stringify(pageContent, null, 2));
    }

    // Step 3: Look for dashboard/main application
    console.log("🎯 Step 3: Looking for main application features");

    // Wait a bit for any redirects
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Check for navigation menu or main app interface
    const navElements = await page.$$eval(
      'nav a, [role="navigation"] a, [data-testid*="nav"] a',
      (elements) =>
        elements
          .map((el) => ({
            text: el.textContent.trim(),
            href: el.href,
          }))
          .filter((item) => item.text.length > 0),
    );

    console.log("Navigation elements found:", navElements);

    // Look for invoices specifically
    const invoiceNavigation = navElements.find(
      (nav) =>
        nav.text.toLowerCase().includes("invoice") ||
        nav.href.toLowerCase().includes("invoice"),
    );

    if (invoiceNavigation) {
      console.log("✅ Found invoice navigation, navigating...");
      await page.goto(invoiceNavigation.href);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await page.screenshot({
        path: path.join(screenshotsDir, "flow-06-invoices.png"),
      });
      console.log("Current URL on invoices page:", page.url());
    } else {
      console.log("⚠️ No invoice navigation found");

      // Try to find any main navigation
      if (navElements.length > 0) {
        console.log("Trying first navigation item:", navElements[0].text);
        await page.goto(navElements[0].href);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await page.screenshot({
          path: path.join(screenshotsDir, "flow-06-main-nav.png"),
        });
      }
    }

    // Final screenshot
    await page.screenshot({
      path: path.join(screenshotsDir, "flow-07-final.png"),
    });

    // Report any failed network requests
    if (failedRequests.length > 0) {
      console.log("❌ Failed network requests:");
      failedRequests.forEach((req) => {
        console.log(`  ${req.status} ${req.statusText}: ${req.url}`);
      });
    } else {
      console.log("✅ No failed network requests detected");
    }

    console.log("✅ Flow test completed successfully!");
    console.log(`📷 Screenshots saved to: ${screenshotsDir}`);
    console.log("Final URL:", page.url());

    // Get final page state
    const finalState = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        hasNavigation: !!document.querySelector('nav, [role="navigation"]'),
        mainHeadings: Array.from(document.querySelectorAll("h1, h2")).map((h) =>
          h.textContent.trim(),
        ),
        actionButtons: Array.from(document.querySelectorAll("button"))
          .map((b) => b.textContent.trim())
          .filter((t) => t.length > 0 && t.length < 50),
      };
    });

    console.log("Final page state:", JSON.stringify(finalState, null, 2));
  } catch (error) {
    console.error("❌ Flow test failed:", error);

    if (browser) {
      const page = (await browser.pages())[0];
      if (page) {
        await page.screenshot({
          path: path.join(__dirname, "screenshots", "flow-error.png"),
        });
        console.log("Error screenshot saved");
      }
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

completeFlow();
