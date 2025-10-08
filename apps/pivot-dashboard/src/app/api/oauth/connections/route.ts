import { createClient } from "@midday/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/oauth/connections
 * Fetches all OAuth connections for the current team
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch OAuth connections for this user's team
    const { data: connections, error: connectionsError } = await supabase
      .from("oauth_connections")
      .select("id, provider, team_id, expires_at, realm_id, tenant_id, created_at, company_name, email_address, environment")
      .eq("user_id", user.id);

    if (connectionsError) {
      console.error("Error fetching connections:", connectionsError);
      return NextResponse.json(
        { error: "Failed to fetch connections" },
        { status: 500 }
      );
    }

    // Format connections for frontend
    const formattedConnections = (connections || []).map((conn) => ({
      id: conn.id,
      provider: conn.provider,
      teamId: conn.team_id,
      expiresAt: conn.expires_at,
      createdAt: conn.created_at,
    }));

    return NextResponse.json({
      connections: formattedConnections,
    });
  } catch (error) {
    console.error("Connections API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
