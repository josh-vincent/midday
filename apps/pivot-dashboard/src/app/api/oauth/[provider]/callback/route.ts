import { createClient } from "@midday/supabase/server";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";

type Provider = "quickbooks" | "xero" | "gmail" | "outlook";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: Provider }> },
) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const realmId = searchParams.get("realmId");

  console.log('[OAuth Callback] Query params:', { code: code?.substring(0, 10) + '...', state, error, realmId });

  // Handle OAuth errors
  if (error) {
    console.error('[OAuth Callback] OAuth error:', error);
    return redirect(`/settings/integrations?error=${error}`);
  }

  if (!code || !state) {
    console.error('[OAuth Callback] Missing code or state:', { code: !!code, state: !!state });
    return redirect("/settings/integrations?error=missing_params");
  }

  try {
    const { provider } = await params;

    // State is the teamId (UUID format from authorize route)
    const teamId = state;
    console.log('[OAuth Callback] Provider:', provider, 'TeamId:', teamId);

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
      gmail: {
        clientId: process.env.GMAIL_CLIENT_ID || "",
        clientSecret: process.env.GMAIL_CLIENT_SECRET || "",
        tokenUrl: "https://oauth2.googleapis.com/token",
      },
      outlook: {
        clientId: process.env.OUTLOOK_CLIENT_ID || "",
        clientSecret: process.env.OUTLOOK_CLIENT_SECRET || "",
        tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      },
    } as const;

    if (!PROVIDER_CONFIG[provider]) {
      return redirect("/settings/integrations?error=invalid_provider");
    }

    const config = PROVIDER_CONFIG[provider];

    if (!config.clientId || !config.clientSecret) {
      return redirect("/settings/integrations?error=oauth_not_configured");
    }

    const supabase = await createClient();

    // Get redirect URI
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3336'}/api/oauth/${provider}/callback`;

    // Exchange authorization code for tokens
    console.log('[OAuth Callback] Exchanging code for tokens...', { tokenUrl: config.tokenUrl, redirectUri });

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
      console.error("[OAuth Callback] Token exchange failed:", { status: tokenResponse.status, error: errorText });
      return redirect("/settings/integrations?error=token_exchange_failed");
    }

    const tokens = await tokenResponse.json();
    console.log('[OAuth Callback] Token exchange successful:', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiresIn: tokens.expires_in
    });

    // Calculate expiration timestamp
    const expiresAt = new Date(
      Date.now() + (tokens.expires_in || 3600) * 1000,
    ).toISOString();

    // Get user from Supabase auth
    const { data: { user } } = await supabase.auth.getUser();

    console.log('[OAuth Callback] User from Supabase:', user ? { id: user.id, email: user.email } : 'null');

    if (!user) {
      console.error("[OAuth Callback] No authenticated user");
      return redirect("/settings/integrations?error=auth_required");
    }

    // Verify the teamId belongs to this user
    const { data: userTeams, error: teamError } = await supabase
      .from("users_on_team")
      .select("team_id")
      .eq("user_id", user.id)
      .eq("team_id", teamId)
      .limit(1);

    if (teamError || !userTeams || userTeams.length === 0) {
      console.error("[OAuth Callback] Team verification failed:", teamError);
      return redirect("/settings/integrations?error=invalid_team");
    }

    // Prepare the data to insert
    const connectionData = {
      team_id: teamId,
      user_id: user.id,
      provider,
      credentials: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresIn: tokens.expires_in || 3600,
        connectedAt: new Date().toISOString(),
        tokenType: tokens.token_type || "bearer",
        scope: tokens.scope,
      },
      expires_at: expiresAt,
      realm_id: provider === "quickbooks" ? realmId : null,
      tenant_id: provider === "xero" ? tokens.tenantId : null,
      environment: process.env.OAUTH_QB_ENVIRONMENT || process.env.OAUTH_XERO_ENVIRONMENT || "production",
    };

    console.log('[OAuth Callback] Inserting connection:', {
      team_id: connectionData.team_id,
      user_id: connectionData.user_id,
      provider: connectionData.provider,
      realm_id: connectionData.realm_id,
      hasCredentials: !!connectionData.credentials
    });

    // Store tokens in oauth_connections table
    const { data: insertedData, error: dbError } = await supabase
      .from("oauth_connections")
      .upsert(connectionData, {
        onConflict: "team_id,provider",
      })
      .select();

    if (dbError) {
      console.error("[OAuth Callback] Database error:", {
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint,
        code: dbError.code
      });
      return redirect("/settings/integrations?error=storage_failed");
    }

    console.log('[OAuth Callback] Connection saved successfully:', insertedData);

    // Also sync with Supabase OAuth API for QuickBooks and Xero
    if (provider === 'quickbooks' || provider === 'xero') {
      try {
        console.log('[OAuth Callback] Syncing with Supabase OAuth API...');

        const oauthApiUrl = process.env.OAUTH_API_URL || 'https://ulncfblvuijlgniydjju.supabase.co/functions/v1/api';
        const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

        const callbackResponse = await fetch(
          `${oauthApiUrl}/oauth/${provider}/callback`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code, state }),
          }
        );

        if (callbackResponse.ok) {
          const result = await callbackResponse.json();
          console.log('[OAuth Callback] Supabase API sync successful:', result);
        } else {
          const errorText = await callbackResponse.text();
          console.error('[OAuth Callback] Supabase API sync failed:', errorText);
          // Don't fail the whole flow if Supabase sync fails
        }
      } catch (syncError) {
        console.error('[OAuth Callback] Error syncing with Supabase API:', syncError);
        // Don't fail the whole flow if Supabase sync fails
      }
    }

    // Redirect to integrations page with success
    redirect("/settings/integrations?success=true");
  } catch (err) {
    // NEXT_REDIRECT is expected - don't catch it
    if (isRedirectError(err)) {
      throw err;
    }
    console.error("[OAuth Callback] Unexpected error:", {
      error: err,
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined
    });
    return redirect("/settings/integrations?error=callback_failed");
  }
}
