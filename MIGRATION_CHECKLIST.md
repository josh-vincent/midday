# Migration Checklist

## 🎯 Quick Start - First 5 Components to Migrate

These components have no dependencies and are identical in both apps:

### 1. animated-number.tsx ✅
- [x] Copy from `apps/dashboard/src/components/animated-number.tsx`
- [x] Place in `packages/dashboard-components/src/components/animated-number.tsx`
- [x] Update imports in `apps/dashboard`
- [x] Update imports in `apps/pivot-dashboard`
- [x] Test both dashboards
- [x] Keep wrapper for app-specific logic (useUserQuery)

### 2. color-picker.tsx ✅
- [x] Copy component
- [x] Add to shared package
- [x] Update imports
- [x] Test
- [x] Re-export from shared package

### 3. attachment-item.tsx ✅
- [x] Copy component with props for app-specific deps
- [x] Add to shared package
- [x] Update imports
- [x] Test
- [x] Keep wrapper for app-specific logic (useDocumentParams, FilePreview)

### 4. category.tsx ✅
- [x] Copy component
- [x] Add to shared package
- [x] Update imports
- [x] Test
- [x] Re-export from shared package

### 5. avatar-upload.tsx
- [ ] Copy component
- [ ] Add to shared package
- [ ] Update imports
- [ ] Test
- [ ] Remove originals

## 📋 Migration Process Template

For each component/router/action:

```bash
# 1. Copy the file
cp apps/dashboard/src/components/[component].tsx \
   packages/dashboard-components/src/components/

# 2. Update package.json exports
# Add to packages/dashboard-components/package.json:
"./[component]": "./src/components/[component].tsx"

# 3. Find all imports
grep -r "components/[component]" apps/dashboard/src
grep -r "components/[component]" apps/pivot-dashboard/src

# 4. Update imports in both apps
# From: import Component from '@/components/[component]'
# To: import { Component } from '@midday/dashboard-components'

# 5. Test
cd apps/dashboard && pnpm dev
cd apps/pivot-dashboard && pnpm dev

# 6. Remove original files
rm apps/dashboard/src/components/[component].tsx
rm apps/pivot-dashboard/src/components/[component].tsx
```

## 🔍 Pre-Migration Checks

Before starting migration:
- [ ] All packages have been created
- [ ] TypeScript configs are in place
- [ ] Package.json files are configured
- [ ] Build system recognizes new packages

## 📊 Component Migration Tracker

### Simple Components (No Dependencies) - 50 total
- [x] animated-number.tsx ✅
- [x] color-picker.tsx ✅
- [x] attachment-item.tsx ✅
- [x] category.tsx ✅
- [ ] avatar-upload.tsx
- [ ] amount-range.tsx
- [ ] assign-user.tsx
- [x] assigned-user.tsx ✅
- [x] change-theme.tsx ✅
- [x] theme-switch.tsx ✅
- [ ] company-country.tsx
- [ ] ... (40 more)

### Chart Components - 25 total
- [ ] average-days-to-payment.tsx
- [ ] average-invoice-size.tsx
- [ ] charts/* (entire directory)
- [ ] ... (20 more)

### Complex Components (With Dependencies) - 140 total
- [ ] app-settings.tsx
- [ ] apps.tsx
- [ ] billing-orders.tsx
- [ ] billing-subscriptions.tsx
- [ ] ... (136 more)

## 🚀 tRPC Router Migration Tracker

### Core Routers (High Priority) - 6 total
- [ ] billing.ts
- [ ] customers.ts (with tests)
- [ ] invoice.ts (with tests)
- [ ] job.ts (with tests)
- [ ] team.ts (with tests)
- [ ] user.ts (with tests)

### Support Routers - 17 total
- [ ] api-keys.ts
- [ ] invoice-products.ts
- [ ] invoice-template.ts (with tests)
- [ ] pricing.ts
- [ ] reports.ts
- [ ] short-links.ts (with tests)
- [ ] tags.ts
- [ ] ... (10 more)

## 🎬 Action Migration Tracker

### Auth Actions - 4 total
- [ ] sign-in action
- [ ] sign-out action
- [ ] sign-up action
- [ ] reset-password action

### Customer Actions - 4 total
- [ ] create-customer action
- [ ] update-customer action
- [ ] delete-customer action
- [ ] link-job-to-customer action

### Billing Actions - 3 total
- [ ] create-checkout-session action
- [ ] update-subscription action
- [ ] cancel-subscription action

### Settings Actions - 3 total
- [ ] update-profile action
- [ ] update-team-settings action
- [ ] update-notifications action

## ✅ Verification Steps

After each migration phase:

1. **Type Checking**
   ```bash
   pnpm typecheck
   ```

2. **Linting**
   ```bash
   pnpm lint
   ```

3. **Build Test**
   ```bash
   pnpm build
   ```

4. **Runtime Test**
   ```bash
   # Start both apps
   pnpm dev
   # Test migrated functionality
   ```

5. **Import Verification**
   ```bash
   # Ensure no old imports remain
   grep -r "@/components/[migrated-component]" apps/
   # Should return no results
   ```

## 📈 Progress Tracking

| Package | Total | Migrated | Percentage |
|---------|-------|----------|------------|
| dashboard-components | 215 | 7 | 3.3% |
| api-core routers | 23 | 0 | 0% |
| actions | 14 | 0 | 0% |
| **Total** | **252** | **7** | **2.8%** |

## 🎯 Success Criteria

- [ ] All 215 shared components migrated
- [ ] All 23 shared routers migrated
- [ ] All 14 shared actions migrated
- [ ] Both dashboards build successfully
- [ ] Both APIs build successfully
- [ ] All tests pass
- [ ] No duplicate code remains
- [ ] Documentation updated

## 📝 Notes

- Start with components that have no dependencies
- Test after each migration
- Commit frequently with clear messages
- Update this checklist as you progress
- If a component has different implementations, investigate before migrating