import { NextResponse } from "next/server";

/**
 * Mock Xero OAuth authorization endpoint for testing
 * In production, this would redirect to Xero OAuth with proper client credentials
 */
export async function GET() {
  // For testing: redirect to our own callback with mock data
  const callbackUrl = new URL(
    "/api/accounting/xero/callback",
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3336"
  );

  // Mock authorization code
  callbackUrl.searchParams.set("code", `mock_xero_code_${Date.now()}`);
  callbackUrl.searchParams.set("state", "mock_state");

  return NextResponse.json({
    authUrl: callbackUrl.toString(),
  });
}
