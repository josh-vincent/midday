# Invoice System Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/midday-ai/midday.git
cd midday/apps/templates

# Install dependencies
bun install

# Copy environment variables
cp .env.example .env.local
```

### Step 2: Basic Configuration (Minimal Setup)

For local development, you only need these in `.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3335
NODE_ENV=development
INVOICE_TOKEN_SECRET=any-random-string-for-dev
```

### Step 3: Run the Application

```bash
bun run dev
```

Visit http://localhost:3335/invoices

## 📋 Complete Working Examples

### Example 1: Create Your First Invoice

```typescript
// app/api/invoice/create/route.ts
import { NextResponse } from 'next/server';
import { invoicesAPI } from '@/lib/mock/invoices-mock';

export async function POST(request: Request) {
  const data = await request.json();
  
  // Create invoice with minimal data
  const invoice = await invoicesAPI.createInvoice({
    customerName: data.customerName || "John Doe",
    customerEmail: data.customerEmail || "john@example.com", 
    currency: "USD",
    status: "draft",
    lineItems: [
      {
        name: "Service",
        description: "Consulting services",
        quantity: 1,
        price: 100,
        total: 100
      }
    ],
    total: 100,
    subtotal: 100,
    tax: 0,
    discount: 0
  });

  return NextResponse.json(invoice);
}
```

### Example 2: View Invoice by Token

```typescript
// app/i/[token]/route.ts
import { invoicesAPI } from '@/lib/mock/invoices-mock';
import { HtmlTemplate } from '@midday/invoice-core';

export default async function InvoicePage({ 
  params: { token } 
}: { 
  params: { token: string } 
}) {
  // For demo, create a sample invoice if token starts with 'demo_'
  if (token.startsWith('demo_')) {
    return <DemoInvoice />;
  }

  const invoice = await invoicesAPI.getInvoiceByToken(token);
  
  if (!invoice) {
    return <div>Invoice not found</div>;
  }

  const invoiceData = {
    ...invoice,
    template: {
      ...defaultTemplate,
      size: "letter",
      includeVat: false,
      includeTax: true,
      taxRate: 10,
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto">
        <HtmlTemplate 
          data={invoiceData}
          width={750}
          height={1056}
        />
        <InvoiceActions invoice={invoice} />
      </div>
    </div>
  );
}
```

### Example 3: Using Invoice Templates

```typescript
// components/use-invoice-template.tsx
'use client';

import { useState } from 'react';
import { invoiceTemplates } from '@/lib/invoice-templates';
import { Button } from '@midday/ui/button';

export function UseInvoiceTemplate() {
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const applyTemplate = (templateId: string) => {
    const template = invoiceTemplates.find(t => t.id === templateId);
    
    if (template) {
      // Apply template to form
      const formData = {
        paymentTerms: template.defaults.paymentTerms,
        currency: template.defaults.currency,
        taxRate: template.defaults.taxRate,
        notes: template.defaults.notes,
        paymentDetails: template.defaults.paymentDetails,
        lineItems: template.defaults.lineItems || []
      };
      
      // Update your form state
      setFormData(formData);
      
      // Save to localStorage for persistence
      localStorage.setItem('currentInvoiceTemplate', JSON.stringify(template));
    }
  };

  return (
    <div className="grid grid-cols-4 gap-4">
      {invoiceTemplates.map(template => (
        <Button
          key={template.id}
          onClick={() => applyTemplate(template.id)}
          variant="outline"
        >
          Use {template.name} Template
        </Button>
      ))}
    </div>
  );
}
```

### Example 4: Invoice Settings Configuration

```typescript
// components/configure-invoice.tsx
'use client';

import { useEffect, useState } from 'react';

export function ConfigureInvoice() {
  const [settings, setSettings] = useState({
    company: {
      name: '',
      email: '',
      address: '',
      taxId: ''
    },
    defaults: {
      currency: 'USD',
      paymentTerms: 30,
      taxRate: 10,
      invoicePrefix: 'INV-'
    }
  });

  // Load settings on mount
  useEffect(() => {
    const saved = localStorage.getItem('invoiceSettings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  // Save settings
  const saveSettings = () => {
    localStorage.setItem('invoiceSettings', JSON.stringify(settings));
    alert('Settings saved!');
  };

  return (
    <div className="p-6 space-y-4">
      <h2>Invoice Settings</h2>
      
      <input
        placeholder="Company Name"
        value={settings.company.name}
        onChange={(e) => setSettings({
          ...settings,
          company: { ...settings.company, name: e.target.value }
        })}
      />
      
      <input
        placeholder="Tax Rate %"
        type="number"
        value={settings.defaults.taxRate}
        onChange={(e) => setSettings({
          ...settings,
          defaults: { ...settings.defaults, taxRate: Number(e.target.value) }
        })}
      />
      
      <button onClick={saveSettings}>Save Settings</button>
    </div>
  );
}
```

## 🎯 End-to-End Working Flow

### Complete Invoice Creation Flow

```typescript
// pages/invoices/create.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateInvoicePage() {
  const router = useRouter();
  const [invoice, setInvoice] = useState({
    customerName: '',
    customerEmail: '',
    items: [{ name: '', quantity: 1, price: 0 }]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Step 1: Calculate totals
    const subtotal = invoice.items.reduce((sum, item) => 
      sum + (item.quantity * item.price), 0
    );
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;

    // Step 2: Create invoice
    const response = await fetch('/api/invoice/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...invoice,
        subtotal,
        tax,
        total,
        status: 'draft',
        createdAt: new Date().toISOString()
      })
    });

    const created = await response.json();

    // Step 3: Redirect to preview
    router.push(`/invoices/${created.id}`);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create Invoice</h1>
      
      {/* Customer Info */}
      <div className="space-y-4 mb-6">
        <input
          type="text"
          placeholder="Customer Name"
          value={invoice.customerName}
          onChange={(e) => setInvoice({
            ...invoice,
            customerName: e.target.value
          })}
          className="w-full p-2 border rounded"
          required
        />
        
        <input
          type="email"
          placeholder="Customer Email"
          value={invoice.customerEmail}
          onChange={(e) => setInvoice({
            ...invoice,
            customerEmail: e.target.value
          })}
          className="w-full p-2 border rounded"
          required
        />
      </div>

      {/* Line Items */}
      <div className="space-y-2 mb-6">
        <h3 className="font-semibold">Line Items</h3>
        {invoice.items.map((item, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              placeholder="Item name"
              value={item.name}
              onChange={(e) => {
                const newItems = [...invoice.items];
                newItems[index].name = e.target.value;
                setInvoice({ ...invoice, items: newItems });
              }}
              className="flex-1 p-2 border rounded"
              required
            />
            
            <input
              type="number"
              placeholder="Qty"
              value={item.quantity}
              onChange={(e) => {
                const newItems = [...invoice.items];
                newItems[index].quantity = Number(e.target.value);
                setInvoice({ ...invoice, items: newItems });
              }}
              className="w-20 p-2 border rounded"
              required
            />
            
            <input
              type="number"
              placeholder="Price"
              value={item.price}
              onChange={(e) => {
                const newItems = [...invoice.items];
                newItems[index].price = Number(e.target.value);
                setInvoice({ ...invoice, items: newItems });
              }}
              className="w-32 p-2 border rounded"
              required
            />
          </div>
        ))}
        
        <button
          type="button"
          onClick={() => setInvoice({
            ...invoice,
            items: [...invoice.items, { name: '', quantity: 1, price: 0 }]
          })}
          className="text-blue-600 hover:underline"
        >
          + Add Item
        </button>
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700"
      >
        Create Invoice
      </button>
    </form>
  );
}
```

## 🧪 Testing the System

### 1. Test Invoice Creation

```bash
# Using curl
curl -X POST http://localhost:3335/api/invoice/create \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Test Customer",
    "customerEmail": "test@example.com",
    "lineItems": [{
      "name": "Test Service",
      "quantity": 1,
      "price": 100
    }]
  }'
