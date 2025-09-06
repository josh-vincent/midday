/**
 * Visual verification script for invoice template display
 * Ensures no [Object object] appears in the UI
 */

const puppeteer = require("puppeteer");

async function verifyInvoiceDisplay() {
  console.log("🔍 Starting visual verification of invoice display...\n");

  const browser = await puppeteer.launch({
    headless: false, // Set to true for CI
    defaultViewport: { width: 1440, height: 900 },
  });

  try {
    const page = await browser.newPage();

    // Navigate to invoice settings page
    console.log("📄 Navigating to invoice settings page...");
    await page.goto("http://localhost:3333/invoices/settings", {
      waitUntil: "networkidle0",
    });

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Check for [Object object] in the page content
    const pageContent = await page.content();
    const hasObjectObject =
      pageContent.includes("[Object object]") ||
      pageContent.includes("[object Object]");

    if (hasObjectObject) {
      console.error("❌ Found [Object object] in the page!");

      // Take screenshot for debugging
      await page.screenshot({
        path: "invoice-settings-error.png",
        fullPage: true,
      });
      console.log("📸 Screenshot saved as invoice-settings-error.png");

      // Find specific locations
      const elements = await page.$$eval("*", (els) => {
        return els
          .filter(
            (el) =>
              el.textContent.includes("[Object object]") ||
              el.textContent.includes("[object Object]"),
          )
          .map((el) => ({
            tag: el.tagName,
            class: el.className,
            text: el.textContent.substring(0, 100),
          }));
      });

      console.log("\n🔍 Elements containing [Object object]:");
      elements.forEach((el) => {
        console.log(`  - ${el.tag}.${el.class}: "${el.text}..."`);
      });
    } else {
      console.log("✅ No [Object object] found in invoice settings page");
    }

    // Check invoice creation sheet
    console.log("\n📄 Checking invoice creation sheet...");
    await page.goto("http://localhost:3333/invoices", {
      waitUntil: "networkidle0",
    });

    // Click create invoice button if it exists
    const createButton = await page.$(
      '[data-testid="create-invoice"], button:has-text("Create Invoice"), button:has-text("New Invoice")',
    );
    if (createButton) {
      await createButton.click();
      await page.waitForTimeout(2000);

      const sheetContent = await page.content();
      const sheetHasObjectObject =
        sheetContent.includes("[Object object]") ||
        sheetContent.includes("[object Object]");

      if (sheetHasObjectObject) {
        console.error("❌ Found [Object object] in invoice creation sheet!");
        await page.screenshot({
          path: "invoice-sheet-error.png",
          fullPage: true,
        });
        console.log("📸 Screenshot saved as invoice-sheet-error.png");
      } else {
        console.log("✅ No [Object object] found in invoice creation sheet");
      }
    } else {
      console.log("⚠️  Could not find create invoice button");
    }

    // Check for proper JSON rendering in text areas
    console.log("\n🔍 Checking text area contents...");
    const textAreas = await page.$$('textarea, [contenteditable="true"]');

    for (let i = 0; i < textAreas.length; i++) {
      const value = await textAreas[i].evaluate(
        (el) => el.value || el.textContent,
      );

      if (
        value &&
        (value.includes("[Object object]") || value.includes("[object Object]"))
      ) {
        console.error(`❌ Found [Object object] in text area ${i + 1}`);
        const elementInfo = await textAreas[i].evaluate((el) => ({
          name: el.name || el.getAttribute("name"),
          id: el.id,
          placeholder: el.placeholder,
        }));
        console.log(`   Element: ${JSON.stringify(elementInfo)}`);
      }
    }

    console.log("\n✨ Visual verification complete!");
  } catch (error) {
    console.error("❌ Error during verification:", error);
  } finally {
    await browser.close();
  }
}

// Check if puppeteer is installed
try {
  require.resolve("puppeteer");
  verifyInvoiceDisplay();
} catch {
  console.log("📦 Puppeteer not found. Installing...");
  const { execSync } = require("child_process");
  execSync("bun add -d puppeteer", { stdio: "inherit" });
  console.log("✅ Puppeteer installed. Please run the script again.");
}
