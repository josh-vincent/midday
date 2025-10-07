# Connection Examples

This guide shows how to retrieve OAuth connections using `userId`, `teamId`, and `orgId` for different B2B SaaS scenarios.

## Table of Contents

- [User-Level Connections](#user-level-connections)
- [Team-Level Connections](#team-level-connections)
- [Organization-Level Connections](#organization-level-connections)
- [Hierarchical Fallback Pattern](#hierarchical-fallback-pattern)
- [API Routes](#api-routes)
- [React Hooks](#react-hooks)

## User-Level Connections

Get connections for a specific user. This is the most granular level.

### Server-Side

```typescript
import { auth } from './oauth'

// Get connections for a specific user
const { connections, userId } = await auth({
  userId: 'user_123'
})

console.log(`Found ${connections.length} connections for user ${userId}`)
```

### Client-Side (Method Chaining)

```typescript
import { client } from './oauth'

const connections = await client.connections.list({
  userId: 'user_123'
})
```

## Team-Level Connections

Get connections shared across a team. Useful when one team member connects an OAuth provider for the whole team.

### Server-Side

```typescript
import { auth } from './oauth'

// Get connections for a team
const { connections, teamId } = await auth({
  teamId: 'team_456'
})

console.log(`Found ${connections.length} connections for team ${teamId}`)
```

### Client-Side (Method Chaining)

```typescript
import { client } from './oauth'

const connections = await client.connections.list({
  teamId: 'team_456'
})
```

## Organization-Level Connections

Get connections shared across an entire organization. Perfect for enterprise B2B SaaS where one admin connects OAuth for the whole company.

### Server-Side

```typescript
import { auth } from './oauth'

// Get connections for an organization
const { connections, orgId } = await auth({
  orgId: 'org_789'
})

console.log(`Found ${connections.length} connections for org ${orgId}`)
```

### Client-Side (Method Chaining)

```typescript
import { client } from './oauth'

const connections = await client.connections.list({
  orgId: 'org_789'
})
```

## Hierarchical Fallback Pattern

Check organization first, then team, then user. This pattern ensures you find the highest-level connection available.

### Server-Side

```typescript
import { auth } from './oauth'

async function getConnections(orgId?: string, teamId?: string, userId?: string) {
  // Try org-level first
  if (orgId) {
    const { connections } = await auth({ orgId })
    if (connections.length > 0) {
      console.log('Using org-level connection')
      return connections
    }
  }

  // Fallback to team-level
  if (teamId) {
    const { connections } = await auth({ teamId })
    if (connections.length > 0) {
      console.log('Using team-level connection')
      return connections
    }
  }

  // Fallback to user-level
  if (userId) {
    const { connections } = await auth({ userId })
    if (connections.length > 0) {
      console.log('Using user-level connection')
      return connections
    }
  }

  return []
}

// Usage
const connections = await getConnections('org_789', 'team_456', 'user_123')
```

### Simplified Version

```typescript
import { auth } from './oauth'

// The auth() helper automatically checks orgId > teamId > userId
const { connections } = await auth({
  orgId: 'org_789',
  teamId: 'team_456',
  userId: 'user_123'
})
```

## API Routes

### Next.js App Router

```typescript
// app/api/oauth/[provider]/route.ts
import { handlers } from '@/oauth'

export { handlers as GET, handlers as POST }
```

### Get Connections Endpoint

```typescript
// GET /api/oauth/connections?orgId=org_789
// GET /api/oauth/connections?teamId=team_456
// GET /api/oauth/connections?userId=user_123

const response = await fetch('/api/oauth/connections?orgId=org_789')
const { connections } = await response.json()
```

### Connect with Context

When initiating OAuth connection, pass the context identifiers:

```typescript
import { connect } from './oauth'

// Connect for organization
const authUrl = await connect('xero', {
  orgId: 'org_789',
  redirectUri: '/api/oauth/xero/callback'
})

// Connect for team
const authUrl = await connect('quickbooks', {
  teamId: 'team_456',
  redirectUri: '/api/oauth/quickbooks/callback'
})

// Connect for user
const authUrl = await connect('gmail', {
  userId: 'user_123',
  redirectUri: '/api/oauth/gmail/callback'
})
```

## React Hooks

### Using the `useOAuth` Hook

```typescript
'use client'

import { useOAuth } from './oauth'

function ConnectButton() {
  const { connect, connections, isLoading } = useOAuth()

  const handleConnect = async () => {
    // Connect with organization context
    await connect('xero', {
      orgId: 'org_789',
      redirectUri: '/api/oauth/xero/callback'
    })
  }

  return (
    <div>
      <button onClick={handleConnect}>
        Connect Xero
      </button>

      {isLoading && <p>Loading connections...</p>}

      <ul>
        {connections.map(conn => (
          <li key={conn.id}>
            {conn.provider} - Connected on {new Date(conn.createdAt).toLocaleDateString()}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

## Real-World Scenarios

### Scenario 1: Multi-Tenant SaaS

One admin per organization connects QuickBooks for entire company:

```typescript
// Admin connects QuickBooks
const authUrl = await connect('quickbooks', {
  orgId: currentOrg.id,
  userId: currentUser.id, // Track who connected it
})

// Any team member can use the connection
const { connections } = await auth({ orgId: currentOrg.id })
const qbConnection = connections.find(c => c.provider === 'quickbooks')
```

### Scenario 2: Team Collaboration

Team lead connects Xero for their team:

```typescript
// Team lead connects
const authUrl = await connect('xero', {
  teamId: currentTeam.id,
  userId: currentUser.id,
})

// Team members retrieve
const { connections } = await auth({ teamId: currentTeam.id })
```

### Scenario 3: Personal Workspace

Individual user connects Gmail for personal use:

```typescript
// User connects
const authUrl = await connect('gmail', {
  userId: currentUser.id,
})

// Retrieve personal connections
const { connections } = await auth({ userId: currentUser.id })
```

## Multiple Connections per Team/Org (Edge Case)

In enterprise scenarios, multiple team members might authenticate the same provider for redundancy or different purposes.

### Handling Multiple Connections

```typescript
import { auth } from './oauth'

async function getActiveConnection(orgId: string, provider: 'quickbooks' | 'xero') {
  const { connections } = await auth({ orgId })

  // Filter by provider
  const providerConnections = connections.filter(c => c.provider === provider)

  if (providerConnections.length === 0) {
    throw new Error(`No ${provider} connections found for org`)
  }

  // Strategy 1: Use the most recent connection
  const mostRecent = providerConnections.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0]

  // Strategy 2: Use the one with the furthest expiry
  const leastExpiring = providerConnections.sort((a, b) => {
    if (!a.expiresAt || !b.expiresAt) return 0
    return new Date(b.expiresAt).getTime() - new Date(a.expiresAt).getTime()
  })[0]

  // Strategy 3: Round-robin for load balancing
  const randomIndex = Math.floor(Math.random() * providerConnections.length)
  const randomConnection = providerConnections[randomIndex]

  return mostRecent // Choose your strategy
}
```

### Fallback Logic with Retry

```typescript
async function getConnectionWithFallback(orgId: string, provider: 'quickbooks' | 'xero') {
  const { connections } = await auth({ orgId })
  const providerConnections = connections
    .filter(c => c.provider === provider)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  // Try each connection until one works
  for (const connection of providerConnections) {
    try {
      // Test the connection
      const response = await fetch('https://api.provider.com/test', {
        headers: {
          Authorization: `Bearer ${connection.credentials.accessToken}`
        }
      })

      if (response.ok) {
        console.log(`Using connection from user ${connection.userId}`)
        return connection
      }
    } catch (error) {
      console.warn(`Connection ${connection.id} failed, trying next...`)
      continue
    }
  }

  throw new Error(`All ${provider} connections failed for org ${orgId}`)
}
```

### Keeping All Connections in Sync

The TokenSyncManager automatically refreshes all connections:

```typescript
import { manager } from './oauth'

// This runs automatically if autoRefresh is enabled
// It will refresh ALL connections, including multiple ones for same org/team
await manager.refreshExpiringConnections(60) // 60 minutes threshold

// Manual refresh of all org connections
const { connections } = await auth({ orgId: 'org_789' })
for (const connection of connections) {
  await manager.refreshConnection(connection.id, connection.provider)
}
```

### Tracking Connection Ownership

Store metadata about who created the connection and their role:

```typescript
// When creating connection in callback handler
const connection: ConnectionRecord = {
  id: crypto.randomUUID(),
  teamId: url.searchParams.get('teamId') || 'default',
  userId: url.searchParams.get('userId') || 'default',
  orgId: url.searchParams.get('orgId') || undefined,
  provider,
  credentials: tokens,
  expiresAt: providerInstance.calculateExpiresAt(tokens.expiresIn),
  metadata: {
    createdBy: {
      userId: url.searchParams.get('userId'),
      email: url.searchParams.get('userEmail'), // Pass in auth URL
      role: url.searchParams.get('userRole'),   // e.g., 'admin', 'owner'
    },
    purpose: url.searchParams.get('purpose'),   // e.g., 'primary', 'backup'
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}
```

### Expiry Notification System

```typescript
interface ConnectionAlert {
  connectionId: string
  provider: string
  orgId?: string
  teamId: string
  expiresAt: string
  createdBy: {
    userId: string
    email: string
    role: string
  }
}

async function checkExpiringConnections(thresholdDays: number = 7): Promise<ConnectionAlert[]> {
  const { connections } = await auth({ orgId: 'org_789' })
  const alerts: ConnectionAlert[] = []

  const thresholdDate = new Date()
  thresholdDate.setDate(thresholdDate.getDate() + thresholdDays)

  for (const conn of connections) {
    if (conn.expiresAt && new Date(conn.expiresAt) <= thresholdDate) {
      alerts.push({
        connectionId: conn.id,
        provider: conn.provider,
        orgId: conn.orgId,
        teamId: conn.teamId,
        expiresAt: conn.expiresAt,
        createdBy: conn.metadata?.createdBy || { userId: conn.userId, email: 'unknown', role: 'unknown' }
      })
    }
  }

  return alerts
}

// Send notifications
const alerts = await checkExpiringConnections(7)
for (const alert of alerts) {
  // Notify the person who created the connection
  await sendEmail({
    to: alert.createdBy.email,
    subject: `${alert.provider} connection expiring soon`,
    body: `Your ${alert.provider} connection for the organization will expire on ${alert.expiresAt}. Please reconnect to maintain access.`
  })
}
```

### Smart Connection Selection

```typescript
async function getOptimalConnection(
  orgId: string,
  provider: 'quickbooks' | 'xero',
  strategy: 'mostRecent' | 'leastExpiring' | 'primaryFirst' | 'roundRobin' = 'primaryFirst'
) {
  const { connections } = await auth({ orgId })
  const providerConnections = connections.filter(c => c.provider === provider)

  if (providerConnections.length === 0) {
    throw new Error(`No ${provider} connections for org`)
  }

  switch (strategy) {
    case 'primaryFirst':
      // Use the one marked as 'primary' in metadata
      const primary = providerConnections.find(c => c.metadata?.purpose === 'primary')
      return primary || providerConnections[0]

    case 'mostRecent':
      return providerConnections.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0]

    case 'leastExpiring':
      return providerConnections.sort((a, b) => {
        if (!a.expiresAt || !b.expiresAt) return 0
        return new Date(b.expiresAt).getTime() - new Date(a.expiresAt).getTime()
      })[0]

    case 'roundRobin':
      // Implement round-robin using a counter stored in KV or DB
      const index = await getRoundRobinIndex(orgId, provider)
      return providerConnections[index % providerConnections.length]
  }
}
```

### Database Schema with Multiple Connections Support

```sql
CREATE TABLE oauth_connections (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  team_id TEXT NOT NULL,
  org_id TEXT,
  provider TEXT NOT NULL,
  credentials JSONB NOT NULL,
  expires_at TIMESTAMP,
  realm_id TEXT,
  tenant_id TEXT,
  metadata JSONB DEFAULT '{}',  -- Store createdBy, purpose, etc.
  is_primary BOOLEAN DEFAULT false,  -- Mark primary connection
  is_active BOOLEAN DEFAULT true,    -- Soft delete / disable
  last_used_at TIMESTAMP,            -- Track usage
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for multiple connection scenarios
CREATE INDEX idx_oauth_connections_org_provider ON oauth_connections(org_id, provider) WHERE org_id IS NOT NULL;
CREATE INDEX idx_oauth_connections_team_provider ON oauth_connections(team_id, provider);
CREATE INDEX idx_oauth_connections_expiring ON oauth_connections(expires_at) WHERE is_active = true;
CREATE INDEX idx_oauth_connections_primary ON oauth_connections(org_id, provider, is_primary) WHERE is_primary = true;

-- Unique constraint: Only one primary connection per org/provider
CREATE UNIQUE INDEX idx_one_primary_per_org_provider
ON oauth_connections(org_id, provider)
WHERE is_primary = true AND org_id IS NOT NULL;
```

## Database Schema

Your connections table should support all three levels:

```sql
CREATE TABLE oauth_connections (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  team_id TEXT NOT NULL,
  org_id TEXT,  -- Optional: Organization-level
  provider TEXT NOT NULL,
  credentials JSONB NOT NULL,
  expires_at TIMESTAMP,
  realm_id TEXT,  -- QuickBooks
  tenant_id TEXT, -- Xero
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX idx_oauth_connections_user_id ON oauth_connections(user_id);
CREATE INDEX idx_oauth_connections_team_id ON oauth_connections(team_id);
CREATE INDEX idx_oauth_connections_org_id ON oauth_connections(org_id);
CREATE INDEX idx_oauth_connections_provider ON oauth_connections(provider);
```

## TypeScript Types

```typescript
import type { ConnectionRecord } from '@midday/oauth-sync-core'

interface ConnectionContext {
  userId?: string
  teamId?: string
  orgId?: string
}

// Auth helper return type
interface AuthResult {
  connections: ConnectionRecord[]
  userId?: string
  teamId?: string
  orgId?: string
  error?: string
}
```

## Best Practices

1. **Hierarchical Access**: Always check org → team → user in that order
2. **Context Preservation**: Store who created the connection (userId) even for org/team connections
3. **Permission Checks**: Verify user has access to the org/team before returning connections
4. **Audit Logging**: Log when connections are created/used at each level
5. **Error Handling**: Gracefully handle missing connections at any level

## See Also

- [B2B Patterns](./B2B_PATTERNS.md) - Detailed B2B SaaS implementation patterns
- [README_V2](./README_V2.md) - Full API documentation
