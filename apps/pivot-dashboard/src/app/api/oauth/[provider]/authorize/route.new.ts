/**
 * OAuth Authorization Route - Simplified with @midday/oauth-sync
 *
 * This replaces the 81-line manual OAuth implementation with just 10 lines.
 *
 * Features:
 * - Automatically generates correct authorization URL
 * - Handles sandbox vs production URLs
 * - Auto-sets correct scopes per provider
 * - Auto-sets redirect URI
 */

import { oauth } from "@/lib/oauth";

type Provider = "quickbooks" | "xero";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: Provider }> }
) {
  const { provider } = await params;

  // All OAuth authorization magic happens here:
  // 1. Generates correct auth URL (sandbox or production based on env)
  // 2. Sets provider-specific scopes automatically
  // 3. Sets redirect URI to: {NEXT_PUBLIC_APP_URL}/api/oauth/{provider}/callback
  // 4. Includes state for CSRF protection
  return oauth.authorize(provider);
}
