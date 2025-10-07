import { config as loadEnv } from "dotenv";
import path from "path";
import { Pool } from "pg";

loadEnv({ path: path.resolve(process.cwd(), ".env.local") });

const pool = new Pool({
  connectionString: process.env.DATABASE_SESSION_POOLER ||
    "postgresql://postgres.ulncfblvuijlgniydjju:MikeTheDogSupabase!@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres"
});

async function createOAuthTable() {
  const client = await pool.connect();
  try {
    console.log("🔄 Creating oauth_connections table...\n");

    // Create oauth_connections table with all required fields
    console.log("1. Creating oauth_connections table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS oauth_connections (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider oauth_provider NOT NULL,
        -- Email-specific fields
        email_address varchar(255),
        -- Accounting-specific fields
        company_name varchar(255),
        realm_id varchar(255),
        tenant_id varchar(255),
        webhook_id varchar(255),
        webhook_verifier varchar(255),
        environment varchar(50) DEFAULT 'production',
        metadata jsonb DEFAULT '{}',
        -- Common OAuth fields
        credentials jsonb NOT NULL,
        expires_at timestamp,
        sync_enabled boolean DEFAULT false NOT NULL,
        last_sync_at timestamp,
        sync_token varchar(255),
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );
    `);

    // Create indexes
    console.log("2. Creating indexes...");
    await client.query(`CREATE INDEX IF NOT EXISTS oauth_connections_team_idx ON oauth_connections USING btree (team_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS oauth_connections_user_idx ON oauth_connections USING btree (user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS oauth_connections_provider_idx ON oauth_connections USING btree (provider);`);
    await client.query(`CREATE INDEX IF NOT EXISTS oauth_connections_expires_idx ON oauth_connections USING btree (expires_at);`);

    // Create unique constraint
    console.log("3. Creating unique constraint...");
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE oauth_connections ADD CONSTRAINT oauth_connections_team_provider UNIQUE (team_id, provider);
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    console.log("\n✅ oauth_connections table created successfully!");

  } catch (error) {
    console.error("\n❌ Creation failed:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createOAuthTable();
