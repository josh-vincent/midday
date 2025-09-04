import { updateUserSchema } from "@api/schemas/users";
import { resend } from "@api/services/resend";
import { createTRPCRouter, authProcedure, protectedProcedure } from "@api/trpc/init";
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
      return updateUser(db, {
        id: session.user.id,
        ...input,
      });
    }),

  delete: authProcedure.mutation(
    async ({ ctx: { supabase, db, session } }) => {
      const [data] = await Promise.all([
        deleteUser(db, session.user.id),
        supabase.auth.admin.deleteUser(session.user.id),
        resend.contacts.remove({
          email: session.user.email!,
          audienceId: process.env.RESEND_AUDIENCE_ID!,
        }),
      ]);

      return data;
    },
  ),

  invites: authProcedure.query(async ({ ctx: { db, session } }) => {
    if (!session.user.email) {
      return [];
    }

    return getUserInvites(db, session.user.email);
  }),
});
