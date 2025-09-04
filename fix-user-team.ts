import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@midday/db/schema";
import { eq } from "drizzle-orm";

async function fixUserTeam() {
  // Connect directly to the database
  const connectionString = process.env.DATABASE_URL || "postgresql://postgres.ulncfblvuijlgniydjju:MikeTheDogSupabase!@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres";
  const client = postgres(connectionString);
  const db = drizzle(client, { schema });
  
  try {
    // Find the admin user
    const adminUser = await db.query.users.findFirst({
      where: eq(schema.users.email, "admin@tocld.com"),
      with: {
        usersOnTeams: true
      }
    });

    if (!adminUser) {
      console.log("User admin@tocld.com not found");
      return;
    }

    console.log("User found:", {
      id: adminUser.id,
      email: adminUser.email,
      teamId: adminUser.teamId,
      usersOnTeams: adminUser.usersOnTeams
    });

    // If user has a teamId but no team membership, fix it
    if (adminUser.teamId && adminUser.usersOnTeams.length === 0) {
      console.log(`User has teamId ${adminUser.teamId} but no team membership. Fixing...`);
      
      // Check if the team exists
      const team = await db.query.teams.findFirst({
        where: eq(schema.teams.id, adminUser.teamId)
      });

      if (!team) {
        console.log(`Team ${adminUser.teamId} doesn't exist. Clearing user's teamId...`);
        // Clear the teamId
        await db
          .update(schema.users)
          .set({ teamId: null })
          .where(eq(schema.users.id, adminUser.id));
        console.log("User's teamId cleared. User should now be redirected to team creation.");
      } else {
        console.log(`Team ${adminUser.teamId} exists. Adding user as member...`);
        // Add user to the team
        await db.insert(schema.usersOnTeams).values({
          userId: adminUser.id,
          teamId: adminUser.teamId,
          role: "owner"
        });
        console.log("User added to team as owner.");
      }
    } else if (!adminUser.teamId) {
      console.log("User has no teamId. They will be redirected to team creation.");
    } else {
      console.log("User already has team membership. No fix needed.");
    }

  } catch (error) {
    console.error("Error fixing user team:", error);
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