import { z } from "zod";
import type { TableConfig } from "@midday/ai-search";

/**
 * Zod schema for job filters
 * This defines what filters are available and their types
 */
export const jobFilterSchema = z.object({
  q: z.string().optional().describe("Search query for rego, job number, company, description"),
  status: z
    .enum(["pending", "in_progress", "completed", "cancelled", "invoiced"])
    .optional()
    .describe("Job status filter"),
  customerId: z.string().optional().describe("Filter by customer ID"),
  start: z.string().optional().describe("Start date for date range filter"),
  end: z.string().optional().describe("End date for date range filter"),
  groupBy: z.array(z.string()).optional().describe("Grouping fields"),
  minCubicMeters: z.number().optional().describe("Minimum cubic meters capacity"),
  maxCubicMeters: z.number().optional().describe("Maximum cubic meters capacity"),
  invoiceStatus: z.enum(["draft", "overdue", "paid", "unpaid", "canceled", "scheduled"]).optional().describe("Filter by linked invoice status"),
});

/**
 * Table configuration for AI to understand the jobs table
 */
export const jobTableConfig: TableConfig = {
  name: "jobs",

  // Columns that can be searched with text queries
  searchableColumns: [
    "rego",           // Vehicle registration
    "jobNumber",
    "companyName",
    "description",
    "addressSite",
    "contactPerson",
    "materialType",
  ],

  // Status enum configuration
  statusColumn: "status",
  statusValues: ["pending", "in_progress", "completed", "cancelled", "invoiced"],

  // Foreign key relationships
  relationColumns: {
    customerId: "customers",
    invoiceStatus: "invoice.status",
  },

  // Date columns for temporal queries
  dateColumns: ["jobDate", "scheduledDate", "createdAt"],

  // Numeric range columns
  numericColumns: ["cubicMetreCapacity"],

  // Additional context for AI
  context: "Job management system for tracking waste management deliveries. Jobs can be filtered by rego (vehicle registration), cubic meter capacity, linked invoice status, and dates.",
};

// Export type for use in components
export type JobFilters = z.infer<typeof jobFilterSchema>;
