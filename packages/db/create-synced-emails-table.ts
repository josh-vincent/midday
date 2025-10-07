import { Client } from "pg";
import * as dotenv from "dotenv";

dotenv.config({ path: "../../apps/pivot-dashboard/.env.local" });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

async function createSyncedEmailsTable() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log("Connected to database");

    // Create synced_emails table
    await client.query(`
      CREATE TABLE IF NOT EXISTS synced_emails (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        connection_id uuid NOT NULL REFERENCES oauth_connections(id) ON DELETE CASCADE,
        message_id varchar(255) NOT NULL,
        thread_id varchar(255),
        subject text,
        from_email varchar(255),
        to_emails jsonb DEFAULT '[]'::jsonb NOT NULL,
        received_at timestamp,
        has_attachments boolean DEFAULT false NOT NULL,
        body_preview text,
        labels jsonb DEFAULT '[]'::jsonb NOT NULL,
        folder varchar(100),
        is_read boolean DEFAULT false NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `);

    console.log("✅ Created synced_emails table");

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS synced_emails_connection_idx ON synced_emails(connection_id);
      CREATE INDEX IF NOT EXISTS synced_emails_message_idx ON synced_emails(message_id);
      CREATE INDEX IF NOT EXISTS synced_emails_received_idx ON synced_emails(received_at);
      CREATE INDEX IF NOT EXISTS synced_emails_has_attachments_idx ON synced_emails(has_attachments);
    `);

    console.log("✅ Created indexes");

    // Create unique constraint
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'synced_emails_connection_message'
        ) THEN
          ALTER TABLE synced_emails
          ADD CONSTRAINT synced_emails_connection_message
          UNIQUE (connection_id, message_id);
        END IF;
      END $$;
    `);

    console.log("✅ Created unique constraint");

    // Reload PostgREST schema cache
    await client.query(`NOTIFY pgrst, 'reload schema'`);
    console.log("✅ Reloaded PostgREST schema cache");

    console.log("\n✅ All done! The synced_emails table is ready.");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createSyncedEmailsTable();
