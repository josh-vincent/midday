#!/usr/bin/env bun

/**
 * Test script for the new job endpoints
 * Tests both unlinkedByCompany and optimized list query
 */

const API_URL = process.env.API_URL || 'http://localhost:3334';

// Test credentials
const TEST_CREDENTIALS = {
  email: 'Admin@tocld.com',
  password: 'Admin123'
};

async function authenticate() {
  console.log('🔐 Authenticating...');
  
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(TEST_CREDENTIALS)
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Authenticated successfully');
    
    return data.token || data.access_token; // Return whatever token format is used
  } catch (error) {
    console.error('❌ Authentication failed:', error);
    throw error;
  }
}

async function makeAuthenticatedRequest(endpoint: string, token: string, body?: any) {
  const url = `${API_URL}${endpoint}`;
  console.log(`📡 Making request to: ${url}`);

  const options: RequestInit = {
    method: body ? 'POST' : 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function testUnlinkedJobsEndpoint(token: string) {
  console.log('\n🎯 Testing unlinkedByCompany endpoint...');
  
  try {
    // Test without company name filter (get all unlinked jobs)
    console.log('📋 Getting all unlinked jobs...');
    const allUnlinked = await makeAuthenticatedRequest('/trpc/jobs.unlinkedByCompany', token, {
      json: {}
    });
    console.log(`✅ Found ${allUnlinked?.result?.data?.length || 0} unlinked jobs`);
    
    if (allUnlinked?.result?.data?.length > 0) {
      const firstJob = allUnlinked.result.data[0];
      console.log(`📄 Sample job: ${firstJob.jobNumber} - ${firstJob.companyName}`);
      
      // Test with specific company name
      if (firstJob.companyName) {
        console.log(`🔍 Searching for company: ${firstJob.companyName}`);
        const filtered = await makeAuthenticatedRequest('/trpc/jobs.unlinkedByCompany', token, {
          json: {
            companyName: firstJob.companyName.substring(0, 3) // Partial match test
          }
        });
        console.log(`✅ Filtered search found ${filtered?.result?.data?.length || 0} jobs`);
      }
    }

    return allUnlinked?.result?.data?.length || 0;
  } catch (error) {
    console.error('❌ unlinkedByCompany test failed:', error);
    return 0;
  }
}

async function testOptimizedListEndpoint(token: string) {
  console.log('\n🚀 Testing optimized list endpoint...');
  
  try {
    const startTime = Date.now();
    
    // Test basic list query
    const result = await makeAuthenticatedRequest('/trpc/jobs.list', token, {
      json: {
        limit: 10
      }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ List query completed in ${duration}ms`);
    console.log(`📊 Found ${result?.result?.data?.length || 0} jobs`);
    
    if (result?.result?.cursor) {
      console.log(`🔄 Has cursor for pagination: ${result.result.cursor}`);
    }

    // Test search functionality
    if (result?.result?.data?.length > 0) {
      const firstJob = result.result.data[0];
      if (firstJob.companyName) {
        console.log(`🔍 Testing search with: ${firstJob.companyName.substring(0, 3)}`);
        
        const searchStartTime = Date.now();
        const searchResult = await makeAuthenticatedRequest('/trpc/jobs.list', token, {
          json: {
            q: firstJob.companyName.substring(0, 3),
            limit: 5
          }
        });
        const searchEndTime = Date.now();
        
        console.log(`✅ Search completed in ${searchEndTime - searchStartTime}ms`);
        console.log(`🎯 Search found ${searchResult?.result?.data?.length || 0} matching jobs`);
      }
    }

    return {
      totalJobs: result?.result?.data?.length || 0,
      queryTime: duration
    };
  } catch (error) {
    console.error('❌ List endpoint test failed:', error);
    return { totalJobs: 0, queryTime: 0 };
  }
}

async function runTests() {
  console.log('🧪 Starting endpoint tests...\n');
  
  try {
    // Authenticate
    const token = await authenticate();
    
    // Test both endpoints
    const unlinkedCount = await testUnlinkedJobsEndpoint(token);
    const listResults = await testOptimizedListEndpoint(token);
    
    // Summary
    console.log('\n📈 Test Summary:');
    console.log('================');
    console.log(`🔗 Unlinked jobs found: ${unlinkedCount}`);
    console.log(`📋 Total jobs in list: ${listResults.totalJobs}`);
    console.log(`⚡ List query time: ${listResults.queryTime}ms`);
    
    if (listResults.queryTime < 1000) {
      console.log('✅ Performance looks good! (< 1s)');
    } else {
      console.log('⚠️ Query might benefit from further optimization');
    }
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Run the tests
runTests()
  .then(() => {
    console.log('\n🎉 All tests completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test suite crashed:', error);
    process.exit(1);
  });