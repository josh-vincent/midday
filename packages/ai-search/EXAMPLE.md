# Usage Example: Jobs with AI Search

## Step 1: Create Configuration File

Create `/apps/dashboard/src/config/jobs-filters.ts`:

```typescript
import { z } from "zod";
import type { TableConfig } from "@midday/ai-search";

/**
 * Zod schema for job filters
 * This defines what filters are available and their types
 */
export const jobFilterSchema = z.object({
  q: z.string().optional().describe("Search query for job number, company, description"),
  status: z
    .enum(["pending", "in_progress", "completed", "cancelled", "invoiced"])
    .optional()
    .describe("Job status filter"),
  customerId: z.string().optional().describe("Filter by customer ID"),
  start: z.string().optional().describe("Start date for date range filter"),
  end: z.string().optional().describe("End date for date range filter"),
  groupBy: z.array(z.string()).optional().describe("Grouping fields"),
});

/**
 * Table configuration for AI to understand the jobs table
 */
export const jobTableConfig: TableConfig = {
  name: "jobs",

  // Columns that can be searched with text queries
  searchableColumns: [
    "jobNumber",
    "companyName",
    "description",
    "addressSite",
    "contactPerson",
    "materialType",
  ],

  // Status enum configuration
  statusColumn: "status",
  statusValues: ["pending", "in_progress", "completed", "cancelled", "invoiced"],

  // Foreign key relationships
  relationColumns: {
    customerId: "customers",
  },

  // Date columns for temporal queries
  dateColumns: ["jobDate", "scheduledDate", "createdAt"],

  // Additional context for AI
  context: "Job management system for tracking waste management deliveries and invoicing",
};

// Export type for use in components
export type JobFilters = z.infer<typeof jobFilterSchema>;
```

## Step 2: Create Filter Hook

Create `/apps/dashboard/src/hooks/use-job-filters.ts`:

```typescript
import { createFilterParamsHook } from "@midday/ai-search";
import { jobFilterSchema } from "@/config/jobs-filters";

/**
 * Type-safe hook for job filter URL parameters
 * Automatically syncs with URL using nuqs
 */
export const useJobFilters = createFilterParamsHook(jobFilterSchema, {
  shallow: true,
  excludeFromHasFilters: ["groupBy"], // Don't count groupBy as an active filter
});
```

## Step 3: Update Jobs Search Component

Update `/apps/dashboard/src/components/jobs-search-filter.tsx`:

```typescript
"use client";

import { generateFilters } from "@midday/ai-search/actions";
import { smartBadgeRenderer } from "@midday/ai-search/utils";
import { useJobFilters } from "@/hooks/use-job-filters";
import { jobFilterSchema, jobTableConfig } from "@/config/jobs-filters";
import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { FilterList } from "./filter-list"; // Existing component

export function JobsSearchFilter() {
  const [prompt, setPrompt] = useState("");
  const [streaming, setStreaming] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const trpc = useTRPC();

  const { filter, setParams, hasFilters } = useJobFilters();

  // Get customers and statuses for AI context
  const { data: customersData } = useQuery(trpc.customers.get.queryOptions());

  const statusFilters = jobTableConfig.statusValues!.map((status) => ({
    id: status,
    name: status.replace("_", " ").charAt(0).toUpperCase() + status.replace("_", " ").slice(1),
  }));

  const handleSearch = (evt: React.ChangeEvent<HTMLInputElement>) => {
    setPrompt(evt.target.value);
  };

  const handleSubmit = async () => {
    if (!prompt) {
      setParams(null);
      return;
    }

    setStreaming(true);

    // Use AI to generate filters
    const { object } = await generateFilters({
      prompt,
      schema: jobFilterSchema,
      tableConfig: jobTableConfig,
      context: `
        Available statuses: ${statusFilters.map((s) => s.name).join(", ")}
        Available customers: ${customersData?.data?.map((c) => c.name).join(", ")}
      `,
    });

    if (object) {
      // Map customer names to IDs
      const customers = object.customers?.map((name: string) => {
        return customersData?.data?.find((c) => c.name === name)?.id;
      }).filter(Boolean);

      setParams({
        q: object.q || null,
        status: object.status || null,
        customerId: customers?.[0] || null,
        start: object.start || null,
        end: object.end || null,
      });
    }

    setStreaming(false);
  };

  return (
    <div className="flex items-center space-x-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="relative"
      >
        <Icons.Search className="absolute left-3 top-[11px]" />
        <Input
          ref={inputRef}
          placeholder="Search jobs or filter..."
          className="pl-9 w-[350px]"
          value={prompt}
          onChange={handleSearch}
        />
      </form>

      <FilterList
        filters={filter}
        loading={streaming}
        onRemove={setParams}
        statusFilters={statusFilters}
        customers={customersData?.data}
        badgeRenderer={smartBadgeRenderer}
      />
    </div>
  );
}
```

## Step 4: Test Natural Language Queries

Users can now search with:

- **"overdue"** → Filters jobs with overdue status
- **"completed last week"** → Status + date range filter
- **"jobs from Acme"** → Customer filter
- **"pending deliveries this month"** → Status + date range
- **"JOB-123"** → Direct search by job number
- **"invoiced jobs for ABC Corp"** → Status + customer filter

## Benefits

✅ No duplicated AI code
✅ Type-safe with Zod + TypeScript
✅ URL state automatically managed
✅ Smart badge display
✅ Easy to add AI search to new tables
✅ Consistent UX across the app

## Adding AI Search to Another Table

Just create a new config file:

```typescript
// config/invoice-filters.ts
export const invoiceFilterSchema = z.object({
  q: z.string().optional(),
  statuses: z.array(z.enum(["draft", "paid", "overdue"])).optional(),
  // ... more filters
});

export const invoiceTableConfig: TableConfig = {
  name: "invoices",
  searchableColumns: ["invoiceNumber", "customerName"],
  statusColumn: "status",
  statusValues: ["draft", "paid", "overdue", "canceled"],
  // ... rest of config
};
```

Then use the same pattern - it just works!
