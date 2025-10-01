# Invoice System Documentation

## Overview

The Midday Invoice System provides a comprehensive solution for creating, managing, and sending professional invoices. This documentation covers the complete setup, configuration, and usage of the invoice system.

## Table of Contents

1. [Environment Setup](#environment-setup)
2. [Core Components](#core-components)
3. [Invoice Templates](#invoice-templates)
4. [API Integration](#api-integration)
5. [Code Examples](#code-examples)
6. [End-to-End Workflow](#end-to-end-workflow)

## Environment Setup

### Required Environment Variables

Create a `.env.local` file in the root of your templates app:

```env
# Application
NEXT_PUBLIC_APP_URL=http://localhost:3335
NODE_ENV=development

# Database (if using real database)
DATABASE_URL=postgresql://user:password@localhost:5432/midday

# Email Service (for sending invoices)
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=invoices@yourdomain.com

# File Storage (for PDF generation and storage)
BLOB_READ_WRITE_TOKEN=your-blob-token
NEXT_PUBLIC_BLOB_URL=https://your-blob-storage.com

# Payment Integration (optional)
STRIPE_SECRET_KEY=sk_test_your-stripe-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# PDF Generation
PUPPETEER_EXECUTABLE_PATH=/usr/local/bin/chromium

# Security
INVOICE_TOKEN_SECRET=your-secret-key-for-tokens
```

### Installation

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Build for production
bun run build
```

## Core Components

### 1. Invoice Core Package (`@midday/invoice-core`)

The invoice-core package provides the foundation for invoice rendering:

```typescript
// Import core components
import { HtmlTemplate, PdfTemplate, Invoice } from '@midday/invoice-core';

// Create an invoice
const invoice: Invoice = {
  id: "inv_123",
  invoiceNumber: "INV-001",
  issueDate: new Date().toISOString(),
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  status: "draft",
  currency: "USD",
  customer: {
    name: "Acme Corp",
    email: "billing@acme.com",
    website: "https://acme.com"
  },
  lineItems: [
    {
      id: "item_1",
      name: "Consulting Services",
      description: "Monthly retainer",
      quantity: 1,
      price: 5000,
      total: 5000
    }
  ],
  template: {
    // Template configuration
    size: "letter",
    includeVat: false,
    includeTax: true,
    taxRate: 10,
    // ... other template settings
  },
  // ... other invoice properties
};
```

### 2. Invoice Templates

Pre-built templates for different industries:

```typescript
import { invoiceTemplates, getTemplateById } from '@/lib/invoice-templates';

// Get a specific template
const freelanceTemplate = getTemplateById('freelance');

// Apply template defaults to a new invoice
const newInvoice = {
  ...freelanceTemplate.defaults,
  customer: selectedCustomer,
  issueDate: new Date().toISOString(),
};
```

### 3. Invoice Settings

Configure default invoice settings:

```typescript
// Load saved settings
const settings = JSON.parse(localStorage.getItem('invoiceSettings') || '{}');

// Apply settings to invoice
const invoiceWithSettings = {
  ...invoice,
  template: {
    ...settings.defaults,
    logoUrl: settings.company.logo,
  },
  fromDetails: {
    type: "doc",
    content: [{
      type: "paragraph",
      content: [{
        type: "text",
        text: `${settings.company.name}\n${settings.company.address}`
      }]
    }]
  },
  paymentDetails: {
    type: "doc",
    content: [{
      type: "paragraph",
      content: [{
        type: "text",
        text: settings.payment.paymentInstructions
      }]
    }]
  }
};
```

## Invoice Templates

### Available Templates

1. **Standard Invoice** - General purpose
2. **Service Invoice** - Consultants and services
3. **Product Invoice** - Physical products
4. **Freelance Invoice** - Independent contractors
5. **Subscription Invoice** - Recurring billing
6. **International Invoice** - With VAT support
7. **Contractor Invoice** - Construction/trades
8. **Retail Invoice** - E-commerce

### Using Templates

```typescript
// In your create invoice component
import { InvoiceTemplate } from '@/lib/invoice-templates';

function CreateInvoice() {
  // Load selected template from localStorage
  const selectedTemplate = JSON.parse(
    localStorage.getItem('selectedInvoiceTemplate') || '{}'
  );

  const [formData, setFormData] = useState({
    ...selectedTemplate.defaults,
    customerName: '',
    issueDate: new Date(),
  });

  // Create invoice with template
  const createInvoice = async () => {
    const invoice = {
      ...formData,
      template: selectedTemplate.settings,
      lineItems: selectedTemplate.defaults.lineItems || [],
    };
    
    await invoicesAPI.createInvoice(invoice);
  };
}
```

## API Integration

### Invoice API Methods

```typescript
// lib/mock/invoices-mock.ts
export const invoicesAPI = {
  // Get all invoices
  async getInvoices(): Promise<MockInvoice[]> {
    return mockInvoices;
  },

  // Get single invoice
  async getInvoice(id: string): Promise<MockInvoice | undefined> {
    return mockInvoices.find(inv => inv.id === id);
  },

  // Get invoice by token (for public viewing)
  async getInvoiceByToken(token: string): Promise<MockInvoice | undefined> {
    return mockInvoices.find(inv => inv.token === token);
  },

  // Create invoice
  async createInvoice(data: Partial<MockInvoice>): Promise<MockInvoice> {
    const newInvoice = {
      id: generateId(),
      number: generateInvoiceNumber(),
      token: generateToken(),
      status: 'draft',
      createdAt: new Date().toISOString(),
      ...data
    };
    mockInvoices.push(newInvoice);
    return newInvoice;
  },

  // Update invoice
  async updateInvoice(id: string, data: Partial<MockInvoice>): Promise<MockInvoice> {
    const index = mockInvoices.findIndex(inv => inv.id === id);
    if (index !== -1) {
      mockInvoices[index] = { ...mockInvoices[index], ...data };
      return mockInvoices[index];
    }
    throw new Error('Invoice not found');
  },

  // Send invoice
  async sendInvoice(id: string, to: string): Promise<void> {
    await this.updateInvoice(id, {
      status: 'sent',
      sentAt: new Date().toISOString(),
      sentTo: to
    });
    // In production, integrate with email service
  },

  // Generate PDF
  async generatePDF(id: string): Promise<Blob> {
    const invoice = await this.getInvoice(id);
    // Use @midday/invoice-core PdfTemplate
    // Return PDF blob
  }
};
```

## Code Examples

### 1. Creating an Invoice

```typescript
'use client';

import { useState } from 'react';
import { invoicesAPI } from '@/lib/mock/invoices-mock';
import { useToast } from '@midday/ui/use-toast';

export function CreateInvoiceForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.target as HTMLFormElement);
      
      const invoice = await invoicesAPI.createInvoice({
        customerName: formData.get('customerName') as string,
        customerEmail: formData.get('customerEmail') as string,
        lineItems: [
          {
            name: formData.get('itemName') as string,
            quantity: parseInt(formData.get('quantity') as string),
            price: parseFloat(formData.get('price') as string),
          }
        ],
        dueDate: formData.get('dueDate') as string,
        currency: 'USD',
      });

      toast({
        title: 'Invoice created',
        description: `Invoice ${invoice.number} has been created`,
      });

      // Redirect to invoice details
      window.location.href = `/invoices/${invoice.id}`;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create invoice',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

### 2. Viewing Invoice with Token

```typescript
// app/i/[token]/page.tsx
import { invoicesAPI } from '@/lib/mock/invoices-mock';
import { HtmlTemplate } from '@midday/invoice-core';
import { notFound } from 'next/navigation';

export default async function PublicInvoicePage({ 
  params 
}: { 
  params: { token: string } 
}) {
  const invoice = await invoicesAPI.getInvoiceByToken(params.token);
  
  if (!invoice) {
    notFound();
  }

  // Convert to Invoice type for HtmlTemplate
  const invoiceData = convertToInvoiceFormat(invoice);

  return (
    <div className="max-w-4xl mx-auto p-8">
      <HtmlTemplate 
        data={invoiceData}
        width={750}
        height={1056}
      />
    </div>
  );
}
```

### 3. Sending Invoice via Email

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInvoiceEmail(invoiceId: string) {
  const invoice = await invoicesAPI.getInvoice(invoiceId);
  
  if (!invoice) {
    throw new Error('Invoice not found');
  }

  // Generate PDF
  const pdfBuffer = await generateInvoicePDF(invoice);

  // Send email
  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: invoice.customer.email,
    subject: `Invoice ${invoice.number} from ${invoice.team.name}`,
    html: `
      <p>Dear ${invoice.customer.name},</p>
      <p>Please find attached invoice ${invoice.number} for ${formatCurrency(invoice.total, invoice.currency)}.</p>
      <p>Payment is due by ${formatDate(invoice.dueDate)}.</p>
      <p>View online: ${process.env.NEXT_PUBLIC_APP_URL}/i/${invoice.token}</p>
    `,
    attachments: [
      {
        filename: `invoice-${invoice.number}.pdf`,
        content: pdfBuffer,
      },
    ],
  });

  if (error) {
    throw error;
  }

  // Update invoice status
  await invoicesAPI.updateInvoice(invoiceId, {
    status: 'sent',
    sentAt: new Date().toISOString(),
  });

  return data;
}
```

### 4. Webhook for Payment Updates

```typescript
// app/api/webhooks/stripe/route.ts
import { headers } from 'next/headers';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      const invoiceId = paymentIntent.metadata.invoiceId;
      
      // Update invoice status
      await invoicesAPI.updateInvoice(invoiceId, {
        status: 'paid',
        paidAt: new Date().toISOString(),
      });
      break;
    
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return new Response('Success', { status: 200 });
}
```

## End-to-End Workflow

### Complete Invoice Lifecycle

```typescript
// 1. Customer selects template
const template = getTemplateById('service');

// 2. Create invoice with template defaults
const invoice = await invoicesAPI.createInvoice({
  ...template.defaults,
  customer: selectedCustomer,
  lineItems: calculatedLineItems,
});

// 3. Preview invoice
const previewUrl = `/invoices/${invoice.id}/preview`;

// 4. Send invoice to customer
await sendInvoiceEmail(invoice.id);

// 5. Customer views invoice via token
const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL}/i/${invoice.token}`;

// 6. Track payment status
const checkPaymentStatus = async () => {
  const updated = await invoicesAPI.getInvoice(invoice.id);
  return updated.status === 'paid';
};

// 7. Generate reports
const generateMonthlyReport = async () => {
  const invoices = await invoicesAPI.getInvoices();
  const thisMonth = invoices.filter(inv => {
    const date = new Date(inv.createdAt);
    return date.getMonth() === new Date().getMonth();
  });
  
  return {
    count: thisMonth.length,
    total: thisMonth.reduce((sum, inv) => sum + inv.total, 0),
    paid: thisMonth.filter(inv => inv.status === 'paid').length,
    pending: thisMonth.filter(inv => inv.status === 'sent').length,
  };
};
```

### Testing the System

```bash
# 1. Start the development server
bun run dev

# 2. Navigate to invoices page
open http://localhost:3335/invoices

# 3. Create a test invoice
# - Click "Create Invoice"
# - Select a template
# - Fill in customer details
# - Add line items
# - Save as draft or send

# 4. View public invoice
# - Copy the invoice token from the details
# - Navigate to /i/[token]
# - Verify the invoice displays correctly

# 5. Test PDF generation (if configured)
# - Click "Download PDF" on invoice details
# - Verify PDF generates correctly
```

## Advanced Features

### Custom Invoice Numbers

```typescript
function generateInvoiceNumber(settings: InvoiceSettings): string {
  const { invoicePrefix, nextInvoiceNumber } = settings.defaults;
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  
  // Format: INV-2024-03-0001
  return `${invoicePrefix}${year}-${month}-${String(nextInvoiceNumber).padStart(4, '0')}`;
}
```

### Recurring Invoices

```typescript
async function createRecurringInvoice(templateId: string, schedule: 'monthly' | 'quarterly' | 'yearly') {
  const template = await invoicesAPI.getInvoice(templateId);
  
  const intervals = {
    monthly: 30,
    quarterly: 90,
    yearly: 365,
  };
  
  const nextDueDate = new Date();
  nextDueDate.setDate(nextDueDate.getDate() + intervals[schedule]);
  
  return invoicesAPI.createInvoice({
    ...template,
    id: undefined,
    number: undefined,
    issueDate: new Date().toISOString(),
    dueDate: nextDueDate.toISOString(),
    status: 'draft',
  });
}
```

### Bulk Invoice Operations

```typescript
async function bulkSendInvoices(invoiceIds: string[]) {
  const results = await Promise.allSettled(
    invoiceIds.map(id => sendInvoiceEmail(id))
  );
  
  const succeeded = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  
  return { succeeded, failed };
}
```

## Troubleshooting

### Common Issues

1. **Module not found errors**
   ```bash
   # Clear cache and reinstall
   rm -rf node_modules .next
   bun install
   ```

2. **PDF generation fails**
   - Ensure Puppeteer/Chromium is installed
   - Check PUPPETEER_EXECUTABLE_PATH in .env

3. **Email sending fails**
   - Verify RESEND_API_KEY is valid
   - Check EMAIL_FROM domain is verified

4. **Invoice preview not loading**
   - Ensure invoice token is valid
   - Check if invoice exists in database

## Support

For additional help:
- Check the [GitHub repository](https://github.com/midday-ai/midday)
- Join our [Discord community](https://discord.gg/midday)
- Email support@midday.ai