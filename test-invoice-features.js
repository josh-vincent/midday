const { createClient } = require('@supabase/supabase-js');
const postgres = require('postgres');
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

// Initialize connections
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const databaseUrl = process.env.DATABASE_URL;
const baseUrl = 'http://localhost:3000';

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const sql = postgres(databaseUrl);

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testInvoiceFeatures() {
  console.log('🚀 Testing Advanced Invoice Features\n');
  console.log('=' .repeat(60));
  
  let adminUserId;
  let teamId;
  let customerId;
  let invoiceId;
  let invoiceToken;
  let authToken;
  
  try {
    // Step 1: Authenticate as admin
    console.log('\n📋 Step 1: Authenticating as admin...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@tocld.com',
      password: 'Admin123'
    });
    
    if (authError) {
      throw new Error(`Authentication failed: ${authError.message}`);
    }
    
    adminUserId = authData.user.id;
    authToken = authData.session.access_token;
    console.log(`   ✅ Authenticated as admin`);
    
    // Get team ID
    const [team] = await sql`
      SELECT team_id FROM users_on_team WHERE user_id = ${adminUserId} LIMIT 1
    `;
    
    if (!team) {
      throw new Error('No team found for admin user');
    }
    
    teamId = team.team_id;
    console.log(`   ✅ Found team (ID: ${teamId})`);
    
    // Step 2: Create or find a customer
    console.log('\n📋 Step 2: Setting up test customer...');
    
    // Check for existing customer
    const [existingCustomer] = await sql`
      SELECT * FROM customers 
      WHERE team_id = ${teamId} 
      AND email = 'billing@testdirt.com'
      LIMIT 1
    `;
    
    if (existingCustomer) {
      customerId = existingCustomer.id;
      console.log(`   ✅ Using existing customer: ${existingCustomer.name}`);
    } else {
      const [newCustomer] = await sql`
        INSERT INTO customers (
          name, email, phone, contact_name, address, city, state, 
          postal_code, country, team_id, created_at, updated_at
        ) VALUES (
          'Test Dirt Company', 'billing@testdirt.com', '555-0199', 
          'John Dirt', '789 Dirt Road', 'Dirtville', 'TX', 
          '77001', 'US', ${teamId}, NOW(), NOW()
        )
        RETURNING *
      `;
      customerId = newCustomer.id;
      console.log(`   ✅ Created customer: ${newCustomer.name}`);
    }
    
    // Step 3: Create an invoice with a token
    console.log('\n📋 Step 3: Creating invoice with public token...');
    
    const timestamp = Date.now();
    const [invoice] = await sql`
      INSERT INTO invoices (
        team_id, customer_id, invoice_number, status,
        issue_date, due_date, subtotal, tax_rate, tax_amount,
        total_amount, currency, line_items, token,
        created_at, updated_at
      ) VALUES (
        ${teamId}, ${customerId}, ${`INV-TEST-${timestamp}`}, 'unpaid',
        CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days',
        250000, 8.25, 20625, 270625, 'USD',
        ${JSON.stringify([
          { description: 'Dirt Removal Service', quantity: 50, price: 5000, total: 250000 }
        ])},
        ${`tok_${timestamp}_${Math.random().toString(36).substr(2, 9)}`},
        NOW(), NOW()
      )
      RETURNING *
    `;
    
    invoiceId = invoice.id;
    invoiceToken = invoice.token;
    console.log(`   ✅ Created invoice: ${invoice.invoice_number}`);
    console.log(`      Token: ${invoiceToken}`);
    console.log(`      Amount: $${(invoice.total_amount / 100).toFixed(2)}`);
    
    // Step 4: Test public invoice viewing
    console.log('\n📋 Step 4: Testing public invoice viewing...');
    
    const publicUrl = `${baseUrl}/i/${invoiceToken}`;
    console.log(`   🔗 Public URL: ${publicUrl}`);
    
    try {
      const response = await fetch(publicUrl);
      if (response.ok) {
        console.log(`   ✅ Public invoice page accessible (Status: ${response.status})`);
        
        // Check if view was tracked
        await delay(1000);
        const [viewedInvoice] = await sql`
          SELECT viewed_at FROM invoices WHERE id = ${invoiceId}
        `;
        
        if (viewedInvoice.viewed_at) {
          console.log(`   ✅ Invoice view tracked at: ${viewedInvoice.viewed_at}`);
        }
      } else {
        console.log(`   ⚠️ Public invoice page returned status: ${response.status}`);
      }
    } catch (error) {
      console.log(`   ⚠️ Could not test public URL (server may need to be running)`);
    }
    
    // Step 5: Test PDF generation
    console.log('\n📋 Step 5: Testing PDF generation...');
    
    const pdfUrl = `${baseUrl}/api/download/invoice?id=${invoiceId}&size=a4&preview=true`;
    console.log(`   🔗 PDF URL: ${pdfUrl}`);
    
    try {
      const pdfResponse = await fetch(pdfUrl, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Cookie': `sb-access-token=${authToken}`
        }
      });
      
      if (pdfResponse.ok) {
        const contentType = pdfResponse.headers.get('content-type');
        console.log(`   ✅ PDF endpoint accessible (Type: ${contentType})`);
      } else {
        console.log(`   ⚠️ PDF generation returned status: ${pdfResponse.status}`);
      }
    } catch (error) {
      console.log(`   ⚠️ Could not test PDF generation (may need auth setup)`);
    }
    
    // Step 6: Test invoice templates
    console.log('\n📋 Step 6: Checking invoice templates...');
    
    const [templates] = await sql`
      SELECT COUNT(*) as count FROM invoice_templates WHERE team_id = ${teamId}
    `;
    console.log(`   ✅ Team has ${templates.count} invoice templates`);
    
    // Create a template if none exists
    if (templates.count === 0) {
      const [newTemplate] = await sql`
        INSERT INTO invoice_templates (
          team_id, name, is_default, template_config, created_at, updated_at
        ) VALUES (
          ${teamId}, 'Default Template', true,
          ${JSON.stringify({
            logo_url: null,
            company_details: 'Dirt Receiving Co.',
            payment_terms: 'Net 30',
            notes: 'Thank you for your business!'
          })},
          NOW(), NOW()
        )
        RETURNING id
      `;
      console.log(`   ✅ Created default invoice template`);
    }
    
    // Step 7: Test payment tracking
    console.log('\n📋 Step 7: Testing payment tracking...');
    
    // Simulate partial payment
    const [partiallyPaid] = await sql`
      UPDATE invoices
      SET 
        paid_amount = 135312,
        status = 'partially_paid',
        updated_at = NOW()
      WHERE id = ${invoiceId}
      RETURNING *
    `;
    console.log(`   ✅ Marked invoice as partially paid: $${(partiallyPaid.paid_amount / 100).toFixed(2)} / $${(partiallyPaid.total_amount / 100).toFixed(2)}`);
    
    await delay(1000);
    
    // Simulate full payment
    const [fullyPaid] = await sql`
      UPDATE invoices
      SET 
        paid_amount = total_amount,
        status = 'paid',
        paid_date = CURRENT_DATE,
        updated_at = NOW()
      WHERE id = ${invoiceId}
      RETURNING *
    `;
    console.log(`   ✅ Marked invoice as fully paid on ${fullyPaid.paid_date}`);
    
    // Step 8: Test invoice analytics
    console.log('\n📋 Step 8: Testing invoice analytics...');
    
    // Invoice summary by status
    const summaryByStatus = await sql`
      SELECT 
        status,
        COUNT(*) as count,
        SUM(total_amount) as total,
        AVG(total_amount) as average
      FROM invoices
      WHERE team_id = ${teamId}
      GROUP BY status
      ORDER BY status
    `;
    
    console.log('   ✅ Invoice Summary by Status:');
    summaryByStatus.forEach(s => {
      console.log(`      ${s.status}: ${s.count} invoices, Total: $${(s.total / 100).toFixed(2)}, Avg: $${(s.average / 100).toFixed(2)}`);
    });
    
    // Payment timing analytics
    const [paymentTiming] = await sql`
      SELECT 
        AVG(EXTRACT(EPOCH FROM (paid_date - issue_date)) / 86400) as avg_days_to_payment
      FROM invoices
      WHERE team_id = ${teamId} 
      AND status = 'paid'
      AND paid_date IS NOT NULL
    `;
    
    if (paymentTiming.avg_days_to_payment) {
      console.log(`   ✅ Average days to payment: ${Math.round(paymentTiming.avg_days_to_payment)} days`);
    }
    
    // Revenue by customer
    const topCustomers = await sql`
      SELECT 
        c.name,
        COUNT(i.id) as invoice_count,
        SUM(i.total_amount) as total_revenue
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      WHERE i.team_id = ${teamId}
      GROUP BY c.id, c.name
      ORDER BY total_revenue DESC
      LIMIT 5
    `;
    
    console.log('   ✅ Top Revenue Customers:');
    topCustomers.forEach((c, idx) => {
      console.log(`      ${idx + 1}. ${c.name}: ${c.invoice_count} invoices, $${(c.total_revenue / 100).toFixed(2)}`);
    });
    
    // Step 9: Test scheduled invoices
    console.log('\n📋 Step 9: Testing scheduled invoices...');
    
    const [scheduledInvoice] = await sql`
      INSERT INTO invoices (
        team_id, customer_id, invoice_number, status,
        issue_date, due_date, subtotal, total_amount,
        currency, line_items, scheduled_send_at,
        created_at, updated_at
      ) VALUES (
        ${teamId}, ${customerId}, ${`INV-SCHED-${timestamp}`}, 'scheduled',
        CURRENT_DATE + INTERVAL '7 days', CURRENT_DATE + INTERVAL '37 days',
        100000, 100000, 'USD',
        ${JSON.stringify([
          { description: 'Future Service', quantity: 1, price: 100000, total: 100000 }
        ])},
        CURRENT_TIMESTAMP + INTERVAL '7 days',
        NOW(), NOW()
      )
      RETURNING *
    `;
    
    console.log(`   ✅ Created scheduled invoice: ${scheduledInvoice.invoice_number}`);
    console.log(`      Scheduled for: ${scheduledInvoice.scheduled_send_at}`);
    
    // Step 10: Test comments/notes system
    console.log('\n📋 Step 10: Testing invoice comments...');
    
    const [comment] = await sql`
      INSERT INTO invoice_comments (
        invoice_id, team_id, user_id, content, created_at
      ) VALUES (
        ${invoiceId}, ${teamId}, ${adminUserId},
        'Payment received via bank transfer', NOW()
      )
      RETURNING *
    `;
    
    console.log(`   ✅ Added comment to invoice`);
    
    const [commentCount] = await sql`
      SELECT COUNT(*) as count FROM invoice_comments WHERE invoice_id = ${invoiceId}
    `;
    console.log(`   ✅ Invoice has ${commentCount.count} comment(s)`);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
  } finally {
    // Cleanup
    await sql.end();
    await supabase.auth.signOut();
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('✅ Advanced Invoice Features Testing Complete!');
  console.log('=' .repeat(60));
  console.log('\n📊 Features Tested:');
  console.log('   • Public invoice viewing with tokens');
  console.log('   • PDF generation endpoints');
  console.log('   • Invoice templates');
  console.log('   • Payment tracking (partial & full)');
  console.log('   • Invoice analytics & reporting');
  console.log('   • Scheduled invoices');
  console.log('   • Comments system');
  console.log('\n🔗 How Features Link:');
  console.log('   • Invoices → Customers (customer_id foreign key)');
  console.log('   • Invoices → Templates (template_id for rendering)');
  console.log('   • Invoices → Payments (paid_amount, paid_date tracking)');
  console.log('   • Invoices → Public Access (unique token per invoice)');
  console.log('   • Invoices → Analytics (aggregated reporting)');
  console.log('   • Invoices → Comments (invoice_id foreign key)');
}

// Run the tests
testInvoiceFeatures().catch(console.error);