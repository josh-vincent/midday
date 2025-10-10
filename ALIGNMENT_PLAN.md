# Dashboard & API Alignment Plan

## Overview
This document outlines the step-by-step plan to consolidate duplicate code between our dashboard/api and pivot-dashboard/pivot-api applications by creating shared packages.

## Phase 1: Package Creation (Setup Only)
Create the following shared packages without implementation:

### 1. Component Packages
- `@midday/dashboard-components` - Shared dashboard-specific UI components
- `@midday/api-core` - Shared tRPC routers and API logic
- `@midday/api-schemas` - Shared Zod schemas and types
- `@midday/actions` - Shared server actions
- `@midday/hooks` - Shared React hooks

### 2. Feature Packages
- `@midday/customer-management` - Customer domain logic
- `@midday/job-management` - Job handling (enhance existing)
- `@midday/billing-core` - Billing and subscription logic
- `@midday/reporting` - Reports and analytics
- `@midday/authentication` - Auth flows and guards

## Phase 2: Component Migration

### Shared Components to Extract (215 total)
These components exist identically in both `apps/dashboard/src/components` and `apps/pivot-dashboard/src/components`:

#### High Priority Components (Core UI)
- [ ] `accept-invite-code.tsx`
- [ ] `amount-range.tsx`
- [ ] `animated-number.tsx`
- [ ] `app-settings.tsx`
- [ ] `app.tsx`
- [ ] `apps-header.tsx`
- [ ] `apps-tabs.tsx`
- [ ] `apps.skeleton.tsx`
- [ ] `apps.tsx`
- [ ] `assign-user.tsx`
- [ ] `assigned-user.tsx`
- [ ] `attachment-item.tsx`
- [ ] `auth-provider.tsx`
- [ ] `avatar-upload.tsx`

#### Chart Components
- [ ] `average-days-to-payment.tsx`
- [ ] `average-invoice-size.tsx`
- [ ] `charts/` (entire directory)

#### Billing Components
- [ ] `billing-orders.tsx`
- [ ] `billing-subscriptions.tsx`
- [ ] `checkout-success-desktop.tsx`
- [ ] `choose-plan-button.tsx`

#### Settings Components
- [ ] `change-email.tsx`
- [ ] `change-theme.tsx`
- [ ] `change-timezone.tsx`
- [ ] `company-country.tsx`
- [ ] `base-currency/` (entire directory)

#### Data Management Components
- [ ] `bulk-actions.tsx`
- [ ] `bulk-link-jobs-dialog.tsx`
- [ ] `category.tsx`
- [ ] `color-picker.tsx`

### Shared tRPC Routers (23 total)
These routers exist in both `apps/api/src/trpc/routers` and `apps/pivot-api/src/trpc/routers`:

#### Core Routers
- [ ] `_app.ts`
- [ ] `api-keys.ts`
- [ ] `billing.ts`
- [ ] `customers.ts` (with tests)
- [ ] `invoice-products.ts`
- [ ] `invoice-template.ts` (with tests)
- [ ] `invoice.ts` (with tests)
- [ ] `job-enhanced.ts`
- [ ] `job.ts` (with tests)
- [ ] `pricing.ts`
- [ ] `reports.ts`
- [ ] `short-links.ts` (with tests)
- [ ] `tags.ts`
- [ ] `team.ts` (with tests)
- [ ] `user.ts` (with tests)

### Shared Actions (14 total)
These actions exist in both `apps/dashboard/src/actions` and `apps/pivot-dashboard/src/actions`:

- [ ] List to be determined after directory inspection

## Phase 3: Implementation Strategy

### Step 1: Component Extraction
1. Create component in `@midday/dashboard-components`
2. Update imports in both dashboards
3. Test functionality
4. Remove duplicates

### Step 2: Router Consolidation
1. Extract router logic to `@midday/api-core`
2. Create shared middleware
3. Update both APIs to use shared routers
4. Test endpoints

### Step 3: Schema Unification
1. Move Zod schemas to `@midday/api-schemas`
2. Update imports across all packages
3. Ensure type safety

### Step 4: Action Consolidation
1. Move server actions to `@midday/actions`
2. Update dashboard imports
3. Test server-side functionality

## Phase 4: Testing & Validation

### Testing Checklist
- [ ] All shared components render correctly
- [ ] API endpoints maintain compatibility
- [ ] Type checking passes
- [ ] Build processes complete
- [ ] No runtime errors
- [ ] Performance metrics maintained

## Phase 5: Cleanup

### Tasks
- [ ] Remove duplicate files
- [ ] Update documentation
- [ ] Update CI/CD pipelines
- [ ] Update developer setup guides

## Metrics

### Before
- Duplicate components: 215
- Duplicate routers: 23
- Duplicate actions: 14
- Total duplicate files: ~252

### After (Expected)
- Duplicate components: 0
- Duplicate routers: 0
- Duplicate actions: 0
- Shared packages: 10
- Code reduction: ~70%

## Migration Order

1. **Week 1**: Set up packages, migrate simple components
2. **Week 2**: Migrate complex components and charts
3. **Week 3**: Consolidate API routers
4. **Week 4**: Unify schemas and actions
5. **Week 5**: Testing and cleanup

## Success Criteria

- ✅ All duplicate code eliminated
- ✅ Both apps use shared packages
- ✅ No functionality regression
- ✅ Improved build times
- ✅ Easier maintenance
- ✅ Clear separation of concerns

## Notes

### Package Naming Convention
- Core packages: `@midday/[function]-core`
- UI packages: `@midday/[domain]-components`
- Feature packages: `@midday/[feature]-management`
- Utility packages: `@midday/[utility]`

### Version Management
- All packages start at version 1.0.0
- Use workspace protocol for internal dependencies
- Semantic versioning for updates

### Development Workflow
1. Create feature branch for each migration
2. Implement in shared package
3. Update consuming applications
4. Test thoroughly
5. Create PR with migration checklist
6. Merge after review

## Next Steps

1. Create package directories
2. Set up package.json files
3. Configure TypeScript
4. Set up build processes
5. Begin component migration