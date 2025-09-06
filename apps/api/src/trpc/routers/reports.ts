import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { connectDb } from "@midday/db/client";
import { invoices, jobs } from "@midday/db/schema";
import { format, startOfMonth, subMonths } from "date-fns";
import { and, between, count, eq, sql, sum } from "drizzle-orm";
import { z } from "zod";

const reportsInputSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  currency: z.string().optional(),
});

export const reportsRouter = createTRPCRouter({
  revenue: protectedProcedure
    .input(reportsInputSchema)
    .query(async ({ ctx: { teamId }, input }) => {
      const db = await connectDb();

      // Get revenue data from invoices
      const currentPeriod = await db
        .select({
          date: sql`DATE(${invoices.issueDate})`.as("date"),
          total: sum(invoices.totalAmount).as("total"),
        })
        .from(invoices)
        .where(
          and(
            eq(invoices.teamId, teamId),
            eq(invoices.status, "paid"),
            between(invoices.issueDate, input.startDate, input.endDate),
          ),
        )
        .groupBy(sql`DATE(${invoices.issueDate})`)
        .orderBy(sql`DATE(${invoices.issueDate})`);

      // Calculate previous period
      const prevFrom = format(subMonths(new Date(input.startDate), 1), "yyyy-MM-dd");
      const prevTo = format(subMonths(new Date(input.endDate), 1), "yyyy-MM-dd");

      const prevPeriod = await db
        .select({
          total: sum(invoices.totalAmount).as("total"),
        })
        .from(invoices)
        .where(
          and(
            eq(invoices.teamId, teamId),
            eq(invoices.status, "paid"),
            between(invoices.issueDate, prevFrom, prevTo),
          ),
        );

      const currentTotal = currentPeriod.reduce(
        (acc, item) => acc + Number(item.total || 0),
        0,
      );
      const prevTotal = Number(prevPeriod[0]?.total || 0);

      return {
        summary: {
          currency: input.currency || "USD",
          currentTotal: currentTotal / 100, // Convert from cents
          prevTotal: prevTotal / 100,
        },
        meta: {
          type: "revenue" as const,
          period: "monthly",
          currency: input.currency || "USD",
        },
        result: currentPeriod.map((item) => ({
          date: item.date,
          value: Number(item.total || 0) / 100,
        })),
      };
    }),

  profit: protectedProcedure
    .input(reportsInputSchema)
    .query(async ({ input }) => {
      // Simplified profit calculation - would need expenses data
      return {
        summary: {
          currency: input.currency || "USD",
          currentTotal: 0,
          prevTotal: 0,
        },
        meta: {
          type: "profit" as const,
          period: "monthly",
          currency: input.currency || "USD",
        },
        result: [],
      };
    }),

  burnRate: protectedProcedure
    .input(reportsInputSchema)
    .query(async ({ input }) => {
      // Simplified burn rate - would need more financial data
      return {
        summary: {
          currency: input.currency || "USD",
          currentTotal: 0,
          prevTotal: 0,
        },
        meta: {
          type: "burn_rate" as const,
          period: "monthly",
          currency: input.currency || "USD",
        },
        result: [],
      };
    }),

  runway: protectedProcedure
    .input(reportsInputSchema)
    .query(async ({ input }) => {
      // Simplified runway calculation
      return {
        summary: {
          currency: input.currency || "USD",
          currentTotal: 0,
          prevTotal: 0,
        },
        meta: {
          type: "runway" as const,
          period: "monthly",
          currency: input.currency || "USD",
        },
        result: [],
      };
    }),

  expense: protectedProcedure
    .input(reportsInputSchema)
    .query(async ({ input }) => {
      // Would need expense tracking
      return {
        summary: {
          currency: input.currency || "USD",
          currentTotal: 0,
          prevTotal: 0,
        },
        meta: {
          type: "expense" as const,
          period: "monthly",
          currency: input.currency || "USD",
        },
        result: [],
      };
    }),

  spending: protectedProcedure
    .input(reportsInputSchema)
    .query(async ({ input }) => {
      // Simplified spending data
      return {
        summary: {
          currency: input.currency || "USD",
          currentTotal: 0,
          prevTotal: 0,
        },
        meta: {
          type: "spending" as const,
          period: "monthly",
          currency: input.currency || "USD",
        },
        result: [],
      };
    }),

  invoice: protectedProcedure
    .input(reportsInputSchema)
    .query(async ({ ctx: { teamId }, input }) => {
      const db = await connectDb();

      // Get invoice counts and amounts
      const currentPeriod = await db
        .select({
          date: sql`DATE(${invoices.issueDate})`.as("date"),
          total: sum(invoices.totalAmount).as("total"),
          count: count(invoices.id).as("count"),
        })
        .from(invoices)
        .where(
          and(
            eq(invoices.teamId, teamId),
            between(invoices.issueDate, input.startDate, input.endDate),
          ),
        )
        .groupBy(sql`DATE(${invoices.issueDate})`)
        .orderBy(sql`DATE(${invoices.issueDate})`);

      const prevFrom = format(subMonths(new Date(input.startDate), 1), "yyyy-MM-dd");
      const prevTo = format(subMonths(new Date(input.endDate), 1), "yyyy-MM-dd");

      const prevPeriod = await db
        .select({
          total: sum(invoices.totalAmount).as("total"),
        })
        .from(invoices)
        .where(
          and(
            eq(invoices.teamId, teamId),
            between(invoices.issueDate, prevFrom, prevTo),
          ),
        );

      const currentTotal = currentPeriod.reduce(
        (acc, item) => acc + Number(item.total || 0),
        0,
      );
      const prevTotal = Number(prevPeriod[0]?.total || 0);

      return {
        summary: {
          currency: input.currency || "USD",
          currentTotal: currentTotal / 100,
          prevTotal: prevTotal / 100,
        },
        meta: {
          type: "invoice" as const,
          period: "monthly",
          currency: input.currency || "USD",
        },
        result: currentPeriod.map((item) => ({
          date: item.date,
          value: Number(item.total || 0) / 100,
        })),
      };
    }),

  jobs: protectedProcedure
    .input(reportsInputSchema)
    .query(async ({ ctx: { teamId }, input }) => {
      const db = await connectDb();

      // Get job counts
      const currentPeriod = await db
        .select({
          date: sql`DATE(${jobs.jobDate})`.as("date"),
          count: count(jobs.id).as("count"),
        })
        .from(jobs)
        .where(
          and(
            eq(jobs.teamId, teamId),
            between(jobs.jobDate, input.startDate, input.endDate),
          ),
        )
        .groupBy(sql`DATE(${jobs.jobDate})`)
        .orderBy(sql`DATE(${jobs.jobDate})`);

      const prevFrom = format(subMonths(new Date(input.startDate), 1), "yyyy-MM-dd");
      const prevTo = format(subMonths(new Date(input.endDate), 1), "yyyy-MM-dd");

      const prevPeriod = await db
        .select({
          count: count(jobs.id).as("count"),
        })
        .from(jobs)
        .where(
          and(eq(jobs.teamId, teamId), between(jobs.jobDate, prevFrom, prevTo)),
        );

      const currentTotal = currentPeriod.reduce(
        (acc, item) => acc + Number(item.count || 0),
        0,
      );
      const prevTotal = Number(prevPeriod[0]?.count || 0);

      return {
        summary: {
          currency: null,
          currentTotal,
          prevTotal,
        },
        meta: {
          type: "count" as const,
          period: "monthly",
          currency: null,
        },
        result: currentPeriod.map((item) => ({
          date: item.date,
          value: Number(item.count || 0),
        })),
      };
    }),

  volume: protectedProcedure
    .input(reportsInputSchema)
    .query(async ({ ctx: { teamId }, input }) => {
      const db = await connectDb();

      // Get volume data (cubic meters)
      const currentPeriod = await db
        .select({
          date: sql`DATE(${jobs.jobDate})`.as("date"),
          volume: sum(sql`${jobs.cubicMetreCapacity} * ${jobs.loadNumber}`).as(
            "volume",
          ),
        })
        .from(jobs)
        .where(
          and(
            eq(jobs.teamId, teamId),
            between(jobs.jobDate, input.startDate, input.endDate),
          ),
        )
        .groupBy(sql`DATE(${jobs.jobDate})`)
        .orderBy(sql`DATE(${jobs.jobDate})`);

      const prevFrom = format(subMonths(new Date(input.startDate), 1), "yyyy-MM-dd");
      const prevTo = format(subMonths(new Date(input.endDate), 1), "yyyy-MM-dd");

      const prevPeriod = await db
        .select({
          volume: sum(sql`${jobs.cubicMetreCapacity} * ${jobs.loadNumber}`).as(
            "volume",
          ),
        })
        .from(jobs)
        .where(
          and(eq(jobs.teamId, teamId), between(jobs.jobDate, prevFrom, prevTo)),
        );

      const currentTotal = currentPeriod.reduce(
        (acc, item) => acc + Number(item.volume || 0),
        0,
      );
      const prevTotal = Number(prevPeriod[0]?.volume || 0);

      return {
        summary: {
          currency: null,
          currentTotal,
          prevTotal,
        },
        meta: {
          type: "volume" as const,
          period: "monthly",
          currency: null,
        },
        result: currentPeriod.map((item) => ({
          date: item.date,
          value: Number(item.volume || 0),
        })),
      };
    }),
});
