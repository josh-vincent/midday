# @midday/actions

Shared Next.js server actions used across dashboard applications.

## Installation

```bash
pnpm add @midday/actions
```

## Usage

### In Server Components

```tsx
// app/customers/page.tsx
import { createCustomer, updateCustomer, deleteCustomer } from '@midday/actions/customer';

export default function CustomersPage() {
  async function handleCreate(formData: FormData) {
    'use server';
    const result = await createCustomer(formData);
    if (result.error) {
      // Handle error
    }
    // Handle success
  }

  return (
    <form action={handleCreate}>
      {/* Form fields */}
    </form>
  );
}
```

### In Client Components

```tsx
// components/customer-form.tsx
'use client';

import { useFormState } from 'react-dom';
import { updateCustomer } from '@midday/actions/customer';

export function CustomerForm({ customerId }: { customerId: string }) {
  const [state, formAction] = useFormState(updateCustomer, null);

  return (
    <form action={formAction}>
      <input type="hidden" name="customerId" value={customerId} />
      {/* Form fields */}
    </form>
  );
}
```

## Available Actions (14 to be migrated)

### Authentication Actions
- `signIn` - User sign in
- `signOut` - User sign out
- `signUp` - User registration
- `resetPassword` - Password reset

### Customer Actions
- `createCustomer` - Create new customer
- `updateCustomer` - Update customer details
- `deleteCustomer` - Delete customer
- `linkJobToCustomer` - Link job to customer

### Billing Actions
- `createCheckoutSession` - Create payment session
- `updateSubscription` - Update subscription
- `cancelSubscription` - Cancel subscription

### Settings Actions
- `updateProfile` - Update user profile
- `updateTeamSettings` - Update team settings
- `updateNotifications` - Update notification preferences

## Action Structure

```
src/
├── auth/
│   ├── sign-in.ts
│   ├── sign-out.ts
│   └── sign-up.ts
├── billing/
│   ├── checkout.ts
│   └── subscription.ts
├── customer/
│   ├── create.ts
│   ├── update.ts
│   └── delete.ts
├── settings/
│   ├── profile.ts
│   └── team.ts
└── index.ts
```

## Error Handling

All actions follow a consistent error handling pattern:

```typescript
type ActionResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };

const result = await createCustomer(formData);
if (result.error) {
  toast.error(result.error);
} else {
  toast.success('Customer created');
  redirect(`/customers/${result.data.id}`);
}
```

## Validation

Actions use Zod schemas for input validation:

```typescript
import { customerSchema } from '@midday/api-schemas/customer';

export async function createCustomer(formData: FormData) {
  const parsed = customerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    // ...
  });

  if (!parsed.success) {
    return { data: null, error: parsed.error.message };
  }

  // Process valid data
}
```

## Migration Status

- [ ] Phase 1: Auth actions (0/4)
- [ ] Phase 2: Customer actions (0/4)
- [ ] Phase 3: Billing actions (0/3)
- [ ] Phase 4: Settings actions (0/3)

Total: 0/14 actions migrated

## Dependencies

- `@midday/api-schemas` - Validation schemas
- `@midday/db` - Database operations
- `@midday/supabase` - Authentication
- `@midday/utils` - Utility functions
- `next-safe-action` - Type-safe actions
- `zod` - Schema validation