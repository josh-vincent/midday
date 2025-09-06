// Test authentication flow and jobs page with Supabase
import { describe, test, expect } from "bun:test";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ulncfblvuijlgniydjju.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsbmNmYmx2dWlqbGduaXlkamp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NTkxODUsImV4cCI6MjA3MjUzNTE4NX0.pCycxnDK259p3AqhTuet9k20ErxOYEJReDUI5iBG6Ik";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

describe("Authentication Flow", () => {
  test("should authenticate and access API", async () => {
    // 1. Sign in with test credentials
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: "admin@tocld.com",
        password: "Admin123",
      });

    expect(authError).toBeNull();
    expect(authData).toBeDefined();
    expect(authData.user.email).toBe("admin@tocld.com");
    expect(authData.session.access_token).toBeDefined();

    // 2. Test API access with the token
    const response = await fetch("http://localhost:3334/trpc/job.summary", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authData.session.access_token}`,
        "Content-Type": "application/json",
      },
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.result?.data?.json).toBeDefined();

    // 3. Test creating a job
    const createResponse = await fetch(
      "http://localhost:3334/trpc/job.create",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authData.session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          json: {
            jobNumber: `TEST-${Date.now()}`,
            companyName: "Integration Test Co",
            contactPerson: "Test User",
            contactNumber: "0400 000 001",
            rego: "INT-TEST",
            loadNumber: 1,
            addressSite: "123 Integration Test St",
            materialType: "Test Material",
            equipmentType: "Test Equipment",
            pricePerUnit: 150,
            cubicMetreCapacity: 25,
            jobDate: new Date().toISOString().split("T")[0],
            status: "pending",
          },
        }),
      },
    );

    expect(createResponse.ok).toBe(true);
    const createData = await createResponse.json();
    const job = createData.result?.data?.json;
    expect(job).toBeDefined();
    expect(job.id).toBeDefined();
    expect(job.status).toBe("pending");

    // Sign out
    await supabase.auth.signOut();
  });
});
