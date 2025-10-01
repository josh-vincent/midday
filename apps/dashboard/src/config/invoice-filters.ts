import { z } from "zod";
import type { TableConfig } from "@midday/ai-search";

/**
 * Zod schema for invoice filters
 * This defines what filters are available and their types
 */
export const invoiceFilterSchema = z.object({
  q: z.string().optional().describe("Search query for invoice number, customer name, notes"),
  statuses: z
    .array(z.enum(["draft", "overdue", "paid", "unpaid", "canceled", "scheduled"]))
    .optional()
    .describe("Invoice status filters"),
  customers: z.array(z.string()).optional().describe("Filter by customer IDs"),
  start: z.string().optional().describe("Start date for date range filter"),
  end: z.string().optional().describe("End date for date range filter"),
});

/**
 * Table configuration for AI to understand the invoices table
 */
export const invoiceTableConfig: TableConfig = {
  name: "invoices",

  // Columns that can be searched with text queries
  searchableColumns: [
    "invoiceNumber",
    "customerName",
    "note",
    "amount",
  ],

  // Status enum configuration
  statusColumn: "status",
  statusValues: ["draft", "overdue", "paid", "unpaid", "canceled", "scheduled"],

  // Foreign key relationships
  relationColumns: {
    customerId: "customers",
  },

  // Date columns for temporal queries
  dateColumns: ["dueDate", "issueDate", "createdAt"],

  // Additional context for AI
  context: "Invoice management system for tracking payments and billing",
};

// Export type for use in components
export type InvoiceFilters = z.infer<typeof invoiceFilterSchema>;
