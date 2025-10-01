"use server";

import { generateObject } from "ai";
import { z } from "zod";
import { jobTableConfig } from "@/config/jobs-filters";

/**
 * Generate job filters from natural language using AI
 * Uses Vercel AI Gateway (requires AI_GATEWAY_API_KEY env variable)
 * Schema and logic inlined to avoid client/server boundary issues
 */
export async function generateJobFilters(prompt: string, context?: string) {
  console.log("=== generateJobFilters called ===");
  console.log("Prompt:", prompt);
  console.log("Context:", context);
  console.log("AI_GATEWAY_API_KEY exists:", !!process.env.AI_GATEWAY_API_KEY);
  console.log("AI_GATEWAY_API_KEY length:", process.env.AI_GATEWAY_API_KEY?.length);

  try {
    // Define schema directly on server side
    // Use .nullable().optional() to accept both null and undefined from AI
    const jobFilterSchema = z.object({
      q: z.string().nullable().optional().describe("Search query for rego (vehicle registration), job number, company, description, address, contact person, material type"),
      status: z
        .enum(["pending", "in_progress", "completed", "cancelled", "invoiced"])
        .nullable()
        .optional()
        .describe("Job status filter"),
      customerId: z.string().nullable().optional().describe("Filter by customer ID"),
      start: z.string().nullable().optional().describe("Start date for date range filter"),
      end: z.string().nullable().optional().describe("End date for date range filter"),
      groupBy: z.array(z.string()).nullable().optional().describe("Grouping fields"),
      minCubicMeters: z.number().nullable().optional().describe("Minimum cubic meters capacity"),
      maxCubicMeters: z.number().nullable().optional().describe("Maximum cubic meters capacity"),
      invoiceStatus: z.enum(["draft", "overdue", "paid", "unpaid", "canceled", "scheduled"]).nullable().optional().describe("Filter by linked invoice status"),
    });

    console.log("Schema created successfully");

    const systemPrompt = `You are a helpful assistant that generates database filters from natural language queries.

Current date: ${new Date().toISOString().split("T")[0]}

Available Tables:
${jobTableConfig.name.toUpperCase()}:
  - Searchable columns: ${jobTableConfig.searchableColumns.join(", ")}
  - Status column: ${jobTableConfig.statusColumn}
  - Available statuses: ${jobTableConfig.statusValues?.join(", ")}
  - Date columns: ${jobTableConfig.dateColumns?.join(", ")}
  - Relations: ${Object.entries(jobTableConfig.relationColumns || {})
    .map(([k, v]) => `${k} -> ${v}`)
    .join(", ")}
  - Context: ${jobTableConfig.context}

${context || ""}

Instructions:
- Parse the user's query to extract filter criteria
- Map status keywords to exact status values from the available statuses
- Extract customer names if mentioned
- Parse date references (e.g., "last month", "this week", "overdue")
- Extract rego (vehicle registration) - look for patterns like "ABC123", "123DEF", or phrases like "rego ABC123"
- Extract cubic meter ranges - look for patterns like "10m3", "over 20 cubic meters", "between 15 and 25 m3"
- Extract invoice status - look for "paid invoices", "unpaid invoices", "draft invoices", etc.
- IMPORTANT: Only use the 'q' field for search terms that couldn't be mapped to structured filters
- If searching for rego, put it in 'q' field as it's searchable via text search
- If all parts of the query are successfully mapped to structured filters, set 'q' to null
- Return null for fields that aren't specified in the query

Examples:
- "jobs for rego ABC123" → q: "ABC123", others: null
- "pending jobs over 20m3" → status: "pending", minCubicMeters: 20, q: null
- "jobs with paid invoices" → invoiceStatus: "paid", q: null
- "rego DEF456 jobs last month" → q: "DEF456", start/end: last month dates
`;

    console.log("System prompt created, calling generateObject...");
    console.log("Model:", "openai/gpt-4o-mini");

    const { object } = await generateObject({
      model: "openai/gpt-4o-mini",
      system: systemPrompt,
      schema: jobFilterSchema,
      prompt,
    });

    console.log("✅ generateObject completed successfully!");
    console.log("Generated object:", JSON.stringify(object, null, 2));

    return { object };
  } catch (error) {
    console.error("❌ Error generating job filters:", error);
    console.error("Error name:", (error as Error)?.name);
    console.error("Error message:", (error as Error)?.message);
    console.error("Error stack:", (error as Error)?.stack);
    return { object: undefined, error: String(error) };
  }
}
