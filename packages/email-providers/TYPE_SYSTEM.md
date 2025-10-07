# Email Providers Type System

This package uses a dual-type system for maximum type safety and runtime validation.

## Architecture

### 1. TypeScript Interfaces (`types.ts`)
Compile-time type checking for development.

**Exported interfaces:**
- `EmailMessage` - Email data structure
- `EmailAddress` - Email address with optional name
- `EmailAttachment` - File attachment metadata
- `EmailSyncOptions` - Parameters for syncing emails
- `EmailSyncResult` - Results from sync operations
- `EmailFolder` - Email folder/label structure
- `EmailThread` - Email thread/conversation
- `EmailSearchOptions` - Search parameters
- `EmailBatchOperation` - Batch operation configuration
- `EmailQuota` - Storage quota information
- `EmailWatchOptions` - Webhook subscription options
- `GmailCredentials` - Gmail OAuth credentials
- `OutlookCredentials` - Outlook OAuth credentials
- `EmailConfig` - Provider configuration (with Zod)

### 2. Zod Schemas (`schemas.ts`)
Runtime validation for API responses and user input.

**Exported schemas:**
- `emailMessageSchema` - Validates email structure
- `emailAddressSchema` - Validates email addresses
- `emailAttachmentSchema` - Validates attachments
- `emailSyncOptionsSchema` - Validates sync parameters
- `emailSyncResultSchema` - Validates sync results (includes `emails` array)
- `emailFolderSchema` - Validates folder data
- `emailThreadSchema` - Validates thread data
- `emailSearchOptionsSchema` - Validates search params
- `emailBatchOperationSchema` - Validates batch operations
- `emailWatchOptionsSchema` - Validates watch subscriptions
- `emailWatchResultSchema` - Validates watch results
- `gmailCredentialsSchema` - Validates Gmail credentials
- `outlookCredentialsSchema` - Validates Outlook credentials
- `syncedEmailSchema` - Validates database records

**Unique types from schemas:**
- `EmailWatchResult` - Watch subscription result (not in types.ts)
- `SyncedEmail` - Database schema (not in types.ts)

## Usage

### TypeScript Development
```typescript
import type { EmailMessage, EmailSyncOptions } from "@midday/email-providers";

// Type-safe function
async function processEmail(email: EmailMessage) {
  // TypeScript ensures email has all required fields
  console.log(email.subject, email.from);
}
```

### Runtime Validation
```typescript
import { emailSyncResultSchema } from "@midday/email-providers";

// Validate API response at runtime
const result = await gmailProvider.syncEmails(options);
const validated = emailSyncResultSchema.parse(result); // Throws if invalid

// Safe parse (returns success/error)
const parseResult = emailSyncResultSchema.safeParse(result);
if (!parseResult.success) {
  console.error("Invalid result:", parseResult.error);
}
```

### Both Together
```typescript
import type { EmailSyncOptions } from "@midday/email-providers";
import { emailSyncOptionsSchema, emailSyncResultSchema } from "@midday/email-providers";

async function syncEmails(options: EmailSyncOptions) {
  // 1. Runtime validation of input
  const validatedOptions = emailSyncOptionsSchema.parse(options);

  // 2. Call provider
  const result = await provider.syncEmails(validatedOptions);

  // 3. Runtime validation of output
  const validatedResult = emailSyncResultSchema.parse(result);

  // 4. TypeScript knows the shape
  return validatedResult.emails; // EmailMessage[] | undefined
}
```

## Key Features

### For Gmail Provider ✅
- Full type coverage for all methods
- Zod validation for API responses
- Includes: `threadId`, `receivedAt`, `isRead`, `hasAttachments`, `bodyPreview`, `labels`

### For Outlook Provider ✅
- Full type coverage for all methods
- Zod validation for API responses
- Includes: `threadId` (conversationId), `receivedAt`, `isRead`, `hasAttachments`, `bodyPreview`, `folder`

### Database Schema ✅
- `syncedEmailSchema` validates records before insertion
- Matches the `synced_emails` table structure
- All fields properly typed and validated

## Example: End-to-End Type Safety

```typescript
import { GmailProvider } from "@midday/email-providers";
import { emailSyncResultSchema } from "@midday/email-providers";
import type { EmailSyncOptions } from "@midday/email-providers";

// 1. Type-safe options (compile-time)
const options: EmailSyncOptions = {
  teamId: "uuid-here",
  userId: "uuid-here",
  provider: "gmail",
  credentials: { /* ... */ },
  maxResults: 10,
  syncSent: true,
};

// 2. Call provider
const provider = new GmailProvider(credentials);
const result = await provider.syncEmails(options);

// 3. Runtime validation
const validated = emailSyncResultSchema.parse(result);

// 4. Type-safe processing
if (validated.emails) {
  for (const email of validated.emails) {
    // TypeScript knows all fields exist
    console.log(email.subject, email.from, email.receivedAt);
  }
}
```

## Benefits

1. **Compile-Time Safety**: TypeScript catches errors during development
2. **Runtime Safety**: Zod catches malformed API responses in production
3. **Auto-Complete**: Full IntelliSense support in VS Code
4. **Self-Documenting**: Types serve as documentation
5. **Validation**: Input/output validation prevents bugs
6. **Consistency**: Same types across client and server
