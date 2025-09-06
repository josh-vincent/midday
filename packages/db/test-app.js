const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

async function testApplication() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 720 },
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  const testResults = {
    screenshots: [],
    errors: [],
    redirects: [],
    consoleErrors: [],
    networkErrors: [],
  };

  // Create screenshots directory
  const screenshotDir = path.join(__dirname, "screenshots");
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir);
  }

  // Monitor console errors
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      testResults.consoleErrors.push({
        type: "console",
        message: msg.text(),
        location: msg.location(),
      });
    }
  });

  // Monitor network failures
  page.on("requestfailed", (request) => {
    testResults.networkErrors.push({
      url: request.url(),
      method: request.method(),
      failure: request.failure().errorText,
    });
  });

  // Monitor responses for status codes
  page.on("response", (response) => {
    if (response.status() >= 400) {
      testResults.errors.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
      });
    }
  });

  async function takeScreenshot(pageName, url) {
    const screenshotPath = path.join(screenshotDir, `${pageName}.png`);
    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
    });
    testResults.screenshots.push({
      page: pageName,
      url: url,
      path: screenshotPath,
      timestamp: new Date().toISOString(),
    });
    console.log(`📸 Screenshot saved: ${pageName}`);
  }

  try {
    console.log("🚀 Starting application tests...");

    // Test 1: Navigate to login page directly
    console.log("\n1. Testing direct login page navigation...");
    const loginResponse = await page.goto("http://localhost:3001/login", {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    console.log(`Login page status: ${loginResponse.status()}`);
    await takeScreenshot("login-page", "http://localhost:3001/login");

    // Test 2: Test homepage redirection
    console.log("\n2. Testing homepage redirection when not authenticated...");
    const homeResponse = await page.goto("http://localhost:3001/", {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    const currentUrl = page.url();
    console.log(`Homepage response status: ${homeResponse.status()}`);
    console.log(`Current URL after homepage navigation: ${currentUrl}`);

    if (currentUrl.includes("/login")) {
      testResults.redirects.push({
        from: "http://localhost:3001/",
        to: currentUrl,
        status: "success",
        message: "Homepage correctly redirects to login when not authenticated",
      });
    } else {
      testResults.redirects.push({
        from: "http://localhost:3001/",
        to: currentUrl,
        status: "warning",
        message: "Homepage may not be redirecting to login as expected",
      });
    }

    await takeScreenshot("homepage-redirect", currentUrl);

    // Test 3: Verify login page form elements
    console.log("\n3. Verifying login page form elements...");
    await page.goto("http://localhost:3001/login", {
      waitUntil: "networkidle0",
    });

    // Check for common login form elements
    const formElements = await page.evaluate(() => {
      const elements = {
        emailInput: !!document.querySelector(
          'input[type="email"], input[name="email"]',
        ),
        passwordInput: !!document.querySelector(
          'input[type="password"], input[name="password"]',
        ),
        submitButton: !!document.querySelector(
          'button[type="submit"], input[type="submit"]',
        ),
        form: !!document.querySelector("form"),
        loginText:
          document.body.textContent.toLowerCase().includes("login") ||
          document.body.textContent.toLowerCase().includes("sign in"),
        anyInput: document.querySelectorAll("input").length > 0,
        anyButton: document.querySelectorAll("button").length > 0,
      };

      // Additional check for buttons with login-related text
      const buttons = Array.from(document.querySelectorAll("button"));
      const loginButtons = buttons.filter(
        (btn) =>
          btn.textContent.toLowerCase().includes("login") ||
          btn.textContent.toLowerCase().includes("sign in"),
      );
      elements.loginButton = loginButtons.length > 0;

      return elements;
    });

    console.log("Form elements found:", formElements);
    testResults.formElements = formElements;

    // Test 4: Test protected routes
    console.log("\n4. Testing protected routes...");
    const protectedRoutes = ["/invoices", "/customers", "/settings"];

    for (const route of protectedRoutes) {
      console.log(`Testing route: ${route}`);
      try {
        const response = await page.goto(`http://localhost:3001${route}`, {
          waitUntil: "networkidle0",
          timeout: 30000,
        });

        const finalUrl = page.url();
        console.log(
          `Route ${route} - Status: ${response.status()}, Final URL: ${finalUrl}`,
        );

        const redirectInfo = {
          route: route,
          originalUrl: `http://localhost:3001${route}`,
          finalUrl: finalUrl,
          status: response.status(),
          redirectsToLogin: finalUrl.includes("/login"),
        };

        testResults.redirects.push(redirectInfo);
        await takeScreenshot(`route-${route.replace("/", "")}`, finalUrl);

        // Small delay between route tests
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error testing route ${route}:`, error.message);
        testResults.errors.push({
          route: route,
          error: error.message,
          type: "navigation_error",
        });
      }
    }

    // Test 5: Final comprehensive check
    console.log("\n5. Performing final checks...");
    await page.goto("http://localhost:3001/login", {
      waitUntil: "networkidle0",
    });

    // Check page title and basic content
    const pageTitle = await page.title();
    const pageContent = await page.evaluate(() => document.body.textContent);

    console.log(`Page title: ${pageTitle}`);
    console.log(`Page has content: ${pageContent.length > 100}`);
  } catch (error) {
    console.error("❌ Test execution error:", error);
    testResults.errors.push({
      type: "execution_error",
      message: error.message,
      stack: error.stack,
    });
  }

  await browser.close();

  // Generate test report
  console.log("\n" + "=".repeat(60));
  console.log("📋 TEST RESULTS SUMMARY");
  console.log("=".repeat(60));

  console.log("\n📸 Screenshots taken:");
  testResults.screenshots.forEach((screenshot) => {
    console.log(`  - ${screenshot.page}: ${screenshot.path}`);
  });

  console.log("\n🔀 Redirect Tests:");
  testResults.redirects.forEach((redirect) => {
    if (redirect.from && redirect.to) {
      console.log(`  - ${redirect.from} → ${redirect.to} (${redirect.status})`);
      console.log(`    ${redirect.message}`);
    } else {
      console.log(`  - Route: ${redirect.route}`);
      console.log(
        `    Status: ${redirect.status}, Redirects to login: ${redirect.redirectsToLogin}`,
      );
    }
  });

  console.log("\n📝 Form Elements Check:");
  if (testResults.formElements) {
    Object.entries(testResults.formElements).forEach(([element, found]) => {
      console.log(`  - ${element}: ${found ? "✅ Found" : "❌ Not found"}`);
    });
  }

  if (testResults.errors.length > 0) {
    console.log("\n❌ Errors encountered:");
    testResults.errors.forEach((error, index) => {
      console.log(
        `  ${index + 1}. ${error.url || error.route || "General"}: ${error.status || "N/A"} - ${error.message || error.statusText || error.error}`,
      );
    });
  }

  if (testResults.consoleErrors.length > 0) {
    console.log("\n🔴 Console Errors:");
    testResults.consoleErrors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error.message}`);
    });
  }

  if (testResults.networkErrors.length > 0) {
    console.log("\n🌐 Network Errors:");
    testResults.networkErrors.forEach((error, index) => {
      console.log(
        `  ${index + 1}. ${error.method} ${error.url}: ${error.failure}`,
      );
    });
  }

  if (
    testResults.errors.length === 0 &&
    testResults.consoleErrors.length === 0 &&
    testResults.networkErrors.length === 0
  ) {
    console.log("\n✅ No critical errors detected!");
  }

  console.log("\n" + "=".repeat(60));
  return testResults;
}

// Run the tests
testApplication().catch(console.error);
