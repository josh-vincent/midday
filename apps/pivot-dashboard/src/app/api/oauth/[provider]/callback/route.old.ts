import { createClient } from "@midday/supabase/server";
import { redirect } from "next/navigation";

type Provider = "quickbooks" | "xero";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: Provider }> },
) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Handle OAuth errors
  if (error) {
    return redirect(`/apps?error=${error}`);
  }

  if (!code || !state) {
    return redirect("/apps?error=missing_params");
  }

  try {
    // Decode state
    const { teamId, provider: stateProvider } = JSON.parse(
      Buffer.from(state, "base64").toString(),
    );

    const { provider } = await params;

    // Verify provider matches
    if (provider !== stateProvider) {
      return redirect("/apps?error=invalid_provider");
    }

    // Get provider config with environment variables
    const PROVIDER_CONFIG = {
      quickbooks: {
        clientId: process.env.OAUTH_QB_CLIENT_ID || process.env.QUICKBOOKS_CLIENT_ID || "",
        clientSecret: process.env.OAUTH_QB_CLIENT_SECRET || process.env.QUICKBOOKS_CLIENT_SECRET || "",
        tokenUrl: "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",
      },
      xero: {
        clientId: process.env.OAUTH_XERO_CLIENT_ID || process.env.XERO_CLIENT_ID || "",
        clientSecret: process.env.OAUTH_XERO_CLIENT_SECRET || process.env.XERO_CLIENT_SECRET || "",
        tokenUrl: "https://identity.xero.com/connect/token",
      },
    } as const;

    if (!PROVIDER_CONFIG[provider]) {
      return redirect("/apps?error=invalid_provider");
    }

    const config = PROVIDER_CONFIG[provider];

    if (!config.clientId || !config.clientSecret) {
      return redirect("/apps?error=oauth_not_configured");
    }
    const supabase = await createClient();

    // Get redirect URI
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3336'}/api/oauth/${provider}/callback`;

    // Exchange authorization code for tokens
    const tokenResponse = await fetch(config.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${config.clientId}:${config.clientSecret}`,
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token exchange failed:", errorText);
      return redirect("/apps?error=token_exchange_failed");
    }

    const tokens = await tokenResponse.json();

    // Calculate expiration timestamp
    const expiresAt = new Date(
      Date.now() + (tokens.expires_in || 3600) * 1000,
    ).toISOString();

    // Store tokens in database
    const { error: dbError } = await supabase.from("oauth_connections").upsert(
      {
        team_id: teamId,
        provider,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt,
        realm_id:
          provider === "quickbooks" ? searchParams.get("realmId") : null,
      },
      {
        onConflict: "team_id,provider",
      },
    );

    if (dbError) {
      console.error("Database error:", dbError);
      return redirect("/apps?error=storage_failed");
    }

    // Redirect to apps page with success
    redirect("/apps?success=true");
  } catch (err) {
    console.error("OAuth callback error:", err);
    return redirect("/apps?error=callback_failed");
  }
}
