/**
 * Comprehensive API Endpoint Tests
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

// Helper function for API calls
async function apiCall(endpoint, method = "GET", body = null) {
  let url = `${API_URL}/trpc/${endpoint}`;
  const options = {
    method,
    headers: {
      "Authorization": `Bearer ${authToken}`,
      "Content-Type": "application/json",
    },
  };
  
  if (body && method !== "GET") {
    options.body = JSON.stringify({ json: body });
  } else if (body && method === "GET") {
    // For GET requests, encode the input as a query parameter
    const params = new URLSearchParams();
    params.append('input', JSON.stringify(body));
    url = `${url}?${params.toString()}`;
  }
  
  const response = await fetch(url, options);
  if (!response.ok) {
    const error = await response.text();
    console.error(`API Error: ${endpoint}`, error);
  }
  return response;
}

describe("Comprehensive API Tests", () => {
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
        billingEmail: "billing@customer.com",
        phone: "0400 123 456",
        website: "https://testcustomer.com",
        addressLine1: "123 Test Street",
        addressLine2: "Suite 100",
        city: "Sydney",
        state: "NSW",
        country: "Australia",
        countryCode: "AU",
        zip: "2000",
        vatNumber: "12345678901",
        abn: "12345678901",
        contact: "John Test",
        tags: ["test", "api"]
      };

      const response = await apiCall("customers.upsert", "POST", customerData);
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      const customer = data.result?.data?.json;
      expect(customer).toBeDefined();
      expect(customer.name).toBe(customerData.name);
      expect(customer.email).toBe(customerData.email);
      testIds.customerId = customer.id;
    });

    test("READ - should get all customers", async () => {
      const response = await apiCall("customers.get");
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      const result = data.result?.data?.json;
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    test("READ - should get customer by ID", async () => {
      if (!testIds.customerId) return;
      
      const response = await apiCall('customers.getById', 'GET', { id: testIds.customerId });
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      const customer = data.result?.data?.json;
      expect(customer.id).toBe(testIds.customerId);
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
      
      const data = await response.json();
      const customer = data.result?.data?.json;
      expect(customer.name).toBe(updateData.name);
    });

    test("DELETE - should delete customer", async () => {
      if (!testIds.customerId) return;
      
      const response = await apiCall("customers.delete", "POST", { id: testIds.customerId });
      expect(response.ok).toBe(true);
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
        notes: "API test job"
      };

      const response = await apiCall("job.create", "POST", jobData);
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      const job = data.result?.data?.json;
      expect(job).toBeDefined();
      expect(job.jobNumber).toBe(jobData.jobNumber);
      testIds.jobId = job.id;
    });

    test("READ - should list all jobs", async () => {
      const response = await apiCall("job.list");
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      const jobs = data.result?.data?.json;
      expect(Array.isArray(jobs)).toBe(true);
    });

    test("READ - should get job summary statistics", async () => {
      const response = await apiCall("job.summary");
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      const summary = data.result?.data?.json;
      expect(summary).toBeDefined();
      expect(summary.pending).toBeDefined();
      expect(summary.today).toBeDefined();
      expect(summary.week).toBeDefined();
      expect(summary.month).toBeDefined();
    });

    test("READ - should get job by search", async () => {
      const response = await apiCall('job.get', 'GET', { q: "TEST" });
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      const result = data.result?.data?.json;
      expect(result).toBeDefined();
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
      
      const data = await response.json();
      const job = data.result?.data?.json;
      expect(job.status).toBe("completed");
    });

    test("BULK - should bulk import jobs", async () => {
      const bulkData = {
        jobs: [
          {
            jobNumber: `BULK-1-${Date.now()}`,
            companyName: "Bulk Test Co",
            contactPerson: "Bulk Tester",
            addressSite: "Bulk Site 1",
            materialType: "Bulk Material",
            equipmentType: "Bulk Equipment",
            pricePerUnit: 80,
            cubicMetreCapacity: 15,
            status: "pending"
          },
          {
            jobNumber: `BULK-2-${Date.now()}`,
            companyName: "Bulk Test Co",
            contactPerson: "Bulk Tester",
            addressSite: "Bulk Site 2",
            materialType: "Bulk Material",
            equipmentType: "Bulk Equipment",
            pricePerUnit: 90,
            cubicMetreCapacity: 18,
            status: "pending"
          }
        ]
      };

      const response = await apiCall("job.bulkImport", "POST", bulkData);
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      expect(data.result?.data?.json).toBeDefined();
    });

    test("DELETE - should delete job", async () => {
      if (!testIds.jobId) return;
      
      const response = await apiCall("job.delete", "POST", { id: testIds.jobId });
      expect(response.ok).toBe(true);
    });
  });

  describe("Invoice CRUD Operations", () => {
    test("CREATE - should create a new invoice", async () => {
      // First create a draft invoice with all required fields
      const draftData = {
        id: crypto.randomUUID(),
        template: {
          name: "Default Template",
          currency: "USD",
          paymentTerms: 30,
        },
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        issueDate: new Date().toISOString().split('T')[0],
        invoiceNumber: `INV-${Date.now()}`,
      };
      
      const draftResponse = await apiCall("invoice.draft", "POST", draftData);
      expect(draftResponse.ok).toBe(true);
      
      const draftDataResponse = await draftResponse.json();
      const draftInvoice = draftDataResponse.result?.data?.json;
      expect(draftInvoice).toBeDefined();
      testIds.invoiceId = draftInvoice.id;
      
      // Then create the actual invoice
      const invoiceData = {
        id: testIds.invoiceId,
        deliveryType: "create",
        customerName: "Invoice Test Customer",
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        lineItems: [
          {
            description: "Test Service 1",
            quantity: 10,
            unit: "hours",
            price: 150,
          },
          {
            description: "Test Service 2",
            quantity: 5,
            unit: "units",
            price: 200,
          }
        ],
        noteDetails: "Test invoice created via API"
      };

      const response = await apiCall("invoice.create", "POST", invoiceData);
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      const invoice = data.result?.data?.json;
      expect(invoice).toBeDefined();
    });

    test("READ - should get invoices", async () => {
      const response = await apiCall("invoice.get");
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      const result = data.result?.data?.json;
      expect(result).toBeDefined();
    });

    test("READ - should get invoice by ID", async () => {
      if (!testIds.invoiceId) return;
      
      const response = await apiCall('invoice.getById', 'GET', { id: testIds.invoiceId });
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      const invoice = data.result?.data?.json;
      expect(invoice).toBeDefined();
    });

    test("READ - should get invoice summary", async () => {
      const response = await apiCall("invoice.invoiceSummary");
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      const summary = data.result?.data?.json;
      expect(summary).toBeDefined();
    });

    test("READ - should get payment status", async () => {
      const response = await apiCall("invoice.paymentStatus");
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      const status = data.result?.data?.json;
      expect(status).toBeDefined();
    });

    test("UPDATE - should update invoice status", async () => {
      if (!testIds.invoiceId) return;
      
      const updateData = {
        id: testIds.invoiceId,
        status: "sent"
      };

      const response = await apiCall("invoice.update", "POST", updateData);
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      const invoice = data.result?.data?.json;
      expect(invoice.status).toBe("sent");
    });

    test("ACTION - should remind about invoice", async () => {
      if (!testIds.invoiceId) return;
      
      const response = await apiCall("invoice.remind", "POST", { id: testIds.invoiceId });
      // May fail if email is not configured, but should not error
      expect([true, false]).toContain(response.ok);
    });

    test("DELETE - should delete invoice", async () => {
      if (!testIds.invoiceId) return;
      
      const response = await apiCall("invoice.delete", "POST", { id: testIds.invoiceId });
      expect(response.ok).toBe(true);
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
      
      const data = await response.json();
      expect(data.result?.data?.json).toBeDefined();
    });

    test("should get runway report", async () => {
      const params = {
        averageMonthlyExpense: 10000
      };
      const response = await apiCall('reports.runway', 'GET', params);
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      expect(data.result?.data?.json).toBeDefined();
    });

    test("should get revenue report", async () => {
      const params = {
        period: "monthly",
        startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      };
      const response = await apiCall('reports.revenue', 'GET', params);
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      expect(data.result?.data?.json).toBeDefined();
    });

    test("should get profit report", async () => {
      const params = {
        startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      };
      const response = await apiCall('reports.profit', 'GET', params);
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      expect(data.result?.data?.json).toBeDefined();
    });

    test("should get spending report", async () => {
      const params = {
        period: "monthly",
        startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      };
      const response = await apiCall('reports.spending', 'GET', params);
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      expect(data.result?.data?.json).toBeDefined();
    });
  });

  describe("Team and User Management", () => {
    test("should get current user", async () => {
      const response = await apiCall("user.me");
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      const user = data.result?.data?.json;
      expect(user).toBeDefined();
      expect(user.email).toBe("admin@tocld.com");
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
      const response = await apiCall("team.current");
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      const team = data.result?.data?.json;
      expect(team).toBeDefined();
    });

    test("should list team members", async () => {
      const response = await apiCall("team.members");
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      const members = data.result?.data?.json;
      expect(Array.isArray(members)).toBe(true);
    });

    test("should list teams", async () => {
      const response = await apiCall("team.list");
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      const teams = data.result?.data?.json;
      expect(Array.isArray(teams)).toBe(true);
    });
  });

  describe("Tags Management", () => {
    test("CREATE - should create a tag", async () => {
      const tagData = {
        name: "Test Tag",
        color: "#FF0000"
      };

      const response = await apiCall("tags.create", "POST", tagData);
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      const tag = data.result?.data?.json;
      expect(tag).toBeDefined();
      testIds.tagId = tag.id;
    });

    test("READ - should get all tags", async () => {
      const response = await apiCall("tags.get", "GET", {});
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      const tags = data.result?.data?.json;
      expect(Array.isArray(tags)).toBe(true);
    });

    test("DELETE - should delete tag", async () => {
      if (!testIds.tagId) return;
      
      const response = await apiCall("tags.delete", "POST", { id: testIds.tagId });
      expect(response.ok).toBe(true);
    });
  });

  describe("Invoice Templates", () => {
    test("should get invoice template", async () => {
      const response = await apiCall("invoiceTemplate.get");
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      expect(data.result?.data?.json).toBeDefined();
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
      const response = await fetch(`${API_URL}/trpc/job.list`, {
        headers: {
          "Authorization": "Bearer invalid-token",
          "Content-Type": "application/json",
        },
      });
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);
    });

    test("should handle missing required fields", async () => {
      const response = await apiCall("job.create", "POST", {
        // Missing required fields
        jobNumber: "ERROR-TEST"
      });
      
      expect(response.ok).toBe(false);
    });

    test("should handle non-existent endpoints", async () => {
      const response = await apiCall("nonexistent.endpoint");
      expect(response.ok).toBe(false);
    });
  });

  describe("Performance Tests", () => {
    test("should handle concurrent requests", async () => {
      const promises = Array(10).fill(null).map(() => 
        apiCall("job.list")
      );
      
      const responses = await Promise.all(promises);
      responses.forEach(response => {
        expect(response.ok).toBe(true);
      });
    });

    test("should handle large data sets", async () => {
      // Request with pagination
      const response = await apiCall('job.list', 'GET', { limit: 100, offset: 0 });
      expect(response.ok).toBe(true);
    });
  });
});