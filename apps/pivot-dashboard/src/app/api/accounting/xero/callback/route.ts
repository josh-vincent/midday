import { NextRequest, NextResponse } from "next/server";
import { XeroProvider } from "@midday/oauth-sync-core/providers";

/**
 * Xero OAuth callback endpoint
 * For testing: Uses mock token exchange. In production, this would call real Xero API
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      new URL("/settings/integrations?error=no_code", request.url)
    );
  }

  try {
    // For testing: Mock the initial token response from Xero
    // In production, you would exchange the code for tokens here using Xero OAuth API
    const mockInitialTokens = {
      accessToken: `xero_access_${Date.now()}`,
      refreshToken: `xero_refresh_${Date.now()}`,
      expiresIn: 1800, // 30 minutes
      connectedAt: new Date().toISOString(),
      scope: "accounting.transactions accounting.settings",
      tokenType: "bearer",
    };

    // Calculate expiresAt using XeroProvider
    const provider = new XeroProvider();
    const expiresAt = provider.calculateExpiresAt(mockInitialTokens.expiresIn);

    const tokenData = {
      provider: "xero",
      accessToken: mockInitialTokens.accessToken,
      refreshToken: mockInitialTokens.refreshToken,
      expiresIn: mockInitialTokens.expiresIn,
      expiresAt,
      connectedAt: mockInitialTokens.connectedAt,
      scope: mockInitialTokens.scope,
      tokenType: mockInitialTokens.tokenType,
      tenantId: `tenant_${Math.random().toString(36).substr(2, 9)}`,
      tenantName: "Test Xero Organization",
    };

    // Redirect back to settings with token data in URL params (encoded)
    const redirectUrl = new URL("/settings/integrations", request.url);
    redirectUrl.searchParams.set("oauth_success", "true");
    redirectUrl.searchParams.set("provider", "xero");
    redirectUrl.searchParams.set(
      "data",
      Buffer.from(JSON.stringify(tokenData)).toString("base64")
    );

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("Xero OAuth callback error:", error);
    return NextResponse.redirect(
      new URL(
        "/settings/integrations?error=callback_failed",
        request.url
      )
    );
  }
}
