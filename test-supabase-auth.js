const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

async function testSupabaseAuth() {
  console.log("🔐 Testing Supabase Authentication...\n");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("❌ Missing Supabase environment variables");
    return;
  }

  console.log("Supabase URL:", supabaseUrl);

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    console.log("1. Attempting to sign in with admin@tocld.com...");
    const { data, error } = await supabase.auth.signInWithPassword({
      email: "admin@tocld.com",
      password: "Admin123",
    });

    if (error) {
      console.error("❌ Authentication failed:", error.message);
      console.error("Error details:", error);
    } else {
      console.log("✅ Authentication successful!");
      console.log("User ID:", data.user.id);
      console.log("Email:", data.user.email);
      console.log("Session:", data.session ? "Active" : "None");

      // Test getting user details
      console.log("\n2. Getting user profile...");
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", data.user.id)
        .single();

      if (profileError) {
        console.error("❌ Failed to get profile:", profileError.message);
      } else {
        console.log("✅ User profile retrieved:");
        console.log("  Name:", profile.full_name);
        console.log("  Email:", profile.email);
        console.log("  Locale:", profile.locale);
      }

      // Sign out
      await supabase.auth.signOut();
      console.log("\n✅ Signed out successfully");
    }
  } catch (err) {
    console.error("❌ Unexpected error:", err);
  }
}

testSupabaseAuth().catch(console.error);
