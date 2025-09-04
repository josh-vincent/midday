import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users } from "@midday/db/schema";
import { eq } from "drizzle-orm";

async function fixUserTeam() {
  // Connect directly to the database
  const connectionString = "postgresql://postgres.ulncfblvuijlgniydjju:MikeTheDogSupabase!@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres";
  const client = postgres(connectionString);
  const db = drizzle(client);
  
  try {
    console.log("Looking for admin@tocld.com...");
    
    // Clear the teamId for the admin user
    const result = await db
      .update(users)
      .set({ teamId: null })
      .where(eq(users.email, "admin@tocld.com"))
      .returning();
    
    if (result.length > 0) {
      console.log("Successfully cleared teamId for admin@tocld.com");
      console.log("User will now be redirected to team creation page.");
    } else {
      console.log("No user found with email admin@tocld.com");
    }

  } catch (error) {
    console.error("Error fixing user team:", error);
  } finally {
    await client.end();
  }
}

// Run the fix
fixUserTeam().then(() => {
  console.log("Fix completed");
  process.exit(0);
}).catch((error) => {
  console.error("Fix failed:", error);
  process.exit(1);
});