#!/usr/bin/env node

// Test if the bulk linking dialog can fetch data properly

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ulncfblvuijlgniydjju.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsbmNmYmx2dWlqbGduaXlkamp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NTkxODUsImV4cCI6MjA3MjUzNTE4NX0.pCycxnDK259p3AqhTuet9k20ErxOYEJReDUI5iBG6Ik';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testBulkDialogData() {
  console.log('🧪 Testing Bulk Link Dialog Data Fetching\n');
  
  try {
    await supabase.auth.signInWithPassword({
      email: 'admin@tocld.com',
      password: 'Admin123',
    });

    const teamId = '3c371904-a765-4bac-bb7b-a28f5c59601d';
    
    // Test the same query the BulkLinkJobsDialog uses
    const customerName = "Acme Corporation";
    
    console.log(`Testing query for customer: "${customerName}"`);
    
    // Simulate the job query that the dialog uses
    const { data: allJobs, error } = await supabase
      .from('jobs')
      .select('id, job_number, company_name, customer_id, status, job_date, total_amount')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching jobs:', error);
      return;
    }

    console.log(`✅ Fetched ${allJobs.length} total jobs`);
    
    // Filter for unlinked jobs with matching company name (same logic as BulkLinkJobsDialog)
    const matchingJobs = allJobs.filter(job => 
      !job.customer_id && 
      job.company_name?.toLowerCase().includes(customerName.toLowerCase())
    );
    
    console.log(`✅ Found ${matchingJobs.length} matching unlinked jobs for "${customerName}":`);
    matchingJobs.forEach(job => {
      console.log(`  - ${job.job_number}: ${job.company_name} (${job.status}, $${(job.total_amount || 0) / 100})`);
    });
    
    // Test with another customer name
    const customerName2 = "TechStart Inc";
    const matchingJobs2 = allJobs.filter(job => 
      !job.customer_id && 
      job.company_name?.toLowerCase().includes(customerName2.toLowerCase())
    );
    
    console.log(`\n✅ Found ${matchingJobs2.length} matching unlinked jobs for "${customerName2}":`);
    matchingJobs2.forEach(job => {
      console.log(`  - ${job.job_number}: ${job.company_name} (${job.status}, $${(job.total_amount || 0) / 100})`);
    });
    
    if (matchingJobs.length === 0 && matchingJobs2.length === 0) {
      console.log('\n⚠️  No unlinked jobs found. The dialog would not show.');
      console.log('This might be why the bulk linking dialog is not appearing.');
    } else {
      console.log('\n✅ Data is available for bulk linking dialog.');
    }
    
    // Show current state
    console.log('\n📊 Current Jobs State:');
    allJobs.forEach(job => {
      const linkedStatus = job.customer_id ? '🔗 Linked' : '❌ Unlinked';
      console.log(`  ${job.job_number}: ${job.company_name} - ${linkedStatus}`);
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testBulkDialogData();