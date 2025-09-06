/**
 * Fixed Comprehensive API Endpoint Tests with correct tRPC formats
 * Tests all CRUD operations, statistics, and reporting endpoints
 */

import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { createClient } from "@supabase/supabase-js";

const API_URL = "http://localhost:3334";
const supabaseUrl = "https://ulncfblvuijlgniydjju.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsbmNmYmx2dWlqbGduaXlkamp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NTkxODUsImV4cCI6MjA3MjUzNTE4NX0.pCycxnDK259p3AqhTuet9k20ErxOYEJReDUI5iBG6Ik";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

let authToken;
let testIds = {
  customerId: null,
  jobId: null,
  invoiceId: null,
  tagId: null
};

// Helper function for API calls with proper tRPC format
async function apiCall(endpoint, method = "GET", body = null) {
  let url = `${API_URL}/trpc/${endpoint}`;
  const options = {
    method,
    headers: {
      "Authorization": `Bearer ${authToken}`,
      "Content-Type": "application/json",
    },
  };
  
  if (method === "POST") {
    // POST requests use json wrapper
    options.body = JSON.stringify({ json: body });
  } else if (method === "GET" && body !== null) {
    // GET requests with input use batch format
    const batchInput = {
      "0": {
        json: body
      }
    };
    url = `${url}?batch=1&input=${encodeURIComponent(JSON.stringify(batchInput))}`;
  } else if (method === "GET") {
    // GET requests without input use batch format with null
    const batchInput = {
      "0": {
        json: null
      }
    };
    url = `${url}?batch=1&input=${encodeURIComponent(JSON.stringify(batchInput))}`;
  }
  
  const response = await fetch(url, options);
  let data;
  
  if (method === "GET") {
    // GET responses come as array in batch format
    const batchResponse = await response.json();
    if (Array.isArray(batchResponse)) {
      data = batchResponse[0];
    } else {
      data = batchResponse;
    }
  } else {
    data = await response.json();
  }
  
  if (!response.ok) {
    console.error(`API Error: ${endpoint}`, data?.error || data);
  }
  
  return {
    ok: response.ok && !data?.error,
    data: data?.result?.data?.json || null,
    error: data?.error || null,
  };
}

