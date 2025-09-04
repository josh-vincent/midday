"use server";

import { LogEvents } from "@midday/events/events";
// Disabled - trigger.dev
// import type { ExportTransactionsPayload } from "@midday/jobs/schema";
// import { tasks } from "@trigger.dev/sdk";
import { z } from "zod";
import { authActionClient } from "./safe-action";

export const exportTransactionsAction = authActionClient
  .schema(
    z.object({
      transactionIds: z.array(z.string()),
      dateFormat: z.string().optional(),
      locale: z.string().optional().default("en"),
    }),
  )
  .metadata({
    name: "export-transactions",
    track: {
      event: LogEvents.ExportTransactions.name,
      channel: LogEvents.ExportTransactions.channel,
    },
  })
  .action(
    async ({
      parsedInput: { transactionIds, dateFormat, locale },
      ctx: { teamId },
    }) => {
      if (!teamId) {
        throw new Error("Team not found");
      }

      // Disabled - trigger.dev
      // const event = await tasks.trigger("export-transactions", {
      //   teamId,
      //   locale,
      //   transactionIds,
      //   dateFormat,
      // } satisfies ExportTransactionsPayload);

      // Mock event object for compatibility
      const event = { id: `mock-export-${Date.now()}` };

      return event;
    },
  );
