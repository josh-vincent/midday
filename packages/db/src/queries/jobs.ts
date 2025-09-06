import type { Database } from "@db/client";
import { customers, invoices, jobs } from "@db/schema";
import { buildSearchQuery } from "@midday/db/utils/search-query";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm/sql/sql";
import { createActivity } from "./activities";

type GetJobByIdParams = {
  id: string;
  teamId: string;
};

export const getJobById = async (db: Database, params: GetJobByIdParams) => {
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
    .where(and(eq(jobs.id, params.id), eq(jobs.teamId, params.teamId)))
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

export const getJobs = async (db: Database, params: GetJobsParams) => {
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
    const searchPattern = buildSearchQuery(searchQuery);
    whereConditions.push(sql`${jobs.jobNumber} ILIKE ${`%${searchQuery}%`}`);
  }

  const column = jobs[orderBy as keyof typeof jobs] as any;
  const orderBySql = sortDirection === "desc" ? desc(column) : asc(column);

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
  teamId: string;
  customerId?: string | null;
  jobNumber?: string | null;
  contactPerson?: string;
  contactNumber?: string;
  rego?: string;
  loadNumber?: number;
  companyName?: string;
  addressSite?: string;
  equipmentType?: string;
  materialType?: string;
  pricePerUnit?: number;
  cubicMetreCapacity?: number;
  jobDate?: string;
  scheduledDate?: string;
  arrivalTime?: string;
  completedTime?: string;
  status?: string;
  truckNumber?: string;
  driverName?: string;
  notes?: string | null;

  // Legacy optional fields
  sourceLocation?: string;
  sourceAddress?: string;
  destinationSite?: string;
  dirtType?: string;
  quantityCubicMeters?: number;
  weightKg?: number;
  pricePerCubicMeter?: number;
  totalAmount?: number;
  photos?: string[];

  createdBy: string;
};

export async function createJob(db: Database, params: CreateJobParams) {
  const [job] = await db
    .insert(jobs)
    .values({
      teamId: params.teamId,
      customerId: params.customerId || null,
      jobNumber: params.jobNumber || null,
      contactPerson: params.contactPerson,
      contactNumber: params.contactNumber,
      rego: params.rego,
      loadNumber: params.loadNumber,
      companyName: params.companyName,
      addressSite: params.addressSite,
      equipmentType: params.equipmentType,
      materialType: params.materialType,
      pricePerUnit: params.pricePerUnit,
      cubicMetreCapacity: params.cubicMetreCapacity,
      jobDate: params.jobDate,
      scheduledDate: params.scheduledDate,
      arrivalTime: params.arrivalTime,
      completedTime: params.completedTime,
      status: params.status || "pending",
      truckNumber: params.truckNumber,
      driverName: params.driverName,
      notes: params.notes || null,
      // Legacy optional fields
      sourceLocation: params.sourceLocation,
      sourceAddress: params.sourceAddress,
      destinationSite: params.destinationSite,
      dirtType: params.dirtType,
      quantityCubicMeters: params.quantityCubicMeters,
      weightKg: params.weightKg,
      pricePerCubicMeter: params.pricePerCubicMeter,
      totalAmount: params.totalAmount,
      photos: params.photos || [],
      createdBy: params.createdBy,
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
        customerId: job.customerId,
      },
    });
  }

  return job;
}

type UpdateJobParams = {
  id: string;
  teamId: string; // Required for scoping
  customerId?: string | null;
  jobNumber?: string | null;
  contactPerson?: string;
  contactNumber?: string;
  rego?: string;
  loadNumber?: number;
  companyName?: string;
  addressSite?: string;
  equipmentType?: string;
  materialType?: string;
  pricePerUnit?: number;
  cubicMetreCapacity?: number;
  jobDate?: string;
  scheduledDate?: string;
  arrivalTime?: string;
  completedTime?: string;
  status?: string;
  truckNumber?: string;
  driverName?: string;
  notes?: string | null;

  // Legacy optional fields
  sourceLocation?: string;
  sourceAddress?: string;
  destinationSite?: string;
  dirtType?: string;
  quantityCubicMeters?: number;
  weightKg?: number;
  pricePerCubicMeter?: number;
  totalAmount?: number;
  photos?: string[];

  updatedBy?: string;
};

