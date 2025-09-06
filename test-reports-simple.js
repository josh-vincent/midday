import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://ulncfblvuijlgniydjju.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsbmNmYmx2dWlqbGduaXlkamp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NTkxODUsImV4cCI6MjA3MjUzNTE4NX0.pCycxnDK259p3AqhTuet9k20ErxOYEJReDUI5iBG6Ik';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test credentials
const email = 'admin@tocld.com';
const password = 'Admin123';

async function testReportsAPI() {
  console.log('🔐 Signing in...');
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('❌ Auth failed:', error.message);
    return;
  }

  console.log('✅ Authenticated successfully');
  const token = authData.session.access_token;

  // Test chart data endpoints
  console.log('\n📊 Testing chart data endpoints...\n');

  // Define date range for testing
  const from = '2024-01-01';
  const to = '2024-12-31';
  const teamId = 'team_vHVRZjT2bVccNVRfqUcPXg';

  // Test invoice chart data
  console.log('1. Testing invoice chart data...');
  try {
    const invoiceResponse = await fetch('http://localhost:3334/trpc/reports.revenue', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        json: { from, to, teamId }
      })
    });
    const invoiceData = await invoiceResponse.json();
    console.log('   ✅ Invoice data:', invoiceData.result?.data?.summary || 'No data');
  } catch (e) {
    console.log('   ❌ Invoice endpoint error:', e.message);
  }

  // Test expense chart data  
  console.log('2. Testing expense chart data...');
  try {
    const expenseResponse = await fetch('http://localhost:3334/trpc/reports.expense', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        json: { from, to, teamId }
      })
    });
    const expenseData = await expenseResponse.json();
    console.log('   ✅ Expense data:', expenseData.result?.data?.summary || 'No data');
  } catch (e) {
    console.log('   ❌ Expense endpoint error:', e.message);
  }

  // Test jobs chart data
  console.log('3. Testing jobs chart data...');
  try {
    const jobsResponse = await fetch('http://localhost:3334/trpc/reports.jobs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        json: { from, to, teamId }
      })
    });
    const jobsData = await jobsResponse.json();
    console.log('   ✅ Jobs data:', jobsData.result?.data?.summary || 'No data');
  } catch (e) {
    console.log('   ❌ Jobs endpoint error:', e.message);
  }

  // Test volume chart data
  console.log('4. Testing volume chart data...');
  try {
    const volumeResponse = await fetch('http://localhost:3334/trpc/reports.volume', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        json: { from, to, teamId }
      })
    });
    const volumeData = await volumeResponse.json();
    console.log('   ✅ Volume data:', volumeData.result?.data?.summary || 'No data');
  } catch (e) {
    console.log('   ❌ Volume endpoint error:', e.message);
  }

  console.log('\n✅ Test complete!');
}

testReportsAPI().catch(console.error);