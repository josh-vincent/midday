import { createClient } from "@supabase/supabase-js";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";

const supabaseUrl = "https://ulncfblvuijlgniydjju.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsbmNmYmx2dWlqbGduaXlkamp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NTkxODUsImV4cCI6MjA3MjUzNTE4NX0.pCycxnDK259p3AqhTuet9k20ErxOYEJReDUI5iBG6Ik";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testChartsAccuracy() {
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
    const teamId = "team_vHVRZjT2bVccNVRfqUcPXg";

    // First, let's check what data we actually have in the database
    console.log("\n📊 Checking Existing Data:\n");

    // Get existing jobs from database
    const { data: existingJobs } = await supabase
      .from("jobs")
      .select("*")
      .eq("team_id", teamId)
      .order("job_date", { ascending: false })
      .limit(10);

    console.log(`Found ${existingJobs?.length || 0} existing jobs`);
    if (existingJobs && existingJobs.length > 0) {
      console.log("Recent jobs:");
      existingJobs.forEach((job) => {
        console.log(
          `  - ${job.job_number}: ${job.job_date} (${job.status}) - ${job.cubic_metre_capacity}m³ × ${job.load_number} loads = ${(job.cubic_metre_capacity || 0) * (job.load_number || 1)}m³`,
        );
      });
    }

    // Get existing invoices
    const { data: existingInvoices } = await supabase
      .from("invoices")
      .select("*")
      .eq("team_id", teamId)
      .order("issue_date", { ascending: false })
      .limit(10);

    console.log(`\nFound ${existingInvoices?.length || 0} existing invoices`);
    if (existingInvoices && existingInvoices.length > 0) {
      console.log("Recent invoices:");
      existingInvoices.forEach((inv) => {
        console.log(
          `  - ${inv.invoice_number}: ${inv.issue_date} (${inv.status}) - $${(inv.total_amount || 0) / 100}`,
        );
      });
    }

    // Create test data with various dates to ensure charts show data
    console.log("\n📝 Creating Test Data with Various Dates:\n");

    const today = new Date();
    const testDates = [
      format(today, "yyyy-MM-dd"),
      format(subDays(today, 1), "yyyy-MM-dd"),
      format(subDays(today, 3), "yyyy-MM-dd"),
      format(subDays(today, 7), "yyyy-MM-dd"),
      format(subDays(today, 14), "yyyy-MM-dd"),
      format(subDays(today, 30), "yyyy-MM-dd"),
      format(subDays(today, 60), "yyyy-MM-dd"),
    ];

    // Create jobs for different dates
    for (let i = 0; i < testDates.length; i++) {
      const jobData = {
        teamId,
        jobNumber: `ACCURACY-${Date.now()}-${i}`,
        contactPerson: "Test Accuracy",
        contactNumber: `040000000${i}`,
        rego: `TEST-${i}`,
        loadNumber: (i % 3) + 1,
        companyName: `Test Company ${i}`,
        addressSite: `${i}00 Test Street`,
        equipmentType: [
          "Truck & Quad 26m3",
          "Tandem 10m3",
          "Truck & Trailer 22m3",
        ][i % 3],
        materialType: ["Dry Clean Fill", "Wet Clay", "Rock"][i % 3],
        pricePerUnit: 20 + i * 5,
        cubicMetreCapacity: [26, 10, 22][i % 3],
        jobDate: testDates[i],
        status: ["completed", "in_progress", "pending"][i % 3],
        createdBy: authData.user.id,
      };

      const response = await fetch("http://localhost:3334/trpc/job.create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ json: jobData }),
      });

      if (response.ok) {
        console.log(`✓ Created job for ${testDates[i]}`);
      }
    }

    // Now test the chart endpoints with different date ranges
    console.log("\n📈 Testing Chart Data Accuracy:\n");

    const dateRanges = [
      {
        name: "Last 7 days",
        from: format(subDays(today, 7), "yyyy-MM-dd"),
        to: format(today, "yyyy-MM-dd"),
      },
      {
        name: "Last 30 days",
        from: format(subDays(today, 30), "yyyy-MM-dd"),
        to: format(today, "yyyy-MM-dd"),
      },
      {
        name: "This month",
        from: format(startOfMonth(today), "yyyy-MM-dd"),
        to: format(endOfMonth(today), "yyyy-MM-dd"),
      },
      {
        name: "Last 60 days",
        from: format(subDays(today, 60), "yyyy-MM-dd"),
        to: format(today, "yyyy-MM-dd"),
      },
    ];

    for (const range of dateRanges) {
      console.log(`\n📅 ${range.name} (${range.from} to ${range.to}):`);

      // Test jobs chart
      const jobsResponse = await fetch(
        `http://localhost:3334/trpc/reports.jobs?input=${encodeURIComponent(
          JSON.stringify({
            json: { from: range.from, to: range.to },
          }),
        )}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (jobsResponse.ok) {
        const jobsResult = await jobsResponse.json();
        const jobsData = jobsResult.result?.data?.json;
        console.log(`  Jobs: ${jobsData.summary?.currentTotal || 0} total`);
        if (jobsData.result?.length > 0) {
          jobsData.result.forEach((point) => {
            console.log(`    ${point.date}: ${point.value} jobs`);
          });
        }
      }

      // Test volume chart
      const volumeResponse = await fetch(
        `http://localhost:3334/trpc/reports.volume?input=${encodeURIComponent(
          JSON.stringify({
            json: { from: range.from, to: range.to },
          }),
        )}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (volumeResponse.ok) {
        const volumeResult = await volumeResponse.json();
        const volumeData = volumeResult.result?.data?.json;
        console.log(
          `  Volume: ${volumeData.summary?.currentTotal || 0} m³ total`,
        );
        if (volumeData.result?.length > 0) {
          volumeData.result.forEach((point) => {
            console.log(`    ${point.date}: ${point.value} m³`);
          });
        }
      }

      // Test invoice chart
      const invoiceResponse = await fetch(
        `http://localhost:3334/trpc/reports.invoice?input=${encodeURIComponent(
          JSON.stringify({
            json: { from: range.from, to: range.to, currency: "USD" },
          }),
        )}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (invoiceResponse.ok) {
        const invoiceResult = await invoiceResponse.json();
        const invoiceData = invoiceResult.result?.data?.json;
        console.log(
          `  Invoices: $${invoiceData.summary?.currentTotal || 0} total`,
        );
        if (invoiceData.result?.length > 0) {
          invoiceData.result.forEach((point) => {
            console.log(`    ${point.date}: $${point.value}`);
          });
        }
      }
    }

    // Test that the data aggregates correctly
    console.log("\n✅ Summary of Chart Data Validation:\n");

    // Verify jobs are grouped by date correctly
    const verifyResponse = await fetch(
      `http://localhost:3334/trpc/reports.jobs?input=${encodeURIComponent(
        JSON.stringify({
          json: {
            from: format(subDays(today, 90), "yyyy-MM-dd"),
            to: format(today, "yyyy-MM-dd"),
          },
        }),
      )}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (verifyResponse.ok) {
      const result = await verifyResponse.json();
      const data = result.result?.data?.json;

      console.log(
        `Total jobs in last 90 days: ${data.summary?.currentTotal || 0}`,
      );
      console.log(`Unique dates with jobs: ${data.result?.length || 0}`);
      console.log(`Previous period total: ${data.summary?.prevTotal || 0}`);

      // Calculate percentage change
      if (data.summary?.prevTotal > 0) {
        const change = (
          ((data.summary.currentTotal - data.summary.prevTotal) /
            data.summary.prevTotal) *
          100
        ).toFixed(1);
        console.log(`Period-over-period change: ${change}%`);
      }
    }
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testChartsAccuracy();
