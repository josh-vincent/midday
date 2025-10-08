import {
  acceptInviteByCodeSchema,
  acceptTeamInviteSchema,
  createTeamSchema,
  declineTeamInviteSchema,
  deleteTeamInviteSchema,
  deleteTeamMemberSchema,
  deleteTeamSchema,
  inviteTeamMembersSchema,
  leaveTeamSchema,
  resendTeamInviteSchema,
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
import { and, eq } from "drizzle-orm";
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
    try {
      return await getTeamsByUserId(db, session.user.id);
    } catch (error) {
      console.error(`[team.list] Error fetching teams for user ${session.user.id}:`, error);
      // Return empty array if query fails
      return [];
    }
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

  acceptInviteByCode: authProcedure
    .input(acceptInviteByCodeSchema)
    .mutation(async ({ ctx: { db, session }, input }) => {
      // Find the invitation by code
      const invite = await db.query.userInvites.findFirst({
        where: eq(userInvites.code, input.code.toUpperCase()),
      });

      if (!invite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid or expired invite code",
        });
      }

      // Check if the invitation has expired (optional - add expiry logic if needed)
      // if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
      //   throw new TRPCError({
      //     code: "BAD_REQUEST",
      //     message: "Invite code has expired",
      //   });
      // }

      // Check if user is already a member of this team
      const existingMembership = await db.query.usersOnTeam.findFirst({
        where: and(
          eq(usersOnTeam.userId, session.user.id),
          eq(usersOnTeam.teamId, invite.teamId)
        ),
      });

      if (existingMembership) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You are already a member of this team",
        });
      }

      // Add user to the team
      await db.insert(usersOnTeam).values({
        userId: session.user.id,
        role: invite.role,
        teamId: invite.teamId,
      });

      // Get team details
      const team = await getTeamById(db, invite.teamId);

      // Delete the invitation
      await db.delete(userInvites).where(eq(userInvites.id, invite.id));

      return {
        teamId: invite.teamId,
        teamName: team?.name,
      };
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
    .mutation(async ({ ctx: { db, session, teamId, supabaseUrl, supabaseServiceKey }, input }) => {
      if (!teamId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No team selected",
        });
      }

      // Import the admin client creator
      const { createAdminClient } = await import("@api/services/supabase");
      const adminClient = await createAdminClient(supabaseUrl, supabaseServiceKey);

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
                // User exists - check if they're already a team member
                const existingMembership = await db.query.usersOnTeam.findFirst({
                  where: and(
                    eq(usersOnTeam.userId, existingUser.id),
                    eq(usersOnTeam.teamId, teamId)
                  ),
                });

                if (existingMembership) {
                  // User is already a member, delete the duplicate invite
                  await db.delete(userInvites).where(eq(userInvites.email, invite.email!));
                  console.log(`User ${invite.email} is already a team member - removed duplicate invite`);
                } else {
                  // User exists but not a member - add them directly to the team
                  await db.insert(usersOnTeam).values({
                    userId: existingUser.id,
                    role: invite.role,
                    teamId: teamId,
                  });

                  // Delete the invite since user was added directly
                  await db.delete(userInvites).where(eq(userInvites.email, invite.email!));
                  addedDirectly++;
                  console.log(`User ${invite.email} added directly to team (existing user)`);

                  // TODO: Send notification email to let them know they were added to the team
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
        sent: results.length - addedDirectly, // Invites sent via email (new users only)
        addedDirectly, // Existing users added directly to team
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

  resendInvite: protectedProcedure
    .input(resendTeamInviteSchema)
    .mutation(async ({ ctx: { db, session, teamId, supabaseUrl, supabaseServiceKey }, input }) => {
      if (!teamId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No team selected",
        });
      }

      // Get the invite details
      const invite = await db.query.userInvites.findFirst({
        where: eq(userInvites.id, input.id),
      });

      if (!invite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found",
        });
      }

      if (invite.teamId !== teamId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to resend this invitation",
        });
      }

      // Get team details separately
      const team = await getTeamById(db, teamId);

      // Import the admin client creator
      const { createAdminClient } = await import("@api/services/supabase");
      const adminClient = await createAdminClient(supabaseUrl, supabaseServiceKey);

      // Check if user already exists
      const { data: existingUsers, error: userError } = await adminClient.auth.admin.listUsers();

      if (userError) {
        console.error(`Error checking for existing user ${invite.email}:`, userError);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to check user status",
        });
      }

      const existingUser = existingUsers.users.find(
        (u) => u.email?.toLowerCase() === invite.email!.toLowerCase()
      );

      if (existingUser) {
        // User already exists - they just need to accept the invitation
        // The invitation is already in their pending invites on the /teams page
        console.log(`User ${invite.email} already registered - invitation is pending on /teams page`);

        return {
          success: true,
          email: invite.email,
          message: "User already registered. They can accept the invitation from the Teams page.",
        };
      }

      // User doesn't exist - send new Supabase invitation email
      const { data: inviteData, error } = await adminClient.auth.admin.inviteUserByEmail(
        invite.email!,
        {
          redirectTo: `${process.env.NEXT_PUBLIC_URL || "http://localhost:3333"}/teams`,
          data: {
            team_id: teamId,
            team_name: team?.name,
            invited_by: session.user.full_name,
            role: invite.role,
          },
        }
      );

      if (error) {
        console.error(`Failed to resend Supabase invite to ${invite.email}:`, error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to resend invitation: ${error.message}`,
        });
      }

      console.log(`Supabase invite resent to ${invite.email}:`, inviteData);

      return {
        success: true,
        email: invite.email,
        message: "Invitation email sent successfully.",
      };
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
