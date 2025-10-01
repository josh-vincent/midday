// Vercel Serverless Function handler for Hono API
// Import the Hono app from src/index.ts

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Simple handler that directly uses the app's fetch
export default async function handler(req: Request) {
  try {
    // Dynamically import to avoid build-time issues
    const { app } = await import("../src/index");

    // Use Hono's native fetch handler
    return await app.fetch(req, {
      // Pass Vercel environment
      env: process.env,
    });
  } catch (error) {
    console.error("API Handler Error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
