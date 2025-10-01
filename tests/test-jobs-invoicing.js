const { createClient } = require("@supabase/supabase-js");
const postgres = require("postgres");
require("dotenv").config({ path: ".env.local" });

// Initialize connections
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const databaseUrl = process.env.DATABASE_URL;

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const sql = postgres(databaseUrl);

async function testJobsToInvoicing() {
  console.log("🚀 Testing Jobs to Invoicing System\n");
  console.log("=".repeat(60));

  let adminUserId;
  let teamId;
  let customerId;
  const jobIds = [];
  let invoiceId;

  try {
    // Step 1: Authenticate
    console.log("\n📋 Step 1: Authenticating...");
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: "admin@tocld.com",
        password: "Admin123",
      });

    if (authError)
      throw new Error(`Authentication failed: ${authError.message}`);

    adminUserId = authData.user.id;
    console.log(`   ✅ Authenticated as admin`);

    // Get team and customer
    const [team] = await sql`
      SELECT team_id FROM users_on_team WHERE user_id = ${adminUserId} LIMIT 1
    `;
    teamId = team.team_id;

    const [customer] = await sql`
      SELECT * FROM customers 
      WHERE team_id = ${teamId} 
      ORDER BY created_at DESC
      LIMIT 1
    `;
    customerId = customer.id;
    console.log(`   ✅ Using customer: ${customer.name}`);

    // Step 2: Create Multiple Jobs
    console.log("\n📋 Step 2: Creating Dirt Receiving Jobs...");

    const jobs = [
      {
        jobNumber: `JOB-${Date.now()}-001`,
        sourceLocation: "Downtown Construction Site",
        sourceAddress: "123 Main St, Downtown, TX 75201",
        destinationSite: "North Facility",
        dirtType: "clean_fill",
        quantityCubicMeters: 45.5,
        weightKg: 68250, // ~1500 kg/m³ for clean fill
        pricePerCubicMeter: 3500, // $35.00 per m³
        scheduledDate: new Date().toISOString().split("T")[0],
        truckNumber: "TRK-101",
        driverName: "John Smith",
      },
      {
        jobNumber: `JOB-${Date.now()}-002`,
        sourceLocation: "Highway 35 Extension",
        sourceAddress: "456 Highway 35, Suburb, TX 75202",
        destinationSite: "South Facility",
        dirtType: "topsoil",
        quantityCubicMeters: 32.8,
        weightKg: 42640, // ~1300 kg/m³ for topsoil
        pricePerCubicMeter: 4500, // $45.00 per m³
        scheduledDate: new Date().toISOString().split("T")[0],
        truckNumber: "TRK-202",
        driverName: "Mike Johnson",
      },
      {
        jobNumber: `JOB-${Date.now()}-003`,
        sourceLocation: "Industrial Park Demolition",
        sourceAddress: "789 Industrial Blvd, Industrial, TX 75203",
        destinationSite: "Special Handling Area",
        dirtType: "contaminated",
        quantityCubicMeters: 28.2,
        weightKg: 45120, // ~1600 kg/m³ for contaminated
        pricePerCubicMeter: 7500, // $75.00 per m³ (higher for contaminated)
        scheduledDate: new Date().toISOString().split("T")[0],
        truckNumber: "TRK-HAZ-01",
        driverName: "Dave Wilson",
      },
      {
        jobNumber: `JOB-${Date.now()}-004`,
        sourceLocation: "Residential Development",
        sourceAddress: "321 Oak Street, Suburbs, TX 75204",
        destinationSite: "North Facility",
        dirtType: "clay",
        quantityCubicMeters: 38.5,
        weightKg: 73150, // ~1900 kg/m³ for clay
        pricePerCubicMeter: 3000, // $30.00 per m³
        scheduledDate: new Date().toISOString().split("T")[0],
        truckNumber: "TRK-103",
        driverName: "Sarah Davis",
      },
    ];

    for (const job of jobs) {
      const totalAmount = Math.round(
        job.quantityCubicMeters * job.pricePerCubicMeter,
      );

      const [newJob] = await sql`
        INSERT INTO jobs (
          team_id, customer_id, job_number,
          source_location, source_address, destination_site,
          dirt_type, quantity_cubic_meters, weight_kg,
          price_per_cubic_meter, total_amount,
          status, scheduled_date,
          truck_number, driver_name,
          created_by, created_at, updated_at
        ) VALUES (
          ${teamId}, ${customerId}, ${job.jobNumber},
          ${job.sourceLocation}, ${job.sourceAddress}, ${job.destinationSite},
          ${job.dirtType}, ${job.quantityCubicMeters}, ${job.weightKg},
          ${job.pricePerCubicMeter}, ${totalAmount},
          'pending', ${job.scheduledDate},
          ${job.truckNumber}, ${job.driverName},
          ${adminUserId}, NOW(), NOW()
        )
        RETURNING *
      `;

      jobIds.push(newJob.id);
      console.log(`   ✅ Created job: ${newJob.job_number}`);
      console.log(`      Location: ${newJob.source_location}`);
      console.log(`      Type: ${newJob.dirt_type}`);
      console.log(`      Volume: ${newJob.quantity_cubic_meters} m³`);
      console.log(`      Weight: ${(newJob.weight_kg / 1000).toFixed(1)} tons`);
      console.log(`      Amount: $${(totalAmount / 100).toFixed(2)}`);
    }

    // Step 3: Mark Jobs as Completed
    console.log("\n📋 Step 3: Marking Jobs as Completed...");

    for (const jobId of jobIds) {
      await sql`
        UPDATE jobs
        SET 
          status = 'completed',
          arrival_time = NOW() - INTERVAL '2 hours',
          completed_time = NOW() - INTERVAL '1 hour',
          updated_at = NOW()
        WHERE id = ${jobId}
      `;
    }
    console.log(`   ✅ Marked ${jobIds.length} jobs as completed`);

    // Step 4: Select Jobs for Invoicing
    console.log("\n📋 Step 4: Selecting Completed Jobs for Invoicing...");

    const uninvoicedJobs = await sql`
      SELECT * FROM jobs
      WHERE team_id = ${teamId}
      AND customer_id = ${customerId}
      AND status = 'completed'
      AND invoice_id IS NULL
      ORDER BY scheduled_date, job_number
    `;

    console.log(
      `   ✅ Found ${uninvoicedJobs.length} completed jobs ready for invoicing`,
    );

    // Step 5: Create Invoice from Jobs
    console.log("\n📋 Step 5: Creating Invoice from Selected Jobs...");

    // Calculate totals
    let subtotal = 0;
    const lineItems = [];

    for (const job of uninvoicedJobs.slice(0, 4)) {
      // Take first 4 jobs
      const amount = parseInt(job.total_amount);
      subtotal += amount;

      lineItems.push({
        description: `${job.job_number} - ${job.source_location} - ${job.dirt_type.replace("_", " ")} (${job.quantity_cubic_meters} m³)`,
        quantity: parseFloat(job.quantity_cubic_meters),
        price: parseInt(job.price_per_cubic_meter),
        total: amount,
      });
    }

    const taxRate = 8.25;
    const taxAmount = Math.round((subtotal * taxRate) / 100);
    const totalAmount = subtotal + taxAmount;

    const [invoice] = await sql`
      INSERT INTO invoices (
        team_id, customer_id, invoice_number, status,
        issue_date, due_date, 
        subtotal, tax_rate, tax_amount, total_amount,
        currency, line_items,
        note, created_by, created_at, updated_at
      ) VALUES (
        ${teamId}, ${customerId}, ${`INV-JOBS-${Date.now()}`}, 'draft',
        CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days',
        ${subtotal}, ${taxRate}, ${taxAmount}, ${totalAmount},
        'USD', ${JSON.stringify(lineItems)},
        'Invoice for dirt receiving services - multiple jobs consolidated',
        ${adminUserId}, NOW(), NOW()
      )
      RETURNING *
    `;

    invoiceId = invoice.id;
    console.log(`   ✅ Created invoice: ${invoice.invoice_number}`);
    console.log(`      Line items: ${lineItems.length}`);
    console.log(`      Subtotal: $${(subtotal / 100).toFixed(2)}`);
    console.log(`      Tax (${taxRate}%): $${(taxAmount / 100).toFixed(2)}`);
    console.log(`      Total: $${(totalAmount / 100).toFixed(2)}`);

    // Step 6: Link Jobs to Invoice
    console.log("\n📋 Step 6: Linking Jobs to Invoice...");

    let linkedCount = 0;
    for (const job of uninvoicedJobs.slice(0, 4)) {
      await sql`
        UPDATE jobs
        SET 
          invoice_id = ${invoiceId},
          updated_at = NOW()
        WHERE id = ${job.id}
      `;
      linkedCount++;
    }
    console.log(
      `   ✅ Linked ${linkedCount} jobs to invoice ${invoice.invoice_number}`,
    );

    // Step 7: Summary Report
    console.log("\n📋 Step 7: Jobs & Invoicing Summary...");

    // Jobs by actual status and invoice link
    const jobsByStatus = await sql`
      SELECT 
        status,
        invoice_id IS NOT NULL as is_invoiced,
        COUNT(*) as count,
        SUM(quantity_cubic_meters) as total_volume,
        SUM(weight_kg) as total_weight,
        SUM(total_amount) as total_value
      FROM jobs
      WHERE team_id = ${teamId}
      GROUP BY status, (invoice_id IS NOT NULL)
      ORDER BY status
    `;

    console.log("\n   📊 Jobs by Status:");
    jobsByStatus.forEach((s) => {
      const displayStatus = s.is_invoiced ? `${s.status} (invoiced)` : s.status;
      console.log(`      ${displayStatus}: ${s.count} jobs`);
      console.log(
        `         Volume: ${parseFloat(s.total_volume).toFixed(1)} m³`,
      );
      console.log(
        `         Weight: ${(s.total_weight / 1000).toFixed(1)} tons`,
      );
      console.log(`         Value: $${(s.total_value / 100).toFixed(2)}`);
    });

    // Jobs by dirt type
    const jobsByType = await sql`
      SELECT 
        dirt_type,
        COUNT(*) as count,
        SUM(quantity_cubic_meters) as total_volume,
        AVG(price_per_cubic_meter) as avg_price
      FROM jobs
      WHERE team_id = ${teamId}
      GROUP BY dirt_type
      ORDER BY total_volume DESC
    `;

    console.log("\n   📊 Jobs by Dirt Type:");
    jobsByType.forEach((t) => {
      console.log(`      ${t.dirt_type.replace("_", " ")}: ${t.count} jobs`);
      console.log(
        `         Volume: ${parseFloat(t.total_volume).toFixed(1)} m³`,
      );
      console.log(`         Avg price: $${(t.avg_price / 100).toFixed(2)}/m³`);
    });

    // Top source locations
    const topLocations = await sql`
      SELECT 
        source_location,
        COUNT(*) as job_count,
        SUM(quantity_cubic_meters) as total_volume
      FROM jobs
      WHERE team_id = ${teamId}
      GROUP BY source_location
      ORDER BY total_volume DESC
      LIMIT 5
    `;

    console.log("\n   📊 Top Source Locations:");
    topLocations.forEach((loc, idx) => {
      console.log(`      ${idx + 1}. ${loc.source_location}`);
      console.log(
        `         Jobs: ${loc.job_count}, Volume: ${parseFloat(loc.total_volume).toFixed(1)} m³`,
      );
    });

    // Step 8: Test Job Search & Filter
    console.log("\n📋 Step 8: Testing Job Queries...");

    // Find jobs for specific dirt type
    const [contaminatedJobs] = await sql`
      SELECT COUNT(*) as count, SUM(total_amount) as total
      FROM jobs
      WHERE team_id = ${teamId}
      AND dirt_type = 'contaminated'
    `;
    console.log(
      `   🔍 Contaminated dirt jobs: ${contaminatedJobs.count} (Value: $${(contaminatedJobs.total / 100).toFixed(2)})`,
    );

    // Find today's jobs
    const [todaysJobs] = await sql`
      SELECT COUNT(*) as count
      FROM jobs
      WHERE team_id = ${teamId}
      AND scheduled_date = CURRENT_DATE
    `;
    console.log(`   🔍 Jobs scheduled today: ${todaysJobs.count}`);

    // Average job size
    const [avgJob] = await sql`
      SELECT 
        AVG(quantity_cubic_meters) as avg_volume,
        AVG(weight_kg) as avg_weight,
        AVG(total_amount) as avg_amount
      FROM jobs
      WHERE team_id = ${teamId}
    `;
    console.log(`   🔍 Average job size:`);
    console.log(`      Volume: ${parseFloat(avgJob.avg_volume).toFixed(1)} m³`);
    console.log(`      Weight: ${(avgJob.avg_weight / 1000).toFixed(1)} tons`);
    console.log(`      Value: $${(avgJob.avg_amount / 100).toFixed(2)}`);
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    console.error(error);
  } finally {
    await sql.end();
    await supabase.auth.signOut();
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ Jobs to Invoicing Testing Complete!");
  console.log("=".repeat(60));

  console.log("\n🎯 Key Features Demonstrated:");
  console.log("   ✅ Job creation with metric measurements (m³ and kg)");
  console.log("   ✅ Source location tracking");
  console.log("   ✅ Different dirt types with varying prices");
  console.log("   ✅ Job status workflow (pending → completed → invoiced)");
  console.log("   ✅ Batch invoice creation from multiple jobs");
  console.log("   ✅ Automatic line item generation from jobs");
  console.log("   ✅ Job-to-invoice linking");
  console.log("   ✅ Analytics and reporting");

  console.log("\n📐 Measurement Standards:");
  console.log("   • Volume: Cubic meters (m³)");
  console.log("   • Weight: Kilograms (kg) / Tons for display");
  console.log("   • Pricing: Cents per cubic meter");
  console.log("   • Common densities:");
  console.log("      - Clean fill: ~1500 kg/m³");
  console.log("      - Topsoil: ~1300 kg/m³");
  console.log("      - Clay: ~1900 kg/m³");
  console.log("      - Contaminated: ~1600 kg/m³");
}

// Run the test
testJobsToInvoicing().catch(console.error);
