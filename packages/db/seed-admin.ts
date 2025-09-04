import { createClient } from "@supabase/supabase-js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users, teams, usersOnTeam } from "./src/schema";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), "../../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const databaseUrl = process.env.DATABASE_URL!;

async function seedAdmin() {
  console.log("🌱 Starting admin user seed...\n");

  // Initialize Supabase Admin client
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Initialize database connection
  const sql = postgres(databaseUrl);
  const db = drizzle(sql);

  try {
    // Try to get existing user first
    console.log("Checking for existing user...");
    const { data: { users: existingUsers } } = await supabase.auth.admin.listUsers();
    let authUser = existingUsers?.find(u => u.email === "admin@tocld.com");

    if (!authUser) {
      // Create new auth user
      console.log("Creating new auth user...");
      const { data, error } = await supabase.auth.admin.createUser({
        email: "admin@tocld.com",
        password: "Admin123",
        email_confirm: true,
      });

      if (error) throw error;
      authUser = data.user;
      console.log(`✅ Created auth user: ${authUser.id}`);
    } else {
      console.log(`✅ Found existing auth user: ${authUser.id}`);
      
      // Update password
      console.log("Updating password...");
      const { error } = await supabase.auth.admin.updateUserById(
        authUser.id,
        { password: "Admin123" }
      );
      
      if (error) {
        console.error("Warning: Could not update password:", error.message);
      } else {
        console.log("✅ Password set to Admin123");
      }
    }

    // Check if user exists in users table
    const [existingDbUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, authUser.id));
      
    if (!existingDbUser) {
      // Create user in database
      console.log("Creating user in database...");
      const [newUser] = await db.insert(users).values({
        id: authUser.id,
        email: "admin@tocld.com",
        fullName: "Admin User",
        avatarUrl: null,
        locale: "en",
        weekStarts: 1,
        timezone: "UTC",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).returning();
      
      console.log("✅ Created user in database");
    } else {
      console.log("✅ User already exists in database");
    }
    
    // Ensure team exists and user is a member
    await ensureTeamAndMembership(db, authUser.id);

    console.log("\n" + "=".repeat(50));
    console.log("✅ Admin user setup complete!");
    console.log("=".repeat(50));
    console.log("📧 Email: admin@tocld.com");
    console.log("🔑 Password: Admin123");
    console.log("=".repeat(50));
    console.log("\nYou can now log in to the application!");

  } catch (error) {
    console.error("❌ Error seeding admin user:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

async function ensureTeamAndMembership(db: any, userId: string) {
  // Check if user already has a team
  const [existingMembership] = await db
    .select()
    .from(usersOnTeam)
    .where(eq(usersOnTeam.userId, userId));
    
  if (existingMembership) {
    console.log("✅ User already belongs to a team");
    return existingMembership.teamId;
  }
  
  // Create team
  console.log("Creating team...");
  const [team] = await db.insert(teams).values({
    name: "TOCLD Dirt Services",
    email: "admin@tocld.com",
    phone: "555-0123",
    website: "https://tocld.com",
    address: "123 Dirt Road, Construction City, CC 12345",
    plan: "pro",
    logoUrl: null,
    baseCurrency: "USD",
    invoicePrefix: "INV",
    nextInvoiceNumber: 1001,
    paymentTerms: 30,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }).returning();

  console.log(`✅ Created team: ${team.id}`);

  // Add user to team
  console.log("Adding user to team...");
  await db.insert(usersOnTeam).values({
    userId: userId,
    teamId: team.id,
    role: "owner",
    createdAt: new Date().toISOString(),
  });

  console.log("✅ Added user as team owner");
  return team.id;
}

// Run the seed
seedAdmin().catch(console.error);