# Old Sheet Components

**⚠️ BACKUP ONLY**

These are backup copies of the original sheet components before they were refactored to use `@midday/invoice-components`.

## Files
- `invoice-sheet.tsx.old` - Original full implementation
- `invoice-content.tsx.old` - Original content wrapper

## What Changed
The sheet components were refactored to use the package:
- Logic moved to `@midday/invoice-components/src/components/sheet/`
- Current files in `/components/sheets/` and `/components/` are now thin wrappers
- They provide app-specific dependencies (tRPC, router) to the package components

## Current Implementation
See:
- `/apps/dashboard/src/components/sheets/invoice-sheet.tsx` (wrapper)
- `/apps/dashboard/src/components/invoice-content.tsx` (wrapper)

## Safe to Delete
These `.old` files can be deleted once the refactored implementation is confirmed working.