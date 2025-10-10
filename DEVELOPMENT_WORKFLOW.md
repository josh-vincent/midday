# Development Workflow for Shared Packages

## 🚀 Quick Start

### Install Dependencies
```bash
bun install
```

### Development Commands

#### Working on Everything
```bash
# Start all apps and packages in dev mode
pnpm dev

# Build everything
pnpm build

# Type check everything
pnpm typecheck
```

#### Working on Packages Only
```bash
# Develop packages with hot reload
pnpm dev:packages

# Build all packages
pnpm build:packages

# Test all packages
pnpm test:packages

# Type check packages
pnpm typecheck:packages
```

#### Working on Specific Apps
```bash
# Dashboard only
pnpm dev:dashboard

# Pivot Dashboard only
pnpm dev:pivot-dashboard

# API only
pnpm dev:api

# Pivot API only
pnpm dev:pivot-api

# Both pivot apps
pnpm dev:pivot
```

## 🔄 Migration Workflow

### Step 1: Choose Component to Migrate

1. Check `MIGRATION_CHECKLIST.md` for next component
2. Verify component is identical in both apps:
```bash
diff apps/dashboard/src/components/[component].tsx \
     apps/pivot-dashboard/src/components/[component].tsx
```

### Step 2: Copy to Shared Package

```bash
# Copy component to shared package
cp apps/dashboard/src/components/animated-number.tsx \
   packages/dashboard-components/src/components/

# If component has dependencies, copy those too
cp -r apps/dashboard/src/components/charts \
      packages/dashboard-components/src/components/
```

### Step 3: Update Package Exports

Edit `packages/dashboard-components/package.json`:
```json
"exports": {
  "./animated-number": "./src/components/animated-number.tsx"
}
```

Edit `packages/dashboard-components/src/index.ts`:
```typescript
export * from './components/animated-number';
```

### Step 4: Update Imports in Apps

Find all uses:
```bash
# Find in dashboard
grep -r "components/animated-number" apps/dashboard/src

# Find in pivot-dashboard
grep -r "components/animated-number" apps/pivot-dashboard/src
```

Update imports:
```typescript
// Before
import AnimatedNumber from '@/components/animated-number';

// After
import { AnimatedNumber } from '@midday/dashboard-components';
```

### Step 5: Test Changes

```bash
# Start both dashboards to test
pnpm dev:dashboard  # In one terminal
pnpm dev:pivot-dashboard  # In another terminal

# Run type checking
pnpm typecheck

# Run tests if available
pnpm test
```

### Step 6: Remove Original Files

```bash
# After confirming everything works
rm apps/dashboard/src/components/animated-number.tsx
rm apps/pivot-dashboard/src/components/animated-number.tsx
```

### Step 7: Commit Changes

```bash
git add .
git commit -m "refactor: migrate animated-number to shared package"
```

## 📦 Creating New Shared Components

### For New Components in Shared Packages

1. **Create the component:**
```bash
touch packages/dashboard-components/src/components/new-component.tsx
```

2. **Add to exports in package.json:**
```json
"./new-component": "./src/components/new-component.tsx"
```

3. **Export from index.ts:**
```typescript
export * from './components/new-component';
```

4. **Use in your app:**
```typescript
import { NewComponent } from '@midday/dashboard-components';
```

## 🔍 Debugging

### Component Not Found
```bash
# Check if package is linked
ls -la node_modules/@midday/dashboard-components

# Reinstall dependencies
bun install

# Clear cache and rebuild
pnpm clean:workspaces
bun install
pnpm build:packages
```

### Type Errors
```bash
# Check specific package types
pnpm typecheck --filter=@midday/dashboard-components

# Check consuming app
pnpm typecheck --filter=@midday/dashboard
```

### Import Resolution Issues
1. Check package.json exports are correct
2. Verify tsconfig paths are set up
3. Restart TypeScript server in VS Code: `Cmd+Shift+P` → "Restart TS Server"

## 🏗️ Build Pipeline

### Dependency Graph
```
@midday/ui
    ↓
@midday/dashboard-components
    ↓
@midday/dashboard & @midday/pivot-dashboard
```

### Build Order
Turbo automatically handles build order based on dependencies. Packages are built before apps that depend on them.

### Caching
Turbo caches builds. To clear cache:
```bash
# Clear turbo cache
rm -rf .turbo

# Clear all node_modules and reinstall
pnpm clean
bun install
```

## 🧪 Testing Strategy

### Unit Tests
```bash
# Test specific package
pnpm test --filter=@midday/dashboard-components

# Test with coverage
pnpm test:coverage --filter=@midday/api-core
```

### Integration Tests
```bash
# Test apps with shared packages
pnpm test --filter=@midday/dashboard
pnpm test --filter=@midday/pivot-dashboard
```

### E2E Tests
```bash
# Run E2E tests after migration
pnpm test:e2e
```

## 📝 Documentation

### When Adding New Components
1. Update package README.md with usage examples
2. Add JSDoc comments to exported functions
3. Update migration tracker in ALIGNMENT_PLAN.md

### Component Documentation Template
```typescript
/**
 * AnimatedNumber - Smoothly animates number changes
 *
 * @example
 * ```tsx
 * <AnimatedNumber value={1234} duration={500} />
 * ```
 *
 * @param value - The number to display
 * @param duration - Animation duration in ms (default: 300)
 */
export function AnimatedNumber({ value, duration = 300 }: Props) {
  // ...
}
```

## 🚨 Common Issues & Solutions

### Issue: "Module not found"
**Solution:** Run `bun install` and restart dev server

### Issue: "Type error after migration"
**Solution:** Check that all imports are updated and run `pnpm typecheck:packages`

### Issue: "Styles not applying"
**Solution:** Ensure Tailwind config includes package paths:
```javascript
content: [
  './packages/dashboard-components/src/**/*.tsx',
  // ... other paths
]
```

### Issue: "Hot reload not working"
**Solution:** Check that the package is in watch mode:
```bash
pnpm dev:packages
```

## 🎯 Best Practices

1. **Always test in both apps** after migration
2. **Keep commits atomic** - one component per commit
3. **Update documentation** as you go
4. **Run type check** before committing
5. **Check for duplicate dependencies** with `manypkg check`
6. **Use workspace protocol** for internal dependencies: `"workspace:*"`

## 📊 Monitoring Progress

Check migration progress:
```bash
# Count migrated components
ls packages/dashboard-components/src/components | wc -l

# Check remaining duplicates
comm -12 <(ls apps/dashboard/src/components | sort) \
         <(ls apps/pivot-dashboard/src/components | sort) | wc -l
```

## 🔗 Related Documents

- [ALIGNMENT_PLAN.md](./ALIGNMENT_PLAN.md) - Overall migration strategy
- [MIGRATION_CHECKLIST.md](./MIGRATION_CHECKLIST.md) - Component-by-component checklist
- [SHARED_PACKAGES_GUIDE.md](./SHARED_PACKAGES_GUIDE.md) - Package usage guide