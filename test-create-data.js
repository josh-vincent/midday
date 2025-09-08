#!/usr/bin/env node

// Create test data for company validation system testing

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ulncfblvuijlgniydjju.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsbmNmYmx2dWlqbGduaXlkamp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NTkxODUsImV4cCI6MjA3MjUzNTE4NX0.pCycxnDK259p3AqhTuet9k20ErxOYEJReDUI5iBG6Ik';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTestData() {
  console.log('🚀 Creating test data for company validation system\n');
  
  try {
    // 1. Sign in
    await supabase.auth.signInWithPassword({
      email: 'admin@tocld.com',
      password: 'Admin123',
    });

    const teamId = '3c371904-a765-4bac-bb7b-a28f5c59601d';

    // 2. Create test jobs with unlinked companies
    console.log('Creating test jobs with unlinked companies...');
    const testJobs = [
      {
        team_id: teamId,
        company_name: 'Acme Corporation',
        job_number: 'JOB-001',
        status: 'pending',
        total_amount: 150000, // $1500.00
        job_date: new Date().toISOString().split('T')[0],
        notes: 'Construction project',
        created_by: '99a44313-c400-42dc-a556-60be2d6354e1',
      },
      {
        team_id: teamId,
        company_name: 'Acme Corporation',
        job_number: 'JOB-002',
        status: 'in_progress',
        total_amount: 250000, // $2500.00
        job_date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
        notes: 'Demolition project',
        created_by: '99a44313-c400-42dc-a556-60be2d6354e1',
      },
      {
        team_id: teamId,
        company_name: 'TechStart Inc',
        job_number: 'JOB-003',
        status: 'pending',
        total_amount: 75000, // $750.00
        job_date: new Date().toISOString().split('T')[0],
        notes: 'Site preparation',
        created_by: '99a44313-c400-42dc-a556-60be2d6354e1',
      },
      {
        team_id: teamId,
        company_name: 'Global Solutions LLC',
        job_number: 'JOB-004',
        status: 'completed',
        total_amount: 500000, // $5000.00
        job_date: new Date(Date.now() - 172800000).toISOString().split('T')[0], // 2 days ago
        notes: 'Full excavation job',
        created_by: '99a44313-c400-42dc-a556-60be2d6354e1',
      }
    ];

    const { data: createdJobs, error: jobsError } = await supabase
      .from('jobs')
      .insert(testJobs)
      .select();

    if (jobsError) {
      console.error('❌ Failed to create jobs:', jobsError);
    } else {
      console.log(`✅ Created ${createdJobs.length} test jobs`);
      createdJobs.forEach(job => {
        console.log(`  - ${job.job_number}: ${job.company_name} ($${job.total_amount / 100})`);
      });
    }

    // 3. Create one customer that matches one of the companies
    console.log('\nCreating test customer...');
    const testCustomer = {
      team_id: teamId,
      name: 'Global Solutions LLC',
      email: 'contact@globalsolutions.com',
      phone: '+1 (555) 123-4567',
      website: 'globalsolutions.com',
    };

    const { data: createdCustomer, error: customerError } = await supabase
      .from('customers')
      .insert([testCustomer])
      .select()
      .single();

    if (customerError) {
      console.error('❌ Failed to create customer:', customerError);
    } else {
      console.log(`✅ Created test customer: ${createdCustomer.name}`);
    }

    console.log('\n🎉 Test data created successfully!');
    console.log('\nNow you can test:');
    console.log('1. Jobs table shows warning icons for Acme Corporation and TechStart Inc');
    console.log('2. Company validation system detects unlinked companies');
    console.log('3. Bulk linking dialog shows jobs for "Acme Corporation" when creating a customer with that name');
    console.log('4. Customer linking workflow from the jobs table');

  } catch (error) {
    console.error('❌ Failed to create test data:', error);
  }
}

// Run the test data creation
createTestData();