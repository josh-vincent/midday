import { and, eq } from "drizzle-orm";
import type { Database } from "../client";
import { notificationSettings, notificationTypeEnum } from "../schema";

export type NotificationType = typeof notificationTypeEnum.enumValues[number];

export interface NotificationSetting {
  id: string;
  userId: string;
  teamId: string;
  type: NotificationType;
  enabled: boolean;
  email: boolean;
  inApp: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GetNotificationSettingsParams {
  userId: string;
  teamId: string;
  type?: NotificationType;
}

export async function getNotificationSettings(
  db: Database,
  params: GetNotificationSettingsParams,
): Promise<NotificationSetting[]> {
  const conditions = [
    eq(notificationSettings.userId, params.userId),
    eq(notificationSettings.teamId, params.teamId),
  ];

  if (params.type) {
    conditions.push(eq(notificationSettings.type, params.type));
  }

  const settings = await db
    .select()
    .from(notificationSettings)
    .where(and(...conditions));

  return settings as NotificationSetting[];
}

export interface UpsertNotificationSettingParams {
  userId: string;
  teamId: string;
  type: NotificationType;
  enabled?: boolean;
  email?: boolean;
  inApp?: boolean;
}

export async function upsertNotificationSetting(
  db: Database,
  params: UpsertNotificationSettingParams,
) {
  const { userId, teamId, type, ...updates } = params;

  const [setting] = await db
    .insert(notificationSettings)
    .values({
      userId,
      teamId,
      type,
      enabled: updates.enabled !== undefined ? updates.enabled : true,
      email: updates.email !== undefined ? updates.email : true,
      inApp: updates.inApp !== undefined ? updates.inApp : true,
    })
    .onConflictDoUpdate({
      target: [
        notificationSettings.userId,
        notificationSettings.teamId,
        notificationSettings.type,
      ],
      set: {
        ...updates,
        updatedAt: new Date().toISOString(),
      },
    })
    .returning();

  return setting as NotificationSetting;
}

export async function deleteNotificationSetting(
  db: Database,
  params: {
    userId: string;
    teamId: string;
    type: NotificationType;
  },
) {
  const [deleted] = await db
    .delete(notificationSettings)
    .where(
      and(
        eq(notificationSettings.userId, params.userId),
        eq(notificationSettings.teamId, params.teamId),
        eq(notificationSettings.type, params.type)
      )
    )
    .returning();

  return deleted as NotificationSetting | undefined;
}

export async function getUserNotificationSettings(
  db: Database,
  userId: string,
  teamId: string,
) {
  const settings = await db
    .select()
    .from(notificationSettings)
    .where(
      and(
        eq(notificationSettings.userId, userId),
        eq(notificationSettings.teamId, teamId)
      )
    );

  return settings as NotificationSetting[];
}

export async function initializeDefaultNotificationSettings(
  db: Database,
  userId: string,
  teamId: string,
) {
  const defaultTypes: NotificationType[] = [
    "invoice_created",
    "invoice_paid",
    "invoice_overdue",
    "invoice_reminder",
    "payment_received",
    "payment_failed",
  ];

  const existingSettings = await getUserNotificationSettings(db, userId, teamId);
  const existingTypes = new Set(existingSettings.map(s => s.type));

  const settingsToCreate = defaultTypes
    .filter(type => !existingTypes.has(type))
    .map(type => ({
      userId,
      teamId,
      type,
      enabled: true,
      email: true,
      inApp: true,
    }));

  if (settingsToCreate.length > 0) {
    const created = await db
      .insert(notificationSettings)
      .values(settingsToCreate)
      .returning();

    return created as NotificationSetting[];
  }

  return [];
}

export async function updateNotificationSettings(
  db: Database,
  userId: string,
  teamId: string,
  updates: Array<{
    type: NotificationType;
    enabled?: boolean;
    email?: boolean;
    inApp?: boolean;
  }>,
) {
  const results = await Promise.all(
    updates.map(update =>
      upsertNotificationSetting(db, {
        userId,
        teamId,
        ...update,
      })
    )
  );

  return results;
}