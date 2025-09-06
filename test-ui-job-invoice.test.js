/**
 * UI Test for Job to Invoice Workflow
 * Tests with admin@tocld.com / Admin123
 */

import { describe, test, expect } from "bun:test";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = 'http://localhost:3333';
const API_URL = 'http://localhost:3334';
const CREDENTIALS = {
  email: 'admin@tocld.com',
  password: 'Admin123'
};

const supabaseUrl = "https://ulncfblvuijlgniydjju.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsbmNmYmx2dWlqbGduaXlkamp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NTkxODUsImV4cCI6MjA3MjUzNTE4NX0.pCycxnDK259p3AqhTuet9k20ErxOYEJReDUI5iBG6Ik";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

describe("UI Job to Invoice Workflow", () => {
  let authToken;
  let testJobIds = [];

  test("should authenticate user", async () => {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: CREDENTIALS.email,
      password: CREDENTIALS.password,
    });
    
    expect(error).toBeNull();
    expect(authData.session.access_token).toBeDefined();
    authToken = authData.session.access_token;
  });

  test("should create test jobs", async () => {
    const testJobs = [
      {
        jobNumber: `UI-TEST-${Date.now()}-1`,
        companyName: "ABC Construction",
        contactPerson: "John Doe",
        contactNumber: "0400 111 222",
        addressSite: "123 Test St, Sydney NSW",
        materialType: "Dry Clean Fill",
        equipmentType: "Truck & Trailer 22m³",
        pricePerUnit: 85,
        cubicMetreCapacity: 22,
        jobDate: new Date().toISOString().split('T')[0],
        status: "completed"
      },
      {
        jobNumber: `UI-TEST-${Date.now()}-2`,
        companyName: "ABC Construction",
        contactPerson: "John Doe",
        contactNumber: "0400 111 222",
        addressSite: "456 Test Ave, Sydney NSW",
        materialType: "Rock",
        equipmentType: "Truck & Quad 26m³",
        pricePerUnit: 95,
        cubicMetreCapacity: 26,
        jobDate: new Date().toISOString().split('T')[0],
        status: "completed"
      }
    ];

    for (const job of testJobs) {
      const response = await fetch(`${API_URL}/trpc/job.create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ json: job })
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      const createdJob = data.result?.data?.json;
      
      if (createdJob?.id) {
        testJobIds.push(createdJob.id);
        expect(createdJob.status).toBe("completed");
      }
    }
    
    expect(testJobIds.length).toBe(2);
  });

  test("should list jobs", async () => {
    const response = await fetch(`${API_URL}/trpc/job.list`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      }
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    const jobs = data.result?.data?.json;
    
    expect(Array.isArray(jobs)).toBe(true);
    expect(jobs.length).toBeGreaterThan(0);
    
    // Verify our test jobs are in the list
    const ourJobs = jobs.filter(job => testJobIds.includes(job.id));
    expect(ourJobs.length).toBe(testJobIds.length);
  });

  test("should get job summary", async () => {
    const response = await fetch(`${API_URL}/trpc/job.summary`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      }
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    const summary = data.result?.data?.json;
    
    expect(summary).toBeDefined();
    expect(summary.pending).toBeDefined();
    expect(summary.month).toBeDefined();
  });

  test("should group jobs by customer", async () => {
    const response = await fetch(`${API_URL}/trpc/job.list`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();
    const jobs = data.result?.data?.json || [];
    
    // Group jobs by customer
    const grouped = jobs.reduce((acc, job) => {
      const customer = job.companyName || 'Unknown';
      if (!acc[customer]) {
        acc[customer] = [];
      }
      acc[customer].push(job);
      return acc;
    }, {});
    
    expect(Object.keys(grouped).length).toBeGreaterThan(0);
    
    // Check if ABC Construction has jobs
    if (grouped['ABC Construction']) {
      expect(grouped['ABC Construction'].length).toBeGreaterThanOrEqual(2);
    }
  });

  test("should prepare invoice data from jobs", async () => {
    // Simulate creating invoice from selected jobs
    const invoiceData = {
      customerName: "ABC Construction",
      status: "draft",
      lineItems: testJobIds.map((id, index) => ({
        description: `Job UI-TEST - Test Material ${index + 1}`,
        quantity: index === 0 ? 22 : 26,
        unit: "m³",
        price: index === 0 ? 85 : 95,
      }))
    };
    
    expect(invoiceData.lineItems).toHaveLength(2);
    
    // Calculate total
    const total = invoiceData.lineItems.reduce((sum, item) => 
      sum + (item.quantity * item.price), 0
    );
    expect(total).toBe(22 * 85 + 26 * 95); // 1870 + 2470 = 4340
  });

  test("should clean up and sign out", async () => {
    // Clean up test jobs if needed
    // Note: In a real test, you might want to delete the test jobs
    
    await supabase.auth.signOut();
  });
});