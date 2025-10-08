import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { createClient } from "@midday/supabase/server";

type Provider = "quickbooks" | "xero" | "gmail" | "outlook";

/**
 * OAuth Authorization Handler
 * Generates OAuth authorization URL and redirects user to provider
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: Provider }> },
) {
  try {
    const { provider } = await params;

    // Always get authenticated user from Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    console.log('[OAuth Authorize] User:', user ? { id: user.id, email: user.email, metadata: user.user_metadata } : 'null');

    if (!user) {
      console.error('[OAuth Authorize] No authenticated user');
      return Response.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get user's team from users_on_team table
    const { data: userTeams, error: teamError } = await supabase
      .from("users_on_team")
      .select("team_id")
      .eq("user_id", user.id)
      .limit(1);

    if (teamError || !userTeams || userTeams.length === 0) {
      console.error('[OAuth Authorize] No team found for user:', teamError);
      return Response.json(
        { error: "User must belong to a team" },
        { status: 403 }
      );
    }

    const teamId = userTeams[0].team_id;
    console.log('[OAuth Authorize] Using teamId:', teamId);

    // Get provider config
    const PROVIDER_CONFIG = {
      quickbooks: {
        clientId: process.env.OAUTH_QB_CLIENT_ID || process.env.QUICKBOOKS_CLIENT_ID || "",
        authUrl: "https://appcenter.intuit.com/connect/oauth2",
        scope: "com.intuit.quickbooks.accounting",
      },
      xero: {
        clientId: process.env.OAUTH_XERO_CLIENT_ID || process.env.XERO_CLIENT_ID || "",
        authUrl: "https://login.xero.com/identity/connect/authorize",
        scope: "accounting.contacts accounting.transactions offline_access",
      },
      gmail: {
        clientId: process.env.GMAIL_CLIENT_ID || "",
        authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
        scope: "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send",
        // Additional params for Gmail
        accessType: "offline" as const,
        prompt: "consent" as const, // Force consent to always get refresh token
      },
      outlook: {
        clientId: process.env.OUTLOOK_CLIENT_ID || "",
        authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
        scope: "offline_access Mail.Read Mail.Send",
      },
    } as const;

    if (!PROVIDER_CONFIG[provider]) {
      return Response.json(
        { error: "Invalid provider" },
        { status: 400 },
      );
    }

    const config = PROVIDER_CONFIG[provider];

    if (!config.clientId) {
      return Response.json(
        { error: `${provider} OAuth credentials not configured` },
        { status: 500 },
      );
    }

    // Build OAuth authorization URL
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3336'}/api/oauth/${provider}/callback`;

    // Use teamId as state (no need to encode JSON)
    const state = teamId;

    const authUrl = new URL(config.authUrl);
    authUrl.searchParams.set("client_id", config.clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("scope", config.scope);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("state", state);

    // Add provider-specific parameters
    if (provider === "gmail") {
      authUrl.searchParams.set("access_type", "offline");
      authUrl.searchParams.set("prompt", "consent");
    }

    console.log('[OAuth Authorize] Redirecting to:', {
      provider,
      redirectUri,
      state,
      authUrl: authUrl.toString().substring(0, 100) + '...'
    });

    // Redirect user to provider's authorization page
    redirect(authUrl.toString());
  } catch (error) {
    // NEXT_REDIRECT is expected - don't catch it
    if (isRedirectError(error)) {
      throw error;
    }
    console.error("OAuth authorization error:", error);
    return Response.json(
      { error: "Authorization failed" },
      { status: 500 },
    );
  }
}
