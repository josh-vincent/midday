import { config as loadEnv } from "dotenv";
import path from "path";
import { Pool } from "pg";

loadEnv({ path: path.resolve(process.cwd(), ".env.local") });

const pool = new Pool({
  connectionString: process.env.DATABASE_SESSION_POOLER || 
    "postgresql://postgres.ulncfblvuijlgniydjju:MikeTheDogSupabase!@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres"
});

async function runMigration() {
  const client = await pool.connect();
  try {
    // Create enum if not exists
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE activity_status AS ENUM('unread', 'read', 'archived');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    // Add columns if they don't exist
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE activities ADD COLUMN status activity_status DEFAULT 'unread' NOT NULL;
      EXCEPTION
        WHEN duplicate_column THEN null;
      END $$;
    `);
    
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE activities ADD COLUMN priority integer DEFAULT 5 NOT NULL;
      EXCEPTION
        WHEN duplicate_column THEN null;
      END $$;
    `);
    
    // Create indexes
    await client.query(`CREATE INDEX IF NOT EXISTS activities_status_priority_idx ON activities USING btree (status, priority);`);
    await client.query(`CREATE INDEX IF NOT EXISTS activities_user_status_idx ON activities USING btree (user_id, status);`);
    
    console.log("✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
