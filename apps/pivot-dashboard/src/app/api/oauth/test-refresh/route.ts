import { oauth } from "@/lib/oauth";

/**
 * Test endpoint to manually trigger token refresh
 * Access: http://localhost:3336/api/oauth/test-refresh
 */
export async function GET() {
  try {
    // Manually trigger refresh check
    if (oauth['autoRefresh']) {
      await oauth['autoRefresh'].trigger();

      return Response.json({
        success: true,
        message: "Refresh check triggered successfully. Check server logs for details.",
      });
    } else {
      return Response.json({
        success: false,
        message: "Auto-refresh service is not enabled",
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Manual refresh trigger failed:", error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
