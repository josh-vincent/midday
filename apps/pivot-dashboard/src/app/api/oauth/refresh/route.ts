import { TokenSyncManager } from "@midday/oauth-sync-core";
import { SupabaseStorageAdapter } from "@midday/oauth-sync-core";
import { createClient } from "@midday/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const supabase = createClient();

    // Initialize the token sync manager
    const manager = new TokenSyncManager({
      storage: new SupabaseStorageAdapter(supabase),
      providers: {
        quickbooks: {
          clientId: process.env.QUICKBOOKS_CLIENT_ID!,
          clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET!,
        },
        xero: {
          clientId: process.env.XERO_CLIENT_ID!,
          clientSecret: process.env.XERO_CLIENT_SECRET!,
        },
      },
      scheduler: {
        thresholdMinutes: 60, // Refresh tokens expiring within 60 minutes
      },
    });

    // Refresh all expiring tokens
    const results = await manager.refreshExpiringTokens();

    const refreshed = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      refreshed,
      failed,
      results: results.map((r) => ({
        connectionId: r.connectionId,
        provider: r.provider,
        success: r.success,
        error: r.error,
      })),
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
