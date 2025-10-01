import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ulncfblvuijlgniydjju.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsbmNmYmx2dWlqbGduaXlkamp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NTkxODUsImV4cCI6MjA3MjUzNTE4NX0.pCycxnDK259p3AqhTuet9k20ErxOYEJReDUI5iBG6Ik';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInvoiceCreation() {
  console.log('Testing invoice creation functionality...\n');

  // Sign in as test user
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@tocld.com',
    password: 'Admin123',
  });

  if (authError) {
    console.error('❌ Authentication failed:', authError.message);
    return;
  }

  console.log('✓ Authenticated successfully');
  const token = authData.session.access_token;

  // Test 1: Get default invoice settings
  console.log('\n1. Testing defaultSettings endpoint...');
  const defaultSettingsResponse = await fetch('http://localhost:3334/trpc/invoice.defaultSettings', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });

  if (!defaultSettingsResponse.ok) {
    console.error('❌ Failed to get default settings:', await defaultSettingsResponse.text());
  } else {
    const settings = await defaultSettingsResponse.json();
    console.log('✓ Default settings retrieved successfully');
    console.log('  Invoice number:', settings.result?.data?.invoiceNumber);
  }

  // Test 2: Create a draft invoice
  console.log('\n2. Testing draft endpoint...');
  const draftData = {
    template: {
      currency: 'USD',
      customerLabel: 'Bill To',
      fromLabel: 'From',
      invoiceNoLabel: 'Invoice #',
      issueDateLabel: 'Date',
      dueDateLabel: 'Due Date',
      descriptionLabel: 'Description',
      priceLabel: 'Price',
      quantityLabel: 'Qty',
      totalLabel: 'Total',
      paymentLabel: 'Payment Details',
      noteLabel: 'Notes',
      includeVat: false,
      includeTax: false,
      includeDiscount: false,
      includeDecimals: true,
      includeUnits: true,
      size: 'a4',
      deliveryType: 'create'
    },
    fromDetails: 'Test Company\n123 Test St\nTest City, TC 12345',
    customerDetails: 'Customer Name\n456 Customer Ave\nCustomer City, CC 67890',
    customerName: 'Test Customer',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    issueDate: new Date().toISOString().split('T')[0],
    invoiceNumber: `INV-${Date.now()}`,
    lineItems: [
      { name: 'Test Service', quantity: 1, price: 100, vat: 0 }
    ],
    amount: 100,
    subtotal: 100,
    vat: 0,
    tax: 0,
    discount: 0
  };

  const draftResponse = await fetch('http://localhost:3334/trpc/invoice.draft', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ json: draftData })
  });

  if (!draftResponse.ok) {
    console.error('❌ Failed to create draft:', await draftResponse.text());
  } else {
    const draft = await draftResponse.json();
    console.log('✓ Draft created successfully');
    console.log('  Draft ID:', draft.result?.data?.id);
    console.log('  Status:', draft.result?.data?.status);
  }

  // Test 3: Check API server errors
  console.log('\n3. Checking API server for errors...');
  const apiStatus = await fetch('http://localhost:3334/health', {
    method: 'GET'
  }).catch(() => null);

  if (apiStatus && apiStatus.ok) {
    console.log('✓ API server is healthy');
  } else {
    console.log('⚠ API server health check not available');
  }

  console.log('\n✅ Invoice functionality test complete!');
}

testInvoiceCreation().catch(console.error);