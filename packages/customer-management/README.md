# @midday/customer-management

Complete customer management domain package with components, actions, hooks, and utilities.

## Installation

```bash
pnpm add @midday/customer-management
```

## Usage

### Components

```tsx
import {
  CustomerList,
  CustomerForm,
  CustomerDetails,
  CustomerSearch
} from '@midday/customer-management/components';

function CustomersPage() {
  return (
    <>
      <CustomerSearch />
      <CustomerList />
    </>
  );
}
```

### Actions (Server-side)

```typescript
import {
  createCustomer,
  updateCustomer,
  deleteCustomer,
  linkJobToCustomer
} from '@midday/customer-management/actions';

// In a server component or action
async function handleSubmit(formData: FormData) {
  'use server';
  const result = await createCustomer(formData);
  if (result.error) {
    return { error: result.error };
  }
  redirect(`/customers/${result.data.id}`);
}
```

### Hooks

```typescript
import {
  useCustomers,
  useCustomer,
  useCustomerSearch,
  useCustomerStats
} from '@midday/customer-management/hooks';

function CustomerDashboard() {
  const { data: customers, loading } = useCustomers();
  const { stats } = useCustomerStats();

  if (loading) return <Skeleton />;

  return (
    <div>
      <Stats {...stats} />
      <CustomerGrid customers={customers} />
    </div>
  );
}
```

### Utilities

```typescript
import {
  formatCustomerName,
  validateCustomerEmail,
  calculateCustomerLifetimeValue,
  exportCustomersToCSV
} from '@midday/customer-management/utils';
```

## Features

### 🎨 Components
- **CustomerList** - Paginated customer table/grid
- **CustomerForm** - Add/edit customer form with validation
- **CustomerDetails** - Detailed customer view
- **CustomerSearch** - Advanced search with filters
- **CustomerCard** - Compact customer display
- **CustomerSelector** - Dropdown/combobox for selection
- **CustomerStats** - Analytics dashboard

### 🎬 Actions
- **CRUD Operations**
  - `createCustomer` - Create new customer
  - `updateCustomer` - Update customer details
  - `deleteCustomer` - Soft/hard delete
  - `archiveCustomer` - Archive customer

- **Relationships**
  - `linkJobToCustomer` - Associate jobs
  - `linkInvoiceToCustomer` - Associate invoices
  - `mergeCustomers` - Merge duplicates

- **Bulk Operations**
  - `importCustomers` - CSV/Excel import
  - `exportCustomers` - Export to various formats
  - `bulkUpdateCustomers` - Mass updates

### 🪝 Hooks
- `useCustomers` - List with pagination
- `useCustomer` - Single customer details
- `useCustomerSearch` - Search functionality
- `useCustomerStats` - Analytics data
- `useCustomerActivity` - Activity timeline
- `useCustomerJobs` - Related jobs
- `useCustomerInvoices` - Related invoices

### 🔧 Utilities
- **Validation**
  - Email validation
  - Phone formatting
  - Tax ID validation

- **Formatting**
  - Name formatting
  - Address formatting
  - Currency display

- **Analytics**
  - Lifetime value calculation
  - Churn prediction
  - Engagement scoring

## Schema

```typescript
interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: Address;
  metadata?: Record<string, unknown>;
  tags?: string[];
  status: 'active' | 'inactive' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

interface Address {
  street1: string;
  street2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}
```

## Project Structure

```
src/
├── components/
│   ├── customer-list.tsx
│   ├── customer-form.tsx
│   ├── customer-details.tsx
│   └── index.ts
├── actions/
│   ├── create.ts
│   ├── update.ts
│   ├── delete.ts
│   └── index.ts
├── hooks/
│   ├── use-customers.ts
│   ├── use-customer.ts
│   └── index.ts
├── schemas/
│   ├── customer.ts
│   └── index.ts
├── utils/
│   ├── validation.ts
│   ├── formatting.ts
│   └── index.ts
└── index.ts
```

## Configuration

```typescript
// Configure default behaviors
import { configureCustomerManagement } from '@midday/customer-management';

configureCustomerManagement({
  defaultPageSize: 20,
  enableSoftDelete: true,
  requireEmailVerification: false,
  customFields: [
    { key: 'vatNumber', label: 'VAT Number', type: 'string' }
  ]
});
```

## Testing

```bash
# Run all tests
pnpm test

# Component tests
pnpm test:components

# Integration tests
pnpm test:integration
```

## Migration Guide

When migrating from separate customer implementations:

1. Replace local customer components with package imports
2. Update action imports to use shared package
3. Migrate custom fields to metadata
4. Update type imports
5. Test thoroughly

## Dependencies

- `@midday/api-schemas` - Validation schemas
- `@midday/db` - Database operations
- `@midday/ui` - Base UI components
- `@midday/utils` - Utility functions
- `react` - React library
- `zod` - Schema validation