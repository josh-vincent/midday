import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { z } from "zod";
import { connectDb } from "@midday/db/client";
import {
  getAccountingConnectionsByTeamId,
  deleteAccountingConnection,
} from "@midday/db/queries";
import { oauthClient, type OAuthProvider } from "@api/lib/oauth-client";

const deleteConnectionSchema = z.object({
  id: z.string(),
});

const initiateConnectionSchema = z.object({
  provider: z.enum(["xero", "quickbooks", "sage", "fortnox", "gmail", "google-calendar", "outlook", "outlook-calendar"]),
});

export const accountingConnectionsRouter = createTRPCRouter({
  /**
   * Get all accounting connections for the current team
   *
   * Phase 1 (Dual Read): Try Supabase first, fallback to local DB
   * This ensures we get the most up-to-date tokens from Supabase
   * while maintaining backward compatibility
   */
  get: protectedProcedure.query(async ({ ctx: { teamId } }) => {
    if (!teamId) return [];

    // Try to fetch from Supabase OAuth API first (has auto-refreshed tokens)
    try {
      const supabaseConnections = await oauthClient.getConnections(teamId);

      if (supabaseConnections && supabaseConnections.length > 0) {
        console.log('[AccountingConnections] Fetched from Supabase OAuth API:', supabaseConnections.length);
        return supabaseConnections.map(conn => ({
          id: conn.id,
          provider: conn.provider,
          teamId: conn.tenantId,
          expiresAt: conn.expiresAt ? new Date(conn.expiresAt * 1000).toISOString() : null,
          isActive: conn.isActive,
          createdAt: conn.createdAt,
          updatedAt: conn.updatedAt,
        }));
      }
    } catch (error) {
      console.log('[AccountingConnections] Supabase API error, falling back to local DB:', error);
    }

    // Fallback to local database
    const db = await connectDb();
    const localConnections = await getAccountingConnectionsByTeamId(db, teamId);
    console.log('[AccountingConnections] Fetched from local DB:', localConnections.length);
    return localConnections;
  }),

  /**
   * Initiate OAuth flow for a provider
   * Returns the authorization URL to redirect the user to
   */
  initiateConnection: protectedProcedure
    .input(initiateConnectionSchema)
    .mutation(async ({ input, ctx: { teamId } }) => {
      console.log('[AccountingConnections] initiateConnection called:', { provider: input.provider, teamId });

      if (!teamId) {
        console.error('[AccountingConnections] No teamId found in context');
        throw new Error("Team ID required");
      }

      try {
        console.log('[AccountingConnections] Calling oauthClient.getAuthorizeUrl...');
        const { authUrl } = await oauthClient.getAuthorizeUrl(
          input.provider as OAuthProvider,
          teamId
        );
        console.log('[AccountingConnections] Got authUrl:', authUrl);

        return { authUrl };
      } catch (error) {
        console.error('[AccountingConnections] Error getting authUrl:', error);
        throw error;
      }
    }),

  /**
   * Delete an accounting connection
   */
  delete: protectedProcedure
    .input(deleteConnectionSchema)
    .mutation(async ({ input, ctx: { teamId } }) => {
      if (!teamId) {
        throw new Error("Team ID required");
      }

      const db = await connectDb();
      await deleteAccountingConnection(db, {
        id: input.id,
        teamId,
      });

      return { success: true };
    }),
});
