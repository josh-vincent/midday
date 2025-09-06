import { createClient } from "@midday/supabase/server";
import type { AppRouter } from "@midday/api/trpc/routers/_app";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";

async function testTRPCEndpoints() {
  const supabase = createClient();

  // Get the current session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    console.error("❌ No authenticated session found. Please log in first.");
    return;
  }

  console.log("✅ Authenticated as:", session.user.email);
  console.log("Session token:", session.access_token?.substring(0, 20) + "...");

  // Create tRPC client
  const trpc = createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3334"}/trpc`,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        transformer: superjson,
      }),
    ],
  });

  console.log("\n=== Testing tRPC Endpoints ===\n");

  // Test user.me endpoint (should work without team)
  console.log("1. Testing user.me endpoint...");
  try {
    const user = await trpc.user.me.query();
    console.log("✅ user.me successful:");
    console.log("   - ID:", user?.id);
    console.log("   - Email:", user?.email);
    console.log("   - Team ID:", user?.teamId || "No team");
    console.log("   - Full response:", JSON.stringify(user, null, 2));
  } catch (error: any) {
    console.error("❌ user.me failed:", error.message);
    console.error("   Full error:", error);
  }

  // Test user.invites endpoint (should work without team)
  console.log("\n2. Testing user.invites endpoint...");
  try {
    const invites = await trpc.user.invites.query();
    console.log("✅ user.invites successful:");
    console.log("   - Invites count:", invites?.length || 0);
    console.log("   - Invites:", JSON.stringify(invites, null, 2));
  } catch (error: any) {
    console.error("❌ user.invites failed:", error.message);
  }

  // Test team endpoints (these should fail if no team)
  console.log("\n3. Testing team.current endpoint...");
  try {
    const team = await trpc.team.current.query();
    console.log("✅ team.current successful:");
    console.log("   - Team:", JSON.stringify(team, null, 2));
  } catch (error: any) {
    console.error("❌ team.current failed:", error.message);
    if (error.message === "NO_TEAM") {
      console.log("   ℹ️  This is expected - user has no team");
    }
  }

  // Test team.create endpoint
  console.log("\n4. Testing team.create endpoint...");
  try {
    const newTeam = await trpc.team.create.mutate({
      name: "Test Dirt Receiving Co",
      email: session.user.email || "test@example.com",
      countryCode: "US",
    });
    console.log("✅ team.create successful:");
    console.log("   - New team:", JSON.stringify(newTeam, null, 2));
  } catch (error: any) {
    console.error("❌ team.create failed:", error.message);
    console.error("   Full error:", error);
  }

  // Test invoice endpoints (these require a team)
  console.log("\n5. Testing invoice.list endpoint...");
  try {
    const invoices = await trpc.invoice.list.query({
      limit: 10,
    });
    console.log("✅ invoice.list successful:");
    console.log("   - Invoices count:", invoices?.data?.length || 0);
  } catch (error: any) {
    console.error("❌ invoice.list failed:", error.message);
    if (error.message.includes("team")) {
      console.log("   ℹ️  This is expected - invoice operations require a team");
    }
  }

  // Test customer endpoints (these require a team)
  console.log("\n6. Testing customer.list endpoint...");
  try {
    const customers = await trpc.customer.list.query({
      limit: 10,
    });
    console.log("✅ customer.list successful:");
    console.log("   - Customers count:", customers?.data?.length || 0);
  } catch (error: any) {
    console.error("❌ customer.list failed:", error.message);
    if (error.message.includes("team")) {
      console.log(
        "   ℹ️  This is expected - customer operations require a team",
      );
    }
  }

  console.log("\n=== Test Complete ===");
}

testTRPCEndpoints()
  .then(() => {
    console.log("\nAll tests completed");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Test suite error:", err);
    process.exit(1);
  });
