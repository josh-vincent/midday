# Generic Item Search Guide

The `GenericItemSearch` component provides a flexible, configurable search interface for invoice line items. It supports multiple item types (products, quotes, jobs, services), grouping, multi-select, and custom rendering.

## Features

- ✅ **Multiple Item Types** - Search across products, quotes, jobs, services, or custom types
- ✅ **Grouping** - Optionally group results by item type
- ✅ **Multi-Select** - Select multiple items at once
- ✅ **Metadata Display** - Show/hide usage counts, prices, descriptions
- ✅ **Custom Rendering** - Override default item display with custom render function
- ✅ **Custom Queries** - Provide your own search and top items functions
- ✅ **Configurable Labels** - Customize all text labels and placeholders

## Basic Usage

### Simple Product Search (Default)

```typescript
import { GenericItemSearch } from "@midday/invoice-components/form";

<GenericItemSearch
  name={`lineItems.${index}.name`}
  index={index}
/>
```

This provides the same functionality as `ProductSearch` with default configuration.

### Job and Product Search

```typescript
import { JobItemSearch } from "@midday/invoice-components/form";

<JobItemSearch
  name={`lineItems.${index}.name`}
  index={index}
/>
```

### Multi-Type Search with Grouping

```typescript
import { MultiItemSearch } from "@midday/invoice-components/form";

<MultiItemSearch
  name={`lineItems.${index}.name`}
  index={index}
/>
```

This searches across products, jobs, quotes, and services with results grouped by type.

## Advanced Configuration

### Custom Configuration

```typescript
import { GenericItemSearch } from "@midday/invoice-components/form";

<GenericItemSearch
  name={`lineItems.${index}.name`}
  index={index}
  config={{
    itemTypes: ["product", "job", "quote"],
    groupByType: true,
    multiSelect: false,
    showMetadata: true,
    showPrice: true,
    showUsageCount: true,
    placeholder: "Search items...",
    searchPlaceholder: "Search products, jobs, quotes...",
    maxResults: 15,
    typeLabels: {
      product: "Products & Services",
      job: "Active Jobs",
      quote: "Saved Quotes",
    },
  }}
/>
```

### Multi-Select Mode

```typescript
import { MultiSelectItemSearch } from "@midday/invoice-components/form";

<MultiSelectItemSearch
  name={`lineItems.${index}.name`}
  index={index}
  onItemsSelected={(items) => {
    // Handle selected items
    items.forEach(item => {
      console.log("Selected:", item.name, item.price);
    });
  }}
/>
```

### Custom Query Functions

If you need to query jobs or other data sources instead of products:

```typescript
import { GenericItemSearch } from "@midday/invoice-components/form";
import type { ItemWithMetadata, ItemType } from "@midday/invoice-components/types";

// Custom search function
const searchJobs = async (query: string, types: ItemType[]): Promise<ItemWithMetadata[]> => {
  // Your custom search logic
  const results = await fetch(`/api/jobs/search?q=${query}`).then(r => r.json());

  return results.map(job => ({
    id: job.id,
    name: job.name,
    description: job.description,
    price: job.estimatedCost,
    currency: job.currency,
    type: "job" as ItemType,
  }));
};

// Custom top items function
const getTopJobs = async (types: ItemType[]): Promise<ItemWithMetadata[]> => {
  const results = await fetch(`/api/jobs/recent`).then(r => r.json());

  return results.map(job => ({
    id: job.id,
    name: job.name,
    description: job.description,
    price: job.estimatedCost,
    currency: job.currency,
    type: "job" as ItemType,
  }));
};

<GenericItemSearch
  name={`lineItems.${index}.name`}
  index={index}
  searchFn={searchJobs}
  topItemsFn={getTopJobs}
  config={{
    itemTypes: ["job"],
    placeholder: "Search jobs...",
    searchPlaceholder: "Search jobs by name or description...",
  }}
/>
```

### Custom Item Rendering

```typescript
import { GenericItemSearch } from "@midday/invoice-components/form";
import type { ItemWithMetadata } from "@midday/invoice-components/types";

<GenericItemSearch
  name={`lineItems.${index}.name`}
  index={index}
  config={{
    renderItem: (item: ItemWithMetadata) => (
      <div className="flex items-center gap-3 p-2">
        <div className="w-10 h-10 bg-gray-200 rounded" />
        <div className="flex-1">
          <div className="font-semibold">{item.name}</div>
          <div className="text-xs text-gray-500">{item.description}</div>
        </div>
        {item.price && (
          <div className="text-right">
            <div className="font-bold">${item.price}</div>
            {item.unit && <div className="text-xs">per {item.unit}</div>}
          </div>
        )}
      </div>
    ),
  }}
/>
```

## Configuration Options

