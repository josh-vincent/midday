// Import test setup to configure all environment variables
import "../__tests__/test-setup";

import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { connectDb } from "@midday/db/client";
import { sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import {
  cleanupTestData,
  createTestCaller,
  createTestCustomer,
  createTestTeam,
  createTestTeamMember,
  createTestUser,
} from "../__tests__/test-utils";

describe("customers router", () => {
  let db: any;
  let caller: any;
  const teamId = uuidv4();
  const userId = uuidv4();
  const customerId = uuidv4();

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
      const customerId2 = uuidv4();
      await createTestCustomer(db, teamId, customerId2);

      const result = await caller.customers.get({ pageSize: 1 });

      expect(result).toBeDefined();
      expect(result.data).toBeInstanceOf(Array);
      expect(result.data.length).toBeLessThanOrEqual(1);
    });

    it("should filter customers by search query", async () => {
      await createTestCustomer(db, teamId, customerId);

      const result = await caller.customers.get({ q: "Test Customer" });

      expect(result).toBeDefined();
      expect(result.data).toBeInstanceOf(Array);
      expect(result.data.length).toBeGreaterThanOrEqual(1);
    });

    it("should sort customers", async () => {
      const customerId1 = uuidv4();
      const customerId2 = uuidv4();

      await db.execute(sql`
        INSERT INTO customers (id, team_id, name, email, token)
        VALUES (${customerId1}, ${teamId}, ${"A Customer"}, ${"a@example.com"}, ${"cust_a"})
      `);

      await db.execute(sql`
        INSERT INTO customers (id, team_id, name, email, token)
        VALUES (${customerId2}, ${teamId}, ${"B Customer"}, ${"b@example.com"}, ${"cust_b"})
      `);

      const result = await caller.customers.get({ sort: ["name", "asc"] });

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
      const nonExistentId = uuidv4();
      const result = await caller.customers.getById({ id: nonExistentId });
      expect(result).toBeNull();
    });

    it("should not fetch customer from another team", async () => {
      const otherTeamId = uuidv4();
      await createTestTeam(db, otherTeamId);

      const otherCustomerId = uuidv4();
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
          addressLine1: "123 Main St",
          city: "New York",
          state: "NY",
          zip: "10001",
          country: "USA",
          note: "Important customer",
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
      });

      it("should create customer with new fields (billingEmail, abn, countryCode, contact, addressLine2)", async () => {
        const customerWithNewFields = {
          name: "Customer with New Fields",
          email: "standard@example.com",
          billingEmail: "billing@example.com",
          phone: "+61123456789",
          website: "https://example.com.au",
          addressLine1: "123 Test St",
          addressLine2: "Suite 456",
          city: "Sydney",
          state: "NSW",
          zip: "2000",
          country: "Australia",
          countryCode: "AU",
          abn: "12345678901",
          contact: "John Smith - CEO",
          note: "VIP Customer",
          vatNumber: "VAT789",
        };

        const result = await caller.customers.upsert(customerWithNewFields);

        expect(result).toBeDefined();
        expect(result.id).toBeDefined();
        expect(result.name).toBe(customerWithNewFields.name);
        expect(result.email).toBe(customerWithNewFields.email);
        expect(result.billingEmail).toBe(customerWithNewFields.billingEmail);
        expect(result.addressLine1).toBe(customerWithNewFields.addressLine1);
        expect(result.addressLine2).toBe(customerWithNewFields.addressLine2);
        expect(result.countryCode).toBe(customerWithNewFields.countryCode);
        expect(result.abn).toBe(customerWithNewFields.abn);
        expect(result.contact).toBe(customerWithNewFields.contact);
        expect(result.token).toBeDefined();
        expect(result.token).toMatch(/^cust_/);
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
          note: "Updated notes",
        };

        const result = await caller.customers.upsert(updateData);

        expect(result).toBeDefined();
        expect(result.id).toBe(customerId);
        expect(result.name).toBe(updateData.name);
        expect(result.email).toBe(updateData.email);
        expect(result.phone).toBe(updateData.phone);
        expect(result.website).toBe(updateData.website);
        expect(result.note).toBe(updateData.note);
      });

      it("should update customer with new fields", async () => {
        await createTestCustomer(db, teamId, customerId);

        const updateData = {
          id: customerId,
          name: "Updated Customer",
          billingEmail: "new-billing@company.com",
          abn: "98765432109",
          countryCode: "NZ",
          contact: "Jane Doe - CFO",
          addressLine1: "456 New Street",
          addressLine2: "Level 10",
        };

        const result = await caller.customers.upsert(updateData);

        expect(result).toBeDefined();
        expect(result.id).toBe(customerId);
        expect(result.name).toBe(updateData.name);
        expect(result.billingEmail).toBe(updateData.billingEmail);
        expect(result.abn).toBe(updateData.abn);
        expect(result.countryCode).toBe(updateData.countryCode);
        expect(result.contact).toBe(updateData.contact);
        expect(result.addressLine1).toBe(updateData.addressLine1);
        expect(result.addressLine2).toBe(updateData.addressLine2);
        expect(result.email).toBe("customer@example.com");
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
        const otherTeamId = uuidv4();
        await createTestTeam(db, otherTeamId);

        const otherCustomerId = uuidv4();
        await createTestCustomer(db, otherTeamId, otherCustomerId);

        const updateData = {
          id: otherCustomerId,
          name: "Should Not Update",
        };

        const result = await caller.customers.upsert(updateData);

        expect(result).toBeUndefined();
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
      const otherTeamId = uuidv4();
      await createTestTeam(db, otherTeamId);

      const otherCustomerId = uuidv4();
      await createTestCustomer(db, otherTeamId, otherCustomerId);

      const result = await caller.customers.delete({ id: otherCustomerId });

      expect(result).toBeUndefined();

      const stillExists = await db.execute(
        sql`SELECT id FROM customers WHERE id = ${otherCustomerId}`,
      );
      expect(stillExists.length).toBe(1);
    });

    it("should handle deletion of non-existent customer", async () => {
      const nonExistentId = uuidv4();
      const result = await caller.customers.delete({ id: nonExistentId });

      expect(result).toBeUndefined();
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
