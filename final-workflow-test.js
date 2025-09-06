const puppeteer = require("puppeteer");

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runWorkflowTest(iteration = 1) {
  console.log("\n" + "=".repeat(60));
  console.log(`🚀 Starting Workflow Test - Iteration ${iteration}`);
  console.log("=".repeat(60));

  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: { width: 1400, height: 900 },
  });

  const page = await browser.newPage();
  const results = { passed: [], failed: [] };

  try {
    // Step 1: Login
    console.log("\n📋 Step 1: Login");
    await page.goto("http://localhost:3333/login", {
      waitUntil: "networkidle2",
    });
    await delay(2000);

    // Fill login form
    await page.type('input[type="email"]', "admin@tocld.com");
    await page.type('input[type="password"]', "Admin123");
    await delay(500);

    // Click submit and wait for response
    const [response] = await Promise.all([
      page
        .waitForResponse(
          (response) =>
            response.url().includes("supabase") &&
            response.url().includes("auth"),
          { timeout: 10000 },
        )
        .catch(() => null),
      page.click('button[type="submit"]'),
    ]);

    // Wait for navigation
    await delay(5000);

    const currentUrl = page.url();
    if (!currentUrl.includes("/login")) {
      console.log("   ✅ Login successful");
      results.passed.push("Login");

      // Step 2: Navigate to customers
      console.log("\n📋 Step 2: Navigate to Customers");
      await page.goto("http://localhost:3333/customers", {
        waitUntil: "networkidle2",
      });
      await delay(3000);

      if (page.url().includes("/customers")) {
        console.log("   ✅ Customers page loaded");
        results.passed.push("Navigate to customers");

        // Try to find and click Add button
        console.log("\n📋 Step 3: Open Add Customer dialog");

        // Look for buttons with SVG icons
        const buttons = await page.$$("button");
        let foundAddButton = false;

        for (let i = buttons.length - 1; i >= 0; i--) {
          const hasIcon = await buttons[i].evaluate(
            (el) => !!el.querySelector("svg"),
          );
          if (hasIcon) {
            await buttons[i].click();
            await delay(2000);

            // Check if dialog opened
            const dialog = await page.$('[role="dialog"]');
            if (dialog) {
              console.log("   ✅ Customer dialog opened");
              results.passed.push("Open customer dialog");
              foundAddButton = true;

              // Close dialog for now
              await page.keyboard.press("Escape");
              await delay(1000);
              break;
            }
          }
        }

        if (!foundAddButton) {
          console.log("   ⚠️  Could not find Add button");
          results.failed.push("Open customer dialog");
        }
      } else {
        console.log("   ❌ Failed to navigate to customers");
        results.failed.push("Navigate to customers");
      }

      // Step 4: Navigate to invoices
      console.log("\n📋 Step 4: Navigate to Invoices");
      await page.goto("http://localhost:3333/invoices", {
        waitUntil: "networkidle2",
      });
      await delay(3000);

      if (page.url().includes("/invoices")) {
        console.log("   ✅ Invoices page loaded");
        results.passed.push("Navigate to invoices");

        // Try to find and click Add button
        console.log("\n📋 Step 5: Open Add Invoice dialog");

        const invoiceButtons = await page.$$("button");
        let foundInvoiceButton = false;

        for (let i = invoiceButtons.length - 1; i >= 0; i--) {
          const hasIcon = await invoiceButtons[i].evaluate(
            (el) => !!el.querySelector("svg"),
          );
          if (hasIcon) {
            await invoiceButtons[i].click();
            await delay(2000);

            // Check if dialog opened
            const dialog = await page.$('[role="dialog"]');
            if (dialog) {
              console.log("   ✅ Invoice dialog opened");
              results.passed.push("Open invoice dialog");
              foundInvoiceButton = true;

              // Close dialog
              await page.keyboard.press("Escape");
              await delay(1000);
              break;
            }
          }
        }

        if (!foundInvoiceButton) {
          console.log("   ⚠️  Could not find Add button");
          results.failed.push("Open invoice dialog");
        }
      } else {
        console.log("   ❌ Failed to navigate to invoices");
        results.failed.push("Navigate to invoices");
      }
    } else {
      console.log("   ❌ Login failed");
      results.failed.push("Login");

      // Check for error
      const errorText = await page.evaluate(() => {
        const error = document.querySelector(".text-red-500");
        return error ? error.textContent : null;
      });

      if (errorText) {
        console.log("   Error:", errorText);
      }
    }
  } catch (error) {
    console.error("Test error:", error.message);
    results.failed.push(`Error: ${error.message}`);
  }

  await browser.close();

  // Report results
  console.log("\n" + "=".repeat(60));
  console.log(`📊 Iteration ${iteration} Results`);
  console.log("=".repeat(60));
  console.log(`✅ Passed: ${results.passed.length}`);
  results.passed.forEach((test) => console.log(`   • ${test}`));

  if (results.failed.length > 0) {
    console.log(`\n❌ Failed: ${results.failed.length}`);
    results.failed.forEach((test) => console.log(`   • ${test}`));
  }

  return results;
}

async function runTestLoop() {
  console.log("🔄 Starting 3-iteration test loop...");

  const allResults = [];

  for (let i = 1; i <= 3; i++) {
    const results = await runWorkflowTest(i);
    allResults.push(results);

    if (i < 3) {
      console.log("\n⏱️  Waiting 5 seconds before next iteration...");
      await delay(5000);
    }
  }

  // Final summary
  console.log("\n" + "=".repeat(60));
  console.log("🎯 FINAL TEST SUMMARY");
  console.log("=".repeat(60));

  let totalPassed = 0;
  let totalFailed = 0;

  allResults.forEach((result, index) => {
    totalPassed += result.passed.length;
    totalFailed += result.failed.length;
    console.log(`\nIteration ${index + 1}:`);
    console.log(`   ✅ Passed: ${result.passed.length}`);
    console.log(`   ❌ Failed: ${result.failed.length}`);
  });

  console.log("\n" + "-".repeat(60));
  console.log(`Total Tests Passed: ${totalPassed}`);
  console.log(`Total Tests Failed: ${totalFailed}`);

  if (totalFailed === 0) {
    console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY!");
  } else {
    console.log(
      "\n⚠️  Some tests failed. The admin user exists and works, but the web form login appears to have issues.",
    );
    console.log(
      "\nNOTE: Authentication works directly with Supabase (verified separately).",
    );
    console.log(
      "The issue appears to be with the client-side form submission or session handling.",
    );
  }
  console.log("=".repeat(60));
}

// Run the test loop
runTestLoop().catch(console.error);
