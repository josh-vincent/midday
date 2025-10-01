# @midday/invoice-core

Unified invoice generation package for Midday applications. This package provides a flexible, extensible invoice system that supports both standard invoicing features and specialized use cases like weighbridge/dirt tracking.

## Features

- **Flexible Line Items**: Support for standard line items and extended fields (weighbridge, EPA levy, etc.)
- **Multiple Template Formats**: HTML, PDF, and OpenGraph image generation
- **Rich Text Editor**: Built-in editor for invoice content
- **Type-Safe**: Full TypeScript support with extensible types
- **Token Generation**: Secure token generation for invoice sharing
- **Calculation Utilities**: Built-in calculation functions for totals, tax, VAT, and discounts

## Installation

```bash
bun add @midday/invoice-core
```

## Usage

### Basic Invoice Creation

```typescript
import { Invoice, LineItem } from '@midday/invoice-core/types';
import { renderToBuffer } from '@midday/invoice-core';
import { PdfTemplate } from '@midday/invoice-core/templates/pdf';

const invoice: Invoice = {
  id: 'inv-123',
  invoiceNumber: '2024-001',
  // ... other invoice fields
  lineItems: [
    {
      name: 'Web Development',
      quantity: 10,
      price: 150,
      unit: 'hours'
    }
  ]
};

// Generate PDF
const pdfBuffer = await renderToBuffer(<PdfTemplate {...invoice} />);
```

### Extended Line Items (Weighbridge/Dirt Tracking)

```typescript
import { ExtendedLineItem } from '@midday/invoice-core/types';

const lineItem: ExtendedLineItem = {
  name: 'Material Transport',
  quantity: 22, // m³
  price: 15, // per m³
  unit: 'm³',
  // Extended fields
  ticketNumber: 'WB-2024-001',
  truckRego: 'ABC-123',
  grossWeight: 35000,
  tareWeight: 13000,
  netTonnage: 22,
  materialType: 'Clean Fill',
  siteFrom: 'Site A',
  siteTo: 'Site B',
  epaLevyRate: 2.5,
  epaLevyAmount: 55
};
```

## Type Definitions

### Core Types

- `Invoice` - Main invoice interface
- `LineItem` - Extended line item with optional weighbridge fields
- `Template` - Invoice template configuration
- `InvoiceStatus` - Invoice status enum

### Base Types

- `BaseLineItem` - Standard line item fields
- `ExtendedLineItem` - Line item with all optional extension fields
- `WeighbridgeFields` - Specific weighbridge/dirt tracking fields

## Templates

### HTML Template
For web display and email rendering.

### PDF Template
For downloadable/printable invoices using React PDF.

### OG Template
For social media preview images.

## Utilities

- `calculate.ts` - Line item and total calculations
- `content.ts` - Content validation and processing
- `logo.ts` - Logo handling utilities
- `pdf-format.ts` - PDF-specific formatting
- `transform.ts` - Data transformation utilities
- `token/index.ts` - JWT token generation for secure sharing

## Migration from @midday/invoice

Simply update your imports:

```typescript
// Before
import { Invoice } from '@midday/invoice';

// After
import { Invoice } from '@midday/invoice-core';
```

All existing functionality is preserved with additional extensibility options.

## License

Private package - Midday internal use only.