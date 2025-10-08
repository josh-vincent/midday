import { getSession } from "@midday/supabase/cached-queries";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const {
      data: { session },
    } = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clientId = process.env.OUTLOOK_CLIENT_ID;
    const tenantId = process.env.OUTLOOK_TENANT_ID || "common";
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/email/oauth/outlook/callback`;

    if (!clientId) {
      return NextResponse.json(
        { error: "Outlook OAuth not configured" },
        { status: 500 }
      );
    }

    const scopes = [
      "https://graph.microsoft.com/Mail.Read",
      "https://graph.microsoft.com/Mail.Send",
      "https://graph.microsoft.com/Mail.ReadWrite",
      "https://graph.microsoft.com/User.Read",
      "offline_access",
    ];

    const authUrl = new URL(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`
    );
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", scopes.join(" "));
    authUrl.searchParams.set("response_mode", "query");
    authUrl.searchParams.set("state", JSON.stringify({
      userId: session.user.id,
      teamId: session.user.user_metadata?.team_id,
    }));

    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error("Outlook OAuth authorization error:", error);
    return NextResponse.json(
      { error: "Failed to initiate OAuth flow" },
      { status: 500 }
    );
  }
}
