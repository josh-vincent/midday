# Shared Packages Integration Guide

## 📊 Current State Analysis

### Migration Status
- **Packages Created**: ✅ 10 shared packages
- **Components Migrated**: ❌ 0/215 (pending)
- **Routers Migrated**: ❌ 0/23 (pending)
- **Actions Migrated**: ❌ 0/14 (pending)

### Feature Distribution
**Normal Dashboard/API**: Base features
**Pivot Dashboard/API**: Base features + 32 additional components + 14 additional routers

### Unique Features by App

#### Pivot-Only Features (Keep Separate)
- **Components** (32 unique):
  - Accounting: `accounting-connections.tsx`, `connect-quickbooks.tsx`, `connect-xero.tsx`
  - Banking: `bank-account-list.tsx`, `bank-logo.tsx`, `add-account-button.tsx`
  - Transactions: `add-transactions.tsx`, `transaction-*` components
  - OAuth: `oauth-integrations.tsx`, `google-sign-in.tsx`, `microsoft-sign-in.tsx`
  - Assistant: `assistant/`, `chat/` directories
  - Email: `email/` directory
  - Time Tracking: `open-tracker-sheet.tsx`, `tracker-*` components

- **API Routers** (14 unique):
  - `accounting-connections.ts`
  - `bank-accounts.ts`
  - `transactions.ts`, `transaction-*.ts`
  - `tracker-entries.ts`, `tracker-projects.ts`
  - `oauth-applications.ts`
  - `documents.ts`, `emails.ts`, `inbox.ts`
  - `search.ts`

#### Dashboard-Only Features (2 components)
- `accept-invite-code.tsx` (should be shared)
- `rego-input.tsx`

## 📦 Package Usage Guide

### 1. @midday/dashboard-components
**Purpose**: Shared UI components for dashboards

**Usage in Your App**:
```tsx
// apps/dashboard/src/components/some-feature.tsx
import { AmountRange, AnimatedNumber } from '@midday/dashboard-components';
import { AvatarUpload } from '@midday/dashboard-components/avatar-upload';

// Use the component
<AmountRange onChange={handleChange} value={range} />
```

**Installation**:
```json
// apps/dashboard/package.json
"dependencies": {
  "@midday/dashboard-components": "workspace:*"
}
```

### 2. @midday/api-core
**Purpose**: Shared tRPC routers and API logic

**Usage in Your API**:
```typescript
// apps/api/src/trpc/routers/_app.ts
import { billingRouter } from '@midday/api-core/routers/billing';
import { customersRouter } from '@midday/api-core/routers/customers';

export const appRouter = router({
  billing: billingRouter,
  customers: customersRouter,
  // Add app-specific routers here
});
```

### 3. @midday/api-schemas
**Purpose**: Shared Zod schemas for type safety

**Usage**:
```typescript
// In any package or app
import { customerSchema, invoiceSchema } from '@midday/api-schemas';
import type { Customer, Invoice } from '@midday/api-schemas';

// Use for validation
const validatedCustomer = customerSchema.parse(data);
```

### 4. @midday/actions
**Purpose**: Shared server actions for Next.js

**Usage in Your Dashboard**:
```typescript
// apps/dashboard/src/app/page.tsx
import { updateCustomer, deleteInvoice } from '@midday/actions/customer';

async function handleSubmit(formData: FormData) {
  'use server';
  await updateCustomer(formData);
}
```

### 5. @midday/hooks
**Purpose**: Shared React hooks

**Usage**:
```typescript
import { useDebounce, useLocalStorage } from '@midday/hooks';

function MyComponent() {
  const [value, setValue] = useLocalStorage('key', 'default');
  const debouncedSearch = useDebounce(searchTerm, 500);
}
```

### 6. Feature Packages
Each feature package (@midday/customer-management, @midday/billing-core, etc.) contains:
- Components specific to that domain
- Actions for server-side operations
- Hooks for stateful logic
- Schemas for validation
- Utils for helper functions

