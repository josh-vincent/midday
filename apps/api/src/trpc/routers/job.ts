import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import {
  createJob,
  deleteJob,
  getJobsByTeamId,
  getJobsAdvanced,
  getJobsGrouped,
  getUnlinkedJobsByCompanyName,
  updateJob,
} from "@midday/db/queries";

type Job = Awaited<ReturnType<typeof getJobsByTeamId>>[number];
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const jobsRouter = createTRPCRouter({
  // Get jobs with search and filtering
  get: protectedProcedure
    .input(
      z
        .object({
          q: z.string().optional(),
          customerId: z.string().optional(),
          status: z
            .array(z.enum(["pending", "in_progress", "completed", "cancelled"]))
            .optional(),
          pageSize: z.number().default(10),
          page: z.number().default(1),
        })
        .optional(),
    )
    .query(async ({ ctx: { db, teamId }, input }) => {
      if (!teamId) {
        return { data: [], total: 0 };
      }

      const params = {
        teamId,
        search: input?.q,
        customerId: input?.customerId,
        status: input?.status,
        limit: input?.pageSize || 10,
        offset: ((input?.page || 1) - 1) * (input?.pageSize || 10),
      };

      // For now, use the existing getJobsByTeamId and filter in memory
      // TODO: Implement proper search in database query
      let jobs = await getJobsByTeamId(db, teamId);

      // Filter by search query
      if (params.search) {
        const searchLower = params.search.toLowerCase();
        jobs = jobs.filter(
          (job: Job) =>
            job.jobNumber?.toLowerCase().includes(searchLower) ||
            job.companyName?.toLowerCase().includes(searchLower) ||
            job.addressSite?.toLowerCase().includes(searchLower) ||
            job.materialType?.toLowerCase().includes(searchLower) ||
            job.contactPerson?.toLowerCase().includes(searchLower),
        );
      }

      // Filter by customer
      if (params.customerId) {
        jobs = jobs.filter((job: Job) => job.customerId === params.customerId);
      }

      // Filter by status
      if (params.status && params.status.length > 0) {
        jobs = jobs.filter((job: Job) => params.status?.includes(job.status as any));
      }

      // Paginate
      const total = jobs.length;
      const paginatedJobs = jobs.slice(
        params.offset,
        params.offset + params.limit,
      );

      return {
        data: paginatedJobs,
        total,
        page: input?.page || 1,
        pageSize: input?.pageSize || 10,
      };
    }),

  list: protectedProcedure
    .input(
      z.object({
        q: z.string().nullable().optional(),
        customerId: z.string().nullable().optional(),
        status: z.string().nullable().optional(),
        start: z.string().nullable().optional(),
        end: z.string().nullable().optional(),
        sort: z.array(z.string()).nullable().optional(),
        cursor: z.string().nullable().optional(),
        limit: z.number().default(50),
        groupBy: z.array(z.string()).nullable().optional(),
        direction: z.enum(['forward', 'backward']).optional(), // Added for infinite query
        minCubicMeters: z.number().nullable().optional(),
        maxCubicMeters: z.number().nullable().optional(),
        invoiceStatus: z.string().nullable().optional(),
      }).optional(),
    )
    .query(async ({ ctx: { db, teamId }, input }) => {
      if (!teamId) {
        return { data: [], cursor: undefined };
      }

      const queryParams = {
        teamId,
        search: input?.q,
        customerId: input?.customerId,
        status: input?.status,
        startDate: input?.start,
        endDate: input?.end,
        sort: input?.sort,
        cursor: input?.cursor,
        limit: input?.limit,
        groupBy: input?.groupBy,
        minCubicMeters: input?.minCubicMeters,
        maxCubicMeters: input?.maxCubicMeters,
        invoiceStatus: input?.invoiceStatus,
      };

      // Use grouped query if groupBy is specified
      if (input?.groupBy && input.groupBy.length > 0) {
        return getJobsGrouped(db, queryParams);
      }

      return getJobsAdvanced(db, queryParams);
    }),

  getByInvoiceId: protectedProcedure
    .input(
      z.object({
        invoiceId: z.string().uuid(),
      })
    )
    .query(async ({ ctx: { db, teamId }, input }) => {
      if (!teamId) {
        return [];
      }

      const jobs = await getJobsByTeamId(db, teamId);
      
      // Filter jobs by invoiceId
      return jobs.filter((job: Job) => job.invoiceId === input.invoiceId);
    }),

  summary: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    if (!teamId) {
      return {
        today: { total: 0, completed: 0 },
        week: { revenue: 0, jobCount: 0 },
        pending: { count: 0, potentialRevenue: 0 },
        month: { volume: 0, deliveries: 0 },
      };
    }

    // Get all jobs for the team
    const jobs = await getJobsByTeamId(db, teamId);
    const now = new Date();
    const today = now.toISOString().split("T")[0];

    // Calculate today's jobs
    const todaysJobs = jobs.filter((job: Job) => job.jobDate === today);
    const todaysCompleted = todaysJobs.filter(
      (job: Job) => job.status === "completed",
    );

    // Calculate this week's data
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // Sunday

    const weekJobs = jobs.filter((job: Job) => {
      if (!job.jobDate) return false;
      const jobDate = new Date(job.jobDate);
      return (
        jobDate >= weekStart && jobDate <= weekEnd && job.status === "completed"
      );
    });

    const weekRevenue = weekJobs.reduce((total: number, job: Job) => {
      const amount =
        (Number(job.pricePerUnit) || 0) * (Number(job.cubicMetreCapacity) || 0);
      return total + amount;
    }, 0);

    // Calculate pending jobs
    const pendingJobs = jobs.filter(
      (job: Job) => job.status === "pending" || job.status === "in_progress",
    );

    const pendingValue = pendingJobs.reduce((total: number, job: Job) => {
      const amount =
        (Number(job.pricePerUnit) || 0) * (Number(job.cubicMetreCapacity) || 0);
      return total + amount;
    }, 0);

    // Calculate monthly volume
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthJobs = jobs.filter((job: Job) => {
      if (!job.jobDate) return false;
      const jobDate = new Date(job.jobDate);
      return jobDate >= monthStart && jobDate <= monthEnd;
    });

    const totalVolume = monthJobs.reduce((total: number, job: Job) => {
      return total + (Number(job.cubicMetreCapacity) || 0);
    }, 0);

    const completedDeliveries = monthJobs.filter(
      (job: Job) => job.status === "completed",
    ).length;

    return {
      today: {
        total: todaysJobs.length,
        completed: todaysCompleted.length,
      },
      week: {
        revenue: weekRevenue,
        jobCount: weekJobs.length,
      },
      pending: {
        count: pendingJobs.length,
        potentialRevenue: pendingValue,
      },
      month: {
        volume: totalVolume,
        deliveries: completedDeliveries,
      },
    };
  }),

  listByDateRange: protectedProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
        status: z
          .enum(["pending", "in_progress", "completed", "cancelled", "delivered"])
          .optional(),
      }),
    )
    .query(async ({ ctx: { db, teamId }, input }) => {
      if (!teamId) {
        return [];
      }
      // This will need to be implemented in the queries
      return getJobsByTeamId(db, teamId);
    }),

  create: protectedProcedure
    .input(
      z.object({
        // Required fields
        customerId: z.string().optional().nullable(),
        jobNumber: z.string().optional().nullable(),

        // Contact details
        contactPerson: z.string().optional(),
        contactNumber: z.string().optional(),

        // Vehicle details
        rego: z.string().optional(),
        loadNumber: z.number().default(1),

        // Company/Job details
        companyName: z.string().optional(),
        addressSite: z.string().optional(),

        // Equipment and material
        equipmentType: z.string().optional(),
        materialType: z.string().optional(),
        pricePerUnit: z.number().optional(),
        cubicMetreCapacity: z.number().optional(),

        // Dates
        jobDate: z.string().optional(),
        scheduledDate: z.string().optional(),

        // Tracking
        status: z
          .enum(["pending", "in_progress", "completed", "cancelled", "delivered"])
          .default("delivered"),

        // Optional fields for backwards compatibility
        truckNumber: z.string().optional(),
        driverName: z.string().optional(),
        notes: z.string().optional(),

        // Legacy fields (optional)
        sourceLocation: z.string().optional(),
        sourceAddress: z.string().optional(),
        destinationSite: z.string().optional(),
        dirtType: z
          .enum([
            "clean",
            "contaminated",
            "mixed",
            "clay",
            "sand",
            "topsoil",
            "rock",
            "concrete",
            "asphalt",
            "other",
          ])
          .optional(),
        quantityCubicMeters: z.number().optional(),
        weightKg: z.number().optional(),
        pricePerCubicMeter: z.number().optional(),
        totalAmount: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx: { db, teamId, session }, input }) => {
      if (!teamId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No team selected",
        });
      }

      // Calculate total amount if not provided
      let totalAmount = input.totalAmount;
      if (!totalAmount && input.pricePerUnit && input.cubicMetreCapacity) {
        totalAmount = input.pricePerUnit * input.cubicMetreCapacity * 100; // Convert to cents
      }

      return createJob(db, {
        ...input,
        teamId: teamId,
        totalAmount: totalAmount || 0,
        createdBy: session.user.id,
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        
        // Customer linking
        customerId: z.string().optional().nullable(),

        // Contact details
        contactPerson: z.string().optional(),
        contactNumber: z.string().optional(),

        // Vehicle details
        rego: z.string().optional(),
        loadNumber: z.number().optional(),

        // Company/Job details
        companyName: z.string().optional(),
        addressSite: z.string().optional(),
        jobNumber: z.string().optional(),

        // Equipment and material
        equipmentType: z.string().optional(),
        materialType: z.string().optional(),
        pricePerUnit: z.number().optional(),
        cubicMetreCapacity: z.number().optional(),

        // Dates
        jobDate: z.string().optional(),
        scheduledDate: z.string().optional(),
        arrivalTime: z.string().optional(),
        completedTime: z.string().optional(),

        // Tracking
        status: z
          .enum(["pending", "in_progress", "completed", "cancelled", "delivered"])
          .optional(),

        // Optional fields
        truckNumber: z.string().optional(),
        driverName: z.string().optional(),
        notes: z.string().optional().nullable(),

        // Legacy fields (optional)
        sourceLocation: z.string().optional(),
        sourceAddress: z.string().optional(),
        destinationSite: z.string().optional(),
        dirtType: z
          .enum([
            "clean",
            "contaminated",
            "mixed",
            "clay",
            "sand",
            "topsoil",
            "rock",
            "concrete",
            "asphalt",
            "other",
          ])
          .optional(),
        quantityCubicMeters: z.number().optional(),
        weightKg: z.number().optional(),
        pricePerCubicMeter: z.number().optional(),
        totalAmount: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      if (!teamId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No team selected",
        });
      }

      // Calculate total amount if price and capacity are provided
      if (
        !input.totalAmount &&
        input.pricePerUnit &&
        input.cubicMetreCapacity
      ) {
        input.totalAmount = input.pricePerUnit * input.cubicMetreCapacity * 100; // Convert to cents
      }

      return updateJob(db, {
        ...input,
        teamId,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx: { db }, input }) => {
      return deleteJob(db, input.id);
    }),

  // Bulk update status
  updateManyStatus: protectedProcedure
    .input(
      z.object({
        ids: z.array(z.string()),
        status: z.enum(["pending", "in_progress", "completed", "cancelled", "invoiced", "delivered"]),
      }),
    )
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      if (!teamId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "No team selected",
        });
      }

      const results = [];
      for (const id of input.ids) {
        const result = await updateJob(db, {
          id,
          status: input.status,
          teamId,
        });
        results.push(result);
      }
      
      return { count: results.length, ids: input.ids };
    }),

  // Link jobs to invoice - only stores invoiceId and invoiceNumber
  // Invoice status is always derived from the invoice table via join
  linkToInvoice: protectedProcedure
    .input(
      z.object({
        jobIds: z.array(z.string()),
        invoiceId: z.string().uuid(),
        invoiceNumber: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      if (!teamId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "No team selected",
        });
      }

      const results = [];
      for (const id of input.jobIds) {
        const result = await updateJob(db, {
          id,
          invoiceId: input.invoiceId,
          invoiceNumber: input.invoiceNumber,
          teamId,
        });
        results.push(result);
      }

      return { count: results.length, jobIds: input.jobIds };
    }),

  // Bulk delete
  deleteMany: protectedProcedure
    .input(z.array(z.string()))
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      if (!teamId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "No team selected",
        });
      }

      const results = [];
      for (const id of input) {
        const result = await deleteJob(db, id);
        results.push(result);
      }
      
      return { count: results.length, ids: input };
    }),

  // New endpoint for bulk import
  bulkImport: protectedProcedure
    .input(
      z.object({
        jobs: z.array(
          z.object({
            customerId: z.string().optional().nullable(),
            jobNumber: z.string().optional().nullable(),
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
            status: z
              .enum(["pending", "in_progress", "completed", "cancelled"])
              .optional(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx: { db, teamId, session }, input }) => {
      console.log(
        "bulkImport called with input:",
        JSON.stringify(input, null, 2),
      );
      console.log("teamId:", teamId);
      console.log("session user:", session?.user?.id);

      if (!teamId) {
        console.error("No teamId available");
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No team selected",
        });
      }

      const results = [];
      for (const job of input.jobs) {
        console.log("Processing job:", JSON.stringify(job, null, 2));

        const totalAmount =
          job.pricePerUnit && job.cubicMetreCapacity
            ? job.pricePerUnit * job.cubicMetreCapacity * 100 // Convert to cents
            : 0;

        const jobData = {
          ...job,
          status: job.status || "pending",
          teamId: teamId,
          totalAmount,
          createdBy: session.user.id,
        };

        console.log(
          "Creating job with data:",
          JSON.stringify(jobData, null, 2),
        );

        try {
          const result = await createJob(db, jobData);
          console.log("Job created successfully:", result.id);
          results.push(result);
        } catch (error) {
          console.error("Error creating job:", error);
          throw error;
        }
      }

      console.log("bulkImport completed, created", results.length, "jobs");
      return results;
    }),

  // Get jobs for a specific date
  getByDate: protectedProcedure
    .input(
      z.object({
        date: z.string(), // Format: YYYY-MM-DD
      }),
    )
    .query(async ({ ctx: { db, teamId }, input }) => {
      if (!teamId) {
        return [];
      }

      // This would need to be implemented in queries
      // For now, return all jobs and filter on client
      const allJobs = await getJobsByTeamId(db, teamId);
      return allJobs.filter((job: Job) => job.jobDate === input.date);
    }),

  // Get unlinked jobs by company name
  unlinkedByCompany: protectedProcedure
    .input(z.object({
      companyName: z.string().optional(),
      limit: z.number().default(50)
    }).optional())
    .query(async ({ ctx: { db, teamId }, input }) => {
      if (!teamId) return [];
      
      return getUnlinkedJobsByCompanyName(
        db, 
        teamId, 
        input?.companyName,
        input?.limit
      );
    }),

  // Get job summary by company
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx: { db, teamId }, input }) => {
      if (!teamId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "No team ID found",
        });
      }

      const jobs = await getJobsByTeamId(db, teamId);
      const job = jobs.find((j: Job) => j.id === input.id);
      
      if (!job) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Job not found",
        });
      }

      return job;
    }),

  getSummaryByCompany: protectedProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }),
    )
    .query(async ({ ctx: { db, teamId }, input }) => {
      if (!teamId) {
        return [];
      }

      // This would need to be implemented in queries
      // For now, return a placeholder
      const allJobs = await getJobsByTeamId(db, teamId);

      // Group by company name
      const summary = allJobs.reduce(
        (acc: Record<string, { company: string; totalJobs: number; totalAmount: number; totalCubicMeters: number }>, job: Job) => {
          const company = job.companyName || "Unknown";
          if (!acc[company]) {
            acc[company] = {
              company,
              totalJobs: 0,
              totalAmount: 0,
              totalCubicMeters: 0,
            };
          }

          acc[company].totalJobs++;
          acc[company].totalAmount += job.totalAmount || 0;
          acc[company].totalCubicMeters += job.cubicMetreCapacity || 0;

          return acc;
        },
        {} as Record<string, { company: string; totalJobs: number; totalAmount: number; totalCubicMeters: number }>,
      );

      return Object.values(summary);
    }),

  // Gatekeeper endpoints for member workflow
  getJobsGroupedByTruckForDate: protectedProcedure
    .input(
      z.object({
        date: z.string(), // Format: YYYY-MM-DD
      }),
    )
    .query(async ({ ctx: { db, teamId }, input }) => {
      if (!teamId) {
        return [];
      }

      const allJobs = await getJobsByTeamId(db, teamId);
      const dateJobs = allJobs.filter((job: Job) => job.jobDate === input.date);
      
      // Group by company and rego combination
      type GroupedJob = {
        companyName: string;
        rego: string;
        loads: Job[];
        totalLoads: number;
        latestJob: Job;
      };

      const grouped = dateJobs.reduce((acc: Record<string, GroupedJob>, job: Job) => {
        if (!job.companyName || !job.rego) return acc;

        const key = `${job.companyName}-${job.rego}`;
        if (!acc[key]) {
          acc[key] = {
            companyName: job.companyName,
            rego: job.rego,
            loads: [],
            totalLoads: 0,
            latestJob: job,
          };
        }

        acc[key].loads.push(job);
        acc[key].totalLoads = acc[key].loads.length;

        // Keep the latest job for reference
        if (!acc[key].latestJob.createdAt ||
            (job.createdAt && job.createdAt > acc[key].latestJob.createdAt)) {
          acc[key].latestJob = job;
        }

        return acc;
      }, {} as Record<string, GroupedJob>);

      return Object.values(grouped);
    }),

  addLoadToExistingTruck: protectedProcedure
    .input(
      z.object({
        originalJobId: z.string(),
        date: z.string(), // Format: YYYY-MM-DD
      }),
    )
    .mutation(async ({ ctx: { db, teamId, session }, input }) => {
      if (!teamId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No team selected",
        });
      }

      // Get the original job to copy details from
      const allJobs = await getJobsByTeamId(db, teamId);
      const originalJob = allJobs.find((j: Job) => j.id === input.originalJobId);
      
      if (!originalJob) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Original job not found",
        });
      }

      // Get the current highest load number for this truck on this date
      const sameCompanyRegoJobs = allJobs.filter(
        (job: Job) =>
          job.jobDate === input.date &&
          job.companyName === originalJob.companyName &&
          job.rego === originalJob.rego
      );
      
      const maxLoadNumber = Math.max(
        ...sameCompanyRegoJobs.map((job: Job) => job.loadNumber || 1),
        1
      );

      // Create new job entry with incremented load number
      const newJobData = {
        customerId: originalJob.customerId,
        companyName: originalJob.companyName,
        rego: originalJob.rego,
        contactPerson: originalJob.contactPerson,
        contactNumber: originalJob.contactNumber,
        addressSite: originalJob.addressSite,
        equipmentType: originalJob.equipmentType,
        materialType: originalJob.materialType,
        pricePerUnit: originalJob.pricePerUnit ? Number(originalJob.pricePerUnit) : undefined,
        cubicMetreCapacity: originalJob.cubicMetreCapacity ? Number(originalJob.cubicMetreCapacity) : undefined,
        jobDate: input.date,
        loadNumber: maxLoadNumber + 1,
        status: "pending" as const,
        teamId: teamId,
        createdBy: session.user.id,
        totalAmount: originalJob.pricePerUnit && originalJob.cubicMetreCapacity 
          ? Number(originalJob.pricePerUnit) * Number(originalJob.cubicMetreCapacity) * 100 // Convert to cents
          : 0,
      };

      return createJob(db, newJobData);
    }),

  addLoadWithDirtType: protectedProcedure
    .input(
      z.object({
        originalJobId: z.string(),
        date: z.string(), // Format: YYYY-MM-DD
        dirtType: z.string().optional(), // Changed from enum to string to accept any material type
      }),
    )
    .mutation(async ({ ctx: { db, teamId, session }, input }) => {
      if (!teamId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No team selected",
        });
      }

      // Get the original job to copy details from
      const allJobs = await getJobsByTeamId(db, teamId);
      const originalJob = allJobs.find((j: Job) => j.id === input.originalJobId);
      
      if (!originalJob) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Original job not found",
        });
      }

      // Get the current highest load number for this truck on this date
      const sameCompanyRegoJobs = allJobs.filter(
        (job: Job) =>
          job.jobDate === input.date &&
          job.companyName === originalJob.companyName &&
          job.rego === originalJob.rego
      );
      
      const maxLoadNumber = Math.max(
        ...sameCompanyRegoJobs.map((job: Job) => job.loadNumber || 1),
        1
      );

      // Create new job entry with incremented load number and specified material type
      const newJobData = {
        customerId: originalJob.customerId,
        companyName: originalJob.companyName,
        rego: originalJob.rego,
        contactPerson: originalJob.contactPerson,
        contactNumber: originalJob.contactNumber,
        addressSite: originalJob.addressSite,
        equipmentType: originalJob.equipmentType,
        materialType: input.dirtType || originalJob.materialType, // Use the specified material type or copy from original
        pricePerUnit: originalJob.pricePerUnit ? Number(originalJob.pricePerUnit) : undefined,
        cubicMetreCapacity: originalJob.cubicMetreCapacity ? Number(originalJob.cubicMetreCapacity) : undefined,
        jobDate: input.date,
        loadNumber: maxLoadNumber + 1,
        status: "delivered" as const, // Set as delivered since it's being added at the gate
        teamId: teamId,
        createdBy: session.user.id,
        totalAmount: originalJob.pricePerUnit && originalJob.cubicMetreCapacity 
          ? Number(originalJob.pricePerUnit) * Number(originalJob.cubicMetreCapacity) 
          : undefined,
        // Add timestamp for when the load was delivered
        completedTime: new Date().toISOString(),
      };

      return createJob(db, newJobData);
    }),
});
