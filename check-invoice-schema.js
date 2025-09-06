// Check invoice table schema
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ulncfblvuijlgniydjju.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsbmNmYmx2dWlqbGduaXlkamp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NTkxODUsImV4cCI6MjA3MjUzNTE4NX0.pCycxnDK259p3AqhTuet9k20ErxOYEJReDUI5iBG6Ik";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
  console.log("📊 Checking invoice table schema...\n");

  try {
    // Create a dummy invoice to see what fields are accepted
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .limit(1);

    if (error) {
      console.log("Error:", error);
    } else if (data && data.length > 0) {
      console.log("Invoice columns:", Object.keys(data[0]));
      console.log("\nSample invoice structure:");
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log("No invoices found, trying to insert a test invoice...");

      // Try inserting with minimal fields
      const testInvoice = {
        id: "test-" + Date.now(),
        invoice_number: "TEST-001",
        status: "draft",
        amount: 10000,
        currency: "USD",
        issue_date: new Date().toISOString(),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        team_id: "6a980403-42c5-40c5-ac24-a08752a3172f",
      };

      const { data: insertData, error: insertError } = await supabase
        .from("invoices")
        .insert(testInvoice)
        .select()
        .single();

      if (insertError) {
        console.log("Insert error:", insertError);
        console.log("This tells us what fields are required/invalid");
      } else {
        console.log("Successfully inserted test invoice!");
        console.log("Columns:", Object.keys(insertData));

        // Clean up
        await supabase.from("invoices").delete().eq("id", testInvoice.id);
      }
    }
  } catch (error) {
    console.error("Error:", error);
  }

  process.exit(0);
}

checkSchema();
