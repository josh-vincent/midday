import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import {
  getJobsByTeamId,
  createJob,
  updateJob,
  deleteJob,
} from "@midday/db/queries";
import { z } from "zod";

export const jobsRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    return getJobsByTeamId(db, teamId!);
  }),

  create: protectedProcedure
    .input(
      z.object({
        customerName: z.string(),
        description: z.string().optional(),
        dumpLocation: z.string(),
        scheduledDate: z.string(),
        quantity: z.number(),
        pricePerUnit: z.number(),
        status: z.enum(["pending", "in_progress", "completed", "cancelled"]).default("pending"),
      })
    )
    .mutation(async ({ ctx: { db, teamId, session }, input }) => {
      return createJob(db, {
        ...input,
        teamId: teamId!,
        createdBy: session.user.id,
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        customerName: z.string().optional(),
        description: z.string().optional().nullable(),
        dumpLocation: z.string().optional(),
        scheduledDate: z.string().optional(),
        completedDate: z.string().optional().nullable(),
        quantity: z.number().optional(),
        pricePerUnit: z.number().optional(),
        status: z.enum(["pending", "in_progress", "completed", "cancelled"]).optional(),
      })
    )
    .mutation(async ({ ctx: { db }, input }) => {
      return updateJob(db, input);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx: { db }, input }) => {
      return deleteJob(db, input.id);
    }),
});