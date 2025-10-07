# Testing Background Jobs

This guide covers testing the Trigger.dev background jobs for accounting integrations (QuickBooks, Xero) and OAuth token refresh.

## Local Development Testing

### 1. Start Trigger.dev Dev Server

```bash
cd packages/jobs
bun run dev
```

This starts the Trigger.dev development server which:
- Registers all task definitions
- Provides a local dashboard at `http://localhost:3030`
- Watches for code changes and hot-reloads
- Allows manual task triggering

### 2. Access Trigger.dev Dashboard

1. Open browser to `http://localhost:3030`
2. You'll see all registered tasks:
   - `token-refresh-scheduler` - OAuth token refresh (scheduled)
   - `initial-quickbooks-setup` - Initial QB sync
   - `sync-quickbooks-entity` - QB entity sync
   - `initial-xero-setup` - Initial Xero sync
   - `sync-xero-entity` - Xero entity sync

3. Features available:
   - **Manual Trigger** - Click "Trigger" button to run tasks manually
   - **View Runs** - See execution history with logs
   - **Inspect Payload** - View input/output data
   - **Debug Errors** - See stack traces and error details

### 3. Test OAuth Token Refresh

**Prerequisites:**
- QuickBooks or Xero OAuth tokens in database
- `apps` table populated with test data

**Steps:**
1. Create a test app record with expiring token:
   ```sql
   INSERT INTO apps (id, team_id, app_id, config) VALUES (
     gen_random_uuid(),
     'your-team-id',
     'quickbooks',
     '{
       "access_token": "test_token",
       "refresh_token": "test_refresh",
       "expires_in": 3600,
       "connected_at": "2025-01-01T00:00:00Z",
       "realm_id": "test_realm"
     }'::jsonb
   );
   ```

2. In Trigger.dev dashboard, trigger `token-refresh-scheduler`
3. Check logs to verify:
   - Tokens were detected as expiring
   - Refresh was attempted
   - Database was updated with new tokens

4. Verify in database:
   ```sql
   SELECT config FROM apps WHERE app_id = 'quickbooks';
   ```

### 4. Test QuickBooks Sync

**Prerequisites:**
- QuickBooks Sandbox account (create at developer.intuit.com)
- OAuth2 credentials configured
- Environment variables set:
  ```env
  QUICKBOOKS_CLIENT_ID=your_client_id
  QUICKBOOKS_CLIENT_SECRET=your_secret
  QUICKBOOKS_SANDBOX=true
  ```

**Test Initial Setup:**
1. Create an app record with valid QB OAuth tokens
2. In Trigger.dev dashboard, trigger `initial-quickbooks-setup` with payload:
   ```json
   {
     "integrationId": "app-id-from-database",
     "tenantId": "team-id",
     "realmId": "quickbooks-company-id"
   }
   ```
3. Monitor logs for:
   - Each entity type being synced (customers, invoices, etc.)
   - Success/failure status for each
4. Verify data in `synced_accounting_entities` table

**Test Entity Sync:**
1. In Trigger.dev dashboard, trigger `sync-quickbooks-entity`:
   ```json
   {
     "integrationId": "app-id",
     "tenantId": "team-id",
     "entityType": "customer",
     "entityId": "123",
     "operation": "update",
     "realmId": "company-id",
     "lastUpdated": "2025-01-01T00:00:00Z"
   }
   ```
2. Check logs for:
   - Token refresh (if needed)
   - QuickBooks API calls
   - Database upsert operations
3. Verify entity in database:
   ```sql
   SELECT * FROM synced_accounting_entities
   WHERE entity_type = 'customers' AND external_id = '123';
   ```

### 5. Test Xero Sync

Similar to QuickBooks, but:
- Use Xero Developer account (developer.xero.com)
- Set `XERO_CLIENT_ID` and `XERO_CLIENT_SECRET`
- Use `xeroTenantId` instead of `realmId`

## Unit Testing

### Run All Tests

```bash
cd packages/jobs
bun test
```

### Watch Mode (Auto-rerun on changes)

```bash
bun test --watch
```

### Run Specific Test File

```bash
bun test src/tasks/oauth/token-refresh.test.ts
```

### Test Coverage

Current test files:
- `src/tasks/oauth/token-refresh.test.ts` - Token expiry detection logic

Tests cover:
- Token expiry detection for QuickBooks (1 hour window)
- Token expiry detection for Xero (30 minute window)
- Edge cases: missing dates, invalid dates, already expired tokens
- Provider-specific time windows

### Writing New Tests

Example test structure using Bun:

```typescript
import { describe, expect, test } from "bun:test";
import { isTokenExpiring } from "./token-refresh";

describe("Feature Name", () => {
  test("should do something", () => {
    const result = isTokenExpiring(config, "quickbooks");
    expect(result).toBe(true);
  });
});
```

## Integration Testing Checklist

### OAuth Token Refresh
- [ ] Scheduler runs every 30 minutes
- [ ] Detects expiring tokens (QB: 1hr, Xero: 30min)
- [ ] Refreshes tokens via provider API
- [ ] Updates database with new tokens
- [ ] Handles refresh failures gracefully
- [ ] Retries with exponential backoff

### QuickBooks Integration
- [ ] Initial setup triggers all entity syncs
- [ ] Entity sync fetches data from QB API
- [ ] Data is saved to synced_accounting_entities
- [ ] Token auto-refresh works during sync
- [ ] Webhook events trigger entity sync
- [ ] Apps table is updated with sync status
- [ ] Errors are logged with details

### Xero Integration
- [ ] Same checklist as QuickBooks
- [ ] Uses correct Xero-specific fields (tenantId)
- [ ] Handles Xero API rate limits

## Debugging Tips

### View Task Logs
1. Open Trigger.dev dashboard
2. Click on a task run
3. Expand log sections to see detailed output

### Common Issues

**"Integration not found"**
- Verify `integrationId` exists in `apps` table
- Check UUID format is correct

**"Missing QuickBooks credentials"**
- Verify `config` JSON has `access_token` and `realm_id`
- Check tokens haven't expired

**"Failed to refresh tokens"**
- Check OAuth credentials in environment variables
- Verify refresh_token is still valid
- Check provider API status

### Database Inspection

```sql
-- View all apps
SELECT id, app_id, team_id, config->>'connected_at', config->>'expires_in'
FROM apps;

-- View synced entities
SELECT entity_type, COUNT(*)
FROM synced_accounting_entities
GROUP BY entity_type;

-- Check recent sync
SELECT * FROM synced_accounting_entities
ORDER BY updated_at DESC
LIMIT 10;
```

## Production Testing

Before deploying:
1. Test with real QuickBooks/Xero sandbox accounts
2. Verify all entity types sync correctly
3. Test token refresh over 24+ hour period
4. Verify webhook handling works
5. Check error handling and retry logic
6. Monitor performance and API rate limits

## Continuous Integration

Add to your CI pipeline:

```yaml
# .github/workflows/test.yml
- name: Test background jobs
  run: |
    cd packages/jobs
    bun test
    bun run typecheck
```
