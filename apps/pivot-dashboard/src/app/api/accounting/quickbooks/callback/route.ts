import { NextRequest, NextResponse } from "next/server";
import { QuickBooksProvider } from "@midday/oauth-sync-core/providers";
import type { ProviderConfig } from "@midday/oauth-sync-core/types";

/**
 * QuickBooks OAuth callback endpoint
 * For testing: Uses mock token exchange. In production, this would call real QuickBooks API
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const realmId = searchParams.get("realmId");

  if (!code) {
    return NextResponse.redirect(
      new URL("/settings/integrations?error=no_code", request.url)
    );
  }

  try {
    // For testing: Mock the initial token response from QuickBooks
    // In production, you would exchange the code for tokens here using QuickBooks OAuth API
    const mockInitialTokens = {
      accessToken: `qb_access_${Date.now()}`,
      refreshToken: `qb_refresh_${Date.now()}`,
      expiresIn: 3600, // 1 hour
      connectedAt: new Date().toISOString(),
      scope: "com.intuit.quickbooks.accounting",
      tokenType: "bearer",
    };

    // Calculate expiresAt using QuickBooksProvider
    const provider = new QuickBooksProvider();
    const expiresAt = provider.calculateExpiresAt(mockInitialTokens.expiresIn);

    const tokenData = {
      provider: "quickbooks",
      accessToken: mockInitialTokens.accessToken,
      refreshToken: mockInitialTokens.refreshToken,
      expiresIn: mockInitialTokens.expiresIn,
      expiresAt,
      connectedAt: mockInitialTokens.connectedAt,
      scope: mockInitialTokens.scope,
      tokenType: mockInitialTokens.tokenType,
      realmId: realmId || `realm_${Math.random().toString(36).substr(2, 9)}`,
      tenantName: "Test QuickBooks Company",
    };

    // Redirect back to settings with token data in URL params (encoded)
    const redirectUrl = new URL("/settings/integrations", request.url);
    redirectUrl.searchParams.set("oauth_success", "true");
    redirectUrl.searchParams.set("provider", "quickbooks");
    redirectUrl.searchParams.set(
      "data",
      Buffer.from(JSON.stringify(tokenData)).toString("base64")
    );

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("QuickBooks OAuth callback error:", error);
    return NextResponse.redirect(
      new URL(
        "/settings/integrations?error=callback_failed",
        request.url
      )
    );
  }
}
