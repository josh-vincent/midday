"use server";

import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

const schema = z.object({
  name: z.string().optional().describe("The name or description to search for"),
  start: z
    .date()
    .optional()
    .describe("The start date when to retrieve from. Return ISO-8601 format."),
  end: z
    .date()
    .optional()
    .describe(
      "The end date when to retrieve data from. If not provided, defaults to the current date. Return ISO-8601 format.",
    ),
});

export async function generateVaultFilters(prompt: string, context?: string) {
  try {
    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      system: `You are a helpful assistant that generates filters for a given prompt. \n
               Current date is: ${new Date().toISOString().split("T")[0]} \n
               ${context}
      `,
      schema,
      prompt,
    });

    return { object };
  } catch (error) {
    console.error("Error generating filters:", error);
    return { object: {} };
  }
}
