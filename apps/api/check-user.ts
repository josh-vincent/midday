import { connectDb } from "@midday/db/client";
import { users, usersOnTeam, teams } from "@midday/db/schema";
import { eq } from "drizzle-orm";

const userId = "99a44313-c400-42dc-a556-60be2d6354e1";

const db = await connectDb();

// Check user
const [user] = await db
  .select()
  .from(users)
  .where(eq(users.id, userId))
  .limit(1);

console.log("User:", JSON.stringify(user, null, 2));

// Check memberships
const memberships = await db
  .select()
  .from(usersOnTeam)
  .where(eq(usersOnTeam.userId, userId));

console.log("Memberships:", JSON.stringify(memberships, null, 2));

process.exit(0);
