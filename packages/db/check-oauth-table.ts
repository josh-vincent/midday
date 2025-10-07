import { config as loadEnv } from "dotenv";
import path from "path";
import { Pool } from "pg";

loadEnv({ path: path.resolve(process.cwd(), ".env.local") });

const pool = new Pool({
  connectionString: process.env.DATABASE_SESSION_POOLER ||
    "postgresql://postgres.ulncfblvuijlgniydjju:MikeTheDogSupabase!@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres"
});

async function checkDatabase() {
  const client = await pool.connect();
  try {
    console.log("🔍 Checking database state...\n");

    // Check if oauth_connections table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'oauth_connections'
      );
    `);
    console.log("oauth_connections table exists:", tableCheck.rows[0].exists);

    // Check if accounting_connections table exists
    const accountingCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'accounting_connections'
      );
    `);
    console.log("accounting_connections table exists:", accountingCheck.rows[0].exists);

    // Check enums
    const enumCheck = await client.query(`
      SELECT typname FROM pg_type WHERE typtype = 'e' AND typname LIKE '%provider%';
    `);
    console.log("\nProvider enums:", enumCheck.rows.map(r => r.typname));

    // If oauth_connections exists, check its columns
    if (tableCheck.rows[0].exists) {
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'oauth_connections'
        ORDER BY ordinal_position;
      `);
      console.log("\noauth_connections columns:");
      columns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkDatabase();
