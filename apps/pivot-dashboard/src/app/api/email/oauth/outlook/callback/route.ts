import { createClient } from "@midday/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const requestUrl = new URL(req.url);
    const code = requestUrl.searchParams.get("code");
    const state = requestUrl.searchParams.get("state");
    const error = requestUrl.searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        `${requestUrl.origin}/settings/emails?error=oauth_failed`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${requestUrl.origin}/settings/emails?error=missing_params`
      );
    }

    const { userId, teamId } = JSON.parse(state);

    if (!userId || !teamId) {
      return NextResponse.redirect(
        `${requestUrl.origin}/settings/emails?error=invalid_state`
      );
    }

    const clientId = process.env.OUTLOOK_CLIENT_ID;
    const clientSecret = process.env.OUTLOOK_CLIENT_SECRET;
    const tenantId = process.env.OUTLOOK_TENANT_ID || "common";
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/email/oauth/outlook/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        `${requestUrl.origin}/settings/emails?error=config_missing`
      );
    }

    // Exchange code for tokens
    const tokenResponse = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      }
    );

    if (!tokenResponse.ok) {
      console.error("Failed to exchange code for tokens:", await tokenResponse.text());
      return NextResponse.redirect(
        `${requestUrl.origin}/settings/emails?error=token_exchange_failed`
      );
    }

    const tokens = await tokenResponse.json();

    // Get user's email address from Microsoft Graph
    const userInfoResponse = await fetch(
      "https://graph.microsoft.com/v1.0/me",
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      }
    );

    if (!userInfoResponse.ok) {
      console.error("Failed to get user info:", await userInfoResponse.text());
      return NextResponse.redirect(
        `${requestUrl.origin}/settings/emails?error=user_info_failed`
      );
    }

    const userInfo = await userInfoResponse.json();

    // Store credentials in database
    const supabase = await createClient();
    const { error: dbError } = await supabase.from("oauth_connections").upsert({
      team_id: teamId,
      user_id: userId,
      provider: "outlook",
      email_address: userInfo.mail || userInfo.userPrincipalName,
      credentials: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: Date.now() + tokens.expires_in * 1000,
        client_id: clientId,
        client_secret: clientSecret,
        tenant_id: tenantId,
      },
      sync_enabled: true,
      updated_at: new Date().toISOString(),
    });

    if (dbError) {
      console.error("Failed to store email connection:", dbError);
      return NextResponse.redirect(
        `${requestUrl.origin}/settings/emails?error=db_error`
      );
    }

    return NextResponse.redirect(
      `${requestUrl.origin}/settings/emails?success=outlook_connected`
    );
  } catch (error) {
    console.error("Outlook OAuth callback error:", error);
    return NextResponse.redirect(
      `${requestUrl.origin}/settings/emails?error=unexpected`
    );
  }
}
