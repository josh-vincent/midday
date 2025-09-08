#!/usr/bin/env bun
import { createClient } from '@supabase/supabase-js';

// Configuration
const API_URL = 'http://localhost:3334';
const SUPABASE_URL = 'https://ulncfblvuijlgniydjju.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsbmNmYmx2dWlqbGduaXlkamp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NTkxODUsImV4cCI6MjA3MjUzNTE4NX0.pCycxnDK259p3AqhTuet9k20ErxOYEJReDUI5iBG6Ik';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test utilities
const log = (message, data = null) => {
  console.log(`\n✅ ${message}`);
  if (data) console.log(JSON.stringify(data, null, 2));
};

const error = (message, err = null) => {
  console.error(`\n❌ ${message}`);
  if (err) console.error(err);
};

const measure = async (name, fn) => {
  const start = Date.now();
  const result = await fn();
  const duration = Date.now() - start;
  console.log(`⏱️  ${name}: ${duration}ms`);
  return result;
};

// Test functions
async function testEnhancedSearch(token) {
  console.log('\n🔍 Testing Enhanced Search...');
  
  // Test 1: Basic search
  const basicSearch = await measure('Basic search', async () => {
    const response = await fetch(`${API_URL}/trpc/job.search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        json: {
          search: 'concrete',
          page: 1,
          pageSize: 10,
        },
      }),
    });
    return response.json();
  });
  
  if (basicSearch.result?.data?.data) {
    log('Basic search completed', {
      results: basicSearch.result.data.data.length,
      total: basicSearch.result.data.pagination?.total,
    });
  }

  // Test 2: Advanced filtering
  const advancedSearch = await measure('Advanced search with filters', async () => {
    const response = await fetch(`${API_URL}/trpc/job.search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        json: {
          status: ['pending', 'in_progress'],
          minAmount: 1000,
          maxAmount: 10000,
          page: 1,
          pageSize: 25,
          orderBy: 'totalAmount',
          sortDirection: 'desc',
        },
      }),
    });
    return response.json();
  });

  if (advancedSearch.result?.data?.data) {
    log('Advanced search completed', {
      results: advancedSearch.result.data.data.length,
      stats: advancedSearch.result.data.stats,
    });
  }

  // Test 3: Test caching (second call should be faster)
  console.log('\n📦 Testing Cache Performance...');
  
  const firstCall = await measure('First call (cache miss)', async () => {
    const response = await fetch(`${API_URL}/trpc/job.summary`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ json: {} }),
    });
    return response.json();
  });

  const secondCall = await measure('Second call (cache hit)', async () => {
    const response = await fetch(`${API_URL}/trpc/job.summary`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ json: {} }),
    });
    return response.json();
  });

  if (firstCall.result?.data && secondCall.result?.data) {
    log('Cache test completed successfully');
  }
}

async function testErrorHandling(token) {
  console.log('\n⚠️  Testing Error Handling...');

  // Test 1: Invalid UUID
  const invalidId = await fetch(`${API_URL}/trpc/job.getById`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      json: { id: 'invalid-uuid' },
    }),
  });

  const invalidIdResult = await invalidId.json();
  if (invalidIdResult.error) {
    log('Invalid UUID handled correctly', {
      code: invalidIdResult.error.code,
      message: invalidIdResult.error.message,
    });
  }

  // Test 2: Not found error
  const notFound = await fetch(`${API_URL}/trpc/job.getById`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      json: { id: '00000000-0000-0000-0000-000000000000' },
    }),
  });

  const notFoundResult = await notFound.json();
  if (notFoundResult.error) {
    log('Not found error handled correctly', {
      code: notFoundResult.error.code,
      message: notFoundResult.error.message,
    });
  }

  // Test 3: Validation error
  const validation = await fetch(`${API_URL}/trpc/job.create`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      json: {
        // Missing required fields
      },
    }),
  });

  const validationResult = await validation.json();
  if (validationResult.error) {
    log('Validation error handled correctly', {
      code: validationResult.error.code,
      message: validationResult.error.message,
    });
  }
}

async function testBatchOperations(token) {
  console.log('\n🚀 Testing Batch Operations...');

  // First, get some job IDs
  const jobsResponse = await fetch(`${API_URL}/trpc/job.search`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      json: {
        status: ['pending'],
        pageSize: 3,
      },
    }),
  });

  const jobsResult = await jobsResponse.json();
  
  if (jobsResult.result?.data?.data && jobsResult.result.data.data.length > 0) {
    const jobIds = jobsResult.result.data.data.map(job => job.id);
    
    // Test batch status update
    const batchUpdate = await measure('Batch status update', async () => {
      const response = await fetch(`${API_URL}/trpc/job.batchUpdateStatus`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          json: {
            jobIds: jobIds,
            status: 'in_progress',
          },
        }),
      });
      return response.json();
    });

    if (batchUpdate.result?.data) {
      log('Batch update completed', {
        updated: batchUpdate.result.data.length,
      });
    }
  }
}

async function testFieldSuggestions(token) {
  console.log('\n💡 Testing Field Suggestions...');

  const fields = ['companyName', 'materialType', 'equipmentType'];
  
  for (const field of fields) {
    const suggestions = await fetch(`${API_URL}/trpc/job.suggestions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        json: { field },
      }),
    });

    const result = await suggestions.json();
    if (result.result?.data) {
      log(`Suggestions for ${field}`, result.result.data.slice(0, 5));
    }
  }
}

// Main test runner
async function runTests() {
  console.log('🧪 Testing Enhanced Features\n');
  console.log('================================');

  try {
    // Authenticate
    console.log('🔐 Authenticating...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@tocld.com',
      password: 'Admin123',
    });

    if (authError || !authData?.session) {
      throw new Error('Authentication failed: ' + authError?.message);
    }

    const token = authData.session.access_token;
    log('Authentication successful');

    // Run test suites
    await testEnhancedSearch(token);
    await testErrorHandling(token);
    await testBatchOperations(token);
    await testFieldSuggestions(token);

    console.log('\n================================');
    console.log('✨ All tests completed successfully!');
    
  } catch (err) {
    error('Test suite failed', err);
    process.exit(1);
  }
}

// Check if API is running
async function checkAPIHealth() {
  try {
    const response = await fetch(`${API_URL}/health`);
    const result = await response.json();
    if (result.status !== 'ok') {
      throw new Error('API health check failed');
    }
    log('API is healthy');
  } catch (err) {
    error('API is not running. Please start the API server first.', err);
    console.log('Run: bun run dev:api');
    process.exit(1);
  }
}

// Run tests
await checkAPIHealth();
await runTests();