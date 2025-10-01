#!/usr/bin/env node

// Test the improved customer-job matching logic for bulk linking

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ulncfblvuijlgniydjju.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsbmNmYmx2dWlqbGduaXlkamp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NTkxODUsImV4cCI6MjA3MjUzNTE4NX0.pCycxnDK259p3AqhTuet9k20ErxOYEJReDUI5iBG6Ik';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Simulate the improved matching logic
function testMatching(customerName, companyName) {
  const customerNameLower = customerName.toLowerCase();
  const companyNameLower = companyName.toLowerCase();
  
  // Strategy 1: Exact contains match
  if (companyNameLower.includes(customerNameLower) || 
      customerNameLower.includes(companyNameLower)) {
    return { match: true, strategy: 'exact-contains' };
  }
  
  // Strategy 2: Word-based matching
  const customerWords = customerNameLower.split(/[\s\-\._,]+/).filter(w => w.length > 2);
  const companyWords = companyNameLower.split(/[\s\-\._,]+/).filter(w => w.length > 2);
  
  const matchCount = customerWords.filter(customerWord => 
    companyWords.some(companyWord => 
      companyWord.includes(customerWord) || customerWord.includes(companyWord)
    )
  ).length;
  
  const required = Math.min(2, Math.ceil(customerWords.length / 2));
  const wordMatch = matchCount >= required;
  
  return {
    match: wordMatch,
    strategy: 'word-based',
    matchCount,
    required,
    customerWords,
    companyWords
  };
}

async function testCustomerJobMatching() {
  console.log('🧪 Testing Customer-Job Matching Logic\n');
  
  try {
    await supabase.auth.signInWithPassword({
      email: 'admin@tocld.com',
      password: 'Admin123',
    });

    const teamId = '3c371904-a765-4bac-bb7b-a28f5c59601d';
    
    // Get existing customers and unlinked jobs
    const [customersResult, jobsResult] = await Promise.all([
      supabase.from('customers').select('id, name').eq('team_id', teamId),
      supabase.from('jobs').select('id, company_name, customer_id').eq('team_id', teamId).is('customer_id', null)
    ]);
    
    const customers = customersResult.data || [];
    const unlinkedJobs = jobsResult.data || [];
    
    console.log(`Found ${customers.length} customers and ${unlinkedJobs.length} unlinked jobs\n`);
    
    // Test some specific matching scenarios
    const testCases = [
      { customerName: 'Acme Corporation', companyName: 'Acme Corporation' },
      { customerName: 'Acme Corp', companyName: 'Acme Corporation' },
      { customerName: 'John\'s Construction LLC', companyName: 'Johns Construction' },
      { customerName: 'TechStart Inc', companyName: 'TechStart' },
      { customerName: 'Global Solutions', companyName: 'Global Solutions LLC' },
      { customerName: 'ABC Company', companyName: 'XYZ Company' }, // Should not match
    ];
    
    console.log('🔍 Testing Matching Scenarios:');
    testCases.forEach(testCase => {
      const result = testMatching(testCase.customerName, testCase.companyName);
      console.log(`  Customer: "${testCase.customerName}" vs Job: "${testCase.companyName}"`);
      console.log(`    Match: ${result.match ? '✅' : '❌'} (${result.strategy})`);
      if (result.strategy === 'word-based') {
        console.log(`    Words: ${result.matchCount}/${result.required} required matches`);
      }
      console.log('');
    });
    
    // Test with real data
    console.log('🔍 Testing with Real Customer-Job Combinations:');
    let matchCount = 0;
    
    customers.slice(0, 5).forEach(customer => {
      const matches = unlinkedJobs.filter(job => {
        if (!job.company_name) return false;
        return testMatching(customer.name, job.company_name).match;
      });
      
      if (matches.length > 0) {
        console.log(`  Customer: "${customer.name}"`);
        matches.forEach(job => {
          console.log(`    ✅ Matches Job: "${job.company_name}"`);
        });
        matchCount += matches.length;
      }
    });
    
    console.log(`\n📊 Results: Found ${matchCount} potential matches using improved logic`);
    console.log('\n✨ The improved matching should now find more relevant jobs for customers!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCustomerJobMatching();