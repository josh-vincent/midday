#!/usr/bin/env node

// Test the bulk job linking functionality to ensure it works with multiple jobs

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ulncfblvuijlgniydjju.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsbmNmYmx2dWlqbGduaXlkamp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NTkxODUsImV4cCI6MjA3MjUzNTE4NX0.pCycxnDK259p3AqhTuet9k20ErxOYEJReDUI5iBG6Ik';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testBulkJobLinking() {
  console.log('🧪 Testing Bulk Job Linking Functionality\n');
  
  try {
    await supabase.auth.signInWithPassword({
      email: 'admin@tocld.com',
      password: 'Admin123',
    });

    const teamId = '3c371904-a765-4bac-bb7b-a28f5c59601d';
    
    // First, create some test jobs if needed
    const testJobData = [
      {
        job_number: 'TEST-001',
        company_name: 'Test Company Alpha',
        job_date: new Date().toISOString(),
        status: 'pending',
        team_id: teamId,
        customer_id: null, // Make sure they're unlinked
      },
      {
        job_number: 'TEST-002', 
        company_name: 'Test Company Beta',
        job_date: new Date().toISOString(),
        status: 'in_progress',
        team_id: teamId,
        customer_id: null, // Make sure they're unlinked
      }
    ];

    // Check if test jobs already exist
    const { data: existingJobs } = await supabase
      .from('jobs')
      .select('*')
      .eq('team_id', teamId)
      .in('job_number', ['TEST-001', 'TEST-002']);

    let testJobs = existingJobs || [];

    // Create test jobs if they don't exist
    if (testJobs.length < 2) {
      console.log('Creating test jobs for bulk linking test...');
      const { data: newJobs, error } = await supabase
        .from('jobs')
        .insert(testJobData)
        .select();

      if (error) {
        console.error('Error creating test jobs:', error);
        return;
      }

      testJobs = newJobs;
      console.log(`✅ Created ${newJobs.length} test jobs`);
    } else {
      // Make sure they're unlinked
      await supabase
        .from('jobs')
        .update({ customer_id: null })
        .eq('team_id', teamId)
        .in('id', testJobs.map(j => j.id));
        
      console.log(`✅ Found ${testJobs.length} existing test jobs`);
    }

    // Get or create a test customer
    let testCustomer;
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('*')
      .eq('team_id', teamId)
      .eq('name', 'Test Customer for Bulk Link')
      .single();

    if (existingCustomer) {
      testCustomer = existingCustomer;
    } else {
      const { data: newCustomer, error } = await supabase
        .from('customers')
        .insert({
          name: 'Test Customer for Bulk Link',
          team_id: teamId,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating test customer:', error);
        return;
      }

      testCustomer = newCustomer;
    }

    console.log(`\n📋 Test Setup:`);
    console.log(`  Customer: ${testCustomer.name} (${testCustomer.id})`);
    console.log(`  Jobs to link: ${testJobs.length}`);
    testJobs.forEach(job => {
      console.log(`    - ${job.job_number}: ${job.company_name} (${job.status})`);
    });

    // Test the bulk linking via API calls (simulating the frontend)
    const token = (await supabase.auth.getSession()).data.session?.access_token;

    if (!token) {
      console.error('❌ No auth token available');
      return;
    }

    console.log('\n🔄 Testing bulk job linking via tRPC API...');

    // Test parallel updates using proper tRPC format
    const updatePromises = testJobs.map(async (job) => {
      const response = await fetch('http://localhost:3334/trpc/job.update', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          json: {
            id: job.id,
            customerId: testCustomer.id,
            companyName: testCustomer.name,
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Update failed for job ${job.job_number}: ${errorText}`);
      }

      const result = await response.json();
      if (result.error) {
        throw new Error(`tRPC error for job ${job.job_number}: ${result.error.message}`);
      }
      
      return result.result;
    });

    try {
      const results = await Promise.all(updatePromises);
      console.log(`✅ Successfully linked ${results.length} jobs in parallel`);
    } catch (error) {
      console.error('❌ Parallel update failed:', error.message);
      
      // Try sequential updates as fallback
      console.log('\n🔄 Trying sequential updates as fallback...');
      
      for (const job of testJobs) {
        try {
          const response = await fetch('http://localhost:3334/trpc/job.update', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              json: {
                id: job.id,
                customerId: testCustomer.id,
                companyName: testCustomer.name,
              }
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Sequential update failed for job ${job.job_number}:`, errorText);
            continue;
          }

          const result = await response.json();
          if (result.error) {
            console.error(`❌ tRPC error for job ${job.job_number}:`, result.error.message);
            continue;
          }

          console.log(`✅ Updated job ${job.job_number} sequentially`);
        } catch (error) {
          console.error(`❌ Exception updating job ${job.job_number}:`, error.message);
        }
      }
    }

    // Verify the links were created
    console.log('\n🔍 Verifying job links...');
    const { data: updatedJobs } = await supabase
      .from('jobs')
      .select('*')
      .eq('team_id', teamId)
      .in('id', testJobs.map(j => j.id));

    const linkedJobs = updatedJobs?.filter(job => job.customer_id === testCustomer.id) || [];
    console.log(`✅ Successfully linked ${linkedJobs.length}/${testJobs.length} jobs to customer`);

    if (linkedJobs.length === testJobs.length) {
      console.log('\n🎉 Bulk job linking test PASSED!');
    } else {
      console.log(`\n❌ Bulk job linking test FAILED: Only ${linkedJobs.length}/${testJobs.length} jobs were linked`);
    }

    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await supabase
      .from('jobs')
      .delete()
      .eq('team_id', teamId)
      .in('job_number', ['TEST-001', 'TEST-002']);
      
    await supabase
      .from('customers')
      .delete()
      .eq('id', testCustomer.id);

    console.log('✅ Test cleanup completed');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testBulkJobLinking();