"use server";

import { updateUser } from "@midday/db/queries";
import { z } from "zod";
import type { ActionFactory } from "../types";

const trackingConsentSchema = z.object({
  value: z.enum(["1", "0"]),
});

/**
 * Factory function for creating the tracking consent action
 */
export const createTrackingConsentAction: ActionFactory = ({
  authActionClient,
}) => {
  return authActionClient
    .schema(trackingConsentSchema)
    .metadata({
      name: "tracking-consent",
    })
    .action(async ({ parsedInput: { value }, ctx: { user } }) => {
      const db = await import("@midday/db/client").then((m) => m.db);

      await updateUser(db, {
        id: user.id,
        tracking: value === "1",
      });

      return { success: true };
    });
};
