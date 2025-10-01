# @midday/invoice-components

Reusable invoice UI components for the Midday platform.

## Overview

This package provides a comprehensive set of invoice form components, sheet wrappers, and utilities for building invoice management interfaces.

## Installation

```bash
bun add @midday/invoice-components
```

## Components

### Sheet Components

```typescript
import { InvoiceSheet, InvoiceContent } from "@midday/invoice-components/sheet";
```

- `InvoiceSheet` - Main sheet wrapper with template checking and state management
- `InvoiceContent` - Content layout with dynamic sizing

### Form Components

```typescript
import {
  Form,
  FormContext,
  CustomerDetails,
  LineItems,
  Summary,
  // ... and 30+ other components
} from "@midday/invoice-components/form";
```

**Core Form:**
- `Form` - Main form with auto-save and validation
- `FormContext` - Form context provider
- `SubmitButton` - Submit button with loading states
- `SettingsMenu` - Invoice template settings

**Input Components:**
- `Input`, `AmountInput`, `QuantityInput`, `LabelInput`
- `TaxInput`, `VATInput`

**Section Components:**
- `CustomerDetails`, `FromDetails`, `LineItems`
- `PaymentDetails`, `NoteDetails`, `Summary`

**Line Item Components:**
- `ProductSearch` - Autocomplete product search
- `Description`, `DescriptionWithJobSearch`

**Metadata Components:**
- `Meta`, `InvoiceNo`, `InvoiceTitle`
- `IssueDate`, `DueDate`, `Logo`

### Hooks

```typescript
import { useInvoiceParams, loadInvoiceParams } from "@midday/invoice-components/hooks";
```

- `useInvoiceParams` - URL state management for invoice params
- `loadInvoiceParams` - Server-side loader

### Utilities

```typescript
import { formatAmount, formatRelativeTime, getUrl } from "@midday/invoice-components/utils";
```

## Required Peer Dependencies

⚠️ **Important**: The invoice form components require dependency injection through the `InvoiceDependenciesProvider`.

### Dependency Injection Pattern

The package uses React Context to inject app-specific dependencies. You must wrap the invoice components with `InvoiceDependenciesProvider`:

```typescript
import {
  InvoiceDependenciesProvider,
  type InvoiceComponentDependencies,
} from "@midday/invoice-components";
import { useTRPC } from "@/trpc/client";
import { useUserQuery } from "@/hooks/use-user";
import { useUpload } from "@/hooks/use-upload";
import { useZodForm } from "@/hooks/use-zod-form";
import { useCustomerParams } from "@/hooks/use-customer-params";
import { Editor } from "@/components/editor";

export function MyInvoiceDependencies({ children }) {
  const trpc = useTRPC();

  const dependencies: InvoiceComponentDependencies = {
    trpc,
    useUserQuery,
    useUpload,
    useZodForm,
    useCustomerParams,
    Editor,
  };

  return (
    <InvoiceDependenciesProvider dependencies={dependencies}>
      {children}
    </InvoiceDependenciesProvider>
  );
}
```

### Required Dependencies Interface

```typescript
interface InvoiceComponentDependencies {
  // tRPC client instance
  trpc: TRPCClient;

  // User query hook
  useUserQuery: () => UseQueryResult<User>;

  // Upload hook for logo/attachments
  useUpload: () => UploadHook;

  // Form hook with Zod validation
  useZodForm: <T>(schema: ZodSchema<T>) => UseFormReturn<T>;

  // Customer params hook for URL state
  useCustomerParams: () => any;

  // Rich text editor component
  Editor: React.ComponentType<EditorProps>;
}

// Required at: @/hooks/use-customer-params
export function useCustomerParams(): CustomerParams;
```

## Usage Example

### Complete Invoice Sheet Setup

```typescript
"use client";

import { InvoiceSheet } from "@midday/invoice-components/sheet";
import { InvoiceContent } from "@/components/invoice-content";
import { FormContext } from "@midday/invoice-components/form";
import { useTRPC } from "@/trpc/client";
import { useRouter } from "next/navigation";
import { DashboardInvoiceDependencies } from "@/providers/invoice-dependencies-provider";

export function MyInvoiceSheet() {
  const trpc = useTRPC();
  const router = useRouter();

  return (
    <DashboardInvoiceDependencies>
      <InvoiceSheet
        trpc={trpc}
        router={router}
        InvoiceContent={InvoiceContent}
        FormContext={FormContext}
      />
    </DashboardInvoiceDependencies>
  );
}
```

### Using Form Components

```typescript
"use client";

import { Form, LineItems, Summary } from "@midday/invoice-components/form";
import { FormProvider } from "react-hook-form";

export function InvoiceForm() {
  return (
    <FormProvider {...formMethods}>
      <Form />
    </FormProvider>
  );
}
```

### Advanced: Generic Item Search

The package includes a powerful `GenericItemSearch` component that supports multiple item types (products, quotes, jobs, services), grouping, and multi-select.

**Simple usage (products only):**
```typescript
import { GenericItemSearch } from "@midday/invoice-components/form";

<GenericItemSearch name={`lineItems.${index}.name`} index={index} />
```

**Advanced usage (jobs + products with grouping):**
```typescript
import { JobItemSearch } from "@midday/invoice-components/form";

<JobItemSearch name={`lineItems.${index}.name`} index={index} />
```

**Multi-select mode:**
```typescript
import { MultiSelectItemSearch } from "@midday/invoice-components/form";

<MultiSelectItemSearch
  name={`lineItems.${index}.name`}
  index={index}
  onItemsSelected={(items) => {
    // Handle bulk item selection
  }}
/>
```

📚 **[Full Item Search Documentation](./ITEM_SEARCH_GUIDE.md)** - See the complete guide for advanced configuration, custom queries, and more examples.

## Package Structure

```
@midday/invoice-components/
├── src/
│   ├── components/
│   │   ├── sheet/           # Sheet wrappers
│   │   ├── form/            # 30+ form components
│   │   ├── invoice-preview  # PDF preview
│   │   ├── invoice-actions  # Action buttons
│   │   └── invoice-share    # Share dialog
│   ├── hooks/               # React hooks
│   ├── utils/               # Utility functions
│   └── types/               # TypeScript types
└── package.json
```

## Dependencies

### Required
- `react` >= 18
- `react-dom` >= 18
- `react-hook-form` ^7.55.0
- `@tanstack/react-query` ^5.64.5
- `framer-motion` ^12.0.0

### Workspace Dependencies
- `@midday/ui` - UI component library
- `@midday/invoice-core` - Invoice business logic
- `@midday/invoice` - PDF/HTML templates
- `@midday/overlay-components` - Overlay primitives

## Development

```bash
# Install dependencies
bun install

# Type check
npx tsc --noEmit

# Lint
biome check .
```

## Migration from Dashboard

These components were extracted from `/apps/dashboard/src/components/invoice/` to enable code reuse across multiple applications.

Old files are archived in:
- `/apps/dashboard/src/components/invoice-old/`
- `/apps/dashboard/src/components/sheets-old/`

## License

Private - Internal use only