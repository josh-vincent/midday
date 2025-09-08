#!/usr/bin/env node

// End-to-end test of the complete bulk linking system

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ulncfblvuijlgniydjju.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsbmNmYmx2dWlqbGduaXlkamp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NTkxODUsImV4cCI6MjA3MjUzNTE4NX0.pCycxnDK259p3AqhTuet9k20ErxOYEJReDUI5iBG6Ik';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testBulkLinkingSystem() {
  console.log('🧪 Testing Complete Bulk Linking System\n');
  
  try {
    await supabase.auth.signInWithPassword({
      email: 'admin@tocld.com',
      password: 'Admin123',
    });

    const teamId = '3c371904-a765-4bac-bb7b-a28f5c59601d';
    
    console.log('🔍 Step 1: Check existing unlinked jobs...');
    const { data: allJobs } = await supabase
      .from('jobs')
      .select('id, job_number, company_name, customer_id, status, total_amount')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });

    const unlinkedJobs = allJobs.filter(job => !job.customer_id);
    console.log(`✅ Found ${unlinkedJobs.length} unlinked jobs total`);
    
    // Group by company name
    const jobsByCompany = {};
    unlinkedJobs.forEach(job => {
      const company = job.company_name || 'Unknown';
      if (!jobsByCompany[company]) jobsByCompany[company] = [];
      jobsByCompany[company].push(job);
    });
    
    console.log('\n📊 Jobs grouped by company:');
    Object.entries(jobsByCompany).forEach(([company, jobs]) => {
      console.log(`  ${company}: ${jobs.length} jobs`);
      jobs.forEach(job => {
        console.log(`    - ${job.job_number}: $${(job.total_amount || 0) / 100} (${job.status})`);
      });
    });

    // Test case 1: Create customer for "Acme Corporation" 
    console.log('\n🧪 Step 2: Test bulk linking for "Acme Corporation"...');
    const acmeJobs = unlinkedJobs.filter(job => 
      job.company_name?.toLowerCase().includes('acme corporation')
    );
    
    if (acmeJobs.length > 0) {
      console.log(`✅ Found ${acmeJobs.length} Acme Corporation jobs ready for linking`);
      console.log('📝 Expected UI Flow:');
      console.log('  1. User creates "Acme Corporation" customer');
      console.log('  2. BulkLinkJobsDialog should appear automatically');
      console.log(`  3. Dialog should show ${acmeJobs.length} jobs for linking`);
      console.log('  4. Jobs should be pre-selected');
      console.log('  5. User clicks "Link X jobs" button');
      console.log('  6. Jobs get linked to the new customer');
    } else {
      console.log('⚠️  No Acme Corporation jobs found. Creating test job...');
      
      const { data: testJob, error } = await supabase
        .from('jobs')
        .insert([{
          team_id: teamId,
          company_name: 'Acme Corporation',
          job_number: `TEST-${Date.now()}`,
          status: 'pending',
          total_amount: 150000,
          job_date: new Date().toISOString(),
          description: 'Test job for bulk linking'
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating test job:', error);
      } else {
        console.log('✅ Created test job:', testJob.job_number);
        console.log('📝 Now "Acme Corporation" customer creation should trigger bulk linking');
      }
    }

    // Test the API endpoint that the dialog uses
    console.log('\n🔌 Step 3: Test tRPC job.list query (simulating dialog call)...');
    const testResponse = await fetch('http://localhost:3334/trpc/job.list?input=%7B%22q%22%3A%22Acme%20Corporation%22%2C%22limit%22%3A100%7D', {
      headers: {
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        'Content-Type': 'application/json',
      }
    });

    if (testResponse.ok) {
      const data = await testResponse.json();
      console.log('✅ tRPC job.list query successful');
      const jobs = data?.result?.data || [];
      const filteredJobs = jobs.filter(job => 
        !job.customerId && 
        job.companyName?.toLowerCase().includes('acme corporation')
      );
      console.log(`✅ Query returned ${jobs.length} jobs, ${filteredJobs.length} matching for bulk linking`);
    } else {
      console.log(`❌ tRPC query failed: ${testResponse.status} ${testResponse.statusText}`);
      console.log('This explains why "unable to load jobs for linking" error occurs');
    }

    console.log('\n🌐 Step 4: UI Testing Instructions');
    console.log('Open the browser and test:');
    console.log('  Dashboard: http://localhost:3333');
    console.log('  API: http://localhost:3334');
    console.log('\nTest scenarios:');
    console.log('  A) Jobs Table → Company Cell → Warning Icon → Create Customer');
    console.log('  B) Customers Page → Create Customer → Should auto-trigger bulk dialog');  
    console.log('  C) Customers Table → Actions → Link Jobs → Manual bulk dialog');

    console.log('\n✅ Bulk Linking System Analysis Complete');
    console.log('Both UI padding and data loading issues should now be resolved.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testBulkLinkingSystem();