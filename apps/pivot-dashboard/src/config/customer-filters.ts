import { z } from "zod";
import type { TableConfig } from "@midday/ai-search";

/**
 * Zod schema for customer filters
 * This defines what filters are available and their types
 */
export const customerFilterSchema = z.object({
  q: z.string().optional().describe("Search query for customer name, email, website"),
  start: z.string().optional().describe("Start date for date range filter (created date)"),
  end: z.string().optional().describe("End date for date range filter (created date)"),
});

/**
 * Table configuration for AI to understand the customers table
 */
export const customerTableConfig: TableConfig = {
  name: "customers",

  // Columns that can be searched with text queries
  searchableColumns: [
    "name",
    "email",
    "website",
    "phone",
    "address_line_1",
    "address_line_2",
    "city",
    "state",
    "zip",
    "country",
    "vat",
  ],

  // Date columns for temporal queries
  dateColumns: ["createdAt"],

  // Additional context for AI
  context: "Customer management system for tracking clients and their information",
};

// Export type for use in components
export type CustomerFilters = z.infer<typeof customerFilterSchema>;
