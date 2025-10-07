# Zod Validation Guide

OAuth Sync v3 provides **full Zod schemas** for runtime validation and type safety.

## Why Zod?

✅ **Runtime validation** - Catch invalid data before it causes errors
✅ **Type inference** - Derive TypeScript types from schemas
✅ **Better error messages** - Detailed validation errors
✅ **Composable** - Extend and customize schemas
✅ **Zero overhead** - Only validates when you call `.parse()`

## Available Schemas

### Core Request/Response Schemas

```typescript
import {
  tokenContextSchema,      // Validates { userId?, teamId?, orgId?, providers? }
  connectOptionsSchema,     // Validates connection options
  tokenInfoSchema,          // Validates rich token info
  oauthSyncConfigSchema,    // Validates OAuthSync configuration
} from '@midday/oauth-sync';
```

### Schema Definitions

#### `tokenContextSchema`

Validates context for token requests:

```typescript
const tokenContextSchema = z.object({
  userId: z.string().optional(),
  teamId: z.string().optional(),
  orgId: z.string().optional(),
  providers: z.array(z.enum(['quickbooks', 'xero', 'gmail', 'outlook'])).optional(),
});

// Example usage
const context = tokenContextSchema.parse({
  userId: 'user_123',
  providers: ['xero', 'quickbooks']
});
```

#### `tokenInfoSchema`

Validates rich token information:

```typescript
const tokenInfoSchema = z.object({
  token: z.string().min(1),
  scopes: z.array(z.string()),
  expiresAt: z.string().datetime(),
  provider: z.enum(['quickbooks', 'xero', 'gmail', 'outlook']),
  connectionId: z.string().min(1),
  metadata: z.object({
    isPrimary: z.boolean().optional(),
    permissions: z.enum(['read', 'readWrite', 'admin']).optional(),
  }).passthrough().optional(),
});

// Example usage
const richTokens = await oauth.getRichTokens({ orgId: 'org_123' });
const xeroInfo = tokenInfoSchema.parse(richTokens.xero);
```

#### `connectOptionsSchema`

Validates OAuth connection options:

```typescript
const connectOptionsSchema = tokenContextSchema.extend({
  redirectUri: z.string().url().optional(),
});

// Example usage
const options = connectOptionsSchema.parse({
  orgId: 'org_123',
  userId: 'user_456',
  redirectUri: 'https://myapp.com/oauth/callback'
});
```

#### `oauthSyncConfigSchema`

Validates OAuthSync configuration:

```typescript
const oauthSyncConfigSchema = z.object({
  storage: z.union([
    z.literal('supabase'),
    z.literal('cloudflare'),
    z.literal('postgres'),
    z.any(), // Custom adapter
  ]),
  storageConfig: z.object({
    url: z.string().url().optional(),
    key: z.string().optional(),
    tableName: z.string().optional(),
    // ... more fields
  }).optional(),
  providers: z.record(z.object({
    clientId: z.string().min(1),
    clientSecret: z.string().min(1),
    environment: z.enum(['production', 'sandbox']).optional(),
  })).optional(),
  autoRefresh: z.union([
    z.boolean(),
    z.object({
      enabled: z.boolean().optional(),
      intervalMinutes: z.number().min(1).optional(),
      thresholdMinutes: z.number().min(1).optional(),
      runImmediately: z.boolean().optional(),
    }),
  ]).optional(),
  maxRetries: z.number().min(0).max(10).optional(),
  timeout: z.number().min(1000).max(300000).optional(),
});

// Example usage
const config = oauthSyncConfigSchema.parse({
  storage: 'supabase',
  autoRefresh: true,
  maxRetries: 3,
});
```

## Usage Patterns

### 1. API Route Validation

