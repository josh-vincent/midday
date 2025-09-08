import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { 
  withErrorHandler, 
  notFoundError, 
  validationError,
  forbiddenError 
} from "@api/utils/errors";
import {
  createJob,
  deleteJob,
  updateJob,
  searchJobsEnhanced,
  getJobsSummary,
  batchUpdateJobStatus,
  getJobFieldSuggestions,
} from "@midday/db/queries";
import { jobs } from "@midday/db/schema";
import { and, eq } from "drizzle-orm";
import { 
  withCache, 
  invalidateCache, 
  invalidatePattern,
  cacheKeys,
  RedisService
} from "@midday/redis";
import { z } from "zod";

const CACHE_TTL = {
  LIST: 60,      // 1 minute for lists
  SUMMARY: 300,  // 5 minutes for summaries
  DETAIL: 120,   // 2 minutes for details
  SUGGESTIONS: 3600, // 1 hour for suggestions
};

export const jobsEnhancedRouter = createTRPCRouter({
  // Enhanced search with caching
  search: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        customerId: z.string().optional(),
        status: z.array(z.enum(["pending", "in_progress", "completed", "invoiced", "cancelled"])).optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        minAmount: z.number().optional(),
        maxAmount: z.number().optional(),
        dirtType: z.array(z.string()).optional(),
        page: z.number().default(1),
        pageSize: z.number().min(1).max(100).default(25),
        orderBy: z.string().default("createdAt"),
        sortDirection: z.enum(["asc", "desc"]).default("desc"),
        skipCache: z.boolean().optional(),
      })
    )
    .query(async ({ ctx: { db, teamId }, input }) => {
      return withErrorHandler(async () => {
        if (!teamId) {
          throw forbiddenError("jobs");
        }

        const cacheKey = cacheKeys.jobsList(teamId, input);
        
        return withCache(
          {
            key: cacheKey,
            ttl: CACHE_TTL.LIST,
          },
          async () => {
            const results = await searchJobsEnhanced(db, {
              ...input,
              teamId,
            });
            
            // Store individual job entries in cache for faster detail lookups
            if (results.data.length > 0) {
              await Promise.all(
                results.data.map(job =>
                  RedisService.set(
                    cacheKeys.jobById(job.id),
                    job,
                    CACHE_TTL.DETAIL
                  )
                )
              );
            }
            
            return results;
          },
          input.skipCache
        );
      }, 'jobs.search');
    }),

  // Get summary statistics with caching
  summary: protectedProcedure
    .input(z.object({ skipCache: z.boolean().optional() }).optional())
    .query(async ({ ctx: { db, teamId }, input }) => {
      return withErrorHandler(async () => {
        if (!teamId) {
          return {
            today: { total: 0, completed: 0, revenue: 0 },
            pending: { count: 0, potentialRevenue: 0 },
            week: { jobCount: 0, revenue: 0 },
            month: { volume: 0, deliveries: 0 },
          };
        }

        const cacheKey = cacheKeys.jobsSummary(teamId);
        
        return withCache(
          {
            key: cacheKey,
            ttl: CACHE_TTL.SUMMARY,
          },
          async () => getJobsSummary(db, teamId),
          input?.skipCache
        );
      }, 'jobs.summary');
    }),

  // Get single job with caching
  getById: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        skipCache: z.boolean().optional(),
      })
    )
    .query(async ({ ctx: { db, teamId }, input }) => {
      return withErrorHandler(async () => {
        if (!teamId) {
          throw forbiddenError("job");
        }

        const cacheKey = cacheKeys.jobById(input.id);
        
        const job = await withCache(
          {
            key: cacheKey,
            ttl: CACHE_TTL.DETAIL,
          },
          async () => {
            const [result] = await db
              .select()
              .from(jobs)
              .where(and(eq(jobs.id, input.id), eq(jobs.teamId, teamId)));
            
            if (!result) {
              notFoundError("Job", input.id);
            }
            
            return result;
          },
          input.skipCache
        );

        return job;
      }, 'jobs.getById');
    }),

  // Create job with cache invalidation
  create: protectedProcedure
    .input(
      z.object({
        customerId: z.string().uuid().nullable().optional(),
        jobNumber: z.string().nullable().optional(),
        contactPerson: z.string().optional(),
        contactNumber: z.string().optional(),
        rego: z.string().optional(),
        loadNumber: z.number().optional(),
        companyName: z.string().optional(),
        addressSite: z.string().optional(),
        equipmentType: z.string().optional(),
        materialType: z.string().optional(),
        pricePerUnit: z.number().optional(),
        cubicMetreCapacity: z.number().optional(),
        jobDate: z.string().optional(),
        scheduledDate: z.string().optional(),
        status: z.enum(["pending", "in_progress", "completed", "invoiced", "cancelled"]).optional(),
        truckNumber: z.string().optional(),
        driverName: z.string().optional(),
        notes: z.string().nullable().optional(),
        // Legacy fields
        sourceLocation: z.string().optional(),
        sourceAddress: z.string().optional(),
        destinationSite: z.string().optional(),
        dirtType: z.string().optional(),
        quantityCubicMeters: z.number().optional(),
        weightKg: z.number().optional(),
        pricePerCubicMeter: z.number().optional(),
        totalAmount: z.number().optional(),
        photos: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx: { db, teamId, session }, input }) => {
      return withErrorHandler(async () => {
        if (!teamId || !session) {
          throw forbiddenError("create jobs");
        }

        // Validate required fields
        if (!input.companyName && !input.contactPerson) {
          validationError("companyName", "Either company name or contact person is required");
        }

        const job = await createJob(db, {
          ...input,
          teamId,
          createdBy: session.user.id,
        });

        // Invalidate related caches
        await Promise.all([
          invalidatePattern(`jobs:list:${teamId}:*`),
          invalidateCache(cacheKeys.jobsSummary(teamId)),
        ]);

        return job;
      }, 'jobs.create');
    }),

  // Update job with cache invalidation
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        customerId: z.string().uuid().nullable().optional(),
        jobNumber: z.string().nullable().optional(),
        contactPerson: z.string().optional(),
        contactNumber: z.string().optional(),
        rego: z.string().optional(),
        loadNumber: z.number().optional(),
        companyName: z.string().optional(),
        addressSite: z.string().optional(),
        equipmentType: z.string().optional(),
        materialType: z.string().optional(),
        pricePerUnit: z.number().optional(),
        cubicMetreCapacity: z.number().optional(),
        jobDate: z.string().optional(),
        scheduledDate: z.string().optional(),
        arrivalTime: z.string().optional(),
        completedTime: z.string().optional(),
        status: z.enum(["pending", "in_progress", "completed", "invoiced", "cancelled"]).optional(),
        truckNumber: z.string().optional(),
        driverName: z.string().optional(),
        notes: z.string().nullable().optional(),
        // Legacy fields
        sourceLocation: z.string().optional(),
        sourceAddress: z.string().optional(),
        destinationSite: z.string().optional(),
        dirtType: z.string().optional(),
        quantityCubicMeters: z.number().optional(),
        weightKg: z.number().optional(),
        pricePerCubicMeter: z.number().optional(),
        totalAmount: z.number().optional(),
        photos: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx: { db, teamId, session }, input }) => {
      return withErrorHandler(async () => {
        if (!teamId || !session) {
          throw forbiddenError("update jobs");
        }

        const { id, ...updateData } = input;

        const job = await updateJob(db, {
          id,
          teamId,
          ...updateData,
          updatedBy: session.user.id,
        });

        if (!job) {
          notFoundError("Job", id);
        }

        // Invalidate related caches
        await Promise.all([
          invalidateCache(cacheKeys.jobById(id)),
          invalidatePattern(`jobs:list:${teamId}:*`),
          invalidateCache(cacheKeys.jobsSummary(teamId)),
        ]);

        return job;
      }, 'jobs.update');
    }),

  // Batch update status
  batchUpdateStatus: protectedProcedure
    .input(
      z.object({
        jobIds: z.array(z.string().uuid()),
        status: z.enum(["pending", "in_progress", "completed", "invoiced", "cancelled"]),
      })
    )
    .mutation(async ({ ctx: { db, teamId, session }, input }) => {
      return withErrorHandler(async () => {
        if (!teamId || !session) {
          throw forbiddenError("update jobs");
        }

        if (input.jobIds.length === 0) {
          validationError("jobIds", "At least one job ID is required");
        }

        if (input.jobIds.length > 100) {
          validationError("jobIds", "Cannot update more than 100 jobs at once");
        }

        const updatedJobs = await batchUpdateJobStatus(
          db,
          input.jobIds,
          input.status,
          teamId,
          session.user.id
        );

        // Invalidate all related caches
        await Promise.all([
          ...input.jobIds.map(id => invalidateCache(cacheKeys.jobById(id))),
          invalidatePattern(`jobs:list:${teamId}:*`),
          invalidateCache(cacheKeys.jobsSummary(teamId)),
        ]);

        return updatedJobs;
      }, 'jobs.batchUpdateStatus');
    }),

  // Delete job with cache invalidation
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx: { db, teamId, session }, input }) => {
      return withErrorHandler(async () => {
        if (!teamId || !session) {
          throw forbiddenError("delete jobs");
        }

        // Verify job exists and belongs to team
        const [existing] = await db
          .select({ id: jobs.id })
          .from(jobs)
          .where(and(eq(jobs.id, input.id), eq(jobs.teamId, teamId)));

        if (!existing) {
          notFoundError("Job", input.id);
        }

        const result = await deleteJob(db, input.id);

        // Invalidate related caches
        await Promise.all([
          invalidateCache(cacheKeys.jobById(input.id)),
          invalidatePattern(`jobs:list:${teamId}:*`),
          invalidateCache(cacheKeys.jobsSummary(teamId)),
        ]);

        return result;
      }, 'jobs.delete');
    }),

  // Get field suggestions for autocomplete
  suggestions: protectedProcedure
    .input(
      z.object({
        field: z.enum([
          "companyName",
          "contactPerson",
          "materialType",
          "equipmentType",
          "addressSite",
          "driverName",
          "truckNumber",
          "rego",
        ]),
        skipCache: z.boolean().optional(),
      })
    )
    .query(async ({ ctx: { db, teamId }, input }) => {
      return withErrorHandler(async () => {
        if (!teamId) {
          return [];
        }

        const cacheKey = `jobs:suggestions:${teamId}:${input.field}`;
        
        return withCache(
          {
            key: cacheKey,
            ttl: CACHE_TTL.SUGGESTIONS,
          },
          async () => getJobFieldSuggestions(db, teamId, input.field),
          input.skipCache
        );
      }, 'jobs.suggestions');
    }),
});