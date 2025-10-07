# Configuration Guide

Complete guide to OAuth Sync v3 configuration, including auto-detection and override options.

---

## Zero Configuration (Auto-Detect Everything)

**The simplest setup** - auto-detects everything from environment variables:

```typescript
import { OAuthSync } from '@midday/oauth-sync';

export const oauth = new OAuthSync();
```

**What gets auto-detected:**
- ✅ Storage (Supabase, Postgres, or Cloudflare KV)
- ✅ OAuth providers (Xero, QuickBooks, Outlook, Gmail)
- ✅ Platform (Node.js, Vercel, Cloudflare, AWS, Deno)
- ✅ Auth provider (NextAuth, Clerk, Supabase Auth, JWT)
- ✅ Auto-refresh with provider-specific intervals
- ✅ User context from JWT/session

---

## Configuration Cases

### 1. Storage Auto-Detection

#### Auto-Detect from Environment

```typescript
// Detects from environment variables
const oauth = new OAuthSync();

// Priority order:
// 1. SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL → 'supabase'
// 2. DATABASE_URL → 'postgres'
// 3. Default → 'supabase' (with warning)
```

**Required Environment Variables:**

```bash
# For Supabase (auto-detected)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
# OR
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# For Postgres (auto-detected)
DATABASE_URL=postgresql://user:pass@host:5432/db
```

#### Override Storage

```typescript
// Option 1: Override with string
const oauth = new OAuthSync({
  storage: 'postgres'  // Force Postgres even if Supabase detected
});

// Option 2: Override with custom config
const oauth = new OAuthSync({
  storage: 'supabase',
  storageConfig: {
    url: 'https://custom-supabase.co',  // Override SUPABASE_URL
    key: 'custom-key',                   // Override SUPABASE_SERVICE_KEY
    tableName: 'my_oauth_connections'    // Override default table name
  }
});

// Option 3: Custom adapter instance
import { SupabaseStorageAdapter } from '@midday/oauth-sync-core';

const oauth = new OAuthSync({
  storage: new SupabaseStorageAdapter({
    url: 'https://custom.supabase.co',
    key: 'custom-key',
    tableName: 'custom_table'
  })
});
```

---

### 2. Provider Auto-Detection

#### Auto-Detect from Environment

```typescript
// Auto-detects all providers from environment
const oauth = new OAuthSync();

// Checks for:
// - OAUTH_XERO_CLIENT_ID / OAUTH_XERO_CLIENT_SECRET
// - XERO_CLIENT_ID / XERO_CLIENT_SECRET (alternative)
// - OAUTH_QB_CLIENT_ID / OAUTH_QB_CLIENT_SECRET
// - QB_CLIENT_ID / QB_CLIENT_SECRET (alternative)
// - QUICKBOOKS_CLIENT_ID / QUICKBOOKS_CLIENT_SECRET (alternative)
```

**Required Environment Variables:**

```bash
# Xero (auto-detected)
OAUTH_XERO_CLIENT_ID=your-xero-client-id
OAUTH_XERO_CLIENT_SECRET=your-xero-secret
OAUTH_XERO_ENVIRONMENT=production  # or 'sandbox'

# QuickBooks (auto-detected)
OAUTH_QB_CLIENT_ID=your-qb-client-id
OAUTH_QB_CLIENT_SECRET=your-qb-secret
OAUTH_QB_ENVIRONMENT=production  # or 'sandbox'

# Alternative naming (also auto-detected)
XERO_CLIENT_ID=...
XERO_CLIENT_SECRET=...
QUICKBOOKS_CLIENT_ID=...
QUICKBOOKS_CLIENT_SECRET=...
```

#### Override Providers

