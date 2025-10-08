import { createClient } from "@midday/supabase/server";

export type OAuthProvider = "quickbooks" | "xero" | "outlook" | "gmail";

export interface OAuthConnection {
  id: string;
  team_id: string;
  provider: OAuthProvider;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  realm_id?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get OAuth connection for a team and provider
 */
export async function getOAuthConnection(
  teamId: string,
  provider: OAuthProvider,
): Promise<OAuthConnection | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("oauth_connections")
    .select("*")
    .eq("team_id", teamId)
    .eq("provider", provider)
    .single();

  if (error || !data) {
    return null;
  }

  return data as OAuthConnection;
}

/**
 * Check if OAuth connection exists and is valid for a team
 */
export async function hasOAuthConnection(
  teamId: string,
  provider: OAuthProvider,
): Promise<boolean> {
  const connection = await getOAuthConnection(teamId, provider);

  if (!connection) {
    return false;
  }

  // Check if token is still valid (not expired)
  const expiresAt = new Date(connection.expires_at);
  const now = new Date();

  return expiresAt > now;
}

/**
 * Delete OAuth connection for a team and provider
 */
export async function deleteOAuthConnection(
  teamId: string,
  provider: OAuthProvider,
): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase
    .from("oauth_connections")
    .delete()
    .eq("team_id", teamId)
    .eq("provider", provider);

  return !error;
}

/**
 * Get all OAuth connections for a team
 */
export async function getTeamOAuthConnections(
  teamId: string,
): Promise<OAuthConnection[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("oauth_connections")
    .select("*")
    .eq("team_id", teamId);

  if (error || !data) {
    return [];
  }

  return data as OAuthConnection[];
}

/**
 * Initiate OAuth flow for a provider
 * Returns the authorization URL to redirect to
 */
export function getOAuthAuthorizeUrl(
  provider: OAuthProvider,
  teamId: string,
): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3336";
  return `${baseUrl}/api/oauth/${provider}/authorize?teamId=${encodeURIComponent(teamId)}`;
}
