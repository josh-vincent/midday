#!/usr/bin/env node

// Detailed test of bulk job linking with verbose logging

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ulncfblvuijlgniydjju.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsbmNmYmx2dWlqbGduaXlkamp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NTkxODUsImV4cCI6MjA3MjUzNTE4NX0.pCycxnDK259p3AqhTuet9k20ErxOYEJReDUI5iBG6Ik';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testBulkJobLinking() {
  console.log('🧪 Detailed Bulk Job Linking Test\n');
  
  try {
    await supabase.auth.signInWithPassword({
      email: 'admin@tocld.com',
      password: 'Admin123',
    });

    // Use the team ID that's actually being used by the API (from the logs)
    const teamId = '45ef1539-1fec-4d7c-9465-d707fc288da5';
    console.log('Using team ID:', teamId);
    
    // Get some existing jobs that aren't linked
    const { data: existingJobs } = await supabase
      .from('jobs')
      .select('*')
      .eq('team_id', teamId)
      .is('customer_id', null)
      .limit(2);

    if (!existingJobs || existingJobs.length < 2) {
      console.log('❌ Need at least 2 unlinked jobs to test. Creating some...');
      
      const testJobData = [
        {
          job_number: 'TEST-BLK-001',
          company_name: 'Bulk Test Company Alpha',
          job_date: new Date().toISOString(),
          status: 'pending',
          team_id: teamId,
          customer_id: null,
        },
        {
          job_number: 'TEST-BLK-002', 
          company_name: 'Bulk Test Company Beta',
          job_date: new Date().toISOString(),
          status: 'in_progress',
          team_id: teamId,
          customer_id: null,
        }
      ];

      const { data: newJobs, error } = await supabase
        .from('jobs')
        .insert(testJobData)
        .select();

      if (error) {
        console.error('Error creating test jobs:', error);
        return;
      }

      existingJobs.push(...newJobs);
      console.log(`✅ Created ${newJobs.length} test jobs`);
    }

    const testJobs = existingJobs.slice(0, 2);
    
    // Get or create a test customer
    let testCustomer;
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('*')
      .eq('team_id', teamId)
      .eq('name', 'Bulk Link Test Customer')
      .single();

    if (existingCustomer) {
      testCustomer = existingCustomer;
    } else {
      const { data: newCustomer, error } = await supabase
        .from('customers')
        .insert({
          name: 'Bulk Link Test Customer',
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
      console.log(`    - ${job.job_number}: ${job.company_name} (status: ${job.status}, customer_id: ${job.customer_id})`);
    });

    // Get auth token
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    if (!token) {
      console.error('❌ No auth token available');
      return;
    }

    console.log('\n🔄 Testing single job update first...');
    
    // Test updating the first job
    const testJob = testJobs[0];
    
    console.log(`\n📤 Updating job ${testJob.job_number}:`);
    console.log(`  Job ID: ${testJob.id}`);
    console.log(`  Customer ID: ${testCustomer.id}`);
    console.log(`  Company Name: ${testCustomer.name}`);
    
    const singleResponse = await fetch('http://localhost:3334/trpc/job.update', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        json: {
          id: testJob.id,
          customerId: testCustomer.id,
          companyName: testCustomer.name,
        }
      }),
    });

    console.log(`📥 Response status: ${singleResponse.status}`);
    
    if (!singleResponse.ok) {
      console.log('❌ Response not OK');
      const errorText = await singleResponse.text();
      console.log('Error body:', errorText);
      return;
    }

    const singleResult = await singleResponse.json();
    console.log('📦 Response body:', JSON.stringify(singleResult, null, 2));

    if (singleResult.error) {
      console.log('❌ tRPC Error:', singleResult.error);
      return;
    }

    console.log('✅ Single job update successful!');

    // Check if the job was actually updated
    const { data: updatedJob } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', testJob.id)
      .single();

    console.log(`\n🔍 Checking job ${testJob.job_number} after update:`);
    console.log(`  Customer ID: ${updatedJob.customer_id} (expected: ${testCustomer.id})`);
    console.log(`  Company Name: ${updatedJob.company_name} (expected: ${testCustomer.name})`);
    
    if (updatedJob.customer_id === testCustomer.id) {
      console.log('✅ Job was successfully linked!');
    } else {
      console.log('❌ Job was NOT linked');
      console.log('Full updated job:', JSON.stringify(updatedJob, null, 2));
    }

    // Now test the second job
    if (testJobs.length > 1) {
      console.log('\n🔄 Testing second job update...');
      
      const secondJob = testJobs[1];
      const secondResponse = await fetch('http://localhost:3334/trpc/job.update', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          json: {
            id: secondJob.id,
            customerId: testCustomer.id,
            companyName: testCustomer.name,
          }
        }),
      });

      if (secondResponse.ok) {
        const secondResult = await secondResponse.json();
        console.log('✅ Second job update successful!');
        
        // Check the second job
        const { data: updatedSecondJob } = await supabase
          .from('jobs')
          .select('*')
          .eq('id', secondJob.id)
          .single();

        if (updatedSecondJob.customer_id === testCustomer.id) {
          console.log('✅ Second job was successfully linked!');
        } else {
          console.log('❌ Second job was NOT linked');
        }
      } else {
        console.log('❌ Second job update failed');
      }
    }

    // Clean up test data
    console.log('\n🧹 Cleaning up...');
    
    // Reset jobs to unlinked
    await supabase
      .from('jobs')
      .update({ customer_id: null })
      .in('id', testJobs.map(j => j.id));
    
    // Delete test customer if we created it
    if (!existingCustomer) {
      await supabase
        .from('customers')
        .delete()
        .eq('id', testCustomer.id);
    }

    // Delete test jobs if we created them
    const testJobNumbers = testJobs.map(j => j.job_number).filter(n => n?.startsWith('TEST-BLK-'));
    if (testJobNumbers.length > 0) {
      await supabase
        .from('jobs')
        .delete()
        .in('job_number', testJobNumbers);
    }

    console.log('✅ Cleanup completed');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testBulkJobLinking();