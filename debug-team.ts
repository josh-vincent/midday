import { createClient } from "@midday/supabase/server";
import { createDb } from "@midday/db/client";

async function debugTeamRelationship() {
  const supabase = createClient();
  const db = createDb();

  // Get the current authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.log("No authenticated user found");
    return;
  }

  console.log("Current user ID:", user.id);
  console.log("Current user email:", user.email);

  // Query user directly
  const userRecord = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, user.id),
  });

  console.log("\n=== User Record ===");
  console.log("Found in users table:", !!userRecord);
  if (userRecord) {
    console.log("teamId (direct):", userRecord.teamId);
    console.log("Full user:", JSON.stringify(userRecord, null, 2));
  }

  // Query user with relations
  const userWithRelations = await db.query.users.findFirst({
    with: {
      usersOnTeams: true,
      team: true,
    },
    where: (users, { eq }) => eq(users.id, user.id),
  });

  console.log("\n=== User with Relations ===");
  if (userWithRelations) {
    console.log("Direct teamId:", userWithRelations.teamId);
    console.log("Direct team relation:", userWithRelations.team);
    console.log("UsersOnTeams records:", userWithRelations.usersOnTeams);
  }

  // Query users_on_team directly
  const { usersOnTeam } = await import("@midday/db/schema");
  const memberships = await db
    .select()
    .from(usersOnTeam)
    .where(eq(usersOnTeam.userId, user.id));

  console.log("\n=== Direct users_on_team Query ===");
  console.log("Memberships found:", memberships.length);
  console.log("Memberships:", JSON.stringify(memberships, null, 2));

  // Check if any teams exist
  const { teams } = await import("@midday/db/schema");
  const allTeams = await db.select().from(teams).limit(5);

  console.log("\n=== Teams in Database ===");
  console.log("Teams found:", allTeams.length);
  if (allTeams.length > 0) {
    console.log("First team:", JSON.stringify(allTeams[0], null, 2));
  }
}

// Import eq separately to avoid issues
import { eq } from "drizzle-orm";

debugTeamRelationship()
  .then(() => {
    console.log("\nDebug completed");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