describe("Fixed API Tests", () => {
  // Setup: Authenticate
  beforeAll(async () => {
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: "admin@tocld.com",
        password: "Admin123",
      });
      
      if (error) {
        console.error("Authentication failed:", error);
        throw error;
      }
      
      authToken = authData.session.access_token;
      console.log("✅ Authenticated successfully");
    } catch (err) {
      console.error("Failed to authenticate:", err);
      throw err;
    }
  });

  // Cleanup: Sign out
  afterAll(async () => {
    await supabase.auth.signOut();
  });

  describe("Customer CRUD Operations", () => {
    test("CREATE/UPDATE - should upsert a new customer", async () => {
      const customerData = {
        name: "Test Customer Inc",
        email: "test@customer.com",
        phone: "0400 123 456",
        city: "Sydney",
        state: "NSW",
        country: "Australia",
        zip: "2000",
      };

      const response = await apiCall("customers.upsert", "POST", customerData);
      expect(response.ok).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data.name).toBe(customerData.name);
      testIds.customerId = response.data.id;
    });

    test("READ - should get all customers", async () => {
      const response = await apiCall("customers.get", "GET");
      expect(response.ok).toBe(true);
      expect(response.data.data).toBeDefined();
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    test("READ - should get customer by ID", async () => {
      if (!testIds.customerId) return;
      
      const response = await apiCall('customers.getById', 'GET', { id: testIds.customerId });
      expect(response.ok).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data.id).toBe(testIds.customerId);
    });

    test("UPDATE - should update customer via upsert", async () => {
      if (!testIds.customerId) return;
      
      const updateData = {
        id: testIds.customerId,
        name: "Updated Test Customer",
        phone: "0400 999 888"
      };

      const response = await apiCall("customers.upsert", "POST", updateData);
      expect(response.ok).toBe(true);
      expect(response.data.name).toBe(updateData.name);
    });

    test("DELETE - should delete customer", async () => {
      if (!testIds.customerId) return;
      
      const response = await apiCall("customers.delete", "POST", { id: testIds.customerId });
      expect(response.ok).toBe(true);
      testIds.customerId = null;
    });
  });

  describe("Job CRUD Operations", () => {
    test("CREATE - should create a new job", async () => {
      const jobData = {
        jobNumber: `API-TEST-${Date.now()}`,
        companyName: "Test Company",
        contactPerson: "Test Person",
        contactNumber: "0400 111 222",
        rego: "TEST-123",
        loadNumber: 1,
        addressSite: "123 Test Site, Sydney NSW",
        materialType: "Test Material",
        equipmentType: "Test Equipment 20m³",
        pricePerUnit: 100,
        cubicMetreCapacity: 20,
        jobDate: new Date().toISOString().split('T')[0],
        status: "pending",
      };

      const response = await apiCall("job.create", "POST", jobData);
      expect(response.ok).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data.jobNumber).toBe(jobData.jobNumber);
      testIds.jobId = response.data.id;
    });

    test("READ - should list all jobs", async () => {
      const response = await apiCall("job.list", "GET");
      expect(response.ok).toBe(true);
      expect(Array.isArray(response.data)).toBe(true);
    });

    test("READ - should get job summary statistics", async () => {
      const response = await apiCall("job.summary", "GET");
      expect(response.ok).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data.pending).toBeDefined();
      expect(response.data.today).toBeDefined();
    });

    test("READ - should get jobs with search", async () => {
      const response = await apiCall('job.get', 'GET', { q: "TEST" });
      expect(response.ok).toBe(true);
      expect(response.data).toBeDefined();
    });

    test("UPDATE - should update job status", async () => {
      if (!testIds.jobId) return;
      
      const updateData = {
        id: testIds.jobId,
        status: "completed",
        notes: "Job completed via API test"
      };

      const response = await apiCall("job.update", "POST", updateData);
      expect(response.ok).toBe(true);
      expect(response.data.status).toBe("completed");
    });

    test("DELETE - should delete job", async () => {
      if (!testIds.jobId) return;
      
      const response = await apiCall("job.delete", "POST", { id: testIds.jobId });
      expect(response.ok).toBe(true);
      testIds.jobId = null;
    });
  });

  describe("Invoice Operations", () => {
    test("READ - should get invoices", async () => {
      const response = await apiCall("invoice.get", "GET");
      expect(response.ok).toBe(true);
      expect(response.data).toBeDefined();
    });

    test("READ - should get invoice summary", async () => {
      const response = await apiCall("invoice.invoiceSummary", "GET");
      expect(response.ok).toBe(true);
      expect(response.data).toBeDefined();
    });

    test("READ - should get payment status", async () => {
      const response = await apiCall("invoice.paymentStatus", "GET");
      expect(response.ok).toBe(true);
      expect(response.data).toBeDefined();
    });
  });

  describe("Reports and Statistics", () => {
    test("should get burn rate report", async () => {
      const params = {
        startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      };
      const response = await apiCall('reports.burnRate', 'GET', params);
      expect(response.ok).toBe(true);
      expect(response.data).toBeDefined();
    });

    test("should get runway report", async () => {
      const params = {
        averageMonthlyExpense: 10000
      };
      const response = await apiCall('reports.runway', 'GET', params);
      expect(response.ok).toBe(true);
      expect(response.data).toBeDefined();
    });

    test("should get revenue report", async () => {
      const params = {
        period: "monthly",
        startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      };
      const response = await apiCall('reports.revenue', 'GET', params);
      expect(response.ok).toBe(true);
      expect(response.data).toBeDefined();
    });

    test("should get profit report", async () => {
      const params = {
        startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      };
      const response = await apiCall('reports.profit', 'GET', params);
      expect(response.ok).toBe(true);
      expect(response.data).toBeDefined();
    });

    test("should get spending report", async () => {
      const params = {
        period: "monthly",
        startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      };
      const response = await apiCall('reports.spending', 'GET', params);
      expect(response.ok).toBe(true);
      expect(response.data).toBeDefined();
    });
  });

  describe("Team and User Management", () => {
    test("should get current user", async () => {
      const response = await apiCall("user.me", "GET");
      expect(response.ok).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data.email).toBe("admin@tocld.com");
    });

    test("should update user", async () => {
      const updateData = {
        full_name: "Admin User",
        locale: "en-US"
      };

      const response = await apiCall("user.update", "POST", updateData);
      expect(response.ok).toBe(true);
    });

    test("should get current team", async () => {
      const response = await apiCall("team.current", "GET");
      expect(response.ok).toBe(true);
      expect(response.data).toBeDefined();
    });

    test("should list team members", async () => {
      const response = await apiCall("team.members", "GET");
      expect(response.ok).toBe(true);
      expect(Array.isArray(response.data)).toBe(true);
    });

    test("should list teams", async () => {
      const response = await apiCall("team.list", "GET");
      expect(response.ok).toBe(true);
      expect(Array.isArray(response.data)).toBe(true);
    });
  });

  describe("Tags Management", () => {
    test("CREATE - should create a tag", async () => {
      const tagData = {
        name: `Test Tag ${Date.now()}`,
        color: "#FF0000"
      };

      const response = await apiCall("tags.create", "POST", tagData);
      expect(response.ok).toBe(true);
      expect(response.data).toBeDefined();
      testIds.tagId = response.data.id;
    });

    test("READ - should get all tags", async () => {
      const response = await apiCall("tags.get", "GET");
      expect(response.ok).toBe(true);
      expect(Array.isArray(response.data)).toBe(true);
    });

    test("DELETE - should delete tag", async () => {
      if (!testIds.tagId) return;
      
      const response = await apiCall("tags.delete", "POST", { id: testIds.tagId });
      expect(response.ok).toBe(true);
      testIds.tagId = null;
    });
  });

  describe("Invoice Templates", () => {
    test("should get invoice template", async () => {
      const response = await apiCall("invoiceTemplate.get", "GET");
      expect(response.ok).toBe(true);
      expect(response.data).toBeDefined();
    });

    test("should upsert invoice template", async () => {
      const templateData = {
        templateName: "Test Template",
        currency: "AUD",
        dateFormat: "DD/MM/YYYY",
        includeVat: true,
        includeDiscount: false
      };

      const response = await apiCall("invoiceTemplate.upsert", "POST", templateData);
      expect(response.ok).toBe(true);
    });
  });

  describe("Error Handling", () => {
    test("should handle invalid authentication", async () => {
      const response = await fetch(`${API_URL}/trpc/job.list?batch=1&input=${encodeURIComponent(JSON.stringify({"0":{"json":null}}))}`, {
        headers: {
          "Authorization": "Bearer invalid-token",
          "Content-Type": "application/json",
        },
      });
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);
    });

    test("should handle non-existent endpoints", async () => {
      const response = await apiCall("nonexistent.endpoint", "GET");
      expect(response.ok).toBe(false);
    });
  });

  describe("Performance Tests", () => {
    test("should handle concurrent requests", async () => {
      const promises = Array(5).fill(null).map(() => 
        apiCall("job.list", "GET")
      );
      
      const responses = await Promise.all(promises);
      responses.forEach(response => {
        expect(response.ok).toBe(true);
      });
    });
  });
});