```typescript
// Explicitly configure providers (overrides auto-detection)
const oauth = new OAuthSync({
  providers: {
    xero: {
      clientId: 'custom-xero-id',      // Override OAUTH_XERO_CLIENT_ID
      clientSecret: 'custom-secret',
      environment: 'sandbox'            // Override OAUTH_XERO_ENVIRONMENT
    },
    quickbooks: {
      clientId: 'custom-qb-id',
      clientSecret: 'custom-secret',
      environment: 'production'
    }
  }
});

// Mix auto-detection + override
// Auto-detects Xero, manually configures QuickBooks
const oauth = new OAuthSync({
  providers: {
    // Xero auto-detected from env
    ...detectOAuthProviders(),

    // QuickBooks manually configured
    quickbooks: {
      clientId: process.env.MY_CUSTOM_QB_ID,
      clientSecret: process.env.MY_CUSTOM_QB_SECRET,
    }
  }
});
```

---

### 3. Auth Context Auto-Detection

#### Auto-Detect from Environment

```typescript
// Auto-detects auth provider from environment
const oauth = new OAuthSync();

// Detection priority:
// 1. NEXTAUTH_URL or NEXTAUTH_SECRET → NextAuth
// 2. NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY → Clerk
// 3. NEXT_PUBLIC_SUPABASE_URL → Supabase Auth
// 4. JWT_SECRET → Generic JWT
```

**Required Environment Variables:**

```bash
# NextAuth (auto-detected)
NEXTAUTH_URL=https://yourapp.com
NEXTAUTH_SECRET=your-secret

# Clerk (auto-detected)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...

# Supabase Auth (auto-detected)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Generic JWT (auto-detected)
JWT_SECRET=your-jwt-secret
JWT_COOKIE_NAME=auth-token  # Optional
```

#### Override Auth Extractor

```typescript
// Option 1: Force specific auth provider
const oauth = new OAuthSync({
  authExtractor: 'clerk'  // Use Clerk even if NextAuth detected
});

// Option 2: Disable auth extraction
const oauth = new OAuthSync({
  authExtractor: false  // Always require manual userId/orgId
});

// Option 3: Custom JWT extraction
import { JWTExtractor } from '@midday/oauth-sync';

const oauth = new OAuthSync({
  authExtractor: new JWTExtractor({
    secret: process.env.MY_CUSTOM_JWT_SECRET,
    cookieName: 'my-auth-cookie',
    fields: {
      userId: 'sub',           // JWT field for userId
      teamId: 'team_id',       // JWT field for teamId
      orgId: 'organization_id' // JWT field for orgId
    }
  })
});

// Option 4: Fully custom extractor
import { CustomExtractor } from '@midday/oauth-sync';

const oauth = new OAuthSync({
  authExtractor: new CustomExtractor(async () => {
    // Your custom logic
    const session = await getMyCustomSession();
    return {
      userId: session.user.id,
      teamId: session.team?.id,
      orgId: session.org?.id,
    };
  })
});
```

---

### 4. Platform Auto-Detection

#### Auto-Detect from Environment

```typescript
// Auto-detects platform from environment
const oauth = new OAuthSync({
  autoRefresh: true  // Uses 'auto' platform by default
});

// Detection logic:
// 1. typeof Deno !== 'undefined' → Deno
// 2. 'caches' in globalThis → Cloudflare Workers
// 3. process.env.VERCEL → Vercel
// 4. process.env.AWS_LAMBDA_FUNCTION_NAME → AWS Lambda
// 5. Default → Node.js
```

#### Override Platform

```typescript
// Force specific platform
const oauth = new OAuthSync({
  autoRefresh: {
    enabled: true,
    platform: 'vercel',  // Override auto-detection
    cronSecret: process.env.CRON_SECRET
  }
});

// Disable auto-refresh entirely
const oauth = new OAuthSync({
  autoRefresh: false
});

// Advanced: Custom per-provider configuration
const oauth = new OAuthSync({
  autoRefresh: {
    enabled: true,
    platform: 'auto',

    // Override provider-specific intervals
    perProviderConfig: {
      thresholds: {
        xero: 25,        // Refresh Xero when 25 min left (default: 20)
        quickbooks: 30,  // Refresh QB when 30 min left (default: 45)
      },
      intervals: {
        xero: 5,  // Check Xero every 5 minutes (default: 10)
      }
    },

    // Callback for serverless setup instructions
    onSetupRequired: (instructions) => {
      console.log(instructions.message);
      console.log(instructions.code);
    }
  }
});
```

