import { config as loadEnv } from "dotenv";
import path from "path";
import { Pool } from "pg";
import fs from "fs";

loadEnv({ path: path.resolve(process.cwd(), ".env.local") });

const pool = new Pool({
  connectionString: process.env.DATABASE_SESSION_POOLER ||
    "postgresql://postgres.ulncfblvuijlgniydjju:MikeTheDogSupabase!@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres"
});

async function runOAuthMigration() {
  const client = await pool.connect();
  try {
    console.log("🔄 Running OAuth connections migration...");

    // Read the migration file
    const migrationPath = path.join(__dirname, "migrations", "0014_unified_oauth_connections.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

    // Split by statement breakpoint and execute each statement
    const statements = migrationSQL
      .split("--> statement-breakpoint")
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 60)}...`);
      await client.query(statement);
    }

    console.log("✅ OAuth migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runOAuthMigration();
