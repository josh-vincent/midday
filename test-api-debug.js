/**
 * Debug script to test individual API endpoints and identify real issues
 */

import { createClient } from "@supabase/supabase-js";

const API_URL = "http://localhost:3334";
const supabaseUrl = "https://ulncfblvuijlgniydjju.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsbmNmYmx2dWlqbGduaXlkamp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NTkxODUsImV4cCI6MjA3MjUzNTE4NX0.pCycxnDK259p3AqhTuet9k20ErxOYEJReDUI5iBG6Ik";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test different API call formats
async function testAPIFormats() {
  // First authenticate
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: "admin@tocld.com",
    password: "Admin123",
  });

  if (error) {
    console.error("Auth failed:", error);
    return;
  }

  const token = authData.session.access_token;
  console.log("✅ Authenticated successfully\n");

  // Test 1: Create a customer first
  console.log("1. Testing customer creation...");
  const createResponse = await fetch(`${API_URL}/trpc/customers.upsert`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      json: {
        name: "Debug Test Customer",
        email: "debug@test.com",
      }
    })
  });

  const createData = await createResponse.json();
  console.log("Create response:", createResponse.ok ? "✅ Success" : "❌ Failed");
  
  let customerId;
  if (createResponse.ok && createData.result?.data?.json) {
    customerId = createData.result.data.json.id;
    console.log("Customer ID:", customerId);
  } else {
    console.log("Error:", createData.error);
  }

  // Test 2: Try different formats for getById
  if (customerId) {
    console.log("\n2. Testing customers.getById with different formats...");

    // Format A: Direct query parameter
    console.log("Format A: Direct query parameter");
    const responseA = await fetch(`${API_URL}/trpc/customers.getById?input=${encodeURIComponent(JSON.stringify({ id: customerId }))}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });
    console.log("Response:", responseA.ok ? "✅ Success" : "❌ Failed");
    if (!responseA.ok) {
      const errorA = await responseA.json();
      console.log("Error:", errorA.error?.json?.message);
    }

    // Format B: Batch format
    console.log("\nFormat B: Batch format");
    const batchInput = {
      "0": {
        json: { id: customerId }
      }
    };
    const responseB = await fetch(`${API_URL}/trpc/customers.getById?batch=1&input=${encodeURIComponent(JSON.stringify(batchInput))}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });
    console.log("Response:", responseB.ok ? "✅ Success" : "❌ Failed");
    if (!responseB.ok) {
      const errorB = await responseB.json();
      console.log("Error:", errorB[0]?.error?.json?.message || errorB);
    }

    // Format C: POST request with GET endpoint
    console.log("\nFormat C: POST request to GET endpoint");
    const responseC = await fetch(`${API_URL}/trpc/customers.getById`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        json: { id: customerId }
      })
    });
    console.log("Response:", responseC.ok ? "✅ Success" : "❌ Failed");
    if (responseC.ok) {
      const dataC = await responseC.json();
      console.log("Customer found:", dataC.result?.data?.json?.name);
    } else {
      const errorC = await responseC.json();
      console.log("Error:", errorC.error?.json?.message);
    }
  }

  // Test 3: Test invoice.draft with minimal fields
  console.log("\n3. Testing invoice.draft with different field combinations...");

  // Try minimal draft
  console.log("Minimal draft:");
  const minimalDraft = await fetch(`${API_URL}/trpc/invoice.draft`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      json: {}
    })
  });
  console.log("Response:", minimalDraft.ok ? "✅ Success" : "❌ Failed");
  if (!minimalDraft.ok) {
    const error = await minimalDraft.json();
    console.log("Required fields:", error.error?.json?.message);
  }

  // Try with required fields
  console.log("\nWith required fields:");
  const draftWithFields = await fetch(`${API_URL}/trpc/invoice.draft`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      json: {
        id: crypto.randomUUID(),
        template: {
          name: "Test Template",
          currency: "USD",
          paymentTerms: 30,
        },
        dueDate: "2025-10-06",
        issueDate: "2025-09-06",
        invoiceNumber: `INV-${Date.now()}`,
      }
    })
  });
  console.log("Response:", draftWithFields.ok ? "✅ Success" : "❌ Failed");
  if (!draftWithFields.ok) {
    const error = await draftWithFields.json();
    console.log("Error:", error.error?.json?.message);
  } else {
    const data = await draftWithFields.json();
    console.log("Draft created with ID:", data.result?.data?.json?.id);
  }

  // Test 4: Test job.create with minimal fields
  console.log("\n4. Testing job.create...");
  const jobResponse = await fetch(`${API_URL}/trpc/job.create`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      json: {
        jobNumber: `DEBUG-${Date.now()}`,
        companyName: "Debug Test Company",
        status: "pending"
      }
    })
  });
  console.log("Response:", jobResponse.ok ? "✅ Success" : "❌ Failed");
  if (!jobResponse.ok) {
    const error = await jobResponse.json();
    console.log("Error:", error.error?.json?.message);
  } else {
    const data = await jobResponse.json();
    console.log("Job created with ID:", data.result?.data?.json?.id);
  }

  // Test 5: Test tags.get
  console.log("\n5. Testing tags.get...");
  
  // Try as simple GET
  const tagsGet = await fetch(`${API_URL}/trpc/tags.get`, {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });
  console.log("Simple GET:", tagsGet.ok ? "✅ Success" : "❌ Failed");
  
  // Try with empty input
  const tagsGetWithInput = await fetch(`${API_URL}/trpc/tags.get?input=${encodeURIComponent(JSON.stringify({}))}`, {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });
  console.log("GET with empty input:", tagsGetWithInput.ok ? "✅ Success" : "❌ Failed");

  // Try as POST
  const tagsPost = await fetch(`${API_URL}/trpc/tags.get`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ json: {} })
  });
  console.log("POST request:", tagsPost.ok ? "✅ Success" : "❌ Failed");

  // Clean up
  if (customerId) {
    await fetch(`${API_URL}/trpc/customers.delete`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        json: { id: customerId }
      })
    });
  }

  await supabase.auth.signOut();
}

testAPIFormats().catch(console.error);