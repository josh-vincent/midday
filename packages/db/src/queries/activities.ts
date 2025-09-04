import type { Database } from "@db/client";
import { activities } from "@db/schema";
import { and, desc, eq, gte, lte } from "drizzle-orm";

type CreateActivityParams = {
  teamId: string;
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
};

export async function createActivity(
  db: Database,
  params: CreateActivityParams,
) {
  const [result] = await db
    .insert(activities)
    .values({
      teamId: params.teamId,
      userId: params.userId,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      metadata: params.metadata || {},
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    })
    .returning();

  return result;
}

export async function getActivitiesByTeam(
  db: Database,
  teamId: string,
  limit = 50,
) {
  return db
    .select()
    .from(activities)
    .where(eq(activities.teamId, teamId))
    .orderBy(desc(activities.createdAt))
    .limit(limit);
}

export async function getActivitiesByUser(
  db: Database,
  userId: string,
  teamId: string,
  limit = 50,
) {
  return db
    .select()
    .from(activities)
    .where(
      and(
        eq(activities.userId, userId),
        eq(activities.teamId, teamId)
      )
    )
    .orderBy(desc(activities.createdAt))
    .limit(limit);
}

export async function getActivitiesByEntity(
  db: Database,
  entity: string,
  entityId: string,
  teamId: string,
) {
  return db
    .select()
    .from(activities)
    .where(
      and(
        eq(activities.entity, entity),
        eq(activities.entityId, entityId),
        eq(activities.teamId, teamId)
      )
    )
    .orderBy(desc(activities.createdAt));
}

export async function getRecentActivities(
  db: Database,
  teamId: string,
  days = 7,
) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  
  return db
    .select()
    .from(activities)
    .where(
      and(
        eq(activities.teamId, teamId),
        gte(activities.createdAt, since.toISOString())
      )
    )
    .orderBy(desc(activities.createdAt));
}

export async function deleteActivityById(
  db: Database,
  activityId: string,
  teamId: string,
) {
  const [result] = await db
    .delete(activities)
    .where(
      and(
        eq(activities.id, activityId),
        eq(activities.teamId, teamId)
      )
    )
    .returning();

  return result;
}

export async function deleteActivitiesForEntity(
  db: Database,
  entity: string,
  entityId: string,
  teamId: string,
) {
  return db
    .delete(activities)
    .where(
      and(
        eq(activities.entity, entity),
        eq(activities.entityId, entityId),
        eq(activities.teamId, teamId)
      )
    );
}