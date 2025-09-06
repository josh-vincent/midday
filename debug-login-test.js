const puppeteer = require("puppeteer");

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function debugLogin() {
  console.log("🔐 Debug Login Test\n");

  const browser = await puppeteer.launch({
    headless: false,
    devtools: true, // Open DevTools
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: { width: 1400, height: 900 },
  });

  const page = await browser.newPage();

  // Log console messages
  page.on("console", (msg) => {
    console.log("Browser console:", msg.type(), msg.text());
  });

  // Log network requests
  page.on("response", (response) => {
    if (
      response.url().includes("supabase") ||
      response.url().includes("auth")
    ) {
      console.log(`Network: ${response.status()} ${response.url()}`);
    }
  });

  try {
    console.log("1. Navigating to login page...");
    await page.goto("http://localhost:3333/login", {
      waitUntil: "networkidle2",
    });
    await delay(2000);

    // Check cookies before login
    const cookiesBefore = await page.cookies();
    console.log(
      "2. Cookies before login:",
      cookiesBefore.filter((c) => c.name.includes("auth")).length,
    );

    console.log("3. Filling form...");
    await page.type('input[type="email"]', "admin@tocld.com");
    await page.type('input[type="password"]', "Admin123");
    await delay(500);

    console.log("4. Clicking submit...");

    // Set up response listener for auth
    const authResponsePromise = page
      .waitForResponse(
        (response) =>
          response.url().includes("auth") ||
          response.url().includes("supabase"),
        { timeout: 10000 },
      )
      .catch(() => null);

    await page.click('button[type="submit"]');

    // Wait for auth response
    const authResponse = await authResponsePromise;
    if (authResponse) {
      console.log(
        `5. Auth response: ${authResponse.status()} from ${authResponse.url()}`,
      );
      const responseBody = await authResponse
        .text()
        .catch(() => "Could not read body");
      if (responseBody.includes("error")) {
        console.log(
          "   Response contains error:",
          responseBody.substring(0, 200),
        );
      }
    } else {
      console.log("5. No auth response detected");
    }

    await delay(5000);

    // Check cookies after login
    const cookiesAfter = await page.cookies();
    console.log(
      "6. Cookies after login:",
      cookiesAfter.filter((c) => c.name.includes("auth")).length,
    );
    cookiesAfter
      .filter((c) => c.name.includes("auth"))
      .forEach((c) => {
        console.log(`   Cookie: ${c.name} = ${c.value.substring(0, 20)}...`);
      });

    const currentUrl = page.url();
    console.log("7. Current URL:", currentUrl);

    // Check for error messages
    const errorText = await page.evaluate(() => {
      const error = document.querySelector(".text-red-500");
      return error ? error.textContent : null;
    });

    if (errorText) {
      console.log("8. Error message on page:", errorText);
    }

    // Try to manually navigate to protected page
    console.log("\n9. Attempting manual navigation to /customers...");
    await page.goto("http://localhost:3333/customers", {
      waitUntil: "networkidle2",
    });
    await delay(2000);
    console.log("   Navigated to:", page.url());
  } catch (error) {
    console.error("Test error:", error.message);
  }

  console.log("\n✅ Test complete. Browser will stay open for inspection.");
  console.log("Press Ctrl+C to exit.");

  // Keep browser open
  await new Promise(() => {});
}

debugLogin().catch(console.error);
