# @midday/ai-search

AI-powered search and filtering for any database table with type-safe integration.

## Features

✅ **AI-Powered** - Natural language queries ("overdue invoices from last month")
✅ **Type-Safe** - Full TypeScript + Zod + nuqs integration
✅ **Configurable** - Works with any table via simple configuration
✅ **Schema-Aware** - Understands your database structure
✅ **Multi-Table** - Search across multiple tables simultaneously
✅ **Smart Badges** - Context-aware filter badge display
✅ **URL State** - All filters synced with URL via nuqs

## Installation

This is a workspace package - it's automatically available in the monorepo.

```typescript
import { generateFilters, createFilterParamsHook, type TableConfig } from "@midday/ai-search";
```

## Quick Start

### 1. Define Your Table Configuration

```typescript
import { z } from "zod";
import type { TableConfig } from "@midday/ai-search";

// Define filter schema
export const jobFilterSchema = z.object({
  q: z.string().optional(),
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]).optional(),
  customerId: z.string().optional(),
  start: z.string().optional(),
  end: z.string().optional(),
});

// Define table configuration
export const jobTableConfig: TableConfig = {
  name: "jobs",
  searchableColumns: ["jobNumber", "companyName", "description", "addressSite"],
  statusColumn: "status",
  statusValues: ["pending", "in_progress", "completed", "cancelled"],
  relationColumns: { customerId: "customers" },
  dateColumns: ["jobDate", "scheduledDate"],
  context: "Job management system for tracking deliveries",
};
```

### 2. Create Filter Hook

```typescript
import { createFilterParamsHook } from "@midday/ai-search";
import { jobFilterSchema } from "./config";

export const useJobFilters = createFilterParamsHook(jobFilterSchema, {
  shallow: true,
  excludeFromHasFilters: ["groupBy"], // Optional: exclude certain keys
});
```

### 3. Use AI Filtering

```typescript
import { generateFilters } from "@midday/ai-search/actions";
import { jobFilterSchema, jobTableConfig } from "./config";

const handleSearch = async (query: string) => {
  const { object } = await generateFilters({
    prompt: query,
    schema: jobFilterSchema,
    tableConfig: jobTableConfig,
    context: "Additional context here", // Optional
  });

  if (object) {
    // Apply filters
    setFilters(object);
  }
};
```

## Usage Examples

### Single Word Queries
- `"overdue"` → Filters by overdue status
- `"paid"` → Filters by paid status
- `"1000"` → Searches for amount or shows as badge

### Natural Language
- `"overdue invoices"` → Status filter
- `"paid last month"` → Status + date range
- `"jobs from Acme Corp"` → Customer filter
- `"completed jobs this week"` → Status + date range

### Multi-Table Search

```typescript
const multiTableConfig: TableConfig[] = [
  jobTableConfig,
  invoiceTableConfig,
];

const { object } = await generateFilters({
  prompt: "search both jobs and invoices",
  schema: combinedSchema,
  tableConfig: multiTableConfig,
});
```

## API Reference

### `generateFilters<T>(options)`

Generates filters from natural language using AI.

**Parameters:**
- `prompt` (string) - User's natural language query
- `schema` (ZodSchema) - Zod schema for validation
- `tableConfig` (TableConfig | TableConfig[]) - Table configuration
- `context` (string, optional) - Additional AI context

**Returns:** `Promise<{ object?: T, error?: string }>`

### `createFilterParamsHook<T>(schema, options?)`

Creates a type-safe hook for managing filter URL state.

**Parameters:**
- `schema` (ZodObject) - Zod object schema
- `options.shallow` (boolean) - Use shallow routing (default: true)
- `options.excludeFromHasFilters` (string[]) - Keys to exclude from hasFilters check

**Returns:** Hook function

### `smartBadgeRenderer(key, value, context?)`

Smart badge renderer with context-aware labels.

**Parameters:**
- `key` (string) - Filter key
- `value` (any) - Filter value
- `context` (object, optional) - Context data (customers, statuses, etc.)

**Returns:** `string | null`

## Types

### `TableConfig`

```typescript
type TableConfig = {
  name: string;
  searchableColumns: string[];
  statusColumn?: string;
  statusValues?: string[];
  relationColumns?: Record<string, string>;
  dateColumns?: string[];
  context?: string;
};
```

### `FilterState<T>`

```typescript
type FilterState<T = Record<string, any>> = {
  q?: string | null;
  status?: string | null;
  statuses?: string[] | null;
  start?: string | null;
  end?: string | null;
  customers?: string[] | null;
  customerId?: string | null;
  [key: string]: any;
} & Partial<T>;
```

## License

Private workspace package