```

### 2. Test Public Invoice View

Visit these URLs in your browser:
- http://localhost:3335/i/demo_123 (Demo invoice)
- http://localhost:3335/i/[actual-token] (Real invoice)

### 3. Test Template System

```typescript
// Quick test script
const testTemplates = () => {
  const templates = ['standard', 'service', 'product', 'freelance'];
  
  templates.forEach(async (templateId) => {
    const template = getTemplateById(templateId);
    console.log(`Testing ${templateId} template:`, template);
    
    // Create invoice with template
    const invoice = await invoicesAPI.createInvoice({
      ...template.defaults,
      customerName: `Test - ${templateId}`,
      customerEmail: 'test@example.com'
    });
    
    console.log(`Created invoice: ${invoice.number}`);
  });
};

testTemplates();
```

## 🔧 Common Configurations

### Email Setup (Resend)

```typescript
// lib/email.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 'demo');

export async function sendInvoice(invoice: any) {
  // In development, just log
  if (process.env.NODE_ENV === 'development') {
    console.log('Would send invoice:', invoice);
    return { success: true };
  }

  // In production, actually send
  return resend.emails.send({
    from: 'invoices@yourdomain.com',
    to: invoice.customerEmail,
    subject: `Invoice ${invoice.number}`,
    html: `<p>View your invoice: ${process.env.NEXT_PUBLIC_APP_URL}/i/${invoice.token}</p>`
  });
}
```

### PDF Generation (Basic)

```typescript
// lib/pdf.ts
export async function generatePDF(invoice: any) {
  // For development - return mock PDF
  if (process.env.NODE_ENV === 'development') {
    return new Blob(['Mock PDF content'], { type: 'application/pdf' });
  }

  // For production - use actual PDF generation
  const response = await fetch('/api/pdf/generate', {
    method: 'POST',
    body: JSON.stringify(invoice)
  });
  
  return response.blob();
}
```

## 📦 Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add NEXT_PUBLIC_APP_URL
vercel env add INVOICE_TOKEN_SECRET
vercel env add RESEND_API_KEY
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM oven/bun:1 as base
WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

EXPOSE 3000
CMD ["bun", "run", "start"]
```

```bash
# Build and run
docker build -t midday-invoices .
docker run -p 3000:3000 --env-file .env.local midday-invoices
```

## 🎉 You're Ready!

Your invoice system is now running. Try these:

1. **Create an invoice**: http://localhost:3335/invoices → Create Invoice
2. **View templates**: http://localhost:3335/invoices → Manage Templates
3. **Configure settings**: Click on Settings in the template manager
4. **Preview invoice**: Create an invoice and click Preview

Need help? Check the [full documentation](./INVOICE_DOCUMENTATION.md) or [open an issue](https://github.com/midday-ai/midday/issues).