**Example Usage**:
```typescript
import {
  CustomerList,
  CustomerForm,
  useCustomerData,
  createCustomer
} from '@midday/customer-management';
```

## 🚀 Migration Steps (Next Actions)

### Phase 1: Core Components (Week 1)
1. **Start with simple, identical components**:
   ```bash
   # Example migration for animated-number.tsx
   cp apps/dashboard/src/components/animated-number.tsx \
      packages/dashboard-components/src/components/

   # Update imports in both apps
   # From: import AnimatedNumber from '@/components/animated-number'
   # To: import { AnimatedNumber } from '@midday/dashboard-components'
   ```

2. **Components to migrate first** (no dependencies):
   - [ ] animated-number.tsx
   - [ ] color-picker.tsx
   - [ ] avatar-upload.tsx
   - [ ] attachment-item.tsx
   - [ ] category.tsx

### Phase 2: Complex Components (Week 2)
3. **Migrate components with dependencies**:
   - [ ] Charts directory (entire folder)
   - [ ] Base-currency directory
   - [ ] Settings components

### Phase 3: API Logic (Week 3)
4. **Extract tRPC routers**:
   ```typescript
   // Move from apps/api/src/trpc/routers/customers.ts
   // To packages/api-core/src/routers/customers.ts
   // Update imports in _app.ts
   ```

### Phase 4: Testing & Validation (Week 4)
5. **Verify everything works**:
   - Run type checking: `pnpm typecheck`
   - Run tests: `pnpm test`
   - Build all apps: `pnpm build`

## 🏗️ Build Configuration

### Add to Turbo Pipeline
```json
// turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "@midday/dashboard-components#build": {
      "dependsOn": ["@midday/ui#build"]
    },
    "@midday/api-core#build": {
      "dependsOn": ["@midday/api-schemas#build"]
    }
  }
}
```

## 🔧 Development Workflow

### For Component Development
```bash
# 1. Make changes in the shared package
cd packages/dashboard-components
pnpm dev

# 2. Test in your app (hot reload works)
cd apps/dashboard
pnpm dev

# 3. Once satisfied, commit
git add .
git commit -m "feat: migrate animated-number to shared package"
```

### For Adding New Shared Components
```bash
# 1. Create component in shared package
touch packages/dashboard-components/src/components/new-component.tsx

# 2. Add export to package.json
# 3. Add export to index.ts
# 4. Use in your app
```

## 📊 Success Metrics

### Before Migration
- **Duplicate files**: 252
- **Maintenance overhead**: High (update in 2 places)
- **Risk of divergence**: High

### After Migration (Target)
- **Duplicate files**: 0
- **Maintenance overhead**: Low (single source of truth)
- **Risk of divergence**: None
- **Bundle size**: Reduced by ~40%
- **Build time**: Improved by ~30%

## ⚠️ Important Considerations

### 1. Feature Flags
For pivot-specific features, consider using feature flags:
```typescript
// In shared component
export function DashboardLayout({ features }: { features?: Features }) {
  return (
    <>
      {features?.banking && <BankingSection />}
      {features?.accounting && <AccountingSection />}
      <CommonSection />
    </>
  );
}
```

### 2. Gradual Migration
- Don't migrate everything at once
- Test each migration thoroughly
- Keep a rollback plan

### 3. Version Management
- Keep all packages at same version initially
- Use workspace protocol for internal deps
- Consider independent versioning later

## 🎯 Next Immediate Steps

1. **Choose 5 simple components to migrate first**
2. **Set up one complete example** (e.g., animated-number)
3. **Document the process**
4. **Create a PR template for migrations**
5. **Establish testing protocol**

## 📚 Resources

- [Turbo Repo Docs](https://turbo.build/repo/docs)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Next.js App Router](https://nextjs.org/docs/app)
- [tRPC Best Practices](https://trpc.io/docs/best-practices)