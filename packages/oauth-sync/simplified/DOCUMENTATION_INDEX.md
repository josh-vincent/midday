# Documentation Index

## ✅ Current Documentation (v3 API)

These documents reflect the latest v3 Stripe-like API:

### Core Documentation
1. **[README.md](./README.md)** - Main package documentation with v3 API
2. **[STRIPE_LIKE_API.md](./STRIPE_LIKE_API.md)** - Complete v3 API reference
3. **[DATA_SYNC_GUIDE.md](./DATA_SYNC_GUIDE.md)** - Three data sync strategies
4. **[ZOD_VALIDATION.md](./ZOD_VALIDATION.md)** - Runtime validation with Zod
5. **[B2B_PATTERNS.md](./B2B_PATTERNS.md)** - Enterprise OAuth patterns
6. **[CONNECTION_EXAMPLES.md](./CONNECTION_EXAMPLES.md)** - Real-world examples

### Examples
7. **[examples/nextjs/README.md](./examples/nextjs/README.md)** - Complete Next.js v3 example
8. **[examples/schema/README.md](./examples/schema/README.md)** - Database schemas

## 📝 Additional Documentation

**MIGRATION.md** - Available for v2→v3 migration (needs updating)

## Documentation Quick Reference

### I want to...

**Get started with v3**
→ Read [README.md](./README.md)

**Understand the complete API**
→ Read [STRIPE_LIKE_API.md](./STRIPE_LIKE_API.md)

**Set up data syncing**
→ Read [DATA_SYNC_GUIDE.md](./DATA_SYNC_GUIDE.md)

**Add runtime validation**
→ Read [ZOD_VALIDATION.md](./ZOD_VALIDATION.md)

**Build a Next.js app**
→ Read [examples/nextjs/README.md](./examples/nextjs/README.md)

**Implement B2B/Enterprise patterns**
→ Read [B2B_PATTERNS.md](./B2B_PATTERNS.md)

**See real-world examples**
→ Read [CONNECTION_EXAMPLES.md](./CONNECTION_EXAMPLES.md)

**Migrate from v2**
→ Read [STRIPE_LIKE_API.md#migration-from-v2](./STRIPE_LIKE_API.md#migration-from-v2)

## What Changed in v3?

### API Changes
- ❌ `createOAuth()` with destructured exports → ✅ `new OAuthSync()` single instance
- ❌ Manual token refresh setup → ✅ Built-in auto-refresh
- ❌ Filter connections array → ✅ Direct token access (`tokens.xero`)
- ❌ Callbacks (`onConnect`, `onSync`) → ✅ Events (`oauth.on('event', handler)`)
- ✅ Added `getRichTokens()` for scopes/permissions
- ✅ Added Zod schemas for all types
- ✅ Added three data sync strategies

### Documentation Structure
- **Before**: 10+ docs covering different patterns
- **After**: 6 core docs covering v3 API only
- **Result**: Clearer, focused documentation


## Test Status

✅ All core tests passing (7 test files in `core/test/`)
- TokenSyncManager tests ✅
- Provider tests (Xero, QuickBooks, Outlook, Gmail) ✅
- Storage adapter tests ✅
- Custom provider tests ✅

No tests exist in simplified package - all testing is in core.

## Status

1. ✅ Main README updated to v3 API
2. ✅ Comprehensive v3 documentation created
3. ✅ All tests passing
4. ✅ Outdated docs removed
5. ⚠️ MIGRATION.md available but needs updating for v2→v3

## Support

Questions? Check:
- [Main README](./README.md) for quick start
- [STRIPE_LIKE_API.md](./STRIPE_LIKE_API.md) for complete API
- [GitHub Issues](https://github.com/midday/oauth-sync/issues)
