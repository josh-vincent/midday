// Import test setup to configure all environment variables
import "../__tests__/test-setup";

import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { connectDb } from "@midday/db/client";
import { v4 as uuidv4 } from "uuid";
import {
  cleanupTestData,
  createTestCaller,
  createTestTeam,
  createTestTeamMember,
  createTestUser,
} from "../__tests__/test-utils";

describe("invoiceTemplate router", () => {
  let db: any;
  let caller: any;
  const teamId = uuidv4();
  const userId = uuidv4();

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

  describe("upsert", () => {
    it("should create a new invoice template", async () => {
      const templateData = {
        title: "Custom Invoice",
        customerLabel: "Bill To",
        fromLabel: "From",
        invoiceNoLabel: "Invoice Number",
        issueDateLabel: "Date Issued",
        dueDateLabel: "Payment Due",
        descriptionLabel: "Item Description",
        priceLabel: "Unit Price",
        quantityLabel: "Qty",
        totalLabel: "Line Total",
        totalSummaryLabel: "Invoice Total",
        subtotalLabel: "Subtotal",
        vatLabel: "VAT",
        taxLabel: "Sales Tax",
        discountLabel: "Discount",
        paymentLabel: "Payment Instructions",
        noteLabel: "Additional Notes",
        currency: "USD",
        size: "a4" as const,
        includeVat: true,
        includeTax: false,
        includeDiscount: true,
        includeDecimals: true,
        includeUnits: false,
        includeQr: true,
        includePdf: true,
        sendCopy: true,
        taxRate: 8.5,
        vatRate: 20,
        deliveryType: "create_and_send" as const,
        dateFormat: "MM/dd/yyyy",
        timezone: "America/New_York",
        locale: "en-US",
        fromDetails: JSON.stringify({
          name: "Test Company",
          address: "123 Business St",
          city: "New York",
          state: "NY",
          zipCode: "10001",
          country: "USA",
          email: "billing@testcompany.com",
          phone: "+1234567890",
          vatNumber: "US123456789",
        }),
        paymentDetails: JSON.stringify({
          bankName: "Test Bank",
          accountNumber: "1234567890",
          routingNumber: "123456789",
          swiftCode: "TESTUS00",
          instructions: "Please pay within 30 days",
        }),
        logoUrl: "https://example.com/logo.png",
      };

      const result = await caller.invoiceTemplate.upsert(templateData);

      expect(result).toBeDefined();
      expect(result.teamId).toBe(teamId);
      expect(result.title).toBe(templateData.title);
      expect(result.currency).toBe(templateData.currency);
      expect(result.size).toBe(templateData.size);
      expect(result.includeVat).toBe(templateData.includeVat);
      expect(result.includeTax).toBe(templateData.includeTax);
      expect(result.taxRate).toBe(templateData.taxRate);
      expect(result.vatRate).toBe(templateData.vatRate);
    });

    it("should update an existing invoice template", async () => {
      const initialData = {
        title: "Initial Invoice",
        currency: "EUR",
        size: "letter" as const,
        includeVat: false,
        includeTax: true,
        taxRate: 5,
        vatRate: 0,
      };

      await caller.invoiceTemplate.upsert(initialData);

      const updatedData = {
        title: "Updated Invoice",
        currency: "GBP",
        size: "a4" as const,
        includeVat: true,
        includeTax: false,
        taxRate: 0,
        vatRate: 15,
        customerLabel: "Client",
        fromLabel: "Seller",
        paymentDetails: JSON.stringify({
          instructions: "Pay by bank transfer",
        }),
      };

      const result = await caller.invoiceTemplate.upsert(updatedData);

      expect(result).toBeDefined();
      expect(result.teamId).toBe(teamId);
      expect(result.title).toBe(updatedData.title);
      expect(result.currency).toBe(updatedData.currency);
      expect(result.size).toBe(updatedData.size);
      expect(result.includeVat).toBe(updatedData.includeVat);
      expect(result.includeTax).toBe(updatedData.includeTax);
      expect(result.vatRate).toBe(updatedData.vatRate);
      expect(result.taxRate).toBe(updatedData.taxRate);
      expect(result.customerLabel).toBe(updatedData.customerLabel);
      expect(result.fromLabel).toBe(updatedData.fromLabel);
    });

    it("should handle minimal template data", async () => {
      const minimalData = {
        title: "Basic Invoice",
      };

      const result = await caller.invoiceTemplate.upsert(minimalData);

      expect(result).toBeDefined();
      expect(result.teamId).toBe(teamId);
      expect(result.title).toBe(minimalData.title);
    });

    it("should handle complex JSON fields", async () => {
      const complexData = {
        fromDetails: JSON.stringify({
          name: "Complex Corp",
          address: "456 Enterprise Blvd",
          city: "San Francisco",
          state: "CA",
          zipCode: "94105",
          country: "USA",
          additionalInfo: {
            registrationNumber: "REG123456",
            taxId: "TAX789012",
          },
        }),
        paymentDetails: JSON.stringify({
          bankName: "International Bank",
          accountNumber: "9876543210",
          iban: "US12345678901234567890",
          swiftCode: "INTLUS00",
          paymentMethods: ["wire", "ach", "check"],
          terms: {
            net: 30,
            earlyPaymentDiscount: 2,
            lateFee: 1.5,
          },
        }),
      };

      const result = await caller.invoiceTemplate.upsert(complexData);

      expect(result).toBeDefined();
      expect(result.fromDetails).toBeDefined();
      expect(result.paymentDetails).toBeDefined();
    });

    it("should validate size enum values", async () => {
      const invalidSizeData = {
        title: "Invalid Size",
        size: "invalid" as any,
      };

      try {
        await caller.invoiceTemplate.upsert(invalidSizeData);
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });

    it("should validate delivery type enum values", async () => {
      const invalidDeliveryData = {
        title: "Invalid Delivery",
        deliveryType: "invalid" as any,
      };

      try {
        await caller.invoiceTemplate.upsert(invalidDeliveryData);
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });

    it("should handle number fields correctly", async () => {
      const numberData = {
        title: "Number Test",
        taxRate: 12.5,
        vatRate: 25.75,
      };

      const result = await caller.invoiceTemplate.upsert(numberData);

      expect(result).toBeDefined();
      expect(result.taxRate).toBe(12.5);
      expect(result.vatRate).toBe(25.75);
    });

    it("should handle boolean fields correctly", async () => {
      const booleanData = {
        title: "Boolean Test",
        includeVat: true,
        includeTax: false,
        includeDiscount: true,
        includeDecimals: false,
        includeUnits: true,
        includeQr: false,
        includePdf: true,
        sendCopy: false,
      };

      const result = await caller.invoiceTemplate.upsert(booleanData);

      expect(result).toBeDefined();
      expect(result.includeVat).toBe(true);
      expect(result.includeTax).toBe(false);
      expect(result.includeDiscount).toBe(true);
      expect(result.includeDecimals).toBe(false);
      expect(result.includeUnits).toBe(true);
      expect(result.includeQr).toBe(false);
      expect(result.includePdf).toBe(true);
      expect(result.sendCopy).toBe(false);
    });

    it("should handle all label fields", async () => {
      const labelData = {
        title: "Label Test",
        customerLabel: "Customer",
        fromLabel: "Vendor",
        invoiceNoLabel: "Invoice #",
        issueDateLabel: "Issued",
        dueDateLabel: "Due",
        descriptionLabel: "Description",
        priceLabel: "Price",
        quantityLabel: "Quantity",
        totalLabel: "Total",
        totalSummaryLabel: "Grand Total",
        subtotalLabel: "Sub Total",
        vatLabel: "Value Added Tax",
        taxLabel: "Tax",
        discountLabel: "Discount Applied",
        paymentLabel: "Payment Info",
        noteLabel: "Notes",
      };

      const result = await caller.invoiceTemplate.upsert(labelData);

      expect(result).toBeDefined();
      Object.entries(labelData).forEach(([key, value]) => {
        expect(result[key]).toBe(value);
      });
    });

    it("should handle localization fields", async () => {
      const localizationData = {
        title: "Localized Invoice",
        currency: "EUR",
        dateFormat: "dd.MM.yyyy",
        timezone: "Europe/Berlin",
        locale: "de-DE",
      };

      const result = await caller.invoiceTemplate.upsert(localizationData);

      expect(result).toBeDefined();
      expect(result.currency).toBe(localizationData.currency);
      expect(result.dateFormat).toBe(localizationData.dateFormat);
      expect(result.timezone).toBe(localizationData.timezone);
      expect(result.locale).toBe(localizationData.locale);
    });
  });

  describe("authorization", () => {
    it("should require authentication", async () => {
      const unauthenticatedCaller = await createTestCaller({
        teamId: undefined,
        session: null,
      });

      try {
        await unauthenticatedCaller.invoiceTemplate.upsert({
          title: "Unauthorized",
        });
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
        await callerWithoutTeam.invoiceTemplate.upsert({
          title: "No Team",
        });
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });
  });
});
