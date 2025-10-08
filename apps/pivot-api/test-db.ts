import "./src/trpc/__tests__/test-setup";
import { connectDb } from "@midday/db/client";
import { sql } from "drizzle-orm";

async function testDb() {
  console.log("Testing database connection...");

  try {
    const db = await connectDb();
    console.log("✅ Connected to database");

    // Test simple query
    const result = await db.execute(sql`SELECT 1 as test`);
    console.log("✅ Query executed:", result);

    // Test table exists
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'teams', 'users_on_team', 'customers', 'invoices')
    `);
    console.log("✅ Found tables:", tables);

    process.exit(0);
  } catch (error) {
    console.error("❌ Database error:", error);
    process.exit(1);
  }
}

testDb();
