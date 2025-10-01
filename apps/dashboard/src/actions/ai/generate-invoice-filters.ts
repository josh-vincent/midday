"use server";

import { generateObject } from "ai";
import { z } from "zod";
import { invoiceTableConfig } from "@/config/invoice-filters";

/**
 * Generate invoice filters from natural language using AI
 * Uses Vercel AI Gateway (requires AI_GATEWAY_API_KEY env variable)
 * Schema and logic inlined to avoid client/server boundary issues
 */
export async function generateInvoiceFilters(prompt: string, context?: string) {
  console.log("=== generateInvoiceFilters called ===");
  console.log("Prompt:", prompt);
  console.log("Context:", context);
  console.log("AI_GATEWAY_API_KEY exists:", !!process.env.AI_GATEWAY_API_KEY);
  console.log("AI_GATEWAY_API_KEY length:", process.env.AI_GATEWAY_API_KEY?.length);

  try {
    // Define schema directly on server side
    // Use .nullable().optional() to accept both null and undefined from AI
    const invoiceFilterSchema = z.object({
      q: z.string().nullable().optional().describe("Search query for invoice number, customer name, notes"),
      statuses: z
        .array(z.enum(["draft", "overdue", "paid", "unpaid", "canceled", "scheduled"]))
        .nullable()
        .optional()
        .describe("Invoice status filters"),
      customers: z.array(z.string()).nullable().optional().describe("Filter by customer IDs"),
      start: z.string().nullable().optional().describe("Start date for date range filter"),
      end: z.string().nullable().optional().describe("End date for date range filter"),
    });

    console.log("Schema created successfully");

    const systemPrompt = `You are a helpful assistant that generates database filters from natural language queries.

Current date: ${new Date().toISOString().split("T")[0]}

Available Tables:
${invoiceTableConfig.name.toUpperCase()}:
  - Searchable columns: ${invoiceTableConfig.searchableColumns.join(", ")}
  - Status column: ${invoiceTableConfig.statusColumn}
  - Available statuses: ${invoiceTableConfig.statusValues?.join(", ")}
  - Date columns: ${invoiceTableConfig.dateColumns?.join(", ")}
  - Relations: ${Object.entries(invoiceTableConfig.relationColumns || {})
    .map(([k, v]) => `${k} -> ${v}`)
    .join(", ")}
  - Context: ${invoiceTableConfig.context}

${context || ""}

Instructions:
- Parse the user's query to extract filter criteria
- Map status keywords to exact status values from the available statuses
- Extract customer names if mentioned
- Parse date references (e.g., "last month", "this week", "overdue")
- IMPORTANT: Only use the 'q' field for search terms that couldn't be mapped to structured filters (statuses, customers, dates)
- If all parts of the query are successfully mapped to structured filters, set 'q' to null
- Return null for fields that aren't specified in the query
`;

    console.log("System prompt created, calling generateObject...");
    console.log("Model:", "openai/gpt-4o-mini");

    const { object } = await generateObject({
      model: "openai/gpt-4o-mini",
      system: systemPrompt,
      schema: invoiceFilterSchema,
      prompt,
    });

    console.log("✅ generateObject completed successfully!");
    console.log("Generated object:", JSON.stringify(object, null, 2));

    return { object };
  } catch (error) {
    console.error("❌ Error generating invoice filters:", error);
    console.error("Error name:", (error as Error)?.name);
    console.error("Error message:", (error as Error)?.message);
    console.error("Error stack:", (error as Error)?.stack);
    return { object: undefined, error: String(error) };
  }
}
