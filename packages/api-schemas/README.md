# @midday/api-schemas

Shared Zod schemas and TypeScript types for API validation and type safety.

## Installation

```bash
pnpm add @midday/api-schemas
```

## Usage

### Import Schemas for Validation

```typescript
import { customerSchema, invoiceSchema, jobSchema } from '@midday/api-schemas';

// Validate data
const validatedCustomer = customerSchema.parse(requestData);

// Safe parse with error handling
const result = customerSchema.safeParse(requestData);
if (!result.success) {
  console.error(result.error);
} else {
  // Use result.data
}
```

### Import Types

```typescript
import type { Customer, Invoice, Job, Team, User } from '@midday/api-schemas';

// Use types in your functions
function processCustomer(customer: Customer) {
  // Type-safe customer handling
}

// Use for API responses
type APIResponse<T> = {
  data: T;
  error: null;
} | {
  data: null;
  error: string;
};

type CustomerResponse = APIResponse<Customer>;
```

### Available Schemas & Types

#### Customer Domain
```typescript
import {
  customerSchema,
  createCustomerSchema,
  updateCustomerSchema,
  customerFilterSchema
} from '@midday/api-schemas/customer';

import type {
  Customer,
  CreateCustomer,
  UpdateCustomer,
  CustomerFilter
} from '@midday/api-schemas/customer';
```

#### Invoice Domain
```typescript
import {
  invoiceSchema,
  invoiceItemSchema,
  invoiceStatusSchema
} from '@midday/api-schemas/invoice';

import type {
  Invoice,
  InvoiceItem,
  InvoiceStatus
} from '@midday/api-schemas/invoice';
```

#### Job Domain
```typescript
import {
  jobSchema,
  jobStatusSchema,
  linkJobSchema
} from '@midday/api-schemas/job';

import type {
  Job,
  JobStatus,
  LinkJobInput
} from '@midday/api-schemas/job';
```

#### Common Schemas
```typescript
import {
  paginationSchema,
  dateRangeSchema,
  moneySchema
} from '@midday/api-schemas/common';

import type {
  Pagination,
  DateRange,
  Money
} from '@midday/api-schemas/common';
```

## Schema Structure

```
src/
├── customer.ts      # Customer-related schemas
├── invoice.ts       # Invoice schemas
├── job.ts          # Job tracking schemas
├── team.ts         # Team management schemas
├── user.ts         # User profile schemas
├── billing.ts      # Billing & subscription schemas
├── common.ts       # Shared utility schemas
└── index.ts        # Main exports
```

## Zod Extensions

### Custom Refinements
```typescript
const emailSchema = z.string().email().toLowerCase();
const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/);
const currencySchema = z.enum(['USD', 'EUR', 'GBP', 'JPY']);
```

### Composable Schemas
```typescript
// Base schema
const baseCustomerSchema = z.object({
  name: z.string().min(1),
  email: emailSchema,
});

// Extended schema
const fullCustomerSchema = baseCustomerSchema.extend({
  phone: phoneSchema.optional(),
  address: addressSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});
```

## OpenAPI Integration

Schemas are compatible with zod-openapi for API documentation:

```typescript
import { createDocument } from 'zod-openapi';
import { customerSchema } from '@midday/api-schemas';

const document = createDocument({
  openapi: '3.1.0',
  info: { title: 'API', version: '1.0.0' },
  paths: {
    '/customers': {
      post: {
        requestBody: {
          content: {
            'application/json': {
              schema: customerSchema,
            },
          },
        },
      },
    },
  },
});
```

## Migration Status

- [ ] Customer schemas (0/5)
- [ ] Invoice schemas (0/6)
- [ ] Job schemas (0/4)
- [ ] Team schemas (0/3)
- [ ] User schemas (0/4)
- [ ] Billing schemas (0/5)
- [ ] Common schemas (0/8)

Total: 0/35 schemas to be migrated

## Type Safety Best Practices

1. **Always use schemas for API inputs**
2. **Export both schema and type**
3. **Use `.safeParse()` for user inputs**
4. **Use `.parse()` for internal data**
5. **Compose schemas for complex types**

## Dependencies

- `zod` - Schema validation
- `zod-openapi` - OpenAPI documentation support