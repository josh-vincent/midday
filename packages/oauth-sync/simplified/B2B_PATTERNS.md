# B2B SaaS Patterns

Advanced implementation patterns for B2B SaaS applications using OAuth Sync.

## Table of Contents

- [Multi-Tenant Architecture](#multi-tenant-architecture)
- [Permission & Access Control](#permission--access-control)
- [Organization Hierarchy](#organization-hierarchy)
- [Connection Lifecycle Management](#connection-lifecycle-management)
- [Admin Delegation](#admin-delegation)
- [Billing & Usage Tracking](#billing--usage-tracking)
- [Compliance & Audit](#compliance--audit)
- [High Availability Patterns](#high-availability-patterns)

## Multi-Tenant Architecture

### Pattern 1: Organization-Isolated Connections

Each organization has completely isolated OAuth connections. Best for strict data separation.

```typescript
import { auth } from './oauth'

// Organization-scoped connection retrieval
async function getOrgConnections(orgId: string, userId: string) {
  // Verify user has access to org first
  const hasAccess = await verifyOrgAccess(userId, orgId)
  if (!hasAccess) {
    throw new Error('User does not have access to this organization')
  }

  const { connections } = await auth({ orgId })
  return connections
}

// Connect with org context
async function connectForOrg(provider: OAuthProvider, orgId: string, userId: string) {
  const hasPermission = await checkPermission(userId, orgId, 'oauth:connect')
  if (!hasPermission) {
    throw new Error('User does not have permission to connect OAuth providers')
  }

  const authUrl = await connect(provider, {
    orgId,
    userId,
    redirectUri: `/api/oauth/${provider}/callback?orgId=${orgId}`
  })

  return authUrl
}
```

### Pattern 2: Workspace-Based Isolation

Teams within an organization can have separate workspaces with their own connections.

```typescript
interface Workspace {
  id: string
  orgId: string
  name: string
  teamIds: string[]
}

async function getWorkspaceConnections(workspaceId: string) {
  const workspace = await getWorkspace(workspaceId)

  // Get all connections for teams in this workspace
  const allConnections = []
  for (const teamId of workspace.teamIds) {
    const { connections } = await auth({ teamId })
    allConnections.push(...connections)
  }

  // Deduplicate by provider (prefer most recent)
  const uniqueConnections = allConnections.reduce((acc, conn) => {
    const existing = acc.find(c => c.provider === conn.provider)
    if (!existing || new Date(conn.createdAt) > new Date(existing.createdAt)) {
      return [...acc.filter(c => c.provider !== conn.provider), conn]
    }
    return acc
  }, [] as ConnectionRecord[])

  return uniqueConnections
}
```

## Permission & Access Control

### Role-Based Access Control (RBAC)

```typescript
type Permission =
  | 'oauth:connect'      // Can create new connections
  | 'oauth:disconnect'   // Can remove connections
  | 'oauth:view'         // Can view connections
  | 'oauth:refresh'      // Can manually refresh tokens

interface Role {
  name: 'owner' | 'admin' | 'member' | 'viewer'
  permissions: Permission[]
}

const ROLES: Record<string, Role> = {
  owner: {
    name: 'owner',
    permissions: ['oauth:connect', 'oauth:disconnect', 'oauth:view', 'oauth:refresh']
  },
  admin: {
    name: 'admin',
    permissions: ['oauth:connect', 'oauth:view', 'oauth:refresh']
  },
  member: {
    name: 'member',
    permissions: ['oauth:view']
  },
  viewer: {
    name: 'viewer',
    permissions: ['oauth:view']
  }
}

async function checkPermission(
  userId: string,
  orgId: string,
  permission: Permission
): Promise<boolean> {
  const userRole = await getUserRole(userId, orgId)
  const role = ROLES[userRole]
  return role.permissions.includes(permission)
}

// Usage in API route
export async function POST(request: Request) {
  const { provider, orgId } = await request.json()
  const userId = await getCurrentUserId()

  // Check permission before allowing connection
  if (!await checkPermission(userId, orgId, 'oauth:connect')) {
    return Response.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const authUrl = await connect(provider, { orgId, userId })
  return Response.json({ authUrl })
}
```

### Connection Ownership Validation

```typescript
async function validateConnectionOwnership(
  connectionId: string,
  userId: string,
  orgId: string
): Promise<boolean> {
  const connection = await storageAdapter.getConnection(connectionId)

  if (!connection) {
    throw new Error('Connection not found')
  }

  // Check if connection belongs to the org
  if (connection.orgId !== orgId) {
    throw new Error('Connection does not belong to this organization')
  }

  // Check if user has access to the org
  const hasAccess = await verifyOrgAccess(userId, orgId)
  if (!hasAccess) {
    throw new Error('User does not have access to this organization')
  }

  return true
}
```

## Organization Hierarchy

### 3-Level Hierarchy: Org → Team → User

```typescript
interface OrgHierarchy {
  org: {
    id: string
    name: string
    settings: {
      allowTeamConnections: boolean
      allowUserConnections: boolean
    }
  }
  teams: Array<{
    id: string
    name: string
    members: string[]
  }>
  users: Array<{
    id: string
    email: string
    role: string
  }>
}

async function getConnectionsWithHierarchy(
  orgId: string,
  teamId?: string,
  userId?: string
) {
  const org = await getOrg(orgId)

  // 1. Try org-level connections first (highest priority)
  const { connections: orgConnections } = await auth({ orgId })
  if (orgConnections.length > 0) {
    return {
      source: 'organization',
      connections: orgConnections
    }
  }

  // 2. Try team-level if allowed and teamId provided
  if (org.settings.allowTeamConnections && teamId) {
    const { connections: teamConnections } = await auth({ teamId })
    if (teamConnections.length > 0) {
      return {
        source: 'team',
        connections: teamConnections
      }
    }
  }

  // 3. Try user-level if allowed and userId provided
  if (org.settings.allowUserConnections && userId) {
    const { connections: userConnections } = await auth({ userId })
    if (userConnections.length > 0) {
      return {
        source: 'user',
        connections: userConnections
      }
    }
  }

  return {
    source: 'none',
    connections: []
  }
}
```

### Inheritance & Override Pattern

```typescript
async function getEffectiveConnections(
  orgId: string,
  teamId: string,
  userId: string,
  provider?: OAuthProvider
) {
  // Get all levels
  const { connections: orgConns } = await auth({ orgId })
  const { connections: teamConns } = await auth({ teamId })
  const { connections: userConns } = await auth({ userId })

  // Build effective connection map (more specific overrides less specific)
  const connectionMap = new Map<OAuthProvider, ConnectionRecord>()

  // Start with org-level (base)
  for (const conn of orgConns) {
    connectionMap.set(conn.provider, conn)
  }

  // Override with team-level
  for (const conn of teamConns) {
    connectionMap.set(conn.provider, conn)
  }

  // Override with user-level (highest specificity)
  for (const conn of userConns) {
    connectionMap.set(conn.provider, conn)
  }

  // Return as array or single provider
  if (provider) {
    return connectionMap.get(provider) || null
  }

  return Array.from(connectionMap.values())
}
```

## Connection Lifecycle Management

### Automatic Expiry Handling

```typescript
import { manager } from './oauth'

// Background job (run every hour)
async function refreshExpiringTokens() {
  const results = await manager.refreshExpiringConnections(
    60, // 60 minutes threshold
    async (result) => {
      // Callback for each refresh
      if (!result.success) {
        // Notify the connection owner about failure
        await notifyConnectionOwner(result.connectionId, result.error)
      }
    }
  )

  console.log(`Refreshed ${results.filter(r => r.success).length} connections`)
}

// Notify connection owner
async function notifyConnectionOwner(connectionId: string, error?: string) {
  const connection = await storageAdapter.getConnection(connectionId)
  if (!connection) return

  const owner = connection.metadata?.createdBy

  await sendNotification({
    userId: owner?.userId || connection.userId,
    email: owner?.email,
    type: 'connection_failed',
    message: `Failed to refresh ${connection.provider} connection: ${error}`,
    action: {
      label: 'Reconnect',
      url: `/settings/connections?reconnect=${connectionId}`
    }
  })
}
```

### Graceful Degradation

```typescript
async function fetchDataWithFallback(
  orgId: string,
  provider: OAuthProvider,
  endpoint: string
) {
  const { connections } = await auth({ orgId })
  const providerConnections = connections
    .filter(c => c.provider === provider)
    .sort((a, b) => {
      // Sort by: primary first, then by expiry date
      if (a.metadata?.isPrimary && !b.metadata?.isPrimary) return -1
      if (!a.metadata?.isPrimary && b.metadata?.isPrimary) return 1
      return new Date(b.expiresAt || 0).getTime() - new Date(a.expiresAt || 0).getTime()
    })

  for (const connection of providerConnections) {
    try {
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${connection.credentials.accessToken}`
        }
      })

      if (response.ok) {
        // Update last used timestamp
        await updateLastUsed(connection.id)
        return await response.json()
      }

      // If 401, try to refresh
      if (response.status === 401) {
        const refreshed = await manager.refreshConnection(connection.id, provider)
        if (refreshed.success) {
          // Retry with new token
          const retryResponse = await fetch(endpoint, {
            headers: {
              Authorization: `Bearer ${refreshed.tokens.accessToken}`
            }
          })
          if (retryResponse.ok) {
            return await retryResponse.json()
          }
        }
      }
    } catch (error) {
      console.warn(`Connection ${connection.id} failed, trying next...`)
      continue
    }
  }

  throw new Error(`All ${provider} connections failed for org ${orgId}`)
}

async function updateLastUsed(connectionId: string) {
  // Update connection metadata with last used timestamp
  const connection = await storageAdapter.getConnection(connectionId)
  if (connection) {
    connection.metadata = {
      ...connection.metadata,
      lastUsedAt: new Date().toISOString()
    }
    await storageAdapter.saveConnection(connection)
  }
}
```

## Admin Delegation

### Designated OAuth Admins

```typescript
interface OAuthAdmin {
  userId: string
  orgId: string
  providers: OAuthProvider[]
  delegatedBy: string
  delegatedAt: string
  expiresAt?: string
}

// Assign OAuth admin role
async function assignOAuthAdmin(
  orgId: string,
  adminUserId: string,
  providers: OAuthProvider[],
  assignedBy: string
) {
  const admin: OAuthAdmin = {
    userId: adminUserId,
    orgId,
    providers,
    delegatedBy: assignedBy,
    delegatedAt: new Date().toISOString()
  }

  await db.insert('oauth_admins').values(admin)

  // Notify the new admin
  await sendNotification({
    userId: adminUserId,
    type: 'oauth_admin_assigned',
    message: `You've been assigned as OAuth admin for ${providers.join(', ')}`
  })
}

// Check if user is OAuth admin
async function isOAuthAdmin(
  userId: string,
  orgId: string,
  provider?: OAuthProvider
): Promise<boolean> {
  const admin = await db
    .select()
    .from('oauth_admins')
    .where({ userId, orgId })
    .first()

  if (!admin) return false

  // Check if admin role is expired
  if (admin.expiresAt && new Date(admin.expiresAt) < new Date()) {
    return false
  }

  // Check provider-specific permission
  if (provider && !admin.providers.includes(provider)) {
    return false
  }

  return true
}
```

### Connection Handoff

```typescript
async function transferConnectionOwnership(
  connectionId: string,
  fromUserId: string,
  toUserId: string,
  orgId: string
) {
  // Verify permissions
  const hasPermission = await checkPermission(fromUserId, orgId, 'oauth:disconnect')
  if (!hasPermission) {
    throw new Error('User does not have permission to transfer connections')
  }

  const connection = await storageAdapter.getConnection(connectionId)
  if (!connection) {
    throw new Error('Connection not found')
  }

  // Update connection metadata
  connection.metadata = {
    ...connection.metadata,
    transferredFrom: {
      userId: fromUserId,
      transferredAt: new Date().toISOString()
    },
    createdBy: {
      ...connection.metadata?.createdBy,
      userId: toUserId
    }
  }

  await storageAdapter.saveConnection(connection)

  // Audit log
  await logAudit({
    action: 'connection_transferred',
    connectionId,
    fromUserId,
    toUserId,
    orgId,
    timestamp: new Date().toISOString()
  })
}
```

## Billing & Usage Tracking

### Connection Limits by Plan

```typescript
interface PlanLimits {
  name: string
  maxConnections: number
  maxConnectionsPerProvider: number
  allowedProviders: OAuthProvider[]
}

const PLANS: Record<string, PlanLimits> = {
  free: {
    name: 'Free',
    maxConnections: 2,
    maxConnectionsPerProvider: 1,
    allowedProviders: ['xero', 'quickbooks']
  },
  pro: {
    name: 'Pro',
    maxConnections: 10,
    maxConnectionsPerProvider: 3,
    allowedProviders: ['xero', 'quickbooks', 'gmail', 'outlook']
  },
  enterprise: {
    name: 'Enterprise',
    maxConnections: -1, // unlimited
    maxConnectionsPerProvider: -1,
    allowedProviders: ['xero', 'quickbooks', 'gmail', 'outlook']
  }
}

async function checkConnectionLimit(
  orgId: string,
  provider: OAuthProvider
): Promise<{ allowed: boolean; reason?: string }> {
  const org = await getOrg(orgId)
  const plan = PLANS[org.planType]

  // Check provider allowed
  if (!plan.allowedProviders.includes(provider)) {
    return {
      allowed: false,
      reason: `${provider} is not available on ${plan.name} plan`
    }
  }

  const { connections } = await auth({ orgId })

  // Check total connections limit
  if (plan.maxConnections !== -1 && connections.length >= plan.maxConnections) {
    return {
      allowed: false,
      reason: `Maximum connections (${plan.maxConnections}) reached for ${plan.name} plan`
    }
  }

  // Check per-provider limit
  const providerConnections = connections.filter(c => c.provider === provider)
  if (plan.maxConnectionsPerProvider !== -1 &&
      providerConnections.length >= plan.maxConnectionsPerProvider) {
    return {
      allowed: false,
      reason: `Maximum ${provider} connections (${plan.maxConnectionsPerProvider}) reached`
    }
  }

  return { allowed: true }
}
```

### Usage Metering

```typescript
interface UsageMetrics {
  orgId: string
  provider: OAuthProvider
  connectionId: string
  metrics: {
    apiCalls: number
    syncOperations: number
    dataVolumeMB: number
    lastSyncAt: string
  }
  period: {
    start: string
    end: string
  }
}

async function trackUsage(
  connectionId: string,
  operation: 'api_call' | 'sync' | 'data_transfer',
  metadata: { bytes?: number }
) {
  const connection = await storageAdapter.getConnection(connectionId)
  if (!connection) return

  await db.insert('usage_metrics').values({
    org_id: connection.orgId,
    provider: connection.provider,
    connection_id: connectionId,
    operation,
    bytes: metadata.bytes || 0,
    timestamp: new Date().toISOString()
  })
}

// Calculate monthly usage
async function getMonthlyUsage(orgId: string): Promise<UsageMetrics[]> {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const endOfMonth = new Date(startOfMonth)
  endOfMonth.setMonth(endOfMonth.getMonth() + 1)

  const usage = await db
    .select()
    .from('usage_metrics')
    .where({ org_id: orgId })
    .where('timestamp', '>=', startOfMonth.toISOString())
    .where('timestamp', '<', endOfMonth.toISOString())

  // Aggregate by connection
  const aggregated = usage.reduce((acc, record) => {
    const key = `${record.connection_id}`
    if (!acc[key]) {
      acc[key] = {
        orgId,
        provider: record.provider,
        connectionId: record.connection_id,
        metrics: {
          apiCalls: 0,
          syncOperations: 0,
          dataVolumeMB: 0,
          lastSyncAt: record.timestamp
        },
        period: {
          start: startOfMonth.toISOString(),
          end: endOfMonth.toISOString()
        }
      }
    }

    if (record.operation === 'api_call') acc[key].metrics.apiCalls++
    if (record.operation === 'sync') acc[key].metrics.syncOperations++
    if (record.operation === 'data_transfer') {
      acc[key].metrics.dataVolumeMB += record.bytes / 1024 / 1024
    }

    return acc
  }, {} as Record<string, UsageMetrics>)

  return Object.values(aggregated)
}
```

## Compliance & Audit

### Audit Trail

```typescript
interface AuditLog {
  id: string
  orgId: string
  userId: string
  action: 'connect' | 'disconnect' | 'refresh' | 'transfer' | 'view'
  connectionId?: string
  provider?: OAuthProvider
  metadata: Record<string, any>
  ipAddress?: string
  userAgent?: string
  timestamp: string
}

async function logAudit(log: Omit<AuditLog, 'id' | 'timestamp'>) {
  await db.insert('audit_logs').values({
    id: crypto.randomUUID(),
    ...log,
    timestamp: new Date().toISOString()
  })
}

// Get audit trail for compliance
async function getAuditTrail(
  orgId: string,
  filters?: {
    userId?: string
    action?: AuditLog['action']
    startDate?: string
    endDate?: string
  }
): Promise<AuditLog[]> {
  let query = db.select().from('audit_logs').where({ org_id: orgId })

  if (filters?.userId) {
    query = query.where({ user_id: filters.userId })
  }

  if (filters?.action) {
    query = query.where({ action: filters.action })
  }

  if (filters?.startDate) {
    query = query.where('timestamp', '>=', filters.startDate)
  }

  if (filters?.endDate) {
    query = query.where('timestamp', '<=', filters.endDate)
  }

  return query.orderBy('timestamp', 'desc')
}
```

### Data Retention & GDPR

```typescript
async function deleteUserData(userId: string, orgId: string) {
  // 1. Get all connections created by user
  const { connections } = await auth({ userId })

  // 2. Check if any connections are org/team level (don't delete those)
  const userOnlyConnections = connections.filter(
    c => !c.orgId && c.userId === userId
  )

  // 3. Delete user-only connections
  for (const conn of userOnlyConnections) {
    await storageAdapter.deleteConnection(conn.id)

    await logAudit({
      orgId,
      userId: 'system',
      action: 'disconnect',
      connectionId: conn.id,
      metadata: { reason: 'gdpr_deletion', requestedBy: userId }
    })
  }

  // 4. Anonymize audit logs
  await db
    .update('audit_logs')
    .set({ user_id: 'deleted_user' })
    .where({ user_id: userId, org_id: orgId })

  // 5. Remove from oauth_admins
  await db
    .delete('oauth_admins')
    .where({ user_id: userId, org_id: orgId })
}
```

## High Availability Patterns

### Circuit Breaker

```typescript
class CircuitBreaker {
  private failures = new Map<string, number>()
  private lastFailure = new Map<string, number>()
  private readonly threshold = 5
  private readonly timeout = 60000 // 1 minute

  async execute<T>(
    connectionId: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const failures = this.failures.get(connectionId) || 0
    const lastFail = this.lastFailure.get(connectionId) || 0

    // Circuit is open (too many failures)
    if (failures >= this.threshold) {
      const timeSinceLastFailure = Date.now() - lastFail

      if (timeSinceLastFailure < this.timeout) {
        throw new Error('Circuit breaker is open')
      }

      // Try to close circuit after timeout
      this.failures.set(connectionId, 0)
    }

    try {
      const result = await fn()
      this.failures.set(connectionId, 0)
      return result
    } catch (error) {
      this.failures.set(connectionId, failures + 1)
      this.lastFailure.set(connectionId, Date.now())
      throw error
    }
  }
}

const breaker = new CircuitBreaker()

async function fetchWithCircuitBreaker(connectionId: string, url: string) {
  return breaker.execute(connectionId, async () => {
    const connection = await storageAdapter.getConnection(connectionId)
    if (!connection) throw new Error('Connection not found')

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${connection.credentials.accessToken}`
      }
    })

    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return response.json()
  })
}
```

### Distributed Lock for Token Refresh

```typescript
async function refreshWithDistributedLock(connectionId: string) {
  const lockAcquired = await storageAdapter.acquireLock(
    connectionId,
    30000 // 30 seconds TTL
  )

  if (!lockAcquired) {
    console.log('Another process is refreshing this connection')
    return { success: false, reason: 'locked' }
  }

  try {
    const connection = await storageAdapter.getConnection(connectionId)
    if (!connection) {
      throw new Error('Connection not found')
    }

    const result = await manager.refreshConnection(connectionId, connection.provider)
    return result
  } finally {
    await storageAdapter.releaseLock(connectionId)
  }
}
```

## See Also

- [Connection Examples](./CONNECTION_EXAMPLES.md) - Basic connection retrieval examples
- [README_V2](./README_V2.md) - Full API documentation
