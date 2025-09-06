import puppeteer from "puppeteer";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ulncfblvuijlgniydjju.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsbmNmYmx2dWlqbGduaXlkamp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NTkxODUsImV4cCI6MjA3MjUzNTE4NX0.pCycxnDK259p3AqhTuet9k20ErxOYEJReDUI5iBG6Ik";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDashboardCharts() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1400, height: 900 },
  });

  try {
    const page = await browser.newPage();

    // Sign in first
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: "admin@tocld.com",
        password: "Admin123",
      });

    if (authError) {
      console.error("Auth error:", authError);
      return;
    }

    console.log("✓ Authenticated successfully");

    // Set the auth cookie
    await page.goto("http://localhost:3333/login");
    await page.evaluate((token) => {
      localStorage.setItem(
        "sb-ulncfblvuijlgniydjju-auth-token",
        JSON.stringify({
          access_token: token.access_token,
          refresh_token: token.refresh_token,
          expires_at: token.expires_at,
          expires_in: token.expires_in,
          token_type: token.token_type,
          user: token.user,
        }),
      );
    }, authData.session);

    console.log("\n📊 Testing Dashboard Charts:\n");

    // Navigate to reports page
    await page.goto("http://localhost:3333/reports", {
      waitUntil: "networkidle0",
    });
    await new Promise((r) => setTimeout(r, 2000));

    // Check if reports page loaded
    const pageTitle = await page.evaluate(() => document.title);
    console.log(`✓ Reports page loaded: ${pageTitle}`);

    // Test chart selector
    const chartSelector = await page.$('[role="combobox"]');
    if (chartSelector) {
      console.log("✓ Chart selector found");

      // Click to open chart options
      await chartSelector.click();
      await new Promise((r) => setTimeout(r, 500));

      // Get all chart options
      const chartOptions = await page.evaluate(() => {
        const options = Array.from(
          document.querySelectorAll('[role="option"]'),
        );
        return options.map((opt) => opt.textContent);
      });

      console.log(`✓ Available charts: ${chartOptions.join(", ")}`);

      // Test each chart type
      const chartsToTest = ["invoice", "jobs", "volume"];

      for (const chartType of chartsToTest) {
        // Find and click the chart option
        const option = await page.$(`[role="option"]:has-text("${chartType}")`);
        if (option) {
          await option.click();
          await new Promise((r) => setTimeout(r, 1500));

          // Check if chart rendered
          const chartExists = await page.evaluate(() => {
            const chart = document.querySelector(
              "canvas, svg, .recharts-wrapper",
            );
            return !!chart;
          });

          const chartData = await page.evaluate(() => {
            const valueElement = document.querySelector(".text-4xl.font-mono");
            return valueElement ? valueElement.textContent : "No data";
          });

          console.log(
            `✓ ${chartType.padEnd(10)} chart - Rendered: ${chartExists ? "Yes" : "No"}, Value: ${chartData}`,
          );

          // Open selector again for next chart
          if (chartsToTest.indexOf(chartType) < chartsToTest.length - 1) {
            await chartSelector.click();
            await new Promise((r) => setTimeout(r, 500));
          }
        }
      }
    } else {
      console.log("⚠️  Chart selector not found");
    }

    // Check widgets
    console.log("\n📦 Checking Widgets:\n");

    const widgets = await page.evaluate(() => {
      const widgetElements = document.querySelectorAll(
        '[class*="widget"], [class*="card"]',
      );
      return widgetElements.length;
    });

    console.log(`✓ Found ${widgets} widgets on the page`);

    // Take screenshot
    await page.screenshot({ path: "reports-page-test.png" });
    console.log("\n✓ Screenshot saved as reports-page-test.png");
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    await browser.close();
  }
}

testDashboardCharts();
