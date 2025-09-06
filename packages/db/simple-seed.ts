import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";
import * as dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), "../../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const databaseUrl = process.env.DATABASE_URL!;

async function seedAdmin() {
  console.log("🌱 Starting simple admin seed...\n");

  // Initialize Supabase Admin client
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Initialize database connection
  const sql = postgres(databaseUrl);

  try {
    // Get or create auth user
    const {
      data: { users: existingUsers },
    } = await supabase.auth.admin.listUsers();
    let authUser = existingUsers?.find((u) => u.email === "admin@tocld.com");

    if (!authUser) {
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
      const { error } = await supabase.auth.admin.updateUserById(authUser.id, {
        password: "Admin123",
      });

      if (error) {
        console.error("Warning: Could not update password:", error.message);
      } else {
        console.log("✅ Password set to Admin123");
      }
    }

    // Use raw SQL to check and insert user
    const existingUser = await sql`
      SELECT id FROM users WHERE id = ${authUser.id}
    `;

    if (existingUser.length === 0) {
      console.log("Creating user in database with raw SQL...");
      await sql`
        INSERT INTO users (id, email, full_name, locale, week_starts, timezone, created_at, updated_at)
        VALUES (
          ${authUser.id},
          'admin@tocld.com',
          'Admin User',
          'en',
          1,
          'UTC',
          ${new Date().toISOString()},
          ${new Date().toISOString()}
        )
      `;
      console.log("✅ Created user in database");
    } else {
      console.log("✅ User already exists in database");
    }

    // Check and create team if needed
    const existingMembership = await sql`
      SELECT team_id FROM users_on_team WHERE user_id = ${authUser.id}
    `;

    if (existingMembership.length === 0) {
      console.log("Creating team...");
      const [team] = await sql`
        INSERT INTO teams (
          name, email, phone, website, address, 
          base_currency, invoice_prefix, next_invoice_number, payment_terms,
          created_at, updated_at
        )
        VALUES (
          'TOCLD Dirt Services',
          'admin@tocld.com',
          '555-0123',
          'https://tocld.com',
          '123 Dirt Road, Construction City, CC 12345',
          'USD',
          'INV',
          1001,
          30,
          ${new Date().toISOString()},
          ${new Date().toISOString()}
        )
        RETURNING id
      `;

      console.log(`✅ Created team: ${team.id}`);

      // Add user to team
      console.log("Adding user to team...");
      await sql`
        INSERT INTO users_on_team (user_id, team_id, role, created_at)
        VALUES (
          ${authUser.id},
          ${team.id},
          'owner',
          ${new Date().toISOString()}
        )
      `;

      console.log("✅ Added user as team owner");
    } else {
      console.log("✅ User already belongs to a team");
    }

    console.log("\n" + "=".repeat(50));
    console.log("✅ Admin user setup complete!");
    console.log("=".repeat(50));
    console.log("📧 Email: admin@tocld.com");
    console.log("🔑 Password: Admin123");
    console.log("=".repeat(50));
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Run the seed
seedAdmin().catch(console.error);
