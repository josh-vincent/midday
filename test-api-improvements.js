/**
 * Test the API improvements
 */

import { createClient } from "@supabase/supabase-js";

const API_URL = "http://localhost:3334";
const supabaseUrl = "https://ulncfblvuijlgniydjju.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsbmNmYmx2dWlqbGduaXlkamp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NTkxODUsImV4cCI6MjA3MjUzNTE4NX0.pCycxnDK259p3AqhTuet9k20ErxOYEJReDUI5iBG6Ik";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testImprovements() {
  // Authenticate
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

  // Test 1: Reports now use startDate/endDate instead of from/to
  console.log("1. Testing reports with startDate/endDate...");
  const reportParams = {
    startDate: "2025-06-01",
    endDate: "2025-09-06",
    currency: "USD"
  };
  
  const reportResponse = await fetch(`${API_URL}/trpc/reports.burnRate?batch=1&input=${encodeURIComponent(JSON.stringify({"0":{"json":reportParams}}))}`, {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });
  
  console.log("Burn rate with startDate/endDate:", reportResponse.ok ? "✅ Success" : "❌ Failed");
  if (!reportResponse.ok) {
    const error = await reportResponse.json();
    console.log("Error:", error[0]?.error?.json?.message);
  }

  // Test 2: Invoice draft with minimal fields
  console.log("\n2. Testing invoice.draft with minimal fields...");
  const minimalDraftResponse = await fetch(`${API_URL}/trpc/invoice.draft`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      json: {} // Empty object - all fields should be optional now
    })
  });
  
  console.log("Minimal draft:", minimalDraftResponse.ok ? "✅ Success" : "❌ Failed");
  let draftId;
  if (minimalDraftResponse.ok) {
    const data = await minimalDraftResponse.json();
    draftId = data.result?.data?.json?.id;
    console.log("Draft created with ID:", draftId);
  } else {
    const error = await minimalDraftResponse.json();
    console.log("Error:", error.error?.json?.message);
  }

  // Test 3: Invoice.get and invoice.invoiceSummary with null
  console.log("\n3. Testing invoice endpoints with null...");
  
  // Test with batch format and null
  const getInvoicesResponse = await fetch(`${API_URL}/trpc/invoice.get?batch=1&input=${encodeURIComponent(JSON.stringify({"0":{"json":null}}))}`, {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });
  
  console.log("invoice.get with null:", getInvoicesResponse.ok ? "✅ Success" : "❌ Failed");
  
  const summaryResponse = await fetch(`${API_URL}/trpc/invoice.invoiceSummary?batch=1&input=${encodeURIComponent(JSON.stringify({"0":{"json":null}}))}`, {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });
  
  console.log("invoice.invoiceSummary with null:", summaryResponse.ok ? "✅ Success" : "❌ Failed");

  // Test 4: All reports endpoints with new parameter names
  console.log("\n4. Testing all report endpoints with startDate/endDate...");
  const reportEndpoints = [
    'reports.revenue',
    'reports.profit', 
    'reports.burnRate',
    'reports.runway',
    'reports.expense',
    'reports.spending',
    'reports.invoice',
    'reports.jobs',
    'reports.volume'
  ];

  for (const endpoint of reportEndpoints) {
    const response = await fetch(`${API_URL}/trpc/${endpoint}?batch=1&input=${encodeURIComponent(JSON.stringify({"0":{"json":reportParams}}))}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });
    console.log(`  ${endpoint}:`, response.ok ? "✅" : "❌");
  }

  // Clean up
  if (draftId) {
    await fetch(`${API_URL}/trpc/invoice.delete`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        json: { id: draftId }
      })
    });
  }

  await supabase.auth.signOut();
  console.log("\n✅ Test complete!");
}

testImprovements().catch(console.error);