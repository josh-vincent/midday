// Import test setup to configure all environment variables
import "../__tests__/test-setup";

import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { connectDb } from "@midday/db/client";
import { TRPCError } from "@trpc/server";
import { v4 as uuidv4 } from "uuid";
import {
  cleanupTestData,
  createTestCaller,
  createTestCustomer,
  createTestInvoice,
  createTestTeam,
  createTestTeamMember,
  createTestUser,
} from "../__tests__/test-utils";

describe("invoice router", () => {
  let db: any;
  let caller: any;
  const teamId = uuidv4();
  const userId = uuidv4();
  const customerId = uuidv4();
  const invoiceId = uuidv4();

  beforeEach(async () => {
    db = await connectDb();

    await createTestUser(db, userId);
    await createTestTeam(db, teamId);
    await createTestTeamMember(db, teamId, userId);
    await createTestCustomer(db, teamId, customerId);

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
    it("should fetch invoices for the team", async () => {
      await createTestInvoice(db, teamId, invoiceId);

      const result = await caller.invoice.get();

      expect(result).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThanOrEqual(1);
    });

    it("should filter invoices by status", async () => {
      await createTestInvoice(db, teamId, invoiceId);

      const result = await caller.invoice.get({ status: "draft" });

      expect(result).toBeDefined();
      expect(result.data).toBeInstanceOf(Array);
      expect(result.data.every((inv: any) => inv.status === "draft")).toBe(
        true,
      );
    });

    it("should paginate invoices", async () => {
      await createTestInvoice(db, teamId, invoiceId);

      const result = await caller.invoice.get({ limit: 5, offset: 0 });

      expect(result).toBeDefined();
      expect(result.data.length).toBeLessThanOrEqual(5);
    });
  });

  describe("getById", () => {
    it("should fetch an invoice by ID", async () => {
      await createTestInvoice(db, teamId, invoiceId);

      const result = await caller.invoice.getById({ id: invoiceId });

      expect(result).toBeDefined();
      expect(result.id).toBe(invoiceId);
      expect(result.teamId).toBe(teamId);
    });

    it("should return null for non-existent invoice", async () => {
      const result = await caller.invoice.getById({ id: "non-existent-id" });
      expect(result).toBeNull();
    });
  });

  describe("paymentStatus", () => {
    it("should fetch payment status for the team", async () => {
      const result = await caller.invoice.paymentStatus();

      expect(result).toBeDefined();
      expect(result).toHaveProperty("total");
      expect(result).toHaveProperty("paid");
      expect(result).toHaveProperty("unpaid");
      expect(result).toHaveProperty("overdue");
    });
  });

  describe("searchInvoiceNumber", () => {
    it("should search for invoices by number", async () => {
      await createTestInvoice(db, teamId, invoiceId);

      const result = await caller.invoice.searchInvoiceNumber({ query: "INV" });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("invoiceSummary", () => {
    it("should fetch invoice summary", async () => {
      await createTestInvoice(db, teamId, invoiceId);

      const result = await caller.invoice.invoiceSummary();

      expect(result).toBeDefined();
      expect(result).toHaveProperty("totalInvoices");
      expect(result).toHaveProperty("totalAmount");
      expect(result).toHaveProperty("paidAmount");
      expect(result).toHaveProperty("overdueAmount");
    });

    it("should filter summary by status", async () => {
      await createTestInvoice(db, teamId, invoiceId);

      const result = await caller.invoice.invoiceSummary({ status: "draft" });

      expect(result).toBeDefined();
      expect(result).toHaveProperty("totalInvoices");
    });
  });

  describe("defaultSettings", () => {
    it("should return default invoice settings", async () => {
      const result = await caller.invoice.defaultSettings();

      expect(result).toBeDefined();
      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("currency");
      expect(result).toHaveProperty("invoiceNumber");
      expect(result).toHaveProperty("template");
      expect(result).toHaveProperty("issueDate");
      expect(result).toHaveProperty("dueDate");
      expect(result).toHaveProperty("lineItems");
      expect(result.lineItems).toBeInstanceOf(Array);
    });
  });

  describe("draft", () => {
    it("should create a draft invoice", async () => {
      const draftData = {
        id: uuidv4(),
        teamId,
        userId,
        customerName: "New Customer",
        invoiceNumber: "INV-002",
        currency: "USD",
        amount: 200.0,
        lineItems: [{ name: "Service", quantity: 2, price: 100, vat: 0 }],
        issueDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        template: {
          title: "Invoice",
          currency: "USD",
          size: "a4",
          includeVat: true,
          includeTax: false,
        },
      };

      const result = await caller.invoice.draft(draftData);

      expect(result).toBeDefined();
      expect(result.id).toBe(draftData.id);
      expect(result.status).toBe("draft");
      expect(result.amount).toBe(draftData.amount);
    });
  });

  describe("update", () => {
    it("should update an existing invoice", async () => {
      await createTestInvoice(db, teamId, invoiceId);

      const updateData = {
        id: invoiceId,
        amount: 150.0,
        customerName: "Updated Customer",
      };

      const result = await caller.invoice.update(updateData);

      expect(result).toBeDefined();
      expect(result.id).toBe(invoiceId);
      expect(result.amount).toBe(150.0);
      expect(result.customerName).toBe("Updated Customer");
    });
  });

  describe("delete", () => {
    it("should delete an invoice", async () => {
      await createTestInvoice(db, teamId, invoiceId);

      const result = await caller.invoice.delete({ id: invoiceId });

      expect(result).toBeDefined();
      expect(result.id).toBe(invoiceId);

      const checkDeleted = await caller.invoice.getById({ id: invoiceId });
      expect(checkDeleted).toBeNull();
    });
  });

  describe("duplicate", () => {
    it("should duplicate an existing invoice", async () => {
      await createTestInvoice(db, teamId, invoiceId);

      const result = await caller.invoice.duplicate({ id: invoiceId });

      expect(result).toBeDefined();
      expect(result.id).not.toBe(invoiceId);
      expect(result.status).toBe("draft");
      expect(result.invoiceNumber).toBeDefined();
    });
  });

  describe("create", () => {
    it("should create an unpaid invoice", async () => {
      const draftId = uuidv4();
      await caller.invoice.draft({
        id: draftId,
        teamId,
        userId,
        customerName: "Test Customer",
        invoiceNumber: "INV-003",
        currency: "USD",
        amount: 300.0,
        lineItems: [{ name: "Product", quantity: 3, price: 100, vat: 0 }],
        issueDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        template: {
          title: "Invoice",
          currency: "USD",
          size: "a4",
        },
      });

      const result = await caller.invoice.create({
        id: draftId,
        deliveryType: "create",
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(draftId);
      expect(result.status).toBe("unpaid");
    });

    it("should handle scheduled delivery type", async () => {
      const draftId = uuidv4();
      await caller.invoice.draft({
        id: draftId,
        teamId,
        userId,
        customerName: "Test Customer",
        invoiceNumber: "INV-004",
        currency: "USD",
        amount: 400.0,
        lineItems: [{ name: "Product", quantity: 4, price: 100, vat: 0 }],
        issueDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        template: {
          title: "Invoice",
          currency: "USD",
          size: "a4",
        },
      });

      const scheduledAt = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
      ).toISOString();

      const result = await caller.invoice.create({
        id: draftId,
        deliveryType: "scheduled",
        scheduledAt,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(draftId);
      expect(result.status).toBe("scheduled");
      expect(result.scheduledAt).toBe(scheduledAt);
    });

    it("should reject scheduled delivery without scheduledAt", async () => {
      const draftId = uuidv4();
      await caller.invoice.draft({
        id: draftId,
        teamId,
        userId,
        customerName: "Test Customer",
        invoiceNumber: "INV-005",
        currency: "USD",
        amount: 500.0,
        lineItems: [{ name: "Product", quantity: 5, price: 100, vat: 0 }],
        issueDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        template: {
          title: "Invoice",
          currency: "USD",
          size: "a4",
        },
      });

      try {
        await caller.invoice.create({
          id: draftId,
          deliveryType: "scheduled",
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.code).toBe("BAD_REQUEST");
      }
    });
  });

  describe("remind", () => {
    it("should send a reminder for an invoice", async () => {
      await createTestInvoice(db, teamId, invoiceId);

      const result = await caller.invoice.remind({
        id: invoiceId,
        date: new Date().toISOString(),
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(invoiceId);
      expect(result.reminderSentAt).toBeDefined();
    });
  });

  describe("metrics", () => {
    it("should fetch most active client", async () => {
      const result = await caller.invoice.mostActiveClient();
      expect(result).toBeDefined();
    });

    it("should fetch inactive clients count", async () => {
      const result = await caller.invoice.inactiveClientsCount();
      expect(result).toBeDefined();
      expect(typeof result).toBe("number");
    });

    it("should fetch average days to payment", async () => {
      const result = await caller.invoice.averageDaysToPayment();
      expect(result).toBeDefined();
    });

    it("should fetch average invoice size", async () => {
      const result = await caller.invoice.averageInvoiceSize();
      expect(result).toBeDefined();
    });

    it("should fetch top revenue client", async () => {
      const result = await caller.invoice.topRevenueClient();
      expect(result).toBeDefined();
    });

    it("should fetch new customers count", async () => {
      const result = await caller.invoice.newCustomersCount();
      expect(result).toBeDefined();
      expect(typeof result).toBe("number");
    });
  });

  describe("getInvoiceByToken", () => {
    it("should reject invalid token", async () => {
      const publicCaller = await createTestCaller({
        teamId: undefined,
        session: null,
      });

      try {
        await publicCaller.invoice.getInvoiceByToken({
          token: "invalid-token",
        });
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("createFromTracker", () => {
    it("should reject if project not found", async () => {
      try {
        await caller.invoice.createFromTracker({
          projectId: uuidv4(),
          dateFrom: new Date().toISOString(),
          dateTo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.code).toBe("NOT_FOUND");
        expect(error.message).toBe("PROJECT_NOT_FOUND");
      }
    });
  });
});
