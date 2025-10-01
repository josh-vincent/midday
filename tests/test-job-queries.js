import { connectDb } from "@midday/db/client";
import { jobs } from "@midday/db/schema";
import { sql, eq, and, desc, asc, gte, lte } from "drizzle-orm";

async function testJobQueries() {
  console.log("🔄 Testing Job Database Queries...\n");

  try {
    const db = await connectDb();

    // Test 1: Get all jobs for a team
    console.log("Test 1: Getting all jobs for team...");
    const teamId = "team_vHVRZjT2bVccNVRfqUcPXg"; // Your team ID

    const allJobs = await db
      .select()
      .from(jobs)
      .where(eq(jobs.teamId, teamId))
      .orderBy(desc(jobs.createdAt));

    console.log(`✅ Found ${allJobs.length} jobs for team`);
    if (allJobs.length > 0) {
      console.log("Sample job:", {
        id: allJobs[0].id,
        jobNumber: allJobs[0].jobNumber,
        companyName: allJobs[0].companyName,
        status: allJobs[0].status,
        jobDate: allJobs[0].jobDate,
      });
    }
    console.log("");

    // Test 2: Get today's jobs
    console.log("Test 2: Getting today's jobs...");
    const today = new Date().toISOString().split("T")[0];

    const todaysJobs = await db
      .select()
      .from(jobs)
      .where(and(eq(jobs.teamId, teamId), eq(jobs.jobDate, today)));

    console.log(`✅ Found ${todaysJobs.length} jobs for today (${today})`);
    const todaysCompleted = todaysJobs.filter(
      (job) => job.status === "completed",
    );
    console.log(`   - Completed: ${todaysCompleted.length}`);
    console.log(
      `   - Pending/In Progress: ${todaysJobs.length - todaysCompleted.length}`,
    );
    console.log("");

    // Test 3: Get this week's completed jobs
    console.log("Test 3: Getting this week's completed jobs...");
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // Sunday

    const weekStartStr = weekStart.toISOString().split("T")[0];
    const weekEndStr = weekEnd.toISOString().split("T")[0];

    const weekJobs = await db
      .select()
      .from(jobs)
      .where(
        and(
          eq(jobs.teamId, teamId),
          eq(jobs.status, "completed"),
          gte(jobs.jobDate, weekStartStr),
          lte(jobs.jobDate, weekEndStr),
        ),
      );

    const weekRevenue = weekJobs.reduce((total, job) => {
      const amount =
        (Number(job.pricePerUnit) || 0) * (Number(job.cubicMetreCapacity) || 0);
      return total + amount;
    }, 0);

    console.log(`✅ This week (${weekStartStr} to ${weekEndStr}):`);
    console.log(`   - Completed jobs: ${weekJobs.length}`);
    console.log(`   - Total revenue: $${weekRevenue.toFixed(2)}`);
    console.log("");

    // Test 4: Get pending jobs
    console.log("Test 4: Getting pending jobs...");
    const pendingJobs = await db
      .select()
      .from(jobs)
      .where(
        and(
          eq(jobs.teamId, teamId),
          sql`${jobs.status} IN ('pending', 'in_progress')`,
        ),
      );

    const pendingValue = pendingJobs.reduce((total, job) => {
      const amount =
        (Number(job.pricePerUnit) || 0) * (Number(job.cubicMetreCapacity) || 0);
      return total + amount;
    }, 0);

    console.log(`✅ Pending/In Progress jobs: ${pendingJobs.length}`);
    console.log(`   - Potential revenue: $${pendingValue.toFixed(2)}`);
    if (pendingJobs.length > 0) {
      console.log("   - Sample pending job:", {
        jobNumber: pendingJobs[0].jobNumber,
        companyName: pendingJobs[0].companyName,
        status: pendingJobs[0].status,
      });
    }
    console.log("");

    // Test 5: Get monthly volume
    console.log("Test 5: Getting monthly volume...");
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthStartStr = monthStart.toISOString().split("T")[0];
    const monthEndStr = monthEnd.toISOString().split("T")[0];

    const monthJobs = await db
      .select()
      .from(jobs)
      .where(
        and(
          eq(jobs.teamId, teamId),
          gte(jobs.jobDate, monthStartStr),
          lte(jobs.jobDate, monthEndStr),
        ),
      );

    const totalVolume = monthJobs.reduce((total, job) => {
      return total + (Number(job.cubicMetreCapacity) || 0);
    }, 0);

    const completedDeliveries = monthJobs.filter(
      (job) => job.status === "completed",
    ).length;

    console.log(`✅ This month (${monthStartStr} to ${monthEndStr}):`);
    console.log(`   - Total jobs: ${monthJobs.length}`);
    console.log(`   - Total volume: ${totalVolume} m³`);
    console.log(`   - Completed deliveries: ${completedDeliveries}`);
    console.log("");

    // Test 6: Get jobs without invoices
    console.log("Test 6: Getting jobs without invoices...");
    const uninvoicedJobs = await db
      .select()
      .from(jobs)
      .where(and(eq(jobs.teamId, teamId), sql`${jobs.invoiceId} IS NULL`));

    console.log(`✅ Found ${uninvoicedJobs.length} jobs without invoices`);
    console.log("");

    // Test 7: Search jobs
    console.log("Test 7: Testing search functionality...");
    const searchTerm = "construction"; // Example search

    const searchResults = await db
      .select()
      .from(jobs)
      .where(
        and(
          eq(jobs.teamId, teamId),
          sql`(
            LOWER(${jobs.companyName}) LIKE LOWER('%${searchTerm}%') OR
            LOWER(${jobs.contactPerson}) LIKE LOWER('%${searchTerm}%') OR
            LOWER(${jobs.addressSite}) LIKE LOWER('%${searchTerm}%') OR
            LOWER(${jobs.materialType}) LIKE LOWER('%${searchTerm}%')
          )`,
        ),
      );

    console.log(
      `✅ Search for "${searchTerm}" found ${searchResults.length} results`,
    );
    console.log("");

    // Summary
    console.log("📊 Summary Statistics:");
    console.log("========================");
    console.log(`Total jobs in database: ${allJobs.length}`);
    console.log(
      `Today's jobs: ${todaysJobs.length} (${todaysCompleted.length} completed)`,
    );
    console.log(
      `This week: ${weekJobs.length} jobs, $${weekRevenue.toFixed(2)} revenue`,
    );
    console.log(
      `Pending: ${pendingJobs.length} jobs, $${pendingValue.toFixed(2)} potential`,
    );
    console.log(
      `Monthly volume: ${totalVolume} m³, ${completedDeliveries} deliveries`,
    );
    console.log(`Uninvoiced jobs: ${uninvoicedJobs.length}`);

    console.log("\n✅ All query tests completed successfully!");
  } catch (error) {
    console.error("❌ Error testing queries:", error);
    console.error("Stack trace:", error.stack);
  }

  process.exit(0);
}

// Run the tests
testJobQueries();
