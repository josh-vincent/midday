import { createClient } from "@midday/supabase/client";

async function testAuth() {
  console.log("Testing tRPC authentication endpoints...\n");

  // Test 1: Check Supabase auth
  const supabase = createClient();
  const {
    data: { session },
    error: authError,
  } = await supabase.auth.getSession();

  if (authError) {
    console.error("❌ Supabase auth error:", authError);
    return;
  }

  if (!session) {
    console.log("❌ No session found - user not authenticated");
    console.log("Please sign in first at http://localhost:3001/sign-in");
    return;
  }

  console.log("✅ Supabase session found");
  console.log("User ID:", session.user.id);
  console.log("Email:", session.user.email);
  console.log("Access token present:", !!session.access_token);

  // Test 2: Direct API call to tRPC endpoint
  console.log("\nTesting tRPC user.me endpoint...");

  try {
    const response = await fetch("http://localhost:3002/api/trpc/user.me", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Cookie: document.cookie, // Include auth cookies
      },
      credentials: "include",
    });

    console.log("Response status:", response.status);

    if (!response.ok) {
      const text = await response.text();
      console.error("❌ tRPC request failed:", text);
    } else {
      const data = await response.json();
      console.log("✅ tRPC response:", JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error("❌ Fetch error:", error);
  }

  // Test 3: Check database user record
  console.log("\nChecking database records...");

  const { data: authUser, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", session.user.id)
    .single();

  if (userError) {
    console.error("❌ Database query error:", userError);
    console.log("User may not exist in public.users table");
  } else if (authUser) {
    console.log("✅ User found in database:");
    console.log("- ID:", authUser.id);
    console.log("- Email:", authUser.email);
    console.log("- Team ID:", authUser.team_id || "No team");
  }

  // Test 4: Check team membership
  if (authUser?.team_id) {
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .select("*")
      .eq("id", authUser.team_id)
      .single();

    if (teamError) {
      console.error("❌ Team query error:", teamError);
    } else if (team) {
      console.log("\n✅ Team found:");
      console.log("- ID:", team.id);
      console.log("- Name:", team.name);
    }
  } else {
    console.log("\n⚠️  User has no team - should redirect to team creation");
  }

  console.log("\n--- Test Complete ---");
}

// Run test in browser console
if (typeof window !== "undefined") {
  (window as any).testAuth = testAuth;
  console.log(
    "Test function ready. Run 'testAuth()' in the console to test authentication.",
  );
}

export { testAuth };