---

### 5. Complete Configuration Examples

#### Production - Auto-Detect Everything

```typescript
// lib/oauth.ts
import { OAuthSync } from '@midday/oauth-sync';

// Minimal production config - auto-detects everything
export const oauth = new OAuthSync();
```

**Environment Variables:**
```bash
# Storage
SUPABASE_URL=https://prod.supabase.co
SUPABASE_SERVICE_KEY=prod-key

# Providers
OAUTH_XERO_CLIENT_ID=prod-xero-id
OAUTH_XERO_CLIENT_SECRET=prod-xero-secret
OAUTH_QB_CLIENT_ID=prod-qb-id
OAUTH_QB_CLIENT_SECRET=prod-qb-secret

# Auth (NextAuth example)
NEXTAUTH_URL=https://myapp.com
NEXTAUTH_SECRET=prod-secret

# Serverless
CRON_SECRET=prod-cron-secret
```

#### Production - Override Everything

```typescript
// lib/oauth.ts
import { OAuthSync, JWTExtractor } from '@midday/oauth-sync';

export const oauth = new OAuthSync({
  // Override storage
  storage: 'postgres',
  storageConfig: {
    connectionString: process.env.CUSTOM_DB_URL,
    tableName: 'my_oauth_tokens'
  },

  // Override providers
  providers: {
    xero: {
      clientId: process.env.MY_XERO_ID,
      clientSecret: process.env.MY_XERO_SECRET,
      environment: 'production'
    },
    quickbooks: {
      clientId: process.env.MY_QB_ID,
      clientSecret: process.env.MY_QB_SECRET,
      environment: 'sandbox'  // Test QB in sandbox
    }
  },

  // Override auth extraction
  authExtractor: new JWTExtractor({
    secret: process.env.MY_JWT_SECRET,
    cookieName: 'my-session',
    fields: {
      userId: 'user_id',
      orgId: 'org_id'
    }
  }),

  // Override auto-refresh
  autoRefresh: {
    enabled: true,
    platform: 'vercel',
    cronSecret: process.env.MY_CRON_SECRET,

    perProviderConfig: {
      thresholds: {
        xero: 25,
        quickbooks: 50,
      },
      intervals: {
        xero: 8,
      }
    },

    onSetupRequired: (instructions) => {
      // Send to monitoring service
      sendToDatadog({
        message: 'OAuth setup required',
        platform: instructions.platform,
        code: instructions.code
      });
    }
  },

  // Other overrides
  maxRetries: 3,
  timeout: 60000
});
```

#### Development - Mixed Auto-Detect + Override

```typescript
// lib/oauth.dev.ts
import { OAuthSync } from '@midday/oauth-sync';

export const oauth = new OAuthSync({
  // Auto-detect storage from SUPABASE_URL
  // (no override needed)

  // Override only QuickBooks to use sandbox
  providers: {
    quickbooks: {
      clientId: process.env.OAUTH_QB_CLIENT_ID!,
      clientSecret: process.env.OAUTH_QB_CLIENT_SECRET!,
      environment: 'sandbox'  // Force sandbox for dev
    }
    // Xero auto-detected from env
  },

  // Auto-detect auth from NextAuth
  // (no override needed)

  // Custom auto-refresh for debugging
  autoRefresh: {
    enabled: true,
    perProviderConfig: {
      intervals: {
        xero: 2,  // Check every 2 minutes for testing
      }
    },
    onSetupRequired: (instructions) => {
      console.log('🔧 Setup Instructions:');
      console.log(instructions.message);
    }
  }
});
```

---

## Configuration Priority Order

When both auto-detection and explicit configuration are present, **explicit configuration always wins**:

