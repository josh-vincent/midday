import type { Database } from "@db/client";
import { teams, users, usersOnTeam } from "@db/schema";
import { eq, inArray, sql } from "drizzle-orm";

export const getUserById = async (db: Database, id: string) => {
  const [result] = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      avatarUrl: users.avatarUrl,
      locale: users.locale,
      timeFormat: users.timeFormat,
      dateFormat: users.dateFormat,
      timezone: users.timezone,
      teamId: users.teamId,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      team: {
        id: teams.id,
        name: teams.name,
        logoUrl: teams.logoUrl,
        plan: teams.plan,
        inboxId: teams.inboxId,
        createdAt: teams.createdAt,
        countryCode: teams.countryCode
      },
    })
    .from(users)
    .leftJoin(teams, eq(users.teamId, teams.id))
    .where(eq(users.id, id))
    .limit(1);
    
  // Also fetch user's teams from usersOnTeam
  const userTeams = await db
    .select({
      teamId: usersOnTeam.teamId,
      role: usersOnTeam.role,
    })
    .from(usersOnTeam)
    .where(eq(usersOnTeam.userId, id));

  if (result) {
    return {
      ...result,
      usersOnTeams: userTeams,
    };
  }

  return null;
};

export type UpdateUserParams = {
  id: string;
  fullName?: string | null;
  teamId?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  locale?: string | null;
  timeFormat?: number | null;
  dateFormat?: string | null;
  timezone?: string | null;
};

export const updateUser = async (db: Database, data: UpdateUserParams) => {
  const { id, ...updateData } = data;

  const [result] = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, id))
    .returning({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      avatarUrl: users.avatarUrl,
      locale: users.locale,
      timeFormat: users.timeFormat,
      dateFormat: users.dateFormat,
      timezone: users.timezone,
      teamId: users.teamId,
    });

  return result;
};

export const getUserTeamId = async (db: Database, userId: string) => {
  const [result] = await db
    .select({ teamId: users.teamId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return result?.teamId || null;
};

export const deleteUser = async (db: Database, id: string) => {
  // Find teams where this user is a member
  const teamsWithUser = await db
    .select({
      teamId: usersOnTeam.teamId,
      memberCount: sql<number>`count(${usersOnTeam.userId})`.as("member_count"),
    })
    .from(usersOnTeam)
    .where(eq(usersOnTeam.userId, id))
    .groupBy(usersOnTeam.teamId);

  // Extract team IDs with only one member (this user)
  const teamIdsToDelete = teamsWithUser
    .filter((team) => team.memberCount === 1)
    .map((team) => team.teamId);

  // Delete the user and teams with only this user as a member
  // Foreign key constraints with cascade delete will handle related records
  await Promise.all([
    db.delete(users).where(eq(users.id, id)),
    teamIdsToDelete.length > 0
      ? db.delete(teams).where(inArray(teams.id, teamIdsToDelete))
      : Promise.resolve(),
  ]);

  return { id };
};
