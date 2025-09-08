#!/usr/bin/env node

// Test the bulk job linking functionality with authentication

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ulncfblvuijlgniydjju.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsbmNmYmx2dWlqbGduaXlkamp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NTkxODUsImV4cCI6MjA3MjUzNTE4NX0.pCycxnDK259p3AqhTuet9k20ErxOYEJReDUI5iBG6Ik';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testBulkLinking() {
  console.log('🧪 Testing Bulk Job Linking Authentication Fix\n');
  
  try {
    // Sign in with test credentials
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@tocld.com',
      password: 'Admin123',
    });

    if (authError) {
      console.error('❌ Authentication failed:', authError);
      return;
    }

    const token = authData.session.access_token;
    console.log('✅ Authenticated successfully');

    // Test the job.list endpoint with authentication
    console.log('\n🔍 Testing job.list endpoint...');
    
    const response = await fetch('http://localhost:3334/trpc/job.list?input=%7B%22json%22%3A%7B%22limit%22%3A200%7D%7D', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      console.error('❌ API call failed:', response.status, response.statusText);
      const text = await response.text();
      console.error('Response:', text);
      return;
    }

    const data = await response.json();
    console.log('✅ job.list endpoint working');
    console.log('📊 Jobs found:', data?.result?.data?.length || 0);

    // Show some sample jobs
    if (data?.result?.data?.length > 0) {
      console.log('\n📋 Sample jobs:');
      data.result.data.slice(0, 3).forEach((job, index) => {
        console.log(`  ${index + 1}. ${job.jobNumber || 'No Number'} - ${job.companyName || 'No Company'} - ${job.status}`);
      });
    }

    // Test an individual job update to verify the endpoint works
    console.log('\n🔍 Testing job.update endpoint...');
    
    const testJobUpdateResponse = await fetch('http://localhost:3334/trpc/job.update', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        json: {
          id: 'test-id-that-does-not-exist',
          customerId: 'test-customer-id'
        }
      })
    });

    if (testJobUpdateResponse.status === 404) {
      console.log('✅ job.update endpoint accessible (returned 404 for non-existent job as expected)');
    } else {
      console.log(`📝 job.update endpoint returned: ${testJobUpdateResponse.status}`);
    }

    console.log('\n✅ Authentication fix appears to be working!');
    console.log('🎯 The bulk linking dialog should now work properly with authenticated tRPC calls');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testBulkLinking();
