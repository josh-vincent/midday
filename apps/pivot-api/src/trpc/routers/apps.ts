import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { apps } from "@midday/db/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

// Schemas
const disconnectAppSchema = z.object({
  id: z.string().uuid(),
});

const updateAppSchema = z.object({
  id: z.string().uuid(),
  settings: z.record(z.any()).optional(),
  config: z.record(z.any()).optional(),
});

export const appsRouter = createTRPCRouter({
  /**
   * Get all installed apps for the current team
   */
  get: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    if (!teamId) {
      return [];
    }

    return db.select().from(apps).where(eq(apps.teamId, teamId));
  }),

  /**
   * Disconnect/uninstall an app
   */
  disconnect: protectedProcedure
    .input(disconnectAppSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      if (!teamId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No team selected",
        });
      }

      const result = await db
        .delete(apps)
        .where(and(eq(apps.id, input.id), eq(apps.teamId, teamId)))
        .returning();

      if (!result || result.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "App not found or you don't have permission to disconnect it",
        });
      }

      return { success: true };
    }),

  /**
   * Update app settings
   */
  update: protectedProcedure
    .input(updateAppSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      if (!teamId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No team selected",
        });
      }

      const updateData: Partial<typeof apps.$inferInsert> = {};
      if (input.settings) updateData.settings = input.settings;
      if (input.config) updateData.config = input.config;

      const result = await db
        .update(apps)
        .set(updateData)
        .where(and(eq(apps.id, input.id), eq(apps.teamId, teamId)))
        .returning();

      if (!result || result.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "App not found or you don't have permission to update it",
        });
      }

      return result[0];
    }),
});
