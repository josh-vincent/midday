"use server";

import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import type { z } from "zod";
import type { TableConfig } from "../types";

type GenerateFiltersOptions<T extends z.ZodTypeAny> = {
  /** User's natural language query */
  prompt: string;

  /** Zod schema for filter validation */
  schema: T;

  /** Table configuration (single or multiple tables) */
  tableConfig: TableConfig | TableConfig[];

  /** Additional context for the AI */
  context?: string;
};

/**
 * Generic AI filter generator that works with any table configuration
 *
 * @example
 * const result = await generateFilters({
 *   prompt: "overdue invoices from last month",
 *   schema: invoiceFilterSchema,
 *   tableConfig: invoiceTableConfig,
 * });
 */
export async function generateFilters<T extends z.ZodTypeAny>({
  prompt,
  schema,
  tableConfig,
  context,
}: GenerateFiltersOptions<T>) {
  try {
    const tables = Array.isArray(tableConfig) ? tableConfig : [tableConfig];

    // Build comprehensive system prompt with table metadata
    const systemPrompt = `You are a helpful assistant that generates database filters from natural language queries.

Current date: ${new Date().toISOString().split("T")[0]}

Available Tables:
${tables
  .map(
    (t) => `
${t.name.toUpperCase()}:
  - Searchable columns: ${t.searchableColumns.join(", ")}
  ${t.statusColumn ? `- Status column: ${t.statusColumn}` : ""}
  ${t.statusValues ? `  Available statuses: ${t.statusValues.join(", ")}` : ""}
  ${t.dateColumns ? `- Date columns: ${t.dateColumns.join(", ")}` : ""}
  ${t.relationColumns ? `- Relations: ${Object.entries(t.relationColumns)
    .map(([k, v]) => `${k} -> ${v}`)
    .join(", ")}` : ""}
  ${t.context ? `- Context: ${t.context}` : ""}
`,
  )
  .join("\n")}

${context || ""}

Instructions:
- Parse the user's query to extract filter criteria
- Map status keywords to exact status values from the available statuses
- Extract customer names if mentioned
- Parse date references (e.g., "last month", "this week", "overdue")
- For search terms that don't match filters, return them in the 'name' field
- Return null for fields that aren't specified in the query
`;

    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      schema,
      prompt,
    });

    return { object };
  } catch (error) {
    console.error("Error generating filters:", error);
    return { object: undefined, error: String(error) };
  }
}
