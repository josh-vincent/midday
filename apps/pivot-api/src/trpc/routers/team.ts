import {
  acceptTeamInviteSchema,
  createTeamSchema,
  declineTeamInviteSchema,
  deleteTeamInviteSchema,
  deleteTeamMemberSchema,
  deleteTeamSchema,
  inviteTeamMembersSchema,
  leaveTeamSchema,
  updateBaseCurrencySchema,
  updateTeamByIdSchema,
  updateTeamMemberSchema,
} from "@api/schemas/team";
import {
  authProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "@api/trpc/init";
import {
  acceptTeamInvite,
  createTeam,
  createTeamInvites,
  declineTeamInvite,
  deleteTeam,
  deleteTeamInvite,
  deleteTeamMember,
  getAvailablePlans,
  getInvitesByEmail,
  getTeamById,
  getTeamInvites,
  getTeamMembers,
  getTeamMembersByTeamId,
  getTeamsByUserId,
  leaveTeam,
  updateTeamById,
  updateTeamMember,
} from "@midday/db/queries";
import { userInvites, usersOnTeam } from "@midday/db/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const teamRouter = createTRPCRouter({
  current: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    if (!teamId) {
      return null;
    }

    return getTeamById(db, teamId!);
  }),

  update: protectedProcedure
    .input(updateTeamByIdSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      if (!teamId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No team selected",
        });
      }
      return updateTeamById(db, {
        id: teamId,
        data: input,
      });
    }),

  members: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    if (!teamId) {
      return [];
    }
    return getTeamMembersByTeamId(db, teamId);
  }),

  list: authProcedure.query(async ({ ctx: { db, session } }) => {
    return getTeamsByUserId(db, session.user.id);
  }),

  create: authProcedure
    .input(createTeamSchema)
    .mutation(async ({ ctx: { db, session }, input }) => {
      return createTeam(db, {
        ...input,
        userId: session.user.id,
        email: session.user.email!,
      });
    }),

  leave: protectedProcedure
    .input(leaveTeamSchema)
    .mutation(async ({ ctx: { db, session }, input }) => {
      const teamMembersData = await getTeamMembersByTeamId(db, input.teamId);

      const currentUser = teamMembersData?.find(
        (member) => member.user?.id === session.user.id,
      );

      const totalOwners = teamMembersData?.filter(
        (member) => member.role === "owner",
      ).length;

      if (currentUser?.role === "owner" && totalOwners === 1) {
        throw Error("Action not allowed");
      }

      return leaveTeam(db, {
        userId: session.user.id,
        teamId: input.teamId,
      });
    }),

  acceptInvite: protectedProcedure
    .input(acceptTeamInviteSchema)
    .mutation(async ({ ctx: { db, session }, input }) => {
      return acceptTeamInvite(db, {
        id: input.id,
        userId: session.user.id,
      });
    }),

  declineInvite: protectedProcedure
    .input(declineTeamInviteSchema)
    .mutation(async ({ ctx: { db, session }, input }) => {
      return declineTeamInvite(db, {
        id: input.id,
        email: session.user.email!,
      });
    }),

  delete: protectedProcedure
    .input(deleteTeamSchema)
    .mutation(async ({ ctx: { db }, input }) => {
      const data = await deleteTeam(db, input.teamId);

      if (!data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Team not found",
        });
      }
    }),

  deleteMember: protectedProcedure
    .input(deleteTeamMemberSchema)
    .mutation(async ({ ctx: { db }, input }) => {
      return deleteTeamMember(db, {
        teamId: input.teamId,
        userId: input.userId,
      });
    }),

  updateMember: protectedProcedure
    .input(updateTeamMemberSchema)
    .mutation(async ({ ctx: { db }, input }) => {
      return updateTeamMember(db, input);
    }),

  teamInvites: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    if (!teamId) {
      return [];
    }
    return getTeamInvites(db, teamId);
  }),

  invitesByEmail: authProcedure.query(async ({ ctx: { db, session } }) => {
    // If email is not available in session, return empty array
    if (!session.user.email) {
      console.log("No email in session for user:", session.user.id);
      return [];
    }
    return getInvitesByEmail(db, session.user.email);
  }),

  invite: protectedProcedure
    .input(inviteTeamMembersSchema)
    .mutation(async ({ ctx: { db, session, teamId }, input }) => {
      if (!teamId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No team selected",
        });
      }

      // Import the admin client creator
      const { createAdminClient } = await import("@api/services/supabase");
      const adminClient = await createAdminClient();

      // Create invite records in database for tracking (this also validates and skips existing members/invites)
      const data = await createTeamInvites(db, {
        teamId: teamId,
        invites: input.map((invite) => ({
          ...invite,
          invitedBy: session.user.id,
        })),
      });

      const results = data?.results ?? [];
      const skippedInvites = data?.skippedInvites ?? [];
      let addedDirectly = 0;

      // Process invites - check if user exists and add directly, or send invite email
      if (results.length > 0) {
        try {
          await Promise.all(
            results.map(async (invite) => {
              if (!invite) return;

              // Check if user already exists in Supabase by email using admin client
              const { data: existingUsers, error: userError } = await adminClient.auth.admin.listUsers();

              if (userError) {
                console.error(`Error checking for existing user ${invite.email}:`, userError);
                return;
              }

              const existingUser = existingUsers.users.find(
                (u) => u.email?.toLowerCase() === invite.email!.toLowerCase()
              );

              if (existingUser) {
                // User exists - add them directly to the team
                try {
                  await db.insert(usersOnTeam).values({
                    userId: existingUser.id,
                    role: invite.role!,
                    teamId: teamId,
                  });

                  // Delete the pending invite since user was added directly
                  await db.delete(userInvites).where(eq(userInvites.email, invite.email!));

                  addedDirectly++;
                  console.log(`User ${invite.email} already exists - added directly to team`);
                } catch (error) {
                  console.error(`Failed to add existing user ${invite.email} to team:`, error);
                }
              } else {
                // User doesn't exist - send Supabase invitation email using admin client
                const { data: inviteData, error } = await adminClient.auth.admin.inviteUserByEmail(
                  invite.email!,
                  {
                    redirectTo: `${process.env.NEXT_PUBLIC_URL || "http://localhost:3333"}/teams`,
                    data: {
                      team_id: teamId,
                      team_name: invite.team?.name,
                      invited_by: session.user.full_name,
                      role: invite.role,
                    },
                  }
                );

                if (error) {
                  console.error(`Failed to send Supabase invite to ${invite.email}:`, error);
                } else {
                  console.log(`Supabase invite sent to ${invite.email}:`, inviteData);
                }
              }
            })
          );
        } catch (error) {
          console.error("Failed to process invites:", error);
        }
      }

      // Return information about the invitation process
      return {
        sent: results.length - addedDirectly, // Invites sent via email
        addedDirectly, // Users added directly
        skipped: skippedInvites.length,
        skippedInvites,
      };
    }),

  deleteInvite: protectedProcedure
    .input(deleteTeamInviteSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return deleteTeamInvite(db, {
        teamId: teamId!,
        id: input.id,
      });
    }),

  availablePlans: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    return getAvailablePlans(db, teamId!);
  }),

  updateBaseCurrency: protectedProcedure
    .input(updateBaseCurrencySchema)
    .mutation(async ({ ctx: { teamId }, input }) => {
      // Disabled - trigger.dev
      // const event = await tasks.trigger("update-base-currency", {
      //   teamId: teamId!,
      //   baseCurrency: input.baseCurrency,
      // } satisfies UpdateBaseCurrencyPayload);

      // return event;
      return { success: true };
    }),
});
