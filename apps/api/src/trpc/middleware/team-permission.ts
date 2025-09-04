import type { Session } from "@api/utils/auth";
import { teamCache } from "@midday/cache/team-cache";
import type { Database } from "@midday/db/client";
import { teams, users, usersOnTeam } from "@midday/db/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const withTeamPermission = async <TReturn>(opts: {
  ctx: {
    session?: Session | null;
    db: Database;
  };
  next: (opts: {
    ctx: {
      session?: Session | null;
      db: Database;
      teamId: string | null;
    };
  }) => Promise<TReturn>;
}) => {
  const { ctx, next } = opts;

  const userId = ctx.session?.user?.id;

  if (!userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "No permission to access this team",
    });
  }

  const [userResult] = await ctx.db
    .select({
      id: users.id,
      teamId: users.teamId,
      team: {
        id: teams.id,
        name: teams.name,
      },
    })
    .from(users)
    .leftJoin(teams, eq(users.teamId, teams.id))
    .where(eq(users.id, userId))
    .limit(1);
  
  // Get user's team memberships separately
  const memberships = await ctx.db
    .select({
      teamId: usersOnTeam.teamId,
      userId: usersOnTeam.userId,
      role: usersOnTeam.role,
    })
    .from(usersOnTeam)
    .where(eq(usersOnTeam.userId, userId));

  const result = userResult || null;

  if (!result) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "User not found",
    });
  }

  // Check if user has a direct teamId or any team memberships
  let teamId: string | null = null;
  
  // First check if user has a direct teamId
  if (result?.teamId) {
    teamId = result.teamId;
  } 
  // Then check if user has any team memberships
  else if (memberships && memberships.length > 0) {
    // Use the first team membership (later we can add team switching)
    teamId = memberships[0]?.teamId || null;
  }

  // If teamId is still null, user has no team - they need to create one
  if (teamId === null) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "NO_TEAM", // Special message to trigger redirect to team creation
    });
  }

  // Cache check for team access
  const cacheKey = `user:${userId}:team:${teamId}`;
  let hasAccess = await teamCache.get(cacheKey);

  if (hasAccess === undefined) {
    // Check if user has access to this specific team
    hasAccess = result?.teamId === teamId || 
                (memberships && memberships.some(
                  (membership) => membership.teamId === teamId
                ));

    await teamCache.set(cacheKey, hasAccess);
  }

  if (!hasAccess) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "No permission to access this team",
    });
  }

  return next({
    ctx: {
      session: ctx.session,
      teamId: teamId!,
      db: ctx.db,
    },
  });
};
