-- Create accounting_connections table for OAuth tokens
CREATE TABLE IF NOT EXISTS accounting_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  user_id UUID NOT NULL,
  org_id UUID,
  provider TEXT NOT NULL,
  credentials JSONB NOT NULL,
  expires_at TIMESTAMPTZ,
  realm_id TEXT, -- QuickBooks company ID
  tenant_id TEXT, -- Xero tenant ID
  environment TEXT DEFAULT 'production',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one connection per team per provider
  CONSTRAINT unique_team_provider UNIQUE (team_id, provider)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_accounting_connections_team_id ON accounting_connections(team_id);
CREATE INDEX IF NOT EXISTS idx_accounting_connections_user_id ON accounting_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_accounting_connections_org_id ON accounting_connections(org_id) WHERE org_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_accounting_connections_provider ON accounting_connections(provider);
CREATE INDEX IF NOT EXISTS idx_accounting_connections_expires_at ON accounting_connections(expires_at) WHERE expires_at IS NOT NULL;

-- RLS policies - Allow authenticated users to manage their connections
ALTER TABLE accounting_connections ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view connections where they are the user_id
CREATE POLICY "Users can view their own connections"
  ON accounting_connections
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow authenticated users to insert their own connections
CREATE POLICY "Users can create their own connections"
  ON accounting_connections
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update their own connections
CREATE POLICY "Users can update their own connections"
  ON accounting_connections
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow authenticated users to delete their own connections
CREATE POLICY "Users can delete their own connections"
  ON accounting_connections
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_accounting_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function
CREATE TRIGGER accounting_connections_updated_at
  BEFORE UPDATE ON accounting_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_accounting_connections_updated_at();