export async function updateJob(db: Database, params: UpdateJobParams) {
  const { id, teamId, updatedBy, ...rest } = params;

  // Build update data with only defined fields
  const updateData: any = {
    updatedAt: new Date().toISOString(),
  };

  // Only include fields that are defined in params
  if (rest.customerId !== undefined) updateData.customerId = rest.customerId;
  if (rest.jobNumber !== undefined) updateData.jobNumber = rest.jobNumber;
  if (rest.contactPerson !== undefined)
    updateData.contactPerson = rest.contactPerson;
  if (rest.contactNumber !== undefined)
    updateData.contactNumber = rest.contactNumber;
  if (rest.rego !== undefined) updateData.rego = rest.rego;
  if (rest.loadNumber !== undefined) updateData.loadNumber = rest.loadNumber;
  if (rest.companyName !== undefined) updateData.companyName = rest.companyName;
  if (rest.addressSite !== undefined) updateData.addressSite = rest.addressSite;
  if (rest.equipmentType !== undefined)
    updateData.equipmentType = rest.equipmentType;
  if (rest.materialType !== undefined)
    updateData.materialType = rest.materialType;
  if (rest.pricePerUnit !== undefined)
    updateData.pricePerUnit = rest.pricePerUnit;
  if (rest.cubicMetreCapacity !== undefined)
    updateData.cubicMetreCapacity = rest.cubicMetreCapacity;
  if (rest.jobDate !== undefined) updateData.jobDate = rest.jobDate;
  if (rest.scheduledDate !== undefined)
    updateData.scheduledDate = rest.scheduledDate;
  if (rest.arrivalTime !== undefined) updateData.arrivalTime = rest.arrivalTime;
  if (rest.completedTime !== undefined)
    updateData.completedTime = rest.completedTime;
  if (rest.status !== undefined) updateData.status = rest.status;
  if (rest.truckNumber !== undefined) updateData.truckNumber = rest.truckNumber;
  if (rest.driverName !== undefined) updateData.driverName = rest.driverName;
  if (rest.notes !== undefined) updateData.notes = rest.notes;
  // Legacy fields
  if (rest.sourceLocation !== undefined)
    updateData.sourceLocation = rest.sourceLocation;
  if (rest.sourceAddress !== undefined)
    updateData.sourceAddress = rest.sourceAddress;
  if (rest.destinationSite !== undefined)
    updateData.destinationSite = rest.destinationSite;
  if (rest.dirtType !== undefined) updateData.dirtType = rest.dirtType;
  if (rest.quantityCubicMeters !== undefined)
    updateData.quantityCubicMeters = rest.quantityCubicMeters;
  if (rest.weightKg !== undefined) updateData.weightKg = rest.weightKg;
  if (rest.pricePerCubicMeter !== undefined)
    updateData.pricePerCubicMeter = rest.pricePerCubicMeter;
  if (rest.totalAmount !== undefined) updateData.totalAmount = rest.totalAmount;
  if (rest.photos !== undefined) updateData.photos = rest.photos;

  const [job] = await db
    .update(jobs)
    .set(updateData)
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
    .where(and(inArray(jobs.id, jobIds), eq(jobs.teamId, teamId)));
}

export async function searchJobs(
  db: Database,
  teamId: string,
  search: string,
  limit = 10,
) {
  const conditions: SQL[] = [eq(jobs.teamId, teamId)];
  if (search) {
    const searchPattern = buildSearchQuery(search);
    conditions.push(sql`${jobs.jobNumber} ILIKE ${`%${search}%`}`);
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
