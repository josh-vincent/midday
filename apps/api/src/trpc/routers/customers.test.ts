// Set up environment variables
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || "test_resend_key";
process.env.RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID || "test_audience_id";
process.env.SUPABASE_URL = process.env.SUPABASE_URL || "http://localhost:54321";
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "test_anon_key";
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "test_service_key";
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/postgres";

import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import { connectDb } from "@midday/db/client";
import {
  createTestCaller,
  createTestTeam,
  createTestUser,
  createTestTeamMember,
  createTestCustomer,
  cleanupTestData,
} from "../__tests__/test-utils";
import { v4 as uuidv4 } from "uuid";

describe("customers router", () => {
  let db: any;
  let caller: any;
  const teamId = `test-team-${uuidv4()}`;
  const userId = `test-user-${uuidv4()}`;
  const customerId = `test-customer-${uuidv4()}`;

  beforeEach(async () => {
    db = await connectDb();
    
    await createTestUser(db, userId);
    await createTestTeam(db, teamId);
    await createTestTeamMember(db, teamId, userId);
    
    caller = await createTestCaller({
      teamId,
      session: {
        user: { id: userId, email: "test@example.com" },
        expires_at: Date.now() + 3600000,
        aud: "authenticated",
        sub: userId,
        email: "test@example.com",
        role: "authenticated",
      },
    });
  });

  afterEach(async () => {
    await cleanupTestData(db, teamId);
  });

  describe("get", () => {
    it("should fetch all customers for the team", async () => {
      await createTestCustomer(db, teamId, customerId);
      
      const result = await caller.customers.get();
      
      expect(result).toBeDefined();
      expect(result.data).toBeInstanceOf(Array);
      expect(result.data.length).toBeGreaterThanOrEqual(1);
    });

    it("should paginate customers", async () => {
      await createTestCustomer(db, teamId, customerId);
      const customerId2 = `test-customer-2-${uuidv4()}`;
      await createTestCustomer(db, teamId, customerId2);
      
      const result = await caller.customers.get({ limit: 1, offset: 0 });
      
      expect(result).toBeDefined();
      expect(result.data).toBeInstanceOf(Array);
      expect(result.data.length).toBeLessThanOrEqual(1);
    });

    it("should filter customers by search query", async () => {
      await createTestCustomer(db, teamId, customerId);
      
      const result = await caller.customers.get({ search: "Test Customer" });
      
      expect(result).toBeDefined();
      expect(result.data).toBeInstanceOf(Array);
      expect(result.data.length).toBeGreaterThanOrEqual(1);
    });

    it("should sort customers", async () => {
      const customerId1 = `test-customer-a-${uuidv4()}`;
      const customerId2 = `test-customer-b-${uuidv4()}`;
      
      await db.execute(`
        INSERT INTO customers (id, team_id, name, email, user_id)
        VALUES ($1, $2, $3, $4, $5)
      `, [customerId1, teamId, "A Customer", "a@example.com", userId]);
      
      await db.execute(`
        INSERT INTO customers (id, team_id, name, email, user_id)
        VALUES ($1, $2, $3, $4, $5)
      `, [customerId2, teamId, "B Customer", "b@example.com", userId]);
      
      const result = await caller.customers.get({ sort: "name", order: "asc" });
      
      expect(result).toBeDefined();
      expect(result.data).toBeInstanceOf(Array);
      expect(result.data.length).toBeGreaterThanOrEqual(2);
      
      const names = result.data.map((c: any) => c.name);
      const sortedNames = [...names].sort();
      expect(names).toEqual(sortedNames);
    });
  });

  describe("getById", () => {
    it("should fetch a customer by ID", async () => {
      await createTestCustomer(db, teamId, customerId);
      
      const result = await caller.customers.getById({ id: customerId });
      
      expect(result).toBeDefined();
      expect(result.id).toBe(customerId);
      expect(result.teamId).toBe(teamId);
      expect(result.name).toBe("Test Customer");
      expect(result.email).toBe("customer@example.com");
    });

    it("should return null for non-existent customer", async () => {
      const result = await caller.customers.getById({ id: "non-existent-id" });
      expect(result).toBeNull();
    });

    it("should not fetch customer from another team", async () => {
      const otherTeamId = `other-team-${uuidv4()}`;
      await createTestTeam(db, otherTeamId);
      
      const otherCustomerId = `other-customer-${uuidv4()}`;
      await createTestCustomer(db, otherTeamId, otherCustomerId);
      
      const result = await caller.customers.getById({ id: otherCustomerId });
      expect(result).toBeNull();
    });
  });

  describe("upsert", () => {
    describe("create", () => {
      it("should create a new customer", async () => {
        const newCustomerData = {
          name: "New Customer",
          email: "new@example.com",
          phone: "+1234567890",
          website: "https://example.com",
          address: "123 Main St",
          city: "New York",
          state: "NY",
          zipCode: "10001",
          country: "USA",
          notes: "Important customer",
          vatNumber: "VAT123456",
        };
        
        const result = await caller.customers.upsert(newCustomerData);
        
        expect(result).toBeDefined();
        expect(result.id).toBeDefined();
        expect(result.name).toBe(newCustomerData.name);
        expect(result.email).toBe(newCustomerData.email);
        expect(result.phone).toBe(newCustomerData.phone);
        expect(result.website).toBe(newCustomerData.website);
        expect(result.teamId).toBe(teamId);
        expect(result.userId).toBe(userId);
      });

      it("should create customer with minimal data", async () => {
        const minimalCustomerData = {
          name: "Minimal Customer",
        };
        
        const result = await caller.customers.upsert(minimalCustomerData);
        
        expect(result).toBeDefined();
        expect(result.id).toBeDefined();
        expect(result.name).toBe(minimalCustomerData.name);
        expect(result.teamId).toBe(teamId);
      });
    });

    describe("update", () => {
      it("should update an existing customer", async () => {
        await createTestCustomer(db, teamId, customerId);
        
        const updateData = {
          id: customerId,
          name: "Updated Customer",
          email: "updated@example.com",
          phone: "+9876543210",
          website: "https://updated.com",
          notes: "Updated notes",
        };
        
        const result = await caller.customers.upsert(updateData);
        
        expect(result).toBeDefined();
        expect(result.id).toBe(customerId);
        expect(result.name).toBe(updateData.name);
        expect(result.email).toBe(updateData.email);
        expect(result.phone).toBe(updateData.phone);
        expect(result.website).toBe(updateData.website);
        expect(result.notes).toBe(updateData.notes);
      });

      it("should partially update customer", async () => {
        await createTestCustomer(db, teamId, customerId);
        
        const partialUpdate = {
          id: customerId,
          name: "Partially Updated",
        };
        
        const result = await caller.customers.upsert(partialUpdate);
        
        expect(result).toBeDefined();
        expect(result.id).toBe(customerId);
        expect(result.name).toBe(partialUpdate.name);
        expect(result.email).toBe("customer@example.com");
      });

      it("should not update customer from another team", async () => {
        const otherTeamId = `other-team-${uuidv4()}`;
        await createTestTeam(db, otherTeamId);
        
        const otherCustomerId = `other-customer-${uuidv4()}`;
        await createTestCustomer(db, otherTeamId, otherCustomerId);
        
        const updateData = {
          id: otherCustomerId,
          name: "Should Not Update",
        };
        
        const result = await caller.customers.upsert(updateData);
        
        expect(result).toBeDefined();
        expect(result.affectedRows).toBe(0);
      });
    });
  });

  describe("delete", () => {
    it("should delete a customer", async () => {
      await createTestCustomer(db, teamId, customerId);
      
      const result = await caller.customers.delete({ id: customerId });
      
      expect(result).toBeDefined();
      expect(result.id).toBe(customerId);
      
      const checkDeleted = await caller.customers.getById({ id: customerId });
      expect(checkDeleted).toBeNull();
    });

    it("should not delete customer from another team", async () => {
      const otherTeamId = `other-team-${uuidv4()}`;
      await createTestTeam(db, otherTeamId);
      
      const otherCustomerId = `other-customer-${uuidv4()}`;
      await createTestCustomer(db, otherTeamId, otherCustomerId);
      
      const result = await caller.customers.delete({ id: otherCustomerId });
      
      expect(result).toBeDefined();
      expect(result.affectedRows).toBe(0);
      
      const stillExists = await db.execute(
        `SELECT id FROM customers WHERE id = $1`,
        [otherCustomerId]
      );
      expect(stillExists.rows.length).toBe(1);
    });

    it("should handle deletion of non-existent customer", async () => {
      const result = await caller.customers.delete({ id: "non-existent-id" });
      
      expect(result).toBeDefined();
      expect(result.affectedRows).toBe(0);
    });
  });

  describe("authorization", () => {
    it("should require authentication", async () => {
      const unauthenticatedCaller = await createTestCaller({
        teamId: undefined,
        session: null,
      });
      
      try {
        await unauthenticatedCaller.customers.get();
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });

    it("should require team membership", async () => {
      const callerWithoutTeam = await createTestCaller({
        teamId: undefined,
        session: {
          user: { id: userId, email: "test@example.com" },
          expires_at: Date.now() + 3600000,
          aud: "authenticated",
          sub: userId,
          email: "test@example.com",
          role: "authenticated",
        },
      });
      
      try {
        await callerWithoutTeam.customers.get();
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("data validation", () => {
    it("should validate email format when provided", async () => {
      const invalidEmailData = {
        name: "Invalid Email Customer",
        email: "not-an-email",
      };
      
      try {
        await caller.customers.upsert(invalidEmailData);
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });

    it("should validate required fields", async () => {
      const invalidData = {
        email: "test@example.com",
      };
      
      try {
        await caller.customers.upsert(invalidData);
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });
  });
});