import type { Database } from "@db/client";
import { customers, invoices, jobs } from "@db/schema";
import { buildSearchQuery } from "@midday/db/utils/search-query";
import { generateToken } from "@midday/invoice/token";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm/sql/sql";
import { createActivity } from "./activities";

type GetJobByIdParams = {
  id: string;
  teamId: string;
};

export const getJobById = async (
  db: Database,
  params: GetJobByIdParams,
) => {
  const [result] = await db
    .select({
      id: jobs.id,
      jobNumber: jobs.jobNumber,
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
      customerId: jobs.customerId,
    })
    .from(jobs)
    .where(
      and(eq(jobs.id, params.id), eq(jobs.teamId, params.teamId)),
    )
    .leftJoin(invoices, eq(jobs.invoiceId, invoices.id))
    .groupBy(jobs.id);

  return result;
};

type GetJobsParams = {
  teamId: string;
  searchQuery?: string;
  page?: number;
  pageSize?: number;
  orderBy?: string;
  sortDirection?: string;
};

export const getJobs = async (
  db: Database,
  params: GetJobsParams,
) => {
  const {
    teamId,
    searchQuery,
    page = 1,
    pageSize = 25,
    orderBy = "name",
    sortDirection = "asc",
  } = params;

  const offset = (page - 1) * pageSize;

  let whereConditions: SQL[] = [eq(jobs.teamId, teamId)];

  if (searchQuery) {
    const searchCondition = buildSearchQuery({
      searchColumn: jobs.jobNumber,
      searchQuery,
    });
    if (searchCondition) {
      whereConditions.push(searchCondition);
    }
  }

  const orderBySql =
    sortDirection === "desc"
      ? desc(jobs[orderBy as keyof typeof jobs])
      : asc(jobs[orderBy as keyof typeof jobs]);

  const results = await db
    .select({
      id: jobs.id,
      jobNumber: jobs.jobNumber,
      invoiceCount: sql<number>`cast(count(distinct ${invoices.id}) as int)`.as(
        "invoice_count",
      ),
    })
    .from(jobs)
    .where(and(...whereConditions))
    .leftJoin(invoices, eq(jobs.invoiceId, invoices.id))
    .groupBy(jobs.id)
    .orderBy(orderBySql)
    .limit(pageSize)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`cast(count(distinct ${jobs.id}) as int)` })
    .from(jobs)
    .where(and(...whereConditions));

  return {
    data: results,
    totalRecords: count || 0,
    pageSize,
    page,
  };
};

type CreateJobParams = {
  name: string;
  teamId: string;
  customerId: string;
  jobNumber: string;
  sourceLocation: string;
  sourceAddress: string;
  destinationSite: string;
  dirtType: string;
  quantityCubicMeters: number;
  weightKg: number;
  pricePerCubicMeter: number;
  totalAmount: number;
  status: string;
  scheduledDate: string;
  truckNumber: string;
  driverName: string;
  notes: string;
  photos: string[];
  createdBy: string;
};

export async function createJob(
  db: Database,
  params: CreateJobParams,
) {
  const token = await generateToken();

  const [job] = await db
    .insert(jobs)
    .values({
      ...params,
    })
    .returning();

  // Log activity
  if (params.createdBy) {
    await createActivity(db, {
      teamId: params.teamId,
      userId: params.createdBy,
      action: "created",
      entity: "job",
      entityId: job.id,
      metadata: {
        jobNumber: job.jobNumber,
        customerId: job.customerId
      },
    });
  }

  return job;
}

type UpdateJobParams = Partial<CreateJobParams> & {
  id: string;
  teamId: string;
  updatedBy?: string;
};

export async function updateJob(
  db: Database,
  params: UpdateJobParams,
) {
  const { id, teamId, updatedBy, ...updateData } = params;

  const [job] = await db
    .update(jobs)
    .set({
      ...updateData,
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(jobs.id, id), eq(jobs.teamId, teamId)))
    .returning();

  // Log activity
  if (updatedBy) {
    await createActivity(db, {
      teamId,
      userId: updatedBy,
      action: "updated",
      entity: "job",
      entityId: id,
      metadata: {
        jobNumber: job.jobNumber,
        customerId: job.customerId,
        changes: Object.keys(updateData),
      },
    });
  }

  return job;
}

export async function getJobsByIds(
  db: Database,
  jobIds: string[],
  teamId: string,
) {
  if (!jobIds.length) return [];

  return db
    .select()
    .from(jobs)
    .where(
      and(
        inArray(jobs.id, jobIds),
        eq(jobs.teamId, teamId)
      )
    );
}

export async function searchJobs(
  db: Database,
  teamId: string,
  search: string,
  limit = 10,
) {
  const searchCondition = buildSearchQuery({
    searchColumn: jobs.jobNumber,
    searchQuery: search,
  });

  const conditions: SQL[] = [eq(jobs.teamId, teamId)];
  if (searchCondition) {
    conditions.push(searchCondition);
  }

  return db
    .select({
      id: jobs.id,
      jobNumber: jobs.jobNumber,
      customerId: jobs.customerId,
    })
    .from(jobs)
    .where(and(...conditions))
    .orderBy(asc(jobs.jobNumber))
    .limit(limit);
}

export async function getJobsByTeamId(db: Database, teamId: string) {
  return db
    .select()
    .from(jobs)
    .where(eq(jobs.teamId, teamId))
    .orderBy(desc(jobs.createdAt));
}

export async function deleteJob(db: Database, id: string) {
  const [result] = await db
    .delete(jobs)
    .where(eq(jobs.id, id))
    .returning({ id: jobs.id });

  return result;
}