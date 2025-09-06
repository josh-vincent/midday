-- Update customers table to match new schema
ALTER TABLE customers 
  ADD COLUMN IF NOT EXISTS billing_email TEXT,
  ADD COLUMN IF NOT EXISTS address_line_1 TEXT,
  ADD COLUMN IF NOT EXISTS address_line_2 TEXT,
  ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT 'AU',
  ADD COLUMN IF NOT EXISTS abn VARCHAR(50),
  ADD COLUMN IF NOT EXISTS token TEXT DEFAULT '' NOT NULL,
  ADD COLUMN IF NOT EXISTS contact TEXT,
  ADD COLUMN IF NOT EXISTS fts tsvector 
    GENERATED ALWAYS AS (
      to_tsvector(
        'english'::regconfig,
        COALESCE(name, ''::text) || ' ' ||
        COALESCE(contact, ''::text) || ' ' ||
        COALESCE(phone, ''::text) || ' ' ||
        COALESCE(email, ''::text) || ' ' ||
        COALESCE(billing_email, ''::text) || ' ' ||
        COALESCE(abn, ''::text) || ' ' ||
        COALESCE(address_line_1, ''::text) || ' ' ||
        COALESCE(address_line_2, ''::text) || ' ' ||
        COALESCE(city, ''::text) || ' ' ||
        COALESCE(state, ''::text) || ' ' ||
        COALESCE(postal_code, ''::text) || ' ' ||
        COALESCE(country, ''::text)
      )
    ) STORED;

-- Remove old columns if they exist
ALTER TABLE customers DROP COLUMN IF EXISTS contact_name;
ALTER TABLE customers DROP COLUMN IF EXISTS address;

-- Add new tables
CREATE TABLE IF NOT EXISTS apps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  team_id uuid DEFAULT gen_random_uuid(),
  config jsonb,
  created_at timestamp with time zone DEFAULT now(),
  app_id text NOT NULL,
  created_by uuid DEFAULT gen_random_uuid(),
  settings jsonb,
  CONSTRAINT integrations_team_id_fkey FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  CONSTRAINT apps_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT unique_app_id_team_id UNIQUE (team_id, app_id)
);

CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  link_id text,
  team_id uuid,
  short_link text,
  "from" timestamp with time zone,
  "to" timestamp with time zone,
  type text CHECK (type IN ('profit', 'revenue', 'burn_rate', 'expense')),
  expire_at timestamp with time zone,
  currency text,
  created_by uuid,
  CONSTRAINT public_reports_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT reports_team_id_fkey FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

-- Add indexes
CREATE INDEX IF NOT EXISTS reports_team_id_idx ON reports(team_id);

-- Update existing customer tokens
UPDATE customers SET token = CONCAT('cust_', REPLACE(gen_random_uuid()::text, '-', '')) WHERE token = '' OR token IS NULL;