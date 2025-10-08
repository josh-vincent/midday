import { oauth } from "@/lib/oauth";
import { createClient } from "@midday/supabase/server";

/**
 * Check auto-refresh status and show token information
 * Access: http://localhost:3336/api/oauth/refresh-status
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Get all connections with expiry info
    const { data: connections, error } = await supabase
      .from("oauth_connections")
      .select("id, provider, team_id, expires_at, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    // Calculate time until expiry for each connection
    const now = new Date();
    const connectionsWithStatus = connections?.map((conn) => {
      const expiresAt = conn.expires_at ? new Date(conn.expires_at) : null;
      const minutesUntilExpiry = expiresAt
        ? Math.floor((expiresAt.getTime() - now.getTime()) / 1000 / 60)
        : null;

      return {
        provider: conn.provider,
        teamId: conn.team_id,
        expiresAt: conn.expires_at,
        minutesUntilExpiry,
        needsRefresh: minutesUntilExpiry !== null && minutesUntilExpiry <= 30,
        status:
          minutesUntilExpiry === null
            ? "no_expiry"
            : minutesUntilExpiry <= 0
            ? "expired"
            : minutesUntilExpiry <= 30
            ? "expiring_soon"
            : "valid",
      };
    }) || [];

    const autoRefreshService = oauth['autoRefresh'];
    const isRunning = autoRefreshService?.running || false;
    const config = autoRefreshService?.getConfig() || null;

    return Response.json({
      autoRefresh: {
        enabled: isRunning,
        config: config,
      },
      connections: connectionsWithStatus,
      summary: {
        total: connectionsWithStatus.length,
        valid: connectionsWithStatus.filter((c) => c.status === "valid").length,
        expiringSoon: connectionsWithStatus.filter((c) => c.status === "expiring_soon").length,
        expired: connectionsWithStatus.filter((c) => c.status === "expired").length,
      },
    });
  } catch (error) {
    console.error("Failed to get refresh status:", error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
