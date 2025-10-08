import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { z } from "zod";

// Schemas
const createOAuthAppSchema = z.object({
  provider: z.enum(["quickbooks", "xero"]),
  name: z.string(),
  description: z.string().optional(),
});

const updateOAuthAppSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
});

const getOAuthAppSchema = z.object({
  id: z.string(),
});

const revokeAccessSchema = z.object({
  provider: z.enum(["quickbooks", "xero"]),
});

/**
 * OAuth Applications Router
 *
 * Note: This router provides OAuth provider configuration.
 * Actual OAuth connections are managed via REST API endpoints:
 * - /api/oauth/[provider]/authorize
 * - /api/oauth/[provider]/callback
 * - /api/oauth/connections
 * - /api/oauth/disconnect
 */
export const oauthApplicationsRouter = createTRPCRouter({
  /**
   * List available OAuth applications/providers
   * Returns configured OAuth providers from environment variables
   */
  list: protectedProcedure.query(async () => {
    const providers = [];

    // Check QuickBooks configuration
    if (process.env.OAUTH_QB_CLIENT_ID || process.env.QUICKBOOKS_CLIENT_ID) {
      providers.push({
        id: "quickbooks",
        provider: "quickbooks",
        name: "QuickBooks",
        description: "Connect your QuickBooks account for accounting integration",
        logo: "/integrations/quickbooks.svg",
        configured: true,
        environment: process.env.OAUTH_QB_ENVIRONMENT || "production",
      });
    }

    // Check Xero configuration
    if (process.env.OAUTH_XERO_CLIENT_ID || process.env.XERO_CLIENT_ID) {
      providers.push({
        id: "xero",
        provider: "xero",
        name: "Xero",
        description: "Connect your Xero account for accounting integration",
        logo: "/integrations/xero.svg",
        configured: true,
        environment: process.env.OAUTH_XERO_ENVIRONMENT || "production",
      });
    }

    return providers;
  }),

  /**
   * Get a single OAuth application by ID
   */
  get: protectedProcedure
    .input(getOAuthAppSchema)
    .query(async ({ input }) => {
      const providers: Record<string, any> = {
        quickbooks: {
          id: "quickbooks",
          provider: "quickbooks",
          name: "QuickBooks",
          description: "Connect your QuickBooks account for accounting integration",
          logo: "/integrations/quickbooks.svg",
          configured: !!(process.env.OAUTH_QB_CLIENT_ID || process.env.QUICKBOOKS_CLIENT_ID),
          environment: process.env.OAUTH_QB_ENVIRONMENT || "production",
        },
        xero: {
          id: "xero",
          provider: "xero",
          name: "Xero",
          description: "Connect your Xero account for accounting integration",
          logo: "/integrations/xero.svg",
          configured: !!(process.env.OAUTH_XERO_CLIENT_ID || process.env.XERO_CLIENT_ID),
          environment: process.env.OAUTH_XERO_ENVIRONMENT || "production",
        },
      };

      return providers[input.id] || null;
    }),

  /**
   * List authorized OAuth connections for the current team
   *
   * Note: OAuth connections should be fetched via REST API at /api/oauth/connections
   * This endpoint returns empty for now as the oauth_connections table needs to be created
   */
  authorized: protectedProcedure.query(async ({ ctx: { teamId } }) => {
    if (!teamId) {
      return [];
    }

    // TODO: Query oauth_connections table once it's created in the database
    // For now, return empty array
    // The frontend should use /api/oauth/connections REST endpoint instead
    return [];
  }),

  /**
   * Create a new OAuth application
   * Note: OAuth applications are configured via environment variables
   * This is a placeholder for future custom OAuth app functionality
   */
  create: protectedProcedure
    .input(createOAuthAppSchema)
    .mutation(async () => {
      return {
        success: false,
        message: "OAuth applications are configured via environment variables",
      };
    }),

  /**
   * Update an OAuth application
   * Note: OAuth applications are configured via environment variables
   * This is a placeholder for future custom OAuth app functionality
   */
  update: protectedProcedure
    .input(updateOAuthAppSchema)
    .mutation(async () => {
      return {
        success: false,
        message: "OAuth applications are configured via environment variables",
      };
    }),

  /**
   * Revoke access to an OAuth application
   * Note: Use /api/oauth/disconnect REST endpoint to disconnect OAuth connections
   */
  revokeAccess: protectedProcedure
    .input(revokeAccessSchema)
    .mutation(async () => {
      return {
        success: false,
        message: "Use /api/oauth/disconnect REST endpoint to disconnect OAuth connections",
      };
    }),
});
