import { userSchemaForTRPC } from "@midday/api-schemas/user";
import { teamCache } from "@midday/cache/team-cache";
import {
  deleteUser,
  getUserById,
  getUserInvites,
  updateUser,
} from "@midday/db/queries";
import type { TRPCRouterFactory } from "../types";

/**
 * Creates a user router with CRUD operations
 * This is a factory function that accepts the router factory dependencies
 */
export const createUserRouter: TRPCRouterFactory = ({
  createTRPCRouter,
  authProcedure,
}) => {
  if (!authProcedure) {
    throw new Error("authProcedure is required for user router");
  }

  return createTRPCRouter({
    // User profile endpoints don't require team membership
    me: authProcedure.query(async ({ ctx: { db, session } }) => {
      return getUserById(db, session.user.id);
    }),

    update: authProcedure
      .input(userSchemaForTRPC.update)
      .mutation(async ({ ctx: { db, session }, input }) => {
        console.log(
          `[user.update] Updating user ${session.user.id} (${session.user.email}) with teamId: ${input.teamId}`,
        );

        // If teamId is being updated, verify the user is a member of that team
        if (input.teamId) {
          const membership = await db.query.usersOnTeam.findFirst({
            where: (usersOnTeam, { eq, and }) =>
              and(
                eq(usersOnTeam.userId, session.user.id),
                eq(usersOnTeam.teamId, input.teamId),
              ),
          });

          if (!membership) {
            console.error(
              `[user.update] User ${session.user.id} (${session.user.email}) tried to join team ${input.teamId} but has no membership`,
            );

            // Check all memberships for debugging
            const allMemberships = await db.query.usersOnTeam.findMany({
              where: (usersOnTeam, { eq }) =>
                eq(usersOnTeam.userId, session.user.id),
            });
            console.error(
              `[user.update] User ${session.user.id} memberships:`,
              allMemberships,
            );

            throw new Error(
              "You are not a member of this team. Please refresh your browser and try again.",
            );
          }

          console.log(
            `[user.update] Verified user ${session.user.id} is member of team ${input.teamId} with role ${membership.role}`,
          );
        }

        const result = await updateUser(db, {
          id: session.user.id,
          ...input,
        });

        console.log(
          `[user.update] Successfully updated user ${session.user.id}`,
        );

        // If teamId was updated, invalidate the team permission cache
        if (input.teamId) {
          const cacheKey = `user:${session.user.id}:team:${input.teamId}`;
          await teamCache.delete(cacheKey);
        }

        return result;
      }),

    delete: authProcedure.mutation(
      async ({ ctx: { supabase, db, session } }) => {
        // Note: The actual API implementations will need to handle resend.contacts.remove
        // This is a simplified version that only handles database deletion
        // The consuming app should handle the full deletion flow
        const data = await deleteUser(db, session.user.id);

        // Delete user from Supabase if available
        if (supabase?.auth?.admin) {
          await supabase.auth.admin.deleteUser(session.user.id);
        }

        return data;
      },
    ),

    invites: authProcedure.query(async ({ ctx: { db, session } }) => {
      return getUserInvites(db, session.user.email!);
    }),
  });
};
