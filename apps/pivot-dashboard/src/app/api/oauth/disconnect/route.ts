import { createClient } from "@midday/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/oauth/disconnect
 * Disconnects an OAuth connection (soft delete)
 */
export async function POST(request: Request) {
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

    // Parse request body
    const body = await request.json();
    const { connectionId } = body;

    if (!connectionId) {
      return NextResponse.json(
        { error: "Connection ID is required" },
        { status: 400 }
      );
    }

    // Delete the connection
    const { error: deleteError } = await supabase
      .from("oauth_connections")
      .delete()
      .eq("id", connectionId)
      .eq("user_id", user.id); // Ensure user owns this connection

    if (deleteError) {
      console.error("Error disconnecting:", deleteError);
      return NextResponse.json(
        { error: "Failed to disconnect" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Connection disconnected successfully",
    });
  } catch (error) {
    console.error("Disconnect API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
