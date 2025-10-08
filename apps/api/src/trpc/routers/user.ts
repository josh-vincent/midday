import { updateUserSchema } from "@api/schemas/users";
import { resend } from "@api/services/resend";
import {
  authProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "@api/trpc/init";
import { teamCache } from "@midday/cache/team-cache";
import {
  deleteUser,
  getUserById,
  getUserInvites,
  updateUser,
} from "@midday/db/queries";

export const userRouter = createTRPCRouter({
  // User profile endpoints don't require team membership
  me: authProcedure.query(async ({ ctx: { db, session } }) => {
    return getUserById(db, session.user.id);
  }),

  update: authProcedure
    .input(updateUserSchema)
    .mutation(async ({ ctx: { db, session }, input }) => {
      console.log(`[user.update] Updating user ${session.user.id} (${session.user.email}) with teamId: ${input.teamId}`);

      // If teamId is being updated, verify the user is a member of that team
      if (input.teamId) {
        const membership = await db.query.usersOnTeam.findFirst({
          where: (usersOnTeam, { eq, and }) =>
            and(
              eq(usersOnTeam.userId, session.user.id),
              eq(usersOnTeam.teamId, input.teamId)
            ),
        });

        if (!membership) {
          console.error(`[user.update] User ${session.user.id} (${session.user.email}) tried to join team ${input.teamId} but has no membership`);

          // Check all memberships for debugging
          const allMemberships = await db.query.usersOnTeam.findMany({
            where: (usersOnTeam, { eq }) => eq(usersOnTeam.userId, session.user.id),
          });
          console.error(`[user.update] User ${session.user.id} memberships:`, allMemberships);

          throw new Error("You are not a member of this team. Please refresh your browser and try again.");
        }

        console.log(`[user.update] Verified user ${session.user.id} is member of team ${input.teamId} with role ${membership.role}`);
      }

      const result = await updateUser(db, {
        id: session.user.id,
        ...input,
      });

      console.log(`[user.update] Successfully updated user ${session.user.id}`);

      // If teamId was updated, invalidate the team permission cache
      if (input.teamId) {
        const cacheKey = `user:${session.user.id}:team:${input.teamId}`;
        await teamCache.delete(cacheKey);
      }

      return result;
    }),

  delete: authProcedure.mutation(async ({ ctx: { supabase, db, session } }) => {
    const [data] = await Promise.all([
      deleteUser(db, session.user.id),
      supabase.auth.admin.deleteUser(session.user.id),
      resend.contacts.remove({
        email: session.user.email!,
        audienceId: process.env.RESEND_AUDIENCE_ID!,
      }),
    ]);

    return data;
  }),

  invites: authProcedure.query(async ({ ctx: { db, session } }) => {
    return getUserInvites(db, session.user.email! );
  }),
});
