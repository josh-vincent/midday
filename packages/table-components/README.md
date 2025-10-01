# @midday/table-components

Shared table components package for the Midday monorepo. This package provides reusable, extensible table components that can work with different data sources (mock data, tRPC, REST APIs, etc.).

## Features

- ✨ **Data Provider Pattern**: Abstract data fetching to work with any backend
- 📊 **Pre-built Tables**: Ready-to-use table components for common entities (invoices, customers, etc.)
- 🎨 **Customizable**: Built on top of @tanstack/react-table for full flexibility
- 🔌 **Framework Agnostic**: Works with Next.js, React, and other frameworks
- 🚀 **Performance**: Supports infinite scrolling and virtualization
- 🎯 **Type Safe**: Full TypeScript support

## Installation

```bash
npm install @midday/table-components
# or
bun add @midday/table-components
```

## Usage

### Basic Example with Mock Data

```tsx
import { InvoiceTable, MockDataProvider } from '@midday/table-components';
import { mockInvoices } from './mock-data';

export default function InvoicesPage() {
  const provider = new MockDataProvider(mockInvoices);
  
  return (
    <InvoiceTable
      provider={provider}
      onInvoiceClick={(invoice) => console.log('Clicked:', invoice)}
      onEditInvoice={(invoice) => console.log('Edit:', invoice)}
    />
  );
}
```

### With tRPC (for workbooks-turbo)

```tsx
import { InvoiceTable, TRPCDataProvider } from '@midday/table-components';
import { useTRPC } from '@/trpc/client';

export default function InvoicesPage() {
  const trpc = useTRPC();
  const provider = new TRPCDataProvider(trpc, 'invoices');
  
  return (
    <InvoiceTable
      provider={provider}
      enableAIFilters={true}
      enableBulkActions={true}
    />
  );
}
```

## Available Components

### Tables
- `InvoiceTable` - Invoice management table
- `CustomerTable` - Customer list table (coming soon)
- `TransactionTable` - Transaction table (coming soon)
- `JobTable` - Job tracking table (coming soon)

### Base Components
- `EmptyState` - Customizable empty state
- `NoResults` - No results found state
- `TableSkeleton` - Loading skeleton

### Providers
- `MockDataProvider` - For demo/development with mock data
- `TRPCDataProvider` - For tRPC-based backends (work in progress)
- `RESTDataProvider` - For REST APIs (coming soon)

## Creating Custom Tables

```tsx
import { createTableColumns, BaseTable } from '@midday/table-components';
import type { DataProvider } from '@midday/table-components';

// Define your entity type
interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

// Create columns
const columns = createTableColumns<Product>([
  {
    accessorKey: 'name',
    header: 'Product Name',
  },
  {
    accessorKey: 'price',
    header: 'Price',
    cell: ({ getValue }) => `$${getValue()}`,
  },
  {
    accessorKey: 'stock',
    header: 'Stock',
  },
]);

// Use with BaseTable
export function ProductTable({ provider }: { provider: DataProvider<Product> }) {
  return (
    <BaseTable
      provider={provider}
      columns={columns}
      onRowClick={(product) => console.log('Product clicked:', product)}
    />
  );
}
```

## Data Provider Interface

```typescript
interface DataProvider<T> {
  fetchPage: (params: FetchParams) => Promise<PageResult<T>>;
  mutate?: (operation: MutationOperation<T>) => Promise<T | void>;
  subscribe?: (callback: DataCallback<T>) => Unsubscribe;
}
```

## Contributing

This package is part of the Midday monorepo. To contribute:

1. Make changes in `/packages/table-components`
2. Test in the templates app (`/apps/templates`)
3. Ensure compatibility with workbooks-turbo patterns
4. Submit a PR

## License

Part of the Midday project.