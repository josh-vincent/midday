# Old Invoice Components

**⚠️ DEPRECATED - DO NOT USE**

These files have been moved to the `@midday/invoice-components` package.

## Migration Date
September 29, 2025

## What Happened
All 30 invoice form components were extracted into a reusable package to enable:
- Code reuse across multiple apps (dashboard, mobile, admin)
- Better maintainability
- Centralized invoice UI logic
- Independent versioning

## New Location
These components are now in:
```
packages/invoice-components/src/components/form/
```

## How to Use
Import from the package instead:

```typescript
// OLD (deprecated)
import { Form } from "@/components/invoice/form";
import { LineItems } from "@/components/invoice/line-items";

// NEW (correct)
import { Form, LineItems } from "@midday/invoice-components/form";
```

## Files Moved (30 total)

### Core Form
- `form.tsx`
- `form-context.tsx`
- `submit-button.tsx`
- `settings-menu.tsx`

### Input Components
- `input.tsx`
- `amount-input.tsx`
- `quantity-input.tsx`
- `label-input.tsx`
- `vat-input.tsx`
- `tax-input.tsx`

### Section Components
- `customer-details.tsx`
- `from-details.tsx`
- `line-items.tsx`
- `payment-details.tsx`
- `note-details.tsx`
- `summary.tsx`

### Line Item Components
- `product-search.tsx`
- `description.tsx`
- `description-with-job-search.tsx`

### Metadata Components
- `meta.tsx`
- `invoice-no.tsx`
- `invoice-title.tsx`
- `issue-date.tsx`
- `due-date.tsx`
- `logo.tsx`

### Utility Components
- `utils.ts`
- `edit-block.tsx`
- `editor.tsx`
- `activity.tsx`
- `template-selector.tsx`

## When to Delete
These files can be safely deleted once all imports have been updated to use the package.

To verify no remaining imports:
```bash
grep -r "from \"@/components/invoice/" apps/dashboard/src/
```

## Package Documentation
See `packages/invoice-components/README.md` for full documentation.