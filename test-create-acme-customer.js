#!/usr/bin/env node

// Test creating an "Acme Corporation" customer to trigger bulk linking dialog

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ulncfblvuijlgniydjju.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsbmNmYmx2dWlqbGduaXlkamp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NTkxODUsImV4cCI6MjA3MjUzNTE4NX0.pCycxnDK259p3AqhTuet9k20ErxOYEJReDUI5iBG6Ik';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCreateAcmeCustomer() {
  console.log('🧪 Testing Acme Corporation Customer Creation\n');
  
  try {
    await supabase.auth.signInWithPassword({
      email: 'admin@tocld.com',
      password: 'Admin123',
    });

    const teamId = '3c371904-a765-4bac-bb7b-a28f5c59601d';
    
    // Create an Acme Corporation customer
    console.log('Creating "Acme Corporation" customer...');
    
    const { data: newCustomer, error } = await supabase
      .from('customers')
      .insert([{
        team_id: teamId,
        name: 'Acme Corporation',
        email: 'contact@acmecorp.com',
        phone: '+1 (555) 000-0000',
        website: 'acmecorp.com',
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating customer:', error);
      return;
    }

    console.log('✅ Created customer:', newCustomer.name);
    
    // Now check what jobs should be available for linking
    const { data: matchingJobs } = await supabase
      .from('jobs')
      .select('job_number, company_name, customer_id, status, total_amount')
      .eq('team_id', teamId)
      .is('customer_id', null)
      .ilike('company_name', '%Acme Corporation%');

    console.log(`\n🔗 Jobs that should appear in bulk linking dialog:`);
    if (matchingJobs.length === 0) {
      console.log('  ⚠️  No matching jobs found!');
    } else {
      matchingJobs.forEach(job => {
        console.log(`  - ${job.job_number}: ${job.company_name} ($${(job.total_amount || 0) / 100})`);
      });
    }
    
    console.log(`\n✨ Expected UI Behavior:`);
    console.log('  1. Customer creation form should close');
    console.log('  2. BulkLinkJobsDialog should open automatically');
    console.log(`  3. Dialog should show ${matchingJobs.length} jobs for linking`);
    console.log('  4. All jobs should be pre-selected');
    console.log('  5. User can click "Link jobs" to complete the process');
    
    // Show the exact customer data that would be passed to the dialog
    console.log(`\n📝 Dialog Props:`);
    console.log(`  - customerName: "${newCustomer.name}"`);
    console.log(`  - customerId: "${newCustomer.id}"`);
    console.log(`  - open: true`);
    
    // Clean up - delete the test customer
    console.log(`\n🧹 Cleaning up test customer...`);
    await supabase
      .from('customers')
      .delete()
      .eq('id', newCustomer.id);
    console.log('✅ Test customer deleted');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCreateAcmeCustomer();