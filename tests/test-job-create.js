import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ulncfblvuijlgniydjju.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsbmNmYmx2dWlqbGduaXlkamp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NTkxODUsImV4cCI6MjA3MjUzNTE4NX0.pCycxnDK259p3AqhTuet9k20ErxOYEJReDUI5iBG6Ik";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testJobCreate() {
  try {
    // Sign in
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: "admin@tocld.com",
        password: "Admin123",
      });

    if (authError) {
      console.error("Auth error:", authError);
      return;
    }

    console.log("✓ Authenticated successfully");
    const token = authData.session.access_token;

    // Test job creation
    const jobData = {
      teamId: "team_vHVRZjT2bVccNVRfqUcPXg",
      jobNumber: "TEST-" + Date.now(),
      contactPerson: "Test Person",
      contactNumber: "0400000000",
      rego: "ABC-123",
      loadNumber: 1,
      companyName: "Test Company",
      addressSite: "123 Test Street",
      equipmentType: "Truck & Quad 26m3",
      materialType: "Dry Clean Fill",
      pricePerUnit: 15,
      cubicMetreCapacity: 22,
      jobDate: new Date().toISOString().split("T")[0],
      status: "pending",
      createdBy: authData.user.id,
    };

    const response = await fetch("http://localhost:3334/trpc/job.create", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        json: jobData,
      }),
    });

    const responseText = await response.text();

    if (response.ok) {
      try {
        const result = JSON.parse(responseText);
        if (result.result?.data?.json) {
          console.log("✓ Job created successfully:", result.result.data.json);
        } else {
          console.log("✓ Job created (response):", result);
        }
      } catch (e) {
        console.log("Response:", responseText);
      }
    } else {
      console.error("✗ Failed to create job. Status:", response.status);
      console.error("Response:", responseText);
    }
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testJobCreate();
