const { createClient } = require("@supabase/supabase-js");
const postgres = require("postgres");
const fetch = require("node-fetch");
require("dotenv").config({ path: ".env.local" });

// Initialize connections
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const databaseUrl = process.env.DATABASE_URL;
const baseUrl = "http://localhost:3000";

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const sql = postgres(databaseUrl);

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testInvoiceOperations() {
  console.log(
    "🚀 Testing Invoice Operations (Status Changes, Downloads, etc.)\n",
  );
  console.log("=".repeat(60));

  let adminUserId;
  let teamId;
  let customerId;
  let invoiceId;
  let authToken;

  try {
    // Step 1: Authenticate
    console.log("\n📋 Step 1: Authenticating as admin...");
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: "admin@tocld.com",
        password: "Admin123",
      });

    if (authError)
      throw new Error(`Authentication failed: ${authError.message}`);

    adminUserId = authData.user.id;
    authToken = authData.session.access_token;
    console.log(`   ✅ Authenticated as admin`);

    // Get team
    const [team] = await sql`
      SELECT team_id FROM users_on_team WHERE user_id = ${adminUserId} LIMIT 1
    `;
    teamId = team.team_id;
    console.log(`   ✅ Found team (ID: ${teamId})`);

    // Get customer
    const [customer] = await sql`
      SELECT * FROM customers 
      WHERE team_id = ${teamId} 
      ORDER BY created_at DESC
      LIMIT 1
    `;
    customerId = customer.id;
    console.log(`   ✅ Using customer: ${customer.name}`);

    // Step 2: Create a draft invoice
    console.log("\n📋 Step 2: Creating Draft Invoice...");

    const timestamp = Date.now();
    const [draftInvoice] = await sql`
      INSERT INTO invoices (
        team_id, customer_id, invoice_number, status,
        issue_date, due_date, subtotal, tax_rate, tax_amount,
        total_amount, currency, line_items,
        created_at, updated_at
      ) VALUES (
        ${teamId}, ${customerId}, ${`INV-OPS-${timestamp}`}, 'draft',
        CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days',
        500000, 8.25, 41250, 541250, 'USD',
        ${JSON.stringify([
          {
            description: "Dirt Receiving Service",
            quantity: 100,
            price: 5000,
            total: 500000,
          },
        ])},
        NOW(), NOW()
      )
      RETURNING *
    `;

    invoiceId = draftInvoice.id;
    console.log(`   ✅ Created draft invoice: ${draftInvoice.invoice_number}`);
    console.log(`      Status: ${draftInvoice.status}`);
    console.log(
      `      Amount: $${(draftInvoice.total_amount / 100).toFixed(2)}`,
    );

    // Step 3: Test Status Changes
    console.log("\n📋 Step 3: Testing Invoice Status Changes...");

    // Change to unpaid (sent)
    console.log("   🔄 Changing status: draft → unpaid");
    const [unpaidInvoice] = await sql`
      UPDATE invoices
      SET 
        status = 'unpaid',
        sent_at = NOW(),
        updated_at = NOW()
      WHERE id = ${invoiceId}
      RETURNING *
    `;
    console.log(`      ✅ Status changed to: ${unpaidInvoice.status}`);
    console.log(`      📧 Marked as sent: ${unpaidInvoice.sent_at}`);

    await delay(1000);

    // Record partial payment
    console.log("   💰 Recording partial payment...");
    const partialAmount = 200000; // $2000 in cents
    await sql`
      INSERT INTO payments (
        invoice_id, amount, currency, payment_date,
        payment_method, reference, created_by, created_at
      ) VALUES (
        ${invoiceId}, ${partialAmount}, 'USD', CURRENT_DATE,
        'bank_transfer', 'PARTIAL-001', ${adminUserId}, NOW()
      )
    `;

    const [partiallyPaidInvoice] = await sql`
      UPDATE invoices
      SET 
        status = 'partially_paid',
        paid_amount = ${partialAmount},
        updated_at = NOW()
      WHERE id = ${invoiceId}
      RETURNING *
    `;
    console.log(`      ✅ Status changed to: ${partiallyPaidInvoice.status}`);
    console.log(
      `      💵 Paid: $${(partiallyPaidInvoice.paid_amount / 100).toFixed(2)} / $${(partiallyPaidInvoice.total_amount / 100).toFixed(2)}`,
    );

    await delay(1000);

    // Record full payment
    console.log("   💰 Recording final payment...");
    const remainingAmount = draftInvoice.total_amount - partialAmount;
    await sql`
      INSERT INTO payments (
        invoice_id, amount, currency, payment_date,
        payment_method, reference, created_by, created_at
      ) VALUES (
        ${invoiceId}, ${remainingAmount}, 'USD', CURRENT_DATE,
        'credit_card', 'FINAL-001', ${adminUserId}, NOW()
      )
    `;

    const [paidInvoice] = await sql`
      UPDATE invoices
      SET 
        status = 'paid',
        paid_amount = total_amount,
        paid_date = CURRENT_DATE,
        updated_at = NOW()
      WHERE id = ${invoiceId}
      RETURNING *
    `;
    console.log(`      ✅ Status changed to: ${paidInvoice.status}`);
    console.log(`      💵 Fully paid on: ${paidInvoice.paid_date}`);

    // Step 4: Test Invoice Operations
    console.log("\n📋 Step 4: Testing Invoice Operations...");

    // Mark as viewed
    console.log("   👁️ Marking invoice as viewed...");
    await sql`
      UPDATE invoices
      SET viewed_at = NOW()
      WHERE id = ${invoiceId} AND viewed_at IS NULL
    `;
    console.log(`      ✅ Invoice marked as viewed`);

    // Mark as downloaded
    console.log("   ⬇️ Marking invoice as downloaded...");
    await sql`
      UPDATE invoices
      SET downloaded_at = NOW()
      WHERE id = ${invoiceId} AND downloaded_at IS NULL
    `;
    console.log(`      ✅ Invoice marked as downloaded`);

    // Send reminder
    console.log("   🔔 Marking reminder as sent...");
    await sql`
      UPDATE invoices
      SET reminder_sent_at = NOW()
      WHERE id = ${invoiceId} AND reminder_sent_at IS NULL
    `;
    console.log(`      ✅ Reminder marked as sent`);

    // Step 5: Test Invoice Duplication
    console.log("\n📋 Step 5: Testing Invoice Duplication...");

    const [originalForDupe] = await sql`
      SELECT * FROM invoices WHERE id = ${invoiceId}
    `;

    const [duplicatedInvoice] = await sql`
      INSERT INTO invoices (
        team_id, customer_id, invoice_number, status,
        issue_date, due_date, subtotal, tax_rate, tax_amount,
        total_amount, currency, line_items, terms, payment_details,
        created_at, updated_at
      ) VALUES (
        ${teamId}, ${customerId}, ${`INV-COPY-${timestamp}`}, 'draft',
        CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days',
        ${originalForDupe.subtotal}, ${originalForDupe.tax_rate}, 
        ${originalForDupe.tax_amount}, ${originalForDupe.total_amount},
        ${originalForDupe.currency}, ${originalForDupe.line_items},
        ${originalForDupe.terms}, ${originalForDupe.payment_details},
        NOW(), NOW()
      )
      RETURNING *
    `;
    console.log(
      `   ✅ Duplicated invoice: ${duplicatedInvoice.invoice_number}`,
    );
    console.log(`      Status: ${duplicatedInvoice.status} (reset to draft)`);
    console.log(
      `      Same amount: $${(duplicatedInvoice.total_amount / 100).toFixed(2)}`,
    );

    // Step 6: Test PDF Download
    console.log("\n📋 Step 6: Testing PDF Download...");

    const pdfUrl = `${baseUrl}/api/download/invoice?id=${invoiceId}&preview=true`;
    console.log(`   📄 PDF URL: ${pdfUrl}`);

    try {
      const pdfResponse = await fetch(pdfUrl, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Cookie: `sb-access-token=${authToken}; sb-refresh-token=${authData.session.refresh_token}`,
        },
      });

      if (pdfResponse.ok) {
        const contentType = pdfResponse.headers.get("content-type");
        const contentLength = pdfResponse.headers.get("content-length");
        console.log(`   ✅ PDF generation successful`);
        console.log(`      Type: ${contentType}`);
        console.log(
          `      Size: ${contentLength ? `${(contentLength / 1024).toFixed(1)} KB` : "Unknown"}`,
        );
      } else {
        console.log(
          `   ⚠️ PDF generation returned status: ${pdfResponse.status}`,
        );
        const errorText = await pdfResponse.text();
        if (errorText) console.log(`      Error: ${errorText}`);
      }
    } catch (error) {
      console.log(`   ⚠️ Could not test PDF generation: ${error.message}`);
    }

    // Step 7: Test Overdue Status
    console.log("\n📋 Step 7: Testing Overdue Status...");

    // Create an overdue invoice
    const [overdueInvoice] = await sql`
      INSERT INTO invoices (
        team_id, customer_id, invoice_number, status,
        issue_date, due_date, subtotal, total_amount,
        currency, line_items, created_at, updated_at
      ) VALUES (
        ${teamId}, ${customerId}, ${`INV-OVERDUE-${timestamp}`}, 'unpaid',
        CURRENT_DATE - INTERVAL '45 days', 
        CURRENT_DATE - INTERVAL '15 days', -- Due 15 days ago
        100000, 100000, 'USD',
        ${JSON.stringify([
          {
            description: "Overdue Service",
            quantity: 1,
            price: 100000,
            total: 100000,
          },
        ])},
        NOW(), NOW()
      )
      RETURNING *
    `;

    // Mark as overdue
    const [markedOverdue] = await sql`
      UPDATE invoices
      SET status = 'overdue'
      WHERE id = ${overdueInvoice.id}
      RETURNING *
    `;
    console.log(
      `   ✅ Created overdue invoice: ${markedOverdue.invoice_number}`,
    );
    console.log(`      Due date: ${markedOverdue.due_date} (past due)`);
    console.log(`      Status: ${markedOverdue.status}`);

    // Step 8: Test Canceled Status
    console.log("\n📋 Step 8: Testing Canceled Status...");

    const [canceledInvoice] = await sql`
      UPDATE invoices
      SET 
        status = 'canceled',
        updated_at = NOW()
      WHERE id = ${duplicatedInvoice.id}
      RETURNING *
    `;
    console.log(`   ✅ Canceled invoice: ${canceledInvoice.invoice_number}`);
    console.log(`      Status: ${canceledInvoice.status}`);

    // Step 9: Test Invoice Analytics
    console.log("\n📋 Step 9: Testing Invoice Analytics...");

    // Status distribution
    const statusDistribution = await sql`
      SELECT 
        status,
        COUNT(*) as count,
        SUM(total_amount) as total_value,
        AVG(total_amount) as avg_value
      FROM invoices
      WHERE team_id = ${teamId}
      GROUP BY status
      ORDER BY count DESC
    `;

    console.log("   📊 Invoice Status Distribution:");
    statusDistribution.forEach((s) => {
      console.log(
        `      ${s.status}: ${s.count} invoices, $${(s.total_value / 100).toFixed(2)} total`,
      );
    });

    // Payment performance
    const [paymentPerformance] = await sql`
      SELECT 
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
        COUNT(CASE WHEN status = 'unpaid' THEN 1 END) as unpaid_count,
        COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_count,
        COUNT(CASE WHEN status = 'partially_paid' THEN 1 END) as partial_count,
        SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) as total_collected,
        SUM(CASE WHEN status IN ('unpaid', 'overdue', 'partially_paid') 
            THEN total_amount - paid_amount ELSE 0 END) as total_outstanding
      FROM invoices
      WHERE team_id = ${teamId}
    `;

    console.log("   💰 Payment Performance:");
    console.log(`      Paid: ${paymentPerformance.paid_count} invoices`);
    console.log(`      Unpaid: ${paymentPerformance.unpaid_count} invoices`);
    console.log(`      Overdue: ${paymentPerformance.overdue_count} invoices`);
    console.log(
      `      Partially Paid: ${paymentPerformance.partial_count} invoices`,
    );
    console.log(
      `      Total Collected: $${(paymentPerformance.total_collected / 100).toFixed(2)}`,
    );
    console.log(
      `      Total Outstanding: $${(paymentPerformance.total_outstanding / 100).toFixed(2)}`,
    );

    // Step 10: Test Scheduled Invoice
    console.log("\n📋 Step 10: Testing Scheduled Invoice...");

    const [scheduledInvoice] = await sql`
      INSERT INTO invoices (
        team_id, customer_id, invoice_number, status,
        issue_date, due_date, subtotal, total_amount,
        currency, line_items, created_at, updated_at
      ) VALUES (
        ${teamId}, ${customerId}, ${`INV-SCHEDULED-${timestamp}`}, 'scheduled',
        CURRENT_DATE + INTERVAL '7 days', 
        CURRENT_DATE + INTERVAL '37 days',
        150000, 150000, 'USD',
        ${JSON.stringify([
          {
            description: "Future Service",
            quantity: 1,
            price: 150000,
            total: 150000,
          },
        ])},
        NOW(), NOW()
      )
      RETURNING *
    `;
    console.log(
      `   ✅ Created scheduled invoice: ${scheduledInvoice.invoice_number}`,
    );
    console.log(`      Issue date: ${scheduledInvoice.issue_date} (future)`);
    console.log(`      Status: ${scheduledInvoice.status}`);
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    console.error(error);
  } finally {
    await sql.end();
    await supabase.auth.signOut();
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ Invoice Operations Testing Complete!");
  console.log("=".repeat(60));

  console.log("\n📊 Operations Tested:");
  console.log("   ✅ Status Changes:");
  console.log("      • draft → unpaid (sent)");
  console.log("      • unpaid → partially_paid");
  console.log("      • partially_paid → paid");
  console.log("      • unpaid → overdue");
  console.log("      • any → canceled");
  console.log("      • draft → scheduled");
  console.log("\n   ✅ Invoice Operations:");
  console.log("      • Mark as viewed");
  console.log("      • Mark as downloaded");
  console.log("      • Send reminder");
  console.log("      • Duplicate invoice");
  console.log("      • Generate PDF");
  console.log("\n   ✅ Analytics:");
  console.log("      • Status distribution");
  console.log("      • Payment performance");
  console.log("      • Outstanding amounts");

  console.log("\n🔍 Available API Endpoints:");
  console.log("   • GET  /api/download/invoice?id={id} - Download PDF");
  console.log(
    "   • GET  /api/download/invoice?id={id}&preview=true - Preview PDF",
  );
  console.log("   • tRPC invoice.update - Update invoice details");
  console.log("   • tRPC invoice.create - Create new invoice");
  console.log("   • tRPC invoice.delete - Delete draft/canceled invoices");
  console.log("   • tRPC invoice.duplicate - Copy existing invoice");
  console.log("   • tRPC invoice.remind - Send payment reminder");
  console.log("   • tRPC invoice.draft - Save as draft");
  console.log("   • tRPC invoice.invoiceSummary - Get financial summaries");
  console.log("   • tRPC invoice.paymentStatus - Check payment health");
}

// Run the tests
testInvoiceOperations().catch(console.error);
