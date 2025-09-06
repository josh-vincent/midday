// Test Supabase database directly
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ulncfblvuijlgniydjju.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsbmNmYmx2dWlqbGduaXlkamp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NTkxODUsImV4cCI6MjA3MjUzNTE4NX0.pCycxnDK259p3AqhTuet9k20ErxOYEJReDUI5iBG6Ik";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRealData() {
  console.log("🔍 Checking REAL data in Supabase database...\n");

  try {
    // 1. Sign in first
    console.log("Signing in...");
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: "admin@tocld.com",
        password: "Admin123",
      });

    if (authError) {
      console.error("Auth failed:", authError.message);
      return;
    }

    console.log("✅ Signed in as:", authData.user.email);
    console.log("");

    // 2. Query jobs table directly
    console.log("📊 Querying REAL jobs table in database...");
    const { data: jobs, error: jobsError } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (jobsError) {
      console.error("❌ Jobs query error:", jobsError);
    } else {
      console.log(`✅ Found ${jobs?.length || 0} REAL jobs in database:`);
      jobs?.forEach((job, index) => {
        console.log(`\n   Job ${index + 1}:`);
        console.log(`   - ID: ${job.id}`);
        console.log(`   - Job Number: ${job.job_number}`);
        console.log(`   - Company: ${job.company_name}`);
        console.log(`   - Status: ${job.status}`);
        console.log(`   - Date: ${job.job_date}`);
        console.log(`   - Created: ${job.created_at}`);
      });
    }

    // 3. Check customers table
    console.log("\n📊 Checking customers table...");
    const { data: customers, error: customersError } = await supabase
      .from("customers")
      .select("*")
      .limit(5);

    if (customersError) {
      console.error("❌ Customers query error:", customersError);
    } else {
      console.log(`✅ Found ${customers?.length || 0} customers in database`);
    }

    // 4. Check invoices table
    console.log("\n📊 Checking invoices table...");
    const { data: invoices, error: invoicesError } = await supabase
      .from("invoices")
      .select("*")
      .limit(5);

    if (invoicesError) {
      console.error("❌ Invoices query error:", invoicesError);
    } else {
      console.log(`✅ Found ${invoices?.length || 0} invoices in database`);
    }

    // 5. Check teams table
    console.log("\n📊 Checking teams table...");
    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select("*")
      .limit(5);

    if (teamsError) {
      console.error("❌ Teams query error:", teamsError);
    } else {
      console.log(`✅ Found ${teams?.length || 0} teams in database`);
      teams?.forEach((team) => {
        console.log(`   - ${team.name} (ID: ${team.id})`);
      });
    }

    console.log("\n" + "=".repeat(60));
    console.log("🎉 This is REAL DATA from your Supabase database!");
    console.log("=".repeat(60));

    await supabase.auth.signOut();
  } catch (error) {
    console.error("❌ Test failed:", error);
  }

  process.exit(0);
}

testRealData();
