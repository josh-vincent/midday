# Database Schema Guide

This guide explains the OAuth connections database schema and what's required vs optional at each organizational level.

## Table of Contents

- [Quick Start](#quick-start)
- [Core Tables](#core-tables)
- [Field Requirements](#field-requirements)
- [Organizational Levels](#organizational-levels)
- [Indexes & Performance](#indexes--performance)
- [Row Level Security](#row-level-security)

## Quick Start

### Apply Schema to Supabase

```bash
# Using Supabase CLI
supabase db push

# Or run directly in Supabase SQL Editor
psql -h db.your-project.supabase.co -U postgres -d postgres -f supabase.sql
```

### Verify Installation

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'oauth%';

-- Should return:
-- oauth_connections
-- oauth_locks
-- oauth_audit_logs
-- oauth_admins
-- oauth_usage_metrics
```

## Core Tables

### 1. `oauth_connections`

The main table storing OAuth provider connections.

#### Required Fields
- `id` - Unique identifier
- `user_id` - Who created the connection (always required)
- `provider` - OAuth provider (quickbooks, xero, gmail, outlook)
- `credentials` - Token data (JSONB)
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

#### Optional Fields
- `team_id` - Team-level connection (optional)
- `org_id` - Organization-level connection (optional)
- `realm_id` - QuickBooks Company ID (provider-specific)
- `tenant_id` - Xero Tenant ID (provider-specific)
- `metadata` - Custom metadata (JSONB)
- `expires_at` - Token expiration
- `is_primary` - Primary connection flag
- `is_active` - Soft delete flag
- `last_used_at` - Last usage timestamp

### 2. `oauth_locks`

Distributed locking for token refresh operations.

#### Fields
- `lock_key` (PK) - Unique lock identifier
- `connection_id` - Connection being locked
- `expires_at` - Lock expiration
- `created_at` - Lock creation time

### 3. `oauth_audit_logs`

Audit trail for compliance and security.

#### Fields
- `id` (PK) - Log entry ID
- `org_id`, `team_id`, `user_id` - Context
- `action` - Action type (connect, disconnect, refresh, etc.)
- `connection_id` - Connection affected
- `provider` - Provider affected
- `metadata` - Additional context (JSONB)
- `ip_address`, `user_agent` - Request details
- `timestamp` - Action timestamp

### 4. `oauth_admins`

OAuth administrator delegation.

#### Fields
- `id` (PK) - Admin record ID
- `user_id` - Admin user
- `org_id` - Organization
- `providers` - Array of providers admin can manage
- `delegated_by` - Who assigned this admin
- `delegated_at` - When assigned
- `expires_at` - Admin role expiration (optional)

### 5. `oauth_usage_metrics`

Usage tracking for billing and monitoring.

#### Fields
- `id` (PK) - Metric ID
- `org_id`, `team_id` - Context (optional)
- `provider` - Provider used
- `connection_id` - Connection used
- `operation` - Type of operation (api_call, sync, data_transfer)
- `bytes` - Data transferred (for data_transfer operations)
- `timestamp` - Operation timestamp

## Field Requirements

### User-Level Connections

**Minimum Required:**
```sql
INSERT INTO oauth_connections (
  id,
  user_id,          -- REQUIRED
  provider,         -- REQUIRED
  credentials,      -- REQUIRED
  created_at,
  updated_at
) VALUES (
  'conn_123',
  'user_456',
  'xero',
  '{"accessToken": "...", "refreshToken": "...", "expiresIn": 3600, "connectedAt": "2025-01-15T10:00:00Z"}',
  NOW(),
  NOW()
);
```

**Recommended:**
```sql
INSERT INTO oauth_connections (
  id,
  user_id,
  provider,
  credentials,
  expires_at,       -- RECOMMENDED: For auto-refresh
  tenant_id,        -- RECOMMENDED: For Xero (provider-specific)
  metadata,         -- RECOMMENDED: Store who created it
  is_active,
  created_at,
  updated_at
) VALUES (
  'conn_123',
  'user_456',
  'xero',
  '{"accessToken": "...", "refreshToken": "...", "expiresIn": 3600, "connectedAt": "2025-01-15T10:00:00Z"}',
  NOW() + INTERVAL '1 hour',
  'tenant_789',
  '{"createdBy": {"userId": "user_456", "email": "user@example.com"}}',
  true,
  NOW(),
  NOW()
);
```

### Team-Level Connections

**Minimum Required:**
```sql
INSERT INTO oauth_connections (
  id,
  user_id,          -- REQUIRED: Who created it
  team_id,          -- REQUIRED: Team context
  provider,
  credentials,
  created_at,
  updated_at
) VALUES (
  'conn_789',
  'user_456',       -- Team member who connected
  'team_123',       -- Team ID
  'quickbooks',
  '{"accessToken": "...", "refreshToken": "...", "expiresIn": 3600, "connectedAt": "2025-01-15T10:00:00Z"}',
  NOW(),
  NOW()
);
```

**Recommended:**
```sql
INSERT INTO oauth_connections (
  id,
  user_id,
  team_id,
  provider,
  credentials,
  expires_at,
  realm_id,         -- RECOMMENDED: For QuickBooks
  metadata,         -- RECOMMENDED: Track who created it and purpose
  is_primary,       -- RECOMMENDED: Mark as primary team connection
  is_active,
  created_at,
  updated_at
) VALUES (
  'conn_789',
  'user_456',
  'team_123',
  'quickbooks',
  '{"accessToken": "...", "refreshToken": "...", "expiresIn": 3600, "connectedAt": "2025-01-15T10:00:00Z"}',
  NOW() + INTERVAL '1 hour',
  'realm_456',
  '{"createdBy": {"userId": "user_456", "email": "admin@team.com", "role": "admin"}, "purpose": "primary"}',
  true,             -- Primary connection for this team
  true,
  NOW(),
  NOW()
);
```

### Organization-Level Connections

**Minimum Required:**
```sql
INSERT INTO oauth_connections (
  id,
  user_id,          -- REQUIRED: Who created it
  org_id,           -- REQUIRED: Organization context
  provider,
  credentials,
  created_at,
  updated_at
) VALUES (
  'conn_101',
  'user_789',       -- Admin who connected
  'org_456',        -- Organization ID
  'xero',
  '{"accessToken": "...", "refreshToken": "...", "expiresIn": 1800, "connectedAt": "2025-01-15T10:00:00Z"}',
  NOW(),
  NOW()
);
```

**Recommended:**
```sql
INSERT INTO oauth_connections (
  id,
  user_id,
  org_id,
  team_id,          -- OPTIONAL: Can also specify team within org
  provider,
  credentials,
  expires_at,
  tenant_id,
  metadata,         -- RECOMMENDED: Store admin details and purpose
  is_primary,       -- RECOMMENDED: Mark as primary org connection
  is_active,
  last_used_at,
  created_at,
  updated_at
) VALUES (
  'conn_101',
  'user_789',
  'org_456',
  NULL,             -- NULL = org-wide, or specify team_id
  'xero',
  '{"accessToken": "...", "refreshToken": "...", "expiresIn": 1800, "connectedAt": "2025-01-15T10:00:00Z"}',
  NOW() + INTERVAL '30 minutes',
  'tenant_012',
  '{"createdBy": {"userId": "user_789", "email": "cto@company.com", "role": "owner"}, "purpose": "primary", "approvedBy": "board"}',
  true,             -- Primary connection for this org
  true,
  NOW(),
  NOW(),
  NOW()
);
```

## Organizational Levels

### Level 1: User-Only (Personal)

```typescript
// User connects for themselves
const connection = {
  id: 'conn_user_123',
  userId: 'user_123',      // ✓ Required
  teamId: null,            // ✗ Not needed
  orgId: null,             // ✗ Not needed
  provider: 'gmail',
  credentials: {...}
}

// Only this user can access this connection
```

### Level 2: Team-Shared

```typescript
// Team member connects for entire team
const connection = {
  id: 'conn_team_456',
  userId: 'user_123',      // ✓ Who created it
  teamId: 'team_456',      // ✓ Team context
  orgId: null,             // ✗ Not org-wide
  provider: 'xero',
  credentials: {...}
}

// All team members can use this connection
```

### Level 3: Organization-Wide

```typescript
// Admin connects for entire organization
const connection = {
  id: 'conn_org_789',
  userId: 'user_123',      // ✓ Who created it (the admin)
  teamId: null,            // ✗ Not team-specific (or can specify)
  orgId: 'org_789',        // ✓ Organization context
  provider: 'quickbooks',
  credentials: {...}
}

// All org members can use this connection
```

### Level 4: Hybrid (Org + Team)

```typescript
// Admin connects for specific team within org
const connection = {
  id: 'conn_hybrid_101',
  userId: 'user_123',      // ✓ Who created it
  teamId: 'team_456',      // ✓ Team within org
  orgId: 'org_789',        // ✓ Organization context
  provider: 'outlook',
  credentials: {...}
}

// This team within the org can use this connection
```

## Indexes & Performance

### Optimized for Common Queries

The schema includes indexes for:

1. **User Queries** - `idx_oauth_connections_user_id`
   - Find all connections for a user

2. **Team Queries** - `idx_oauth_connections_team_id`
   - Find all connections for a team

3. **Org Queries** - `idx_oauth_connections_org_id`
   - Find all connections for an organization

4. **Provider Queries** - `idx_oauth_connections_org_provider`, `idx_oauth_connections_team_provider`
   - Find specific provider connection for org/team

5. **Expiring Connections** - `idx_oauth_connections_expiring`
   - Background jobs to refresh expiring tokens

6. **Primary Connections** - `idx_one_primary_per_org_provider`
   - Enforce only one primary connection per org/provider

### Query Examples

```sql
-- Get all org connections (efficient with index)
SELECT * FROM oauth_connections
WHERE org_id = 'org_123' AND is_active = true;

-- Get primary QuickBooks connection for org (uses composite index)
SELECT * FROM oauth_connections
WHERE org_id = 'org_123' AND provider = 'quickbooks' AND is_primary = true;

-- Get expiring connections for refresh job (uses expiring index)
SELECT * FROM oauth_connections
WHERE is_active = true
  AND expires_at <= NOW() + INTERVAL '1 hour'
ORDER BY expires_at ASC;
```

## Row Level Security

The schema includes RLS policies for multi-tenant security:

### Policy 1: Own Connections
Users can always view their own connections:
```sql
user_id = auth.uid()
```

### Policy 2: Team Connections
Users can view team connections if they're team members:
```sql
team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
```

### Policy 3: Org Connections
Users can view org connections if they're org members:
```sql
org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid())
```

### Policy 4: Admin Modifications
Only OAuth admins can modify connections:
```sql
EXISTS (SELECT 1 FROM oauth_admins WHERE user_id = auth.uid() AND ...)
```

## Migration from Existing Schema

If you already have an `oauth_connections` table:

### Option 1: Add New Columns

```sql
-- Add org_id column
ALTER TABLE oauth_connections
ADD COLUMN org_id TEXT;

-- Add index
CREATE INDEX idx_oauth_connections_org_id
ON oauth_connections(org_id)
WHERE org_id IS NOT NULL;

-- Add is_primary flag
ALTER TABLE oauth_connections
ADD COLUMN is_primary BOOLEAN DEFAULT false;

-- Add unique constraint for primary connections
CREATE UNIQUE INDEX idx_one_primary_per_org_provider
ON oauth_connections(org_id, provider)
WHERE is_primary = true AND org_id IS NOT NULL;
```

### Option 2: Create New Table & Migrate

```sql
-- Rename old table
ALTER TABLE oauth_connections RENAME TO oauth_connections_old;

-- Create new schema
\i supabase.sql

-- Migrate data
INSERT INTO oauth_connections (
  id, user_id, team_id, provider, credentials,
  expires_at, realm_id, tenant_id, metadata,
  created_at, updated_at
)
SELECT
  id, user_id, team_id, provider, credentials,
  expires_at, realm_id, tenant_id,
  COALESCE(metadata, '{}'::JSONB),
  created_at, updated_at
FROM oauth_connections_old;

-- Verify migration
SELECT COUNT(*) FROM oauth_connections;
SELECT COUNT(*) FROM oauth_connections_old;

-- Drop old table (after verification)
-- DROP TABLE oauth_connections_old;
```

## Helper Functions

The schema includes helper functions:

### Clean Expired Locks

```sql
-- Run periodically (e.g., via cron)
SELECT cleanup_expired_oauth_locks();
-- Returns: number of locks deleted
```

### Find Expiring Connections

```sql
-- Use the view
SELECT * FROM oauth_connections_expiring_soon;

-- Or query directly
SELECT * FROM oauth_connections
WHERE is_active = true
  AND expires_at <= NOW() + INTERVAL '7 days'
ORDER BY expires_at ASC;
```

## Monitoring Queries

### Active Connections by Provider

```sql
SELECT
  provider,
  COUNT(*) as total_connections,
  COUNT(*) FILTER (WHERE org_id IS NOT NULL) as org_level,
  COUNT(*) FILTER (WHERE team_id IS NOT NULL AND org_id IS NULL) as team_level,
  COUNT(*) FILTER (WHERE org_id IS NULL AND team_id IS NULL) as user_level
FROM oauth_connections
WHERE is_active = true
GROUP BY provider;
```

### Connections Needing Attention

```sql
SELECT
  c.*,
  CASE
    WHEN c.expires_at <= NOW() THEN 'expired'
    WHEN c.expires_at <= NOW() + INTERVAL '1 day' THEN 'expiring_soon'
    ELSE 'ok'
  END as status
FROM oauth_connections c
WHERE c.is_active = true
  AND c.expires_at IS NOT NULL
ORDER BY c.expires_at ASC;
```

### Usage Statistics

```sql
SELECT
  DATE(timestamp) as date,
  provider,
  operation,
  COUNT(*) as count,
  SUM(bytes)::BIGINT as total_bytes
FROM oauth_usage_metrics
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY DATE(timestamp), provider, operation
ORDER BY date DESC, provider, operation;
```

## See Also

- [Next.js Example](../nextjs/README.md) - Full Next.js implementation
- [Connection Examples](../../CONNECTION_EXAMPLES.md) - Usage examples
- [B2B Patterns](../../B2B_PATTERNS.md) - Enterprise patterns
