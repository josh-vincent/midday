import { config as loadEnv } from "dotenv";
import path from "path";
import { Pool } from "pg";

loadEnv({ path: path.resolve(process.cwd(), ".env.local") });

const pool = new Pool({
  connectionString: process.env.DATABASE_SESSION_POOLER ||
    "postgresql://postgres.ulncfblvuijlgniydjju:MikeTheDogSupabase!@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres"
});

async function fixOAuthTable() {
  const client = await pool.connect();
  try {
    console.log("🔄 Fixing OAuth connections table...\n");

    // Step 1: Drop the wrong oauth_connections table (from oauth-schema.ts)
    console.log("1. Dropping incorrect oauth_connections table...");
    await client.query(`DROP TABLE IF EXISTS oauth_connections CASCADE;`);

    // Step 2: Rename accounting_connections to oauth_connections
    console.log("2. Renaming accounting_connections to oauth_connections...");
    await client.query(`ALTER TABLE accounting_connections RENAME TO oauth_connections;`);

    // Step 3: Add email_address column
    console.log("3. Adding email_address column...");
    await client.query(`ALTER TABLE oauth_connections ADD COLUMN IF NOT EXISTS email_address varchar(255);`);

    // Step 4: Check if oauth_provider enum has all values
    console.log("4. Checking oauth_provider enum...");
    const enumValues = await client.query(`
      SELECT e.enumlabel as value
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typname = 'oauth_provider'
      ORDER BY e.enumsortorder;
    `);
    console.log("   Current enum values:", enumValues.rows.map(r => r.value));

    // Add missing enum values if needed
    const currentValues = enumValues.rows.map(r => r.value);
    const requiredValues = ['gmail', 'outlook', 'quickbooks', 'xero', 'sage', 'wave', 'freshbooks'];

    for (const value of requiredValues) {
      if (!currentValues.includes(value)) {
        console.log(`   Adding '${value}' to oauth_provider enum...`);
        await client.query(`ALTER TYPE oauth_provider ADD VALUE IF NOT EXISTS '${value}';`);
      }
    }

    // Step 5: Update indexes (drop old, create new)
    console.log("5. Updating indexes...");
    await client.query(`DROP INDEX IF EXISTS accounting_connections_team_idx;`);
    await client.query(`DROP INDEX IF EXISTS accounting_connections_user_idx;`);
    await client.query(`DROP INDEX IF EXISTS accounting_connections_provider_idx;`);
    await client.query(`DROP INDEX IF EXISTS accounting_connections_expires_idx;`);

    await client.query(`CREATE INDEX IF NOT EXISTS oauth_connections_team_idx ON oauth_connections USING btree (team_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS oauth_connections_user_idx ON oauth_connections USING btree (user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS oauth_connections_provider_idx ON oauth_connections USING btree (provider);`);
    await client.query(`CREATE INDEX IF NOT EXISTS oauth_connections_expires_idx ON oauth_connections USING btree (expires_at);`);

    // Step 6: Update constraints
    console.log("6. Updating constraints...");
    await client.query(`ALTER TABLE oauth_connections DROP CONSTRAINT IF EXISTS accounting_connections_team_provider;`);
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE oauth_connections ADD CONSTRAINT oauth_connections_team_provider UNIQUE (team_id, provider);
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    // Step 7: Update foreign keys in synced_accounting_entities
    console.log("7. Updating foreign keys...");
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE synced_accounting_entities
        DROP CONSTRAINT IF EXISTS synced_accounting_entities_connection_id_accounting_connections_id_fk;
      EXCEPTION
        WHEN undefined_object THEN NULL;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        ALTER TABLE synced_accounting_entities
        ADD CONSTRAINT synced_accounting_entities_connection_id_oauth_connections_id_fk
        FOREIGN KEY (connection_id) REFERENCES oauth_connections(id) ON DELETE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    console.log("\n✅ OAuth table migration completed successfully!");

  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixOAuthTable();
