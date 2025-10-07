import { config as loadEnv } from "dotenv";
import path from "path";
import { Pool } from "pg";

loadEnv({ path: path.resolve(process.cwd(), ".env.local") });

const pool = new Pool({
  connectionString: process.env.DATABASE_SESSION_POOLER || 
    "postgresql://postgres.ulncfblvuijlgniydjju:MikeTheDogSupabase!@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres"
});

async function verify() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'activities' 
      AND column_name IN ('status', 'priority')
      ORDER BY column_name;
    `);
    
    console.log("✅ Activities table columns:");
    console.table(result.rows);
  } catch (error) {
    console.error("❌ Verification failed:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

verify();
