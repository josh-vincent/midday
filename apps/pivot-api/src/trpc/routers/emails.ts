import {
  disconnectEmailSchema,
  getEmailSchema,
  searchEmailsSchema,
  sendEmailSchema,
  syncEmailsSchema,
} from "@api/schemas/emails";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { oauthConnections, syncedEmails } from "@midday/db/schema";
import { and, desc, eq, gte, like, lte, or } from "drizzle-orm";
import { logger } from "@midday/logger";
import { GmailProvider, OutlookProvider } from "@midday/email-providers";
import type {
  GmailCredentials,
  OutlookCredentials,
} from "@midday/email-providers";

export const emailsRouter = createTRPCRouter({
  connections: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    if (!teamId) return [];

    return db.query.oauthConnections.findMany({
      where: eq(oauthConnections.teamId, teamId),
      orderBy: [desc(oauthConnections.createdAt)],
    });
  }),

  disconnect: protectedProcedure
    .input(disconnectEmailSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      if (!teamId) {
        throw new Error("Team ID is required");
      }

      await db
        .delete(oauthConnections)
        .where(
          and(
            eq(oauthConnections.id, input.id),
            eq(oauthConnections.teamId, teamId)
          )
        );

      return { success: true };
    }),

  sync: protectedProcedure
    .input(syncEmailsSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      if (!teamId) {
        throw new Error("Team ID is required");
      }

      // Get the connection
      const connection = await db.query.oauthConnections.findFirst({
        where: and(
          eq(oauthConnections.id, input.connectionId),
          eq(oauthConnections.teamId, teamId)
        ),
      });

      if (!connection) {
        throw new Error("Email connection not found");
      }

      // Initialize provider
      const provider =
        connection.provider === "gmail"
          ? new GmailProvider(connection.credentials as GmailCredentials)
          : new OutlookProvider(connection.credentials as OutlookCredentials);

      try {
        // Sync emails
        const result = await provider.syncEmails({
          teamId,
          userId: connection.userId,
          provider: connection.provider,
          credentials: connection.credentials,
          folders: input.folders,
          startDate: input.startDate ? new Date(input.startDate) : undefined,
          endDate: input.endDate ? new Date(input.endDate) : undefined,
          maxResults: input.maxResults,
        });

        // Store synced emails in database
        if (result.emails && result.emails.length > 0) {
          await db.insert(syncedEmails).values(
            result.emails.map((email) => ({
              connectionId: connection.id,
              messageId: email.id!,
              threadId: email.threadId,
              subject: email.subject,
              fromEmail: typeof email.from === "string" ? email.from : email.from.address,
              toEmails: Array.isArray(email.to)
                ? email.to.map((t) => (typeof t === "string" ? t : t.address))
                : [typeof email.to === "string" ? email.to : email.to.address],
              receivedAt: email.receivedAt,
              hasAttachments: email.hasAttachments || false,
              bodyPreview: email.bodyPreview,
              labels: email.labels || [],
              folder: email.folder,
              isRead: email.isRead || false,
            }))
          ).onConflictDoNothing();
        }

        // Update last sync time
        await db
          .update(oauthConnections)
          .set({
            lastSyncAt: new Date().toISOString(),
            syncToken: result.nextSyncToken,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(oauthConnections.id, connection.id));

        return {
          success: true,
          emailsCount: result.emails?.length || 0,
        };
      } catch (error) {
        logger.error("Email sync failed", { error, connectionId: connection.id });
        throw new Error("Failed to sync emails");
      }
    }),

  search: protectedProcedure
    .input(searchEmailsSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      if (!teamId) return [];

      const conditions = [
        eq(syncedEmails.connectionId, input.connectionId),
      ];

      if (input.query) {
        conditions.push(
          or(
            like(syncedEmails.subject, `%${input.query}%`),
            like(syncedEmails.bodyPreview, `%${input.query}%`),
            like(syncedEmails.fromEmail, `%${input.query}%`)
          )!
        );
      }

      if (input.folder) {
        conditions.push(eq(syncedEmails.folder, input.folder));
      }

      if (input.hasAttachments !== undefined) {
        conditions.push(eq(syncedEmails.hasAttachments, input.hasAttachments));
      }

      if (input.isUnread !== undefined) {
        conditions.push(eq(syncedEmails.isRead, !input.isUnread));
      }

      if (input.startDate) {
        conditions.push(gte(syncedEmails.receivedAt, input.startDate));
      }

      if (input.endDate) {
        conditions.push(lte(syncedEmails.receivedAt, input.endDate));
      }

      return db.query.syncedEmails.findMany({
        where: and(...conditions),
        orderBy: [desc(syncedEmails.receivedAt)],
        limit: input.limit,
      });
    }),

  getEmail: protectedProcedure
    .input(getEmailSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      if (!teamId) {
        throw new Error("Team ID is required");
      }

      // Get the connection
      const connection = await db.query.oauthConnections.findFirst({
        where: and(
          eq(oauthConnections.id, input.connectionId),
          eq(oauthConnections.teamId, teamId)
        ),
      });

      if (!connection) {
        throw new Error("Email connection not found");
      }

      // Initialize provider
      const provider =
        connection.provider === "gmail"
          ? new GmailProvider(connection.credentials as GmailCredentials)
          : new OutlookProvider(connection.credentials as OutlookCredentials);

      try {
        const email = await provider.getEmail(input.messageId);
        return email;
      } catch (error) {
        logger.error("Failed to get email", { error, messageId: input.messageId });
        throw new Error("Failed to retrieve email");
      }
    }),

  sendEmail: protectedProcedure
    .input(sendEmailSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      if (!teamId) {
        throw new Error("Team ID is required");
      }

      // Get the connection
      const connection = await db.query.oauthConnections.findFirst({
        where: and(
          eq(oauthConnections.id, input.connectionId),
          eq(oauthConnections.teamId, teamId)
        ),
      });

      if (!connection) {
        throw new Error("Email connection not found");
      }

      // Initialize provider
      const provider =
        connection.provider === "gmail"
          ? new GmailProvider(connection.credentials as GmailCredentials)
          : new OutlookProvider(connection.credentials as OutlookCredentials);

      try {
        const result = await provider.sendEmail({
          from: connection.emailAddress,
          to: input.to,
          subject: input.subject,
          html: input.body,
          cc: input.cc,
        });

        return {
          success: true,
          messageId: result.messageId,
        };
      } catch (error) {
        logger.error("Failed to send email", { error });
        throw new Error("Failed to send email");
      }
    }),
});