```typescript
interface ItemSearchConfig {
  // Item types to include in search
  itemTypes: ItemType[]; // ["product", "quote", "job", "service", "custom"]

  // Whether to group results by type
  groupByType?: boolean; // default: false

  // Whether to allow multi-select
  multiSelect?: boolean; // default: false

  // Custom labels for item types
  typeLabels?: Partial<Record<ItemType, string>>;

  // Placeholder text
  placeholder?: string; // default: "Search items..."

  // Search input placeholder
  searchPlaceholder?: string; // default: "Search products, quotes, jobs..."

  // Whether to show item metadata
  showMetadata?: boolean; // default: true

  // Whether to show price in results
  showPrice?: boolean; // default: true

  // Whether to show usage count
  showUsageCount?: boolean; // default: true

  // Custom render function for item display
  renderItem?: (item: ItemWithMetadata) => React.ReactNode;

  // Callback when items are selected (multi-select mode)
  onSelect?: (items: ItemWithMetadata[]) => void;

  // Maximum items to display
  maxResults?: number; // default: 10
}
```

## Item Data Format

Items must conform to the `ItemWithMetadata` interface:

```typescript
interface ItemWithMetadata {
  id: string;
  name: string;
  description?: string | null;
  price?: number | null;
  currency?: string | null;
  unit?: string | null;
  type?: ItemType; // "product" | "quote" | "job" | "service" | "custom"
  usageCount?: number;
  lastUsed?: Date | string | null;
  [key: string]: any; // Additional custom metadata
}
```

## Backend Integration

To support multiple item types, your backend queries need to:

1. **Return items in the correct format**
2. **Support type filtering**
3. **Handle grouping if needed**

### Example tRPC Query

```typescript
// apps/api/src/trpc/routers/invoice-items.ts
export const invoiceItemsRouter = router({
  search: protectedProcedure
    .input(
      z.object({
        query: z.string(),
        types: z.array(z.enum(["product", "job", "quote", "service"])).optional(),
        limit: z.number().default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const items = [];

      // Search products
      if (!input.types || input.types.includes("product")) {
        const products = await ctx.db
          .select()
          .from(invoiceProducts)
          .where(
            and(
              eq(invoiceProducts.teamId, ctx.teamId),
              ilike(invoiceProducts.name, `%${input.query}%`)
            )
          )
          .limit(input.limit);

        items.push(...products.map(p => ({ ...p, type: "product" as const })));
      }

      // Search jobs
      if (!input.types || input.types.includes("job")) {
        const jobs = await ctx.db
          .select()
          .from(jobsTable)
          .where(
            and(
              eq(jobsTable.teamId, ctx.teamId),
              ilike(jobsTable.name, `%${input.query}%`)
            )
          )
          .limit(input.limit);

        items.push(...jobs.map(j => ({
          id: j.id,
          name: j.name,
          description: j.description,
          price: j.estimatedCost,
          currency: j.currency,
          type: "job" as const,
        })));
      }

      return items;
    }),
});
```

## Migration from ProductSearch

The `ProductSearch` component is still available and unchanged. To migrate:

**Before:**
```typescript
<ProductSearch name={`lineItems.${index}.name`} index={index} />
```

**After (same functionality):**
```typescript
<GenericItemSearch name={`lineItems.${index}.name`} index={index} />
```

**After (with jobs):**
```typescript
<GenericItemSearch
  name={`lineItems.${index}.name`}
  index={index}
  config={{
    itemTypes: ["product", "job"],
    groupByType: true,
  }}
/>
```

## Examples

### Use Case 1: Invoice from Jobs

Allow users to select completed jobs to invoice:

```typescript
<GenericItemSearch
  name={`lineItems.${index}.name`}
  index={index}
  config={{
    itemTypes: ["job"],
    showMetadata: true,
    placeholder: "Select completed job...",
    searchPlaceholder: "Search jobs...",
  }}
/>
```

### Use Case 2: Mixed Items Invoice

Create invoices with products, services, and job line items:

```typescript
<MultiItemSearch
  name={`lineItems.${index}.name`}
  index={index}
/>
```

### Use Case 3: Bulk Add Items

Allow selecting multiple items at once:

```typescript
<MultiSelectItemSearch
  name={`lineItems.${index}.name`}
  index={index}
  onItemsSelected={(items) => {
    // Add all selected items as new line items
    items.forEach((item, idx) => {
      if (idx === 0) {
        // First item goes to current line
        setValue(`lineItems.${index}.name`, item.name);
        setValue(`lineItems.${index}.price`, item.price);
      } else {
        // Additional items create new lines
        append({
          name: item.name,
          price: item.price ?? 0,
          quantity: 1,
          unit: item.unit ?? "",
        });
      }
    });
  }}
/>
```

## TypeScript Support

All types are fully typed and exported:

```typescript
import type {
  ItemType,
  BaseItem,
  ItemWithMetadata,
  ItemGroup,
  ItemSearchConfig,
  ItemSearchProps,
} from "@midday/invoice-components/types";
```