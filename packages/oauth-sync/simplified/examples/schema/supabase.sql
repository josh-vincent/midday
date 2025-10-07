-- OAuth Connections Table for Supabase
-- Supports user-level, team-level, and organization-level connections

-- ============================================================================
-- MAIN CONNECTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS oauth_connections (
  -- Identity
  id TEXT PRIMARY KEY,

  -- Hierarchy (at least one of these is required)
  user_id TEXT NOT NULL,           -- REQUIRED: Who created the connection
  team_id TEXT,                     -- OPTIONAL: Team-level connection
  org_id TEXT,                      -- OPTIONAL: Organization-level connection

  -- Provider details
  provider TEXT NOT NULL CHECK (provider IN ('quickbooks', 'xero', 'gmail', 'outlook')),

  -- OAuth tokens (JSONB for flexibility)
  credentials JSONB NOT NULL,       -- { accessToken, refreshToken, expiresIn, connectedAt, scope, tokenType }

  -- Provider-specific IDs
  realm_id TEXT,                    -- QuickBooks Company ID
  tenant_id TEXT,                   -- Xero Tenant ID

  -- Connection metadata
  metadata JSONB DEFAULT '{}'::JSONB,  -- Custom metadata (createdBy, purpose, etc.)
  expires_at TIMESTAMPTZ,           -- Token expiration timestamp

  -- Status flags
  is_primary BOOLEAN DEFAULT false, -- Primary connection for this org/team/provider
  is_active BOOLEAN DEFAULT true,   -- Soft delete flag
  last_used_at TIMESTAMPTZ,         -- Track usage

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- User-level queries
CREATE INDEX idx_oauth_connections_user_id
ON oauth_connections(user_id);

-- Team-level queries
CREATE INDEX idx_oauth_connections_team_id
ON oauth_connections(team_id)
WHERE team_id IS NOT NULL;

-- Organization-level queries
CREATE INDEX idx_oauth_connections_org_id
ON oauth_connections(org_id)
WHERE org_id IS NOT NULL;

-- Provider lookups
CREATE INDEX idx_oauth_connections_provider
ON oauth_connections(provider);

-- Composite indexes for common queries
CREATE INDEX idx_oauth_connections_org_provider
ON oauth_connections(org_id, provider)
WHERE org_id IS NOT NULL AND is_active = true;

CREATE INDEX idx_oauth_connections_team_provider
ON oauth_connections(team_id, provider)
WHERE team_id IS NOT NULL AND is_active = true;

-- Expiring connections (for background refresh jobs)
CREATE INDEX idx_oauth_connections_expiring
ON oauth_connections(expires_at)
WHERE is_active = true AND expires_at IS NOT NULL;

-- Primary connections
CREATE INDEX idx_oauth_connections_primary
ON oauth_connections(org_id, provider, is_primary)
WHERE is_primary = true;

-- QuickBooks realm lookup
CREATE INDEX idx_oauth_connections_realm_id
ON oauth_connections(realm_id)
WHERE realm_id IS NOT NULL;

-- Xero tenant lookup
CREATE INDEX idx_oauth_connections_tenant_id
ON oauth_connections(tenant_id)
WHERE tenant_id IS NOT NULL;

-- ============================================================================
-- UNIQUE CONSTRAINTS
-- ============================================================================

-- Only one primary connection per org/provider
CREATE UNIQUE INDEX idx_one_primary_per_org_provider
ON oauth_connections(org_id, provider)
WHERE is_primary = true AND org_id IS NOT NULL;

-- Only one primary connection per team/provider
CREATE UNIQUE INDEX idx_one_primary_per_team_provider
ON oauth_connections(team_id, provider)
WHERE is_primary = true AND team_id IS NOT NULL;

-- ============================================================================
-- DISTRIBUTED LOCKS TABLE (for token refresh)
-- ============================================================================

CREATE TABLE IF NOT EXISTS oauth_locks (
  lock_key TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for cleanup of expired locks
CREATE INDEX idx_oauth_locks_expires_at
ON oauth_locks(expires_at);

-- ============================================================================
-- AUDIT LOG TABLE (for compliance)
-- ============================================================================

CREATE TABLE IF NOT EXISTS oauth_audit_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,

  -- Context
  org_id TEXT,
  team_id TEXT,
  user_id TEXT NOT NULL,

  -- Action details
  action TEXT NOT NULL CHECK (action IN ('connect', 'disconnect', 'refresh', 'transfer', 'view', 'sync')),
  connection_id TEXT,
  provider TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB,
  ip_address TEXT,
  user_agent TEXT,

  -- Timestamp
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for audit queries
CREATE INDEX idx_oauth_audit_logs_org_id
ON oauth_audit_logs(org_id)
WHERE org_id IS NOT NULL;

CREATE INDEX idx_oauth_audit_logs_user_id
ON oauth_audit_logs(user_id);

CREATE INDEX idx_oauth_audit_logs_timestamp
ON oauth_audit_logs(timestamp DESC);

CREATE INDEX idx_oauth_audit_logs_action
ON oauth_audit_logs(action);

-- ============================================================================
-- OAUTH ADMINS TABLE (for admin delegation)
-- ============================================================================

CREATE TABLE IF NOT EXISTS oauth_admins (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,

  user_id TEXT NOT NULL,
  org_id TEXT NOT NULL,

  -- Which providers this admin can manage
  providers TEXT[] NOT NULL,

  -- Delegation details
  delegated_by TEXT NOT NULL,
  delegated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_oauth_admins_user_org
ON oauth_admins(user_id, org_id);

CREATE INDEX idx_oauth_admins_org_id
ON oauth_admins(org_id);

-- ============================================================================
-- USAGE METRICS TABLE (for billing)
-- ============================================================================

CREATE TABLE IF NOT EXISTS oauth_usage_metrics (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,

  org_id TEXT,
  team_id TEXT,
  provider TEXT NOT NULL,
  connection_id TEXT NOT NULL,

  operation TEXT NOT NULL CHECK (operation IN ('api_call', 'sync', 'data_transfer')),
  bytes BIGINT DEFAULT 0,

  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for usage queries
CREATE INDEX idx_oauth_usage_metrics_org_timestamp
ON oauth_usage_metrics(org_id, timestamp DESC)
WHERE org_id IS NOT NULL;

CREATE INDEX idx_oauth_usage_metrics_connection
ON oauth_usage_metrics(connection_id);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_oauth_connection_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER oauth_connections_updated_at
BEFORE UPDATE ON oauth_connections
FOR EACH ROW
EXECUTE FUNCTION update_oauth_connection_updated_at();

-- Clean up expired locks (call this periodically via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_locks()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM oauth_locks
  WHERE expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - Optional but recommended
-- ============================================================================

-- Enable RLS
ALTER TABLE oauth_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_usage_metrics ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own connections
CREATE POLICY oauth_connections_select_own
ON oauth_connections FOR SELECT
USING (user_id = auth.uid()::TEXT);

-- Policy: Users can view team connections if they're team members
CREATE POLICY oauth_connections_select_team
ON oauth_connections FOR SELECT
USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()::TEXT
  )
);

-- Policy: Users can view org connections if they're org members
CREATE POLICY oauth_connections_select_org
ON oauth_connections FOR SELECT
USING (
  org_id IN (
    SELECT org_id FROM organization_members
    WHERE user_id = auth.uid()::TEXT
  )
);

-- Policy: Only OAuth admins can insert/update/delete connections
CREATE POLICY oauth_connections_modify
ON oauth_connections FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM oauth_admins
    WHERE user_id = auth.uid()::TEXT
    AND (oauth_admins.org_id = oauth_connections.org_id
         OR oauth_admins.org_id IN (
           SELECT org_id FROM teams
           WHERE id = oauth_connections.team_id
         ))
    AND (oauth_admins.expires_at IS NULL OR oauth_admins.expires_at > NOW())
  )
);

-- ============================================================================
-- HELPER VIEWS
-- ============================================================================

-- View: Active connections with owner details
CREATE OR REPLACE VIEW oauth_connections_with_owner AS
SELECT
  c.*,
  u.email as owner_email,
  u.name as owner_name,
  CASE
    WHEN c.org_id IS NOT NULL THEN 'organization'
    WHEN c.team_id IS NOT NULL THEN 'team'
    ELSE 'user'
  END as connection_level
FROM oauth_connections c
LEFT JOIN users u ON c.user_id = u.id
WHERE c.is_active = true;

-- View: Expiring connections (next 7 days)
CREATE OR REPLACE VIEW oauth_connections_expiring_soon AS
SELECT *
FROM oauth_connections
WHERE is_active = true
  AND expires_at IS NOT NULL
  AND expires_at <= NOW() + INTERVAL '7 days'
ORDER BY expires_at ASC;

-- ============================================================================
-- SAMPLE QUERIES
-- ============================================================================

-- Get all connections for an organization
-- SELECT * FROM oauth_connections WHERE org_id = 'org_123' AND is_active = true;

-- Get primary QuickBooks connection for an org
-- SELECT * FROM oauth_connections
-- WHERE org_id = 'org_123' AND provider = 'quickbooks' AND is_primary = true;

-- Get all connections for a user (including org and team)
-- SELECT * FROM oauth_connections
-- WHERE user_id = 'user_123'
--    OR team_id IN (SELECT team_id FROM team_members WHERE user_id = 'user_123')
--    OR org_id IN (SELECT org_id FROM organization_members WHERE user_id = 'user_123');

-- Get connections needing refresh
-- SELECT * FROM oauth_connections
-- WHERE is_active = true
--   AND expires_at <= NOW() + INTERVAL '1 hour';

-- Get usage metrics for current month
-- SELECT
--   org_id,
--   provider,
--   operation,
--   COUNT(*) as count,
--   SUM(bytes) as total_bytes
-- FROM oauth_usage_metrics
-- WHERE timestamp >= date_trunc('month', NOW())
-- GROUP BY org_id, provider, operation;
