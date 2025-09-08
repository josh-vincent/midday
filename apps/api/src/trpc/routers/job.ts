import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import {
  createJob,
  deleteJob,
  getJobsByTeamId,
  updateJob,
} from "@midday/db/queries";
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
          (job) =>
            job.jobNumber?.toLowerCase().includes(searchLower) ||
            job.companyName?.toLowerCase().includes(searchLower) ||
            job.addressSite?.toLowerCase().includes(searchLower) ||
            job.materialType?.toLowerCase().includes(searchLower) ||
            job.contactPerson?.toLowerCase().includes(searchLower),
        );
      }

      // Filter by customer
      if (params.customerId) {
        jobs = jobs.filter((job) => job.customerId === params.customerId);
      }

      // Filter by status
      if (params.status && params.status.length > 0) {
        jobs = jobs.filter((job) => params.status?.includes(job.status as any));
      }

      // Filter out invoiced jobs (those with invoiceId)
      jobs = jobs.filter((job) => !job.invoiceId);

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
      }).optional(),
    )
    .query(async ({ ctx: { db, teamId }, input }) => {
      if (!teamId) {
        return [];
      }
      
      // Get all jobs for the team
      let jobs = await getJobsByTeamId(db, teamId);
      
      // Filter by search query
      if (input?.q && input.q !== null) {
        const searchLower = input.q.toLowerCase();
        jobs = jobs.filter(
          (job) =>
            job.jobNumber?.toLowerCase().includes(searchLower) ||
            job.companyName?.toLowerCase().includes(searchLower) ||
            job.addressSite?.toLowerCase().includes(searchLower) ||
            job.materialType?.toLowerCase().includes(searchLower) ||
            job.contactPerson?.toLowerCase().includes(searchLower),
        );
      }
      
      // Filter by customer
      if (input?.customerId && input.customerId !== null) {
        jobs = jobs.filter((job) => job.customerId === input.customerId);
      }
      
      // Filter by status
      if (input?.status && input.status !== null) {
        jobs = jobs.filter((job) => job.status === input.status);
      }
      
      // Filter by date range
      if ((input?.start && input.start !== null) || (input?.end && input.end !== null)) {
        jobs = jobs.filter((job) => {
          if (!job.jobDate) return false;
          const jobDate = new Date(job.jobDate);
          
          if (input.start && input.start !== null && jobDate < new Date(input.start)) {
            return false;
          }
          if (input.end && input.end !== null && jobDate > new Date(input.end)) {
            return false;
          }
          return true;
        });
      }
      
      // Filter out invoiced jobs (those with invoiceId)
      jobs = jobs.filter((job) => !job.invoiceId);
      
      // Sort
      if (input?.sort && input.sort !== null && input.sort.length > 0) {
        const [column, direction] = input.sort[0].split(":");
        
        jobs.sort((a, b) => {
          let aVal: any = (a as any)[column];
          let bVal: any = (b as any)[column];
          
          // Handle null/undefined values
          if (aVal == null) aVal = "";
          if (bVal == null) bVal = "";
          
          // Handle date comparison
          if (column === "jobDate") {
            aVal = new Date(aVal);
            bVal = new Date(bVal);
          }
          
          // Handle numeric comparison
          if (column === "totalAmount" || column === "volume" || column === "weight") {
            aVal = Number(aVal) || 0;
            bVal = Number(bVal) || 0;
          }
          
          // Compare
          if (aVal < bVal) return direction === "desc" ? 1 : -1;
          if (aVal > bVal) return direction === "desc" ? -1 : 1;
          return 0;
        });
      }
      
      // For infinite scroll pagination
      const limit = input?.limit || 50;
      const cursorIndex = input?.cursor ? parseInt(input.cursor, 10) : 0;
      const paginatedJobs = jobs.slice(cursorIndex, cursorIndex + limit);
      const nextCursor = cursorIndex + limit < jobs.length ? String(cursorIndex + limit) : undefined;
      
      return {
        data: paginatedJobs,
        cursor: nextCursor,
      };
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
    const todaysJobs = jobs.filter((job) => job.jobDate === today);
    const todaysCompleted = todaysJobs.filter(
      (job) => job.status === "completed",
    );

    // Calculate this week's data
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // Sunday

    const weekJobs = jobs.filter((job) => {
      if (!job.jobDate) return false;
      const jobDate = new Date(job.jobDate);
      return (
        jobDate >= weekStart && jobDate <= weekEnd && job.status === "completed"
      );
    });

    const weekRevenue = weekJobs.reduce((total, job) => {
      const amount =
        (Number(job.pricePerUnit) || 0) * (Number(job.cubicMetreCapacity) || 0);
      return total + amount;
    }, 0);

    // Calculate pending jobs
    const pendingJobs = jobs.filter(
      (job) => job.status === "pending" || job.status === "in_progress",
    );

    const pendingValue = pendingJobs.reduce((total, job) => {
      const amount =
        (Number(job.pricePerUnit) || 0) * (Number(job.cubicMetreCapacity) || 0);
      return total + amount;
    }, 0);

    // Calculate monthly volume
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthJobs = jobs.filter((job) => {
      if (!job.jobDate) return false;
      const jobDate = new Date(job.jobDate);
      return jobDate >= monthStart && jobDate <= monthEnd;
    });

    const totalVolume = monthJobs.reduce((total, job) => {
      return total + (Number(job.cubicMetreCapacity) || 0);
    }, 0);

    const completedDeliveries = monthJobs.filter(
      (job) => job.status === "completed",
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
          .enum(["pending", "in_progress", "completed", "cancelled"])
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
          .enum(["pending", "in_progress", "completed", "cancelled"])
          .default("pending"),

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
          .enum(["pending", "in_progress", "completed", "cancelled"])
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
        status: z.enum(["pending", "in_progress", "completed", "cancelled", "invoiced"]),
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
      return allJobs.filter((job) => job.jobDate === input.date);
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
      const job = jobs.find((j) => j.id === input.id);
      
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
        (acc, job) => {
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
        {} as Record<string, any>,
      );

      return Object.values(summary);
    }),
});