```typescript
// Even if SUPABASE_URL is set, postgres wins
const oauth = new OAuthSync({
  storage: 'postgres'  // ✅ Uses postgres
});

// Even if OAUTH_XERO_CLIENT_ID is set, custom wins
const oauth = new OAuthSync({
  providers: {
    xero: {
      clientId: 'custom-id'  // ✅ Uses custom-id
    }
  }
});

// Even if NEXTAUTH_URL is set, Clerk wins
const oauth = new OAuthSync({
  authExtractor: 'clerk'  // ✅ Uses Clerk
});
```

---

## Environment Variable Reference

### Complete List of Auto-Detected Variables

**Storage:**
- `SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_KEY` or `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`

**OAuth Providers:**
- `OAUTH_XERO_CLIENT_ID` or `XERO_CLIENT_ID`
- `OAUTH_XERO_CLIENT_SECRET` or `XERO_CLIENT_SECRET`
- `OAUTH_XERO_ENVIRONMENT` or `XERO_ENVIRONMENT`
- `OAUTH_QB_CLIENT_ID` or `QB_CLIENT_ID` or `QUICKBOOKS_CLIENT_ID`
- `OAUTH_QB_CLIENT_SECRET` or `QB_CLIENT_SECRET` or `QUICKBOOKS_CLIENT_SECRET`
- `OAUTH_QB_ENVIRONMENT` or `QB_ENVIRONMENT`

**Auth Providers:**
- `NEXTAUTH_URL` or `NEXTAUTH_SECRET` → NextAuth
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` → Clerk
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Supabase Auth
- `JWT_SECRET` and `JWT_COOKIE_NAME` → Generic JWT

**Platform Detection:**
- `VERCEL` or `VERCEL_ENV` → Vercel
- `AWS_LAMBDA_FUNCTION_NAME` or `AWS_EXECUTION_ENV` → AWS Lambda
- `CF_PAGES` or `CLOUDFLARE_ACCOUNT_ID` → Cloudflare
- Runtime checks for Deno and Node.js

**Optional:**
- `CRON_SECRET` → For serverless auto-refresh authentication

---

## Best Practices

1. **Use auto-detection in development** - Less configuration, faster iteration
2. **Override in production** - Explicit is better than implicit for critical systems
3. **Use environment-specific configs** - Different configs for dev/staging/prod
4. **Always set CRON_SECRET** - Secure your serverless refresh endpoints
5. **Monitor setup instructions** - Log `onSetupRequired` messages to catch platform issues

---

## Troubleshooting

### "No storage detected"
**Cause**: No `SUPABASE_URL` or `DATABASE_URL` found
**Fix**: Set one of these environment variables, or explicitly configure storage

### "Provider X not configured"
**Cause**: Missing `OAUTH_X_CLIENT_ID` environment variables
**Fix**: Set provider credentials in environment, or explicitly configure providers

### "Manual scheduler setup required"
**Cause**: Running on serverless platform (Vercel/Cloudflare/AWS/Deno)
**Fix**: Follow the instructions in `onSetupRequired` callback or see platform-specific docs

---

## Summary

| Configuration | Auto-Detected From | Override With | Priority |
|--------------|-------------------|---------------|----------|
| **Storage** | `SUPABASE_URL`, `DATABASE_URL` | `storage: 'postgres'` | Override wins |
| **Providers** | `OAUTH_*_CLIENT_ID` | `providers: {...}` | Override wins |
| **Auth** | `NEXTAUTH_URL`, `CLERK_*`, etc. | `authExtractor: 'clerk'` | Override wins |
| **Platform** | Runtime checks | `autoRefresh.platform: 'vercel'` | Override wins |
| **Intervals** | Provider defaults | `perProviderConfig.intervals` | Override wins |
| **Thresholds** | Provider defaults | `perProviderConfig.thresholds` | Override wins |

**Rule**: User-provided configuration always takes precedence over auto-detection.