```typescript
// app/api/tokens/route.ts
import { tokenContextSchema } from '@midday/oauth-sync';
import { oauth } from '@/lib/oauth';

export async function POST(request: Request) {
  const body = await request.json();

  // Validate request body
  const result = tokenContextSchema.safeParse(body);

  if (!result.success) {
    return Response.json({
      error: 'Invalid request',
      issues: result.error.issues
    }, { status: 400 });
  }

  const tokens = await oauth.getTokens(result.data);
  return Response.json({ tokens });
}
```

### 2. Server Action Validation

```typescript
// app/actions.ts
'use server'

import { validateTokenContext } from '@midday/oauth-sync';
import { oauth } from '@/lib/oauth';

export async function getTokensAction(rawContext: unknown) {
  try {
    // Validate and parse
    const context = validateTokenContext(rawContext);
    return await oauth.getTokens(context);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation failed: ${error.message}`);
    }
    throw error;
  }
}
```

### 3. Type Inference

```typescript
import { tokenContextSchema, tokenInfoSchema } from '@midday/oauth-sync';
import { z } from 'zod';

// Infer TypeScript types from schemas
type TokenContext = z.infer<typeof tokenContextSchema>;
type TokenInfo = z.infer<typeof tokenInfoSchema>;

function processTokens(context: TokenContext) {
  // context is fully typed
  console.log(context.userId);
  console.log(context.providers);
}
```

### 4. Custom Validation

```typescript
import { tokenContextSchema } from '@midday/oauth-sync';
import { z } from 'zod';

// Extend base schema
const strictTokenContextSchema = tokenContextSchema.extend({
  userId: z.string().min(1), // Make required
  orgId: z.string().min(1),  // Make required
  providers: z.array(z.enum(['xero', 'quickbooks'])).min(1).max(2),
});

// Refine with custom logic
const businessRuleSchema = tokenContextSchema.refine(
  (data) => data.orgId || data.userId,
  { message: 'Either orgId or userId must be provided' }
);

// Validate
const context = strictTokenContextSchema.parse(input);
```

### 5. Form Validation (React Hook Form)

```typescript
import { tokenContextSchema } from '@midday/oauth-sync';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export function TokenRequestForm() {
  const form = useForm({
    resolver: zodResolver(tokenContextSchema),
    defaultValues: {
      userId: '',
      orgId: '',
      providers: [],
    },
  });

  async function onSubmit(data: z.infer<typeof tokenContextSchema>) {
    const tokens = await getTokensAction(data);
    console.log(tokens);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register('userId')} />
      {form.formState.errors.userId && (
        <span>{form.formState.errors.userId.message}</span>
      )}
      <button type="submit">Submit</button>
    </form>
  );
}
```

### 6. tRPC Integration

```typescript
import { tokenContextSchema } from '@midday/oauth-sync';
import { z } from 'zod';
import { publicProcedure, router } from './trpc';

export const oauthRouter = router({
  getTokens: publicProcedure
    .input(tokenContextSchema)
    .query(async ({ input }) => {
      return await oauth.getTokens(input);
    }),

  getRichTokens: publicProcedure
    .input(tokenContextSchema)
    .query(async ({ input }) => {
      return await oauth.getRichTokens(input);
    }),
});
```

### 7. Environment Variable Validation

```typescript
import { oauthSyncConfigSchema } from '@midday/oauth-sync';
import { z } from 'zod';

// Validate config from env vars
const envSchema = z.object({
  OAUTH_XERO_CLIENT_ID: z.string().min(1),
  OAUTH_XERO_CLIENT_SECRET: z.string().min(1),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_KEY: z.string().min(1),
});

const env = envSchema.parse(process.env);

// Use validated env vars
const config = oauthSyncConfigSchema.parse({
  storage: 'supabase',
  storageConfig: {
    url: env.SUPABASE_URL,
    key: env.SUPABASE_SERVICE_KEY,
  },
  providers: {
    xero: {
      clientId: env.OAUTH_XERO_CLIENT_ID,
      clientSecret: env.OAUTH_XERO_CLIENT_SECRET,
    },
  },
});

