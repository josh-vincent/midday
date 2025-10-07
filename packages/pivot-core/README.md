# @midday/pivot-core

Core business logic package for the Pivot application.

## Purpose

This package contains Pivot-specific business logic, types, and utilities that are not shared with Midday. It leverages shared packages like `@midday/db` and `@midday/utils` while maintaining Pivot's unique functionality.

## Installation

This is a workspace package and is automatically available to apps in the monorepo:

```json
{
  "dependencies": {
    "@midday/pivot-core": "workspace:*"
  }
}
```

## Usage

```typescript
import { PIVOT_VERSION, formatPivotDate, generatePivotId } from '@midday/pivot-core';
import type { PivotConfig, PivotEntity } from '@midday/pivot-core/types';
import { formatPivotDate } from '@midday/pivot-core/utils';

// Use Pivot-specific functionality
const id = generatePivotId('entity');
const formattedDate = formatPivotDate(new Date());
```

## Exports

- **Main**: Core exports
- **types**: TypeScript types and Zod schemas
- **utils**: Utility functions

## Architecture

This package:
- ✅ Contains Pivot-specific business logic
- ✅ Uses shared packages (`@midday/db`, `@midday/utils`)
- ✅ Does not interfere with Midday functionality
- ✅ Maintains clear separation of concerns

## Development

```bash
# Type check
bun run typecheck

# Lint
bun run lint

# Format
bun run format
```
