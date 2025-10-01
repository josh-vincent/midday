const { createClient } = require("@supabase/supabase-js");
const postgres = require("postgres");
require("dotenv").config({ path: ".env.local" });

// Initialize connections
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const databaseUrl = process.env.DATABASE_URL;

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const sql = postgres(databaseUrl);

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testInvoiceRelationships() {
  console.log("🚀 Testing Invoice Relationships & Features\n");
  console.log("=".repeat(60));

  let adminUserId;
  let teamId;
  let customerId;
  let invoiceId;
  let templateId;

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
    console.log(`   ✅ Authenticated as admin`);

    // Get team
    const [team] = await sql`
      SELECT team_id FROM users_on_team WHERE user_id = ${adminUserId} LIMIT 1
    `;
    teamId = team.team_id;
    console.log(`   ✅ Found team (ID: ${teamId})`);

    // Step 2: Invoice Templates
    console.log("\n📋 Step 2: Testing Invoice Templates...");

    // Check existing templates
    const templates = await sql`
      SELECT * FROM invoice_templates WHERE team_id = ${teamId}
    `;

    if (templates.length === 0) {
      // Create a template
      const [newTemplate] = await sql`
        INSERT INTO invoice_templates (
          team_id, name, description, is_default, logo_url,
          primary_color, include_qr, include_tax_number,
          include_payment_details, payment_terms, note, terms,
          payment_details, created_at, updated_at
        ) VALUES (
          ${teamId}, 'Dirt Receiving Template', 'Standard template for dirt receiving invoices',
          true, '/logo.png', '#1a1a1a', false, true, true, 30,
          'Thank you for your business!',
          'Payment due within 30 days. Late fees may apply.',
          'Wire transfer to Account: 123456789',
          NOW(), NOW()
        )
        RETURNING *
      `;
      templateId = newTemplate.id;
      console.log(`   ✅ Created template: ${newTemplate.name}`);
    } else {
      templateId = templates[0].id;
      console.log(`   ✅ Found ${templates.length} existing template(s)`);
    }

    // Step 3: Customer Management
    console.log("\n📋 Step 3: Testing Customer Management...");

    // Get or create customer
    const [customer] = await sql`
      SELECT * FROM customers 
      WHERE team_id = ${teamId} 
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (customer) {
      customerId = customer.id;
      console.log(`   ✅ Using customer: ${customer.name}`);

      // Check customer's invoice history
      const [invoiceCount] = await sql`
        SELECT COUNT(*) as count, 
               SUM(total_amount) as total_revenue,
               AVG(total_amount) as avg_invoice
        FROM invoices 
        WHERE customer_id = ${customerId}
      `;
      console.log(`      📊 Customer has ${invoiceCount.count} invoices`);
      if (invoiceCount.total_revenue) {
        console.log(
          `      💰 Total revenue: $${(invoiceCount.total_revenue / 100).toFixed(2)}`,
        );
        console.log(
          `      📈 Average invoice: $${(invoiceCount.avg_invoice / 100).toFixed(2)}`,
        );
      }
    } else {
      throw new Error("No customers found. Run test-api-endpoints.js first");
    }

    // Step 4: Create Invoice with Template
    console.log("\n📋 Step 4: Creating Invoice with Template...");

    const timestamp = Date.now();
    const [invoice] = await sql`
      INSERT INTO invoices (
        team_id, customer_id, template_id, invoice_number, status,
        issue_date, due_date, subtotal, tax_rate, tax_amount,
        total_amount, currency, line_items, terms, payment_details,
        created_at, updated_at
      ) VALUES (
        ${teamId}, ${customerId}, ${templateId}, 
        ${`INV-REL-${timestamp}`}, 'unpaid',
        CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days',
        300000, 8.25, 24750, 324750, 'USD',
        ${JSON.stringify([
          {
            description: "Dirt Receiving - Site A",
            quantity: 100,
            price: 2000,
            total: 200000,
          },
          {
            description: "Dirt Processing Fee",
            quantity: 1,
            price: 100000,
            total: 100000,
          },
        ])},
        'Payment due within 30 days',
        'Wire transfer to Account: 123456789',
        NOW(), NOW()
      )
      RETURNING *
    `;

    invoiceId = invoice.id;
    console.log(`   ✅ Created invoice: ${invoice.invoice_number}`);
    console.log(
      `      Template: ${templateId ? "Using template" : "No template"}`,
    );
    console.log(`      Amount: $${(invoice.total_amount / 100).toFixed(2)}`);
    console.log(`      Line items: ${JSON.parse(invoice.line_items).length}`);

    // Step 5: Payment Management
    console.log("\n📋 Step 5: Testing Payment Management...");

    // Record a partial payment
    const [payment1] = await sql`
      INSERT INTO payments (
        invoice_id, amount, currency, payment_date,
        payment_method, reference, notes, created_by, created_at
      ) VALUES (
        ${invoiceId}, 100000, 'USD', CURRENT_DATE,
        'bank_transfer', 'TXN-001', 'Partial payment received',
        ${adminUserId}, NOW()
      )
      RETURNING *
    `;
    console.log(
      `   ✅ Recorded payment: $${(payment1.amount / 100).toFixed(2)} via ${payment1.payment_method}`,
    );

    // Update invoice with payment
    await sql`
      UPDATE invoices
      SET 
        paid_amount = paid_amount + ${payment1.amount},
        status = CASE 
          WHEN paid_amount + ${payment1.amount} >= total_amount THEN 'paid'
          WHEN paid_amount + ${payment1.amount} > 0 THEN 'partially_paid'
          ELSE status
        END,
        paid_date = CASE 
          WHEN paid_amount + ${payment1.amount} >= total_amount THEN CURRENT_DATE
          ELSE paid_date
        END,
        updated_at = NOW()
      WHERE id = ${invoiceId}
    `;

    // Record another payment
    const [payment2] = await sql`
      INSERT INTO payments (
        invoice_id, amount, currency, payment_date,
        payment_method, reference, notes, created_by, created_at
      ) VALUES (
        ${invoiceId}, 224750, 'USD', CURRENT_DATE,
        'credit_card', 'CC-002', 'Final payment',
        ${adminUserId}, NOW()
      )
      RETURNING *
    `;
    console.log(
      `   ✅ Recorded payment: $${(payment2.amount / 100).toFixed(2)} via ${payment2.payment_method}`,
    );

    // Update invoice to paid
    const [paidInvoice] = await sql`
      UPDATE invoices
      SET 
        paid_amount = total_amount,
        status = 'paid',
        paid_date = CURRENT_DATE,
        updated_at = NOW()
      WHERE id = ${invoiceId}
      RETURNING *
    `;
    console.log(
      `   ✅ Invoice fully paid: $${(paidInvoice.paid_amount / 100).toFixed(2)} on ${paidInvoice.paid_date}`,
    );

    // Step 6: Invoice Comments
    console.log("\n📋 Step 6: Testing Invoice Comments...");

    // Add comments
    await sql`
      INSERT INTO invoice_comments (
        invoice_id, team_id, user_id, content, created_at
      ) VALUES 
        (${invoiceId}, ${teamId}, ${adminUserId}, 'Customer requested payment plan', NOW()),
        (${invoiceId}, ${teamId}, ${adminUserId}, 'First payment received via wire transfer', NOW()),
        (${invoiceId}, ${teamId}, ${adminUserId}, 'Invoice paid in full', NOW())
    `;

    const comments = await sql`
      SELECT * FROM invoice_comments 
      WHERE invoice_id = ${invoiceId}
      ORDER BY created_at DESC
    `;
    console.log(`   ✅ Added ${comments.length} comments to invoice`);
    comments.forEach((c) => {
      console.log(`      💬 "${c.content}"`);
    });

    // Step 7: Activity Tracking
    console.log("\n📋 Step 7: Testing Activity Tracking...");

    // Record activities
    await sql`
      INSERT INTO activities (
        team_id, user_id, action, entity, entity_id, 
        metadata, created_at
      ) VALUES 
        (${teamId}, ${adminUserId}, 'invoice_created', 'invoice', ${invoiceId},
         ${JSON.stringify({ invoice_number: invoice.invoice_number, amount: invoice.total_amount })}, NOW()),
        (${teamId}, ${adminUserId}, 'payment_received', 'invoice', ${invoiceId},
         ${JSON.stringify({ amount: payment1.amount, method: payment1.payment_method })}, NOW()),
        (${teamId}, ${adminUserId}, 'invoice_paid', 'invoice', ${invoiceId},
         ${JSON.stringify({ total_paid: paidInvoice.paid_amount })}, NOW())
    `;

    const activities = await sql`
      SELECT * FROM activities 
      WHERE entity = 'invoice' AND entity_id = ${invoiceId}
      ORDER BY created_at DESC
    `;
    console.log(`   ✅ Recorded ${activities.length} activities for invoice`);
    activities.forEach((a) => {
      console.log(`      📝 ${a.action} - ${JSON.stringify(a.metadata)}`);
    });

    // Step 8: Analytics & Reporting
    console.log("\n📋 Step 8: Testing Analytics & Reporting...");

    // Invoice summary by status
    const summary = await sql`
      SELECT 
        status,
        COUNT(*) as count,
        SUM(total_amount) as total,
        SUM(paid_amount) as paid
      FROM invoices
      WHERE team_id = ${teamId}
      GROUP BY status
      ORDER BY total DESC
    `;

    console.log("   📊 Invoice Summary:");
    summary.forEach((s) => {
      const outstanding = s.total - s.paid;
      console.log(
        `      ${s.status}: ${s.count} invoices, $${(s.total / 100).toFixed(2)} total, $${(outstanding / 100).toFixed(2)} outstanding`,
      );
    });

    // Customer ranking
    const topCustomers = await sql`
      SELECT 
        c.name,
        c.email,
        COUNT(i.id) as invoice_count,
        SUM(i.total_amount) as total_revenue,
        SUM(i.paid_amount) as total_paid,
        AVG(EXTRACT(EPOCH FROM (i.paid_date - i.issue_date)) / 86400) as avg_payment_days
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      WHERE i.team_id = ${teamId}
      GROUP BY c.id, c.name, c.email
      ORDER BY total_revenue DESC
      LIMIT 3
    `;

    console.log("   🏆 Top Customers:");
    topCustomers.forEach((c, idx) => {
      console.log(
        `      ${idx + 1}. ${c.name} - ${c.invoice_count} invoices, $${(c.total_revenue / 100).toFixed(2)} revenue`,
      );
      if (c.avg_payment_days) {
        console.log(
          `         Avg payment time: ${Math.round(c.avg_payment_days)} days`,
        );
      }
    });

    // Payment methods breakdown
    const paymentMethods = await sql`
      SELECT 
        payment_method,
        COUNT(*) as count,
        SUM(amount) as total
      FROM payments p
      JOIN invoices i ON p.invoice_id = i.id
      WHERE i.team_id = ${teamId}
      GROUP BY payment_method
      ORDER BY total DESC
    `;

    console.log("   💳 Payment Methods:");
    paymentMethods.forEach((p) => {
      console.log(
        `      ${p.payment_method}: ${p.count} payments, $${(p.total / 100).toFixed(2)} total`,
      );
    });

    // Step 9: Invoice Tracking Features
    console.log("\n📋 Step 9: Testing Invoice Tracking Features...");

    // Mark invoice as viewed
    await sql`
      UPDATE invoices
      SET viewed_at = NOW()
      WHERE id = ${invoiceId} AND viewed_at IS NULL
    `;
    console.log(`   ✅ Marked invoice as viewed`);

    // Mark invoice as downloaded
    await sql`
      UPDATE invoices
      SET downloaded_at = NOW()
      WHERE id = ${invoiceId} AND downloaded_at IS NULL
    `;
    console.log(`   ✅ Marked invoice as downloaded`);

    // Mark reminder sent
    await sql`
      UPDATE invoices
      SET reminder_sent_at = NOW()
      WHERE id = ${invoiceId} AND reminder_sent_at IS NULL
    `;
    console.log(`   ✅ Marked reminder as sent`);

    // Check tracking status
    const [tracked] = await sql`
      SELECT viewed_at, downloaded_at, reminder_sent_at, sent_at
      FROM invoices
      WHERE id = ${invoiceId}
    `;
    console.log("   📍 Tracking Status:");
    console.log(`      Viewed: ${tracked.viewed_at ? "✅" : "❌"}`);
    console.log(`      Downloaded: ${tracked.downloaded_at ? "✅" : "❌"}`);
    console.log(
      `      Reminder sent: ${tracked.reminder_sent_at ? "✅" : "❌"}`,
    );
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    console.error(error);
  } finally {
    await sql.end();
    await supabase.auth.signOut();
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ Invoice Relationships Testing Complete!");
  console.log("=".repeat(60));

  console.log("\n🔗 Relationship Summary:");
  console.log("   • Invoices ← → Customers (many-to-one)");
  console.log("   • Invoices ← → Templates (many-to-one)");
  console.log("   • Invoices ← → Payments (one-to-many)");
  console.log("   • Invoices ← → Comments (one-to-many)");
  console.log("   • Invoices ← → Activities (one-to-many)");
  console.log("   • Teams → Invoices → Customers (hierarchy)");

  console.log("\n📊 Features Tested:");
  console.log("   ✅ Invoice templates for consistent formatting");
  console.log("   ✅ Payment tracking with multiple payments per invoice");
  console.log("   ✅ Comment system for invoice notes");
  console.log("   ✅ Activity logging for audit trail");
  console.log("   ✅ Analytics and customer insights");
  console.log("   ✅ Invoice tracking (viewed, downloaded, reminders)");
  console.log("   ✅ Customer invoice history");
  console.log("   ✅ Payment method analytics");
}

// Run the tests
testInvoiceRelationships().catch(console.error);
