/**
 * OAuth Sync Instance
 * Centralized OAuth management using @midday/oauth-sync
 */

import { OAuthSync } from "@midday/oauth-sync";
import { SupabaseStorageAdapter } from "@midday/oauth-sync-core/storage";

// Auto-detect providers from environment variables
const providers: Record<string, any> = {};

if (process.env.OAUTH_XERO_CLIENT_ID || process.env.XERO_CLIENT_ID) {
  providers.xero = {
    clientId: process.env.OAUTH_XERO_CLIENT_ID || process.env.XERO_CLIENT_ID || "",
    clientSecret: process.env.OAUTH_XERO_CLIENT_SECRET || process.env.XERO_CLIENT_SECRET || "",
    environment: (process.env.OAUTH_XERO_ENVIRONMENT || "production") as "production" | "sandbox",
  };
}

if (process.env.OAUTH_QB_CLIENT_ID || process.env.QUICKBOOKS_CLIENT_ID) {
  providers.quickbooks = {
    clientId: process.env.OAUTH_QB_CLIENT_ID || process.env.QUICKBOOKS_CLIENT_ID || "",
    clientSecret: process.env.OAUTH_QB_CLIENT_SECRET || process.env.QUICKBOOKS_CLIENT_SECRET || "",
    environment: (process.env.OAUTH_QB_ENVIRONMENT || "production") as "production" | "sandbox",
  };
}

// Get Supabase credentials from environment
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";

/**
 * Centralized OAuth instance
 * Handles authorization, token refresh, and storage automatically
 */
export const oauth = new OAuthSync({
  storage: new SupabaseStorageAdapter({
    url: supabaseUrl,
    key: supabaseKey,
    tableName: "oauth_connections",
  }),
  providers,
  authExtractor: "supabase", // Auto-extract user/team from Supabase auth
  autoRefresh: {
    enabled: true,
    intervalMinutes: 15,
    thresholdMinutes: 30,
  },
});
