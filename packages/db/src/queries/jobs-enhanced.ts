import type { Database } from "@midday/db/client";
import { customers, invoices, jobs } from "@midday/db/schema";
import { and, asc, desc, eq, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm/sql/sql";
import { createActivity } from "./activities";

// Enhanced search with full-text capabilities
type JobSearchParams = {
  teamId: string;
  search?: string;
  customerId?: string;
  status?: string[];
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  dirtType?: string[];
  page?: number;
  pageSize?: number;
  orderBy?: string;
  sortDirection?: "asc" | "desc";
};

export async function searchJobsEnhanced(
  db: Database,
  params: JobSearchParams
) {
  const {
    teamId,
    search,
    customerId,
    status,
    dateFrom,
    dateTo,
    minAmount,
    maxAmount,
    dirtType,
    page = 1,
    pageSize = 25,
    orderBy = "createdAt",
    sortDirection = "desc",
  } = params;

  const offset = (page - 1) * pageSize;
  const conditions: SQL[] = [eq(jobs.teamId, teamId)];

  // Full-text search across multiple fields
  if (search && search.trim()) {
    const searchTerm = `%${search.trim()}%`;
    conditions.push(
      or(
        ilike(jobs.jobNumber, searchTerm),
        ilike(jobs.companyName, searchTerm),
        ilike(jobs.contactPerson, searchTerm),
        ilike(jobs.addressSite, searchTerm),
        ilike(jobs.materialType, searchTerm),
        ilike(jobs.equipmentType, searchTerm),
        ilike(jobs.rego, searchTerm),
        ilike(jobs.driverName, searchTerm),
        ilike(jobs.notes, searchTerm),
        // Legacy fields
        ilike(jobs.sourceLocation, searchTerm),
        ilike(jobs.destinationSite, searchTerm)
      ) as SQL
    );
  }

  // Filter by customer
  if (customerId) {
    conditions.push(eq(jobs.customerId, customerId));
  }

  // Filter by status (array)
  if (status && status.length > 0) {
    conditions.push(inArray(jobs.status, status));
  }

  // Filter by dirt type (array)
  if (dirtType && dirtType.length > 0) {
    conditions.push(inArray(jobs.dirtType, dirtType));
  }

  // Date range filter
  if (dateFrom) {
    conditions.push(gte(jobs.jobDate, dateFrom));
  }
  if (dateTo) {
    conditions.push(lte(jobs.jobDate, dateTo));
  }

  // Amount range filter
  if (minAmount !== undefined) {
    conditions.push(gte(jobs.totalAmount, minAmount));
  }
  if (maxAmount !== undefined) {
    conditions.push(lte(jobs.totalAmount, maxAmount));
  }

  // Dynamic ordering
  const orderByColumn = jobs[orderBy as keyof typeof jobs] as any;
  const orderByClause = sortDirection === "asc" 
    ? asc(orderByColumn) 
    : desc(orderByColumn);

  // Execute main query with joins
  const results = await db
    .select({
      id: jobs.id,
      teamId: jobs.teamId,
      customerId: jobs.customerId,
      jobNumber: jobs.jobNumber,
      contactPerson: jobs.contactPerson,
      contactNumber: jobs.contactNumber,
      rego: jobs.rego,
      loadNumber: jobs.loadNumber,
      companyName: jobs.companyName,
      addressSite: jobs.addressSite,
      equipmentType: jobs.equipmentType,
      materialType: jobs.materialType,
      pricePerUnit: jobs.pricePerUnit,
      cubicMetreCapacity: jobs.cubicMetreCapacity,
      jobDate: jobs.jobDate,
      sourceLocation: jobs.sourceLocation,
      sourceAddress: jobs.sourceAddress,
      destinationSite: jobs.destinationSite,
      dirtType: jobs.dirtType,
      quantityCubicMeters: jobs.quantityCubicMeters,
      weightKg: jobs.weightKg,
      pricePerCubicMeter: jobs.pricePerCubicMeter,
      totalAmount: jobs.totalAmount,
      status: jobs.status,
      scheduledDate: jobs.scheduledDate,
      arrivalTime: jobs.arrivalTime,
      completedTime: jobs.completedTime,
      invoiceId: jobs.invoiceId,
      truckNumber: jobs.truckNumber,
      driverName: jobs.driverName,
      notes: jobs.notes,
      photos: jobs.photos,
      createdBy: jobs.createdBy,
      createdAt: jobs.createdAt,
      updatedAt: jobs.updatedAt,
      // Add customer info
      customerName: customers.name,
      customerEmail: customers.email,
      // Add invoice info
      invoiceNumber: invoices.invoiceNumber,
      invoiceStatus: invoices.status,
    })
    .from(jobs)
    .leftJoin(customers, eq(jobs.customerId, customers.id))
    .leftJoin(invoices, eq(jobs.invoiceId, invoices.id))
    .where(and(...conditions))
    .orderBy(orderByClause)
    .limit(pageSize)
    .offset(offset);

  // Get total count for pagination
  const [{ count }] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(jobs)
    .leftJoin(customers, eq(jobs.customerId, customers.id))
    .where(and(...conditions));

  // Get aggregated stats
  const [stats] = await db
    .select({
      totalAmount: sql<number>`cast(sum(${jobs.totalAmount}) as int)`,
      totalVolume: sql<number>`cast(sum(${jobs.quantityCubicMeters}) as numeric)`,
      avgAmount: sql<number>`cast(avg(${jobs.totalAmount}) as int)`,
      completedCount: sql<number>`cast(sum(case when ${jobs.status} = 'completed' then 1 else 0 end) as int)`,
    })
    .from(jobs)
    .where(and(...conditions));

  return {
    data: results,
    pagination: {
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
      hasMore: page * pageSize < (count || 0),
    },
    stats: {
      totalAmount: stats?.totalAmount || 0,
      totalVolume: stats?.totalVolume || 0,
      avgAmount: stats?.avgAmount || 0,
      completedCount: stats?.completedCount || 0,
    },
  };
}

// Get job summary statistics
export async function getJobsSummary(db: Database, teamId: string) {
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Today's stats
  const [todayStats] = await db
    .select({
      total: sql<number>`cast(count(*) as int)`,
      completed: sql<number>`cast(sum(case when ${jobs.status} = 'completed' then 1 else 0 end) as int)`,
      revenue: sql<number>`cast(sum(case when ${jobs.status} = 'completed' then ${jobs.totalAmount} else 0 end) as int)`,
    })
    .from(jobs)
    .where(and(
      eq(jobs.teamId, teamId),
      eq(jobs.jobDate, today)
    ));

  // Pending jobs
  const [pendingStats] = await db
    .select({
      count: sql<number>`cast(count(*) as int)`,
      potentialRevenue: sql<number>`cast(sum(${jobs.totalAmount}) as int)`,
    })
    .from(jobs)
    .where(and(
      eq(jobs.teamId, teamId),
      eq(jobs.status, 'pending')
    ));

  // This week's stats
  const [weekStats] = await db
    .select({
      jobCount: sql<number>`cast(count(*) as int)`,
      revenue: sql<number>`cast(sum(case when ${jobs.status} = 'completed' then ${jobs.totalAmount} else 0 end) as int)`,
    })
    .from(jobs)
    .where(and(
      eq(jobs.teamId, teamId),
      gte(jobs.jobDate, weekAgo)
    ));

  // This month's stats
  const [monthStats] = await db
    .select({
      volume: sql<number>`cast(sum(${jobs.quantityCubicMeters}) as numeric)`,
      deliveries: sql<number>`cast(count(*) as int)`,
    })
    .from(jobs)
    .where(and(
      eq(jobs.teamId, teamId),
      gte(jobs.jobDate, monthAgo)
    ));

  return {
    today: {
      total: todayStats?.total || 0,
      completed: todayStats?.completed || 0,
      revenue: todayStats?.revenue || 0,
    },
    pending: {
      count: pendingStats?.count || 0,
      potentialRevenue: pendingStats?.potentialRevenue || 0,
    },
    week: {
      jobCount: weekStats?.jobCount || 0,
      revenue: weekStats?.revenue || 0,
    },
    month: {
      volume: monthStats?.volume || 0,
      deliveries: monthStats?.deliveries || 0,
    },
  };
}

// Batch update job status
export async function batchUpdateJobStatus(
  db: Database,
  jobIds: string[],
  status: string,
  teamId: string,
  userId?: string
) {
  if (!jobIds.length) return [];

  const updatedJobs = await db
    .update(jobs)
    .set({ 
      status,
      updatedAt: new Date().toISOString(),
      completedTime: status === 'completed' ? new Date().toISOString() : undefined,
    })
    .where(and(
      inArray(jobs.id, jobIds),
      eq(jobs.teamId, teamId)
    ))
    .returning();

  // Log activities
  if (userId) {
    await Promise.all(
      updatedJobs.map(job =>
        createActivity(db, {
          teamId,
          userId,
          action: "updated_status",
          entity: "job",
          entityId: job.id,
          metadata: {
            jobNumber: job.jobNumber,
            oldStatus: job.status,
            newStatus: status,
          },
        })
      )
    );
  }

  return updatedJobs;
}

// Auto-suggest values for form fields based on historical data
export async function getJobFieldSuggestions(
  db: Database,
  teamId: string,
  field: string
) {
  const validFields = [
    'companyName',
    'contactPerson',
    'materialType',
    'equipmentType',
    'addressSite',
    'driverName',
    'truckNumber',
    'rego',
  ];

  if (!validFields.includes(field)) {
    throw new Error(`Invalid field for suggestions: ${field}`);
  }

  const column = jobs[field as keyof typeof jobs];
  
  const results = await db
    .selectDistinct({ value: column })
    .from(jobs)
    .where(and(
      eq(jobs.teamId, teamId),
      sql`${column} IS NOT NULL AND ${column} != ''`
    ))
    .orderBy(desc(sql`count(*) OVER (PARTITION BY ${column})`))
    .limit(20);

  return results.map(r => r.value).filter(Boolean);
}