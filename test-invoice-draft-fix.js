import { createClient } from "@supabase/supabase-js";

const API_URL = "http://localhost:3334";
const supabaseUrl = "https://ulncfblvuijlgniydjju.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsbmNmYmx2dWlqbGduaXlkamp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NTkxODUsImV4cCI6MjA3MjUzNTE4NX0.pCycxnDK259p3AqhTuet9k20ErxOYEJReDUI5iBG6Ik";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInvoiceDraft() {
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

  // First, let's check if there are any existing templates
  console.log("1. Checking for existing invoice templates...");
  const { data: templates, error: templateError } = await supabase
    .from('invoice_templates')
    .select('*')
    .limit(5);

  if (templateError) {
    console.log("Error fetching templates:", templateError);
  } else {
    console.log(`Found ${templates?.length || 0} templates`);
    if (templates?.length > 0) {
      console.log("First template:", templates[0]);
    }
  }

  // Test different draft scenarios
  console.log("\n2. Testing invoice.draft with different approaches...");

  // Approach 1: Completely minimal
  console.log("\nApproach 1: Completely empty object");
  let response = await fetch(`${API_URL}/trpc/invoice.draft`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      json: {}
    })
  });
  
  if (response.ok) {
    const data = await response.json();
    console.log("✅ Success! Draft ID:", data.result?.data?.json?.id);
  } else {
    const error = await response.json();
    console.log("❌ Failed:", error.error?.json?.message?.substring(0, 200));
  }

  // Approach 2: With explicit minimal fields
  console.log("\nApproach 2: With explicit minimal fields");
  const minimalData = {
    customerName: "Test Customer"
  };
  
  response = await fetch(`${API_URL}/trpc/invoice.draft`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      json: minimalData
    })
  });
  
  if (response.ok) {
    const data = await response.json();
    console.log("✅ Success! Draft ID:", data.result?.data?.json?.id);
  } else {
    const error = await response.json();
    console.log("❌ Failed:", error.error?.json?.message?.substring(0, 200));
  }

  // Let's also check the database connection directly
  console.log("\n3. Testing direct database access...");
  const { data: invoices, error: invoiceError } = await supabase
    .from('invoices')
    .select('id, invoice_number, status')
    .limit(3);

  if (invoiceError) {
    console.log("Error fetching invoices:", invoiceError);
  } else {
    console.log(`Found ${invoices?.length || 0} invoices in database`);
  }

  await supabase.auth.signOut();
  console.log("\n✅ Test complete!");
}

testInvoiceDraft().catch(console.error);