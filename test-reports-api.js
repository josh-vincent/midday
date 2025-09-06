import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ulncfblvuijlgniydjju.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsbmNmYmx2dWlqbGduaXlkamp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NTkxODUsImV4cCI6MjA3MjUzNTE4NX0.pCycxnDK259p3AqhTuet9k20ErxOYEJReDUI5iBG6Ik";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testReportsAPI() {
  try {
    // Sign in
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
    const token = authData.session.access_token;

    // Test date range
    const from = "2025-01-01";
    const to = "2025-12-31";

    // List of chart endpoints to test
    const chartTypes = [
      "revenue",
      "profit",
      "burnRate",
      "expense",
      "invoice",
      "jobs",
      "volume",
      "spending",
      "runway",
    ];

    console.log("\n📊 Testing All Chart Endpoints:\n");

    for (const chartType of chartTypes) {
      try {
        const response = await fetch(
          `http://localhost:3334/trpc/reports.${chartType}?input=${encodeURIComponent(
            JSON.stringify({
              json: { from, to, currency: "USD" },
            }),
          )}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const responseText = await response.text();

        if (response.ok) {
          const result = JSON.parse(responseText);
          if (result.result?.data?.json) {
            const data = result.result.data.json;
            console.log(
              `✅ ${chartType.padEnd(12)} - Current: ${data.summary?.currentTotal ?? 0}, Previous: ${data.summary?.prevTotal ?? 0}, Data points: ${data.result?.length ?? 0}`,
            );

            // Show sample data if available
            if (data.result?.length > 0) {
              console.log(`   Sample: ${JSON.stringify(data.result[0])}`);
            }
          } else {
            console.log(`⚠️  ${chartType.padEnd(12)} - Empty response`);
          }
        } else {
          console.error(
            `❌ ${chartType.padEnd(12)} - Status: ${response.status}`,
          );
          console.error(`   Error: ${responseText.substring(0, 100)}`);
        }
      } catch (error) {
        console.error(`❌ ${chartType.padEnd(12)} - Error: ${error.message}`);
      }
    }

    // Test with real job data first
    console.log("\n📋 Creating test data for charts:\n");

    // Create some test jobs to ensure we have data
    const testJobs = [
      {
        teamId: "team_vHVRZjT2bVccNVRfqUcPXg",
        jobNumber: "CHART-TEST-001",
        contactPerson: "Chart Test",
        contactNumber: "0400000001",
        rego: "TEST-001",
        loadNumber: 2,
        companyName: "Test Company 1",
        addressSite: "123 Test Street",
        equipmentType: "Truck & Quad 26m3",
        materialType: "Dry Clean Fill",
        pricePerUnit: 25,
        cubicMetreCapacity: 26,
        jobDate: "2025-09-01",
        status: "completed",
        createdBy: authData.user.id,
      },
      {
        teamId: "team_vHVRZjT2bVccNVRfqUcPXg",
        jobNumber: "CHART-TEST-002",
        contactPerson: "Chart Test",
        contactNumber: "0400000002",
        rego: "TEST-002",
        loadNumber: 3,
        companyName: "Test Company 2",
        addressSite: "456 Test Avenue",
        equipmentType: "Tandem 10m3",
        materialType: "Wet Clay",
        pricePerUnit: 30,
        cubicMetreCapacity: 10,
        jobDate: "2025-09-03",
        status: "completed",
        createdBy: authData.user.id,
      },
      {
        teamId: "team_vHVRZjT2bVccNVRfqUcPXg",
        jobNumber: "CHART-TEST-003",
        contactPerson: "Chart Test",
        contactNumber: "0400000003",
        rego: "TEST-003",
        loadNumber: 1,
        companyName: "Test Company 3",
        addressSite: "789 Test Road",
        equipmentType: "Truck & Trailer 22m3",
        materialType: "Rock",
        pricePerUnit: 35,
        cubicMetreCapacity: 22,
        jobDate: "2025-09-05",
        status: "in_progress",
        createdBy: authData.user.id,
      },
    ];

    for (const job of testJobs) {
      const response = await fetch("http://localhost:3334/trpc/job.create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ json: job }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✓ Created job: ${job.jobNumber}`);
      }
    }

    // Now test the charts again with the new data
    console.log("\n📊 Re-testing Charts with New Data:\n");

    const chartsToRetest = ["jobs", "volume"];

    for (const chartType of chartsToRetest) {
      const response = await fetch(
        `http://localhost:3334/trpc/reports.${chartType}?input=${encodeURIComponent(
          JSON.stringify({
            json: { from: "2025-09-01", to: "2025-09-30", currency: "USD" },
          }),
        )}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const result = await response.json();
        const data = result.result?.data?.json;
        console.log(
          `✅ ${chartType.padEnd(12)} - Total: ${data.summary?.currentTotal ?? 0}, Data points: ${data.result?.length ?? 0}`,
        );

        if (data.result?.length > 0) {
          console.log(`   Data points:`);
          data.result.forEach((point) => {
            console.log(`   - ${point.date}: ${point.value}`);
          });
        }
      }
    }
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testReportsAPI();