export const oauth = new OAuthSync(config);
```

## Helper Functions

OAuth Sync provides helper functions that throw on validation error:

```typescript
import {
  validateTokenContext,
  validateConnectOptions,
  validateOAuthSyncConfig,
} from '@midday/oauth-sync';

// These throw ZodError if validation fails
const context = validateTokenContext(unknownData);
const options = validateConnectOptions(unknownData);
const config = validateOAuthSyncConfig(unknownData);
```

## Error Handling

### Parse (Throws on Error)

```typescript
import { tokenContextSchema } from '@midday/oauth-sync';
import { z } from 'zod';

try {
  const context = tokenContextSchema.parse(input);
  // Valid data
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('Validation failed:', error.errors);
    // [
    //   {
    //     path: ['userId'],
    //     message: 'Expected string, received number',
    //     code: 'invalid_type'
    //   }
    // ]
  }
}
```

### Safe Parse (Returns Result)

```typescript
import { tokenContextSchema } from '@midday/oauth-sync';

const result = tokenContextSchema.safeParse(input);

if (result.success) {
  // result.data is valid
  const tokens = await oauth.getTokens(result.data);
} else {
  // result.error contains validation errors
  console.error('Validation failed:', result.error.issues);
  return Response.json({
    error: 'Invalid request',
    details: result.error.flatten()
  }, { status: 400 });
}
```

## Advanced Patterns

### Conditional Validation

```typescript
import { tokenContextSchema } from '@midday/oauth-sync';
import { z } from 'zod';

const conditionalSchema = tokenContextSchema.refine(
  (data) => {
    // If providers is specified, at least one ID must be present
    if (data.providers && data.providers.length > 0) {
      return data.userId || data.teamId || data.orgId;
    }
    return true;
  },
  {
    message: 'At least one ID (userId, teamId, or orgId) required when providers are specified',
  }
);
```

### Transform Data

```typescript
import { tokenContextSchema } from '@midday/oauth-sync';
import { z } from 'zod';

const transformedSchema = tokenContextSchema.transform((data) => ({
  ...data,
  // Add computed fields
  hasOrg: !!data.orgId,
  hasTeam: !!data.teamId,
  // Normalize providers
  providers: data.providers?.map(p => p.toLowerCase()),
}));

const result = transformedSchema.parse(input);
// result includes original fields + computed fields
```

### Union Types

```typescript
import { z } from 'zod';

// Accept either simple context or strict context
const flexibleContextSchema = z.union([
  tokenContextSchema,
  tokenContextSchema.required(), // All fields required
]);
```

## Best Practices

1. **Validate at boundaries** - Validate all external input (API requests, user input, env vars)
2. **Use safeParse for APIs** - Don't throw 500 errors for validation issues
3. **Extend schemas** - Create strict versions for specific use cases
4. **Type inference** - Use `z.infer<typeof schema>` to derive types
5. **Error messages** - Provide clear, actionable error messages to users
6. **Performance** - Validation is fast, but avoid validating in hot paths

## Migration from Plain Types

```typescript
// Before (TypeScript only - no runtime validation)
interface TokenContext {
  userId?: string;
  teamId?: string;
  orgId?: string;
}

function getTokens(context: TokenContext) {
  // No validation, bugs at runtime
}

// After (TypeScript + Zod - runtime safety)
import { tokenContextSchema } from '@midday/oauth-sync';
import { z } from 'zod';

type TokenContext = z.infer<typeof tokenContextSchema>;

function getTokens(context: unknown) {
  // Validated at runtime
  const validContext = tokenContextSchema.parse(context);
  // Safe to use
}
```

## See Also

- [Zod Documentation](https://zod.dev)
- [React Hook Form + Zod](https://react-hook-form.com/get-started#SchemaValidation)
- [tRPC + Zod](https://trpc.io/docs/server/validators)
- [Next.js Server Actions + Zod](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations#validation)
