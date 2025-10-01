# @midday/documents

Comprehensive document generation, processing, and management package supporting PDFs, Excel, Word, images, and more.

## Installation

```bash
npm install @midday/documents
```

## Features

- 📄 **PDF Generation** - Invoices, reports, with templates
- 📊 **Excel/CSV Processing** - Read, write, convert spreadsheets
- 📝 **Word Document Processing** - Extract text and metadata
- 🖼️ **Image Processing** - Compress, convert, OCR
- 🔍 **OCR** - Extract text from images and scanned documents
- 📊 **Data Extraction** - Tables, metadata, text from various formats
- 🔒 **Security** - PDF encryption, password protection
- 📦 **Batch Operations** - Merge, split, rotate PDFs
- 📱 **QR/Barcode** - Generate and read QR codes and barcodes

## Quick Start

```typescript
import { DocumentManager } from "@midday/documents";

const manager = new DocumentManager();

// Generate invoice PDF
const invoice = await manager.generateInvoice({
  invoiceNumber: "INV-001",
  issueDate: new Date(),
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  seller: {
    name: "ACME Corp",
    address: {
      line1: "123 Business St",
      city: "San Francisco",
      state: "CA",
      postalCode: "94105",
      country: "USA",
    },
    email: "billing@acme.com",
    taxId: "12-3456789",
  },
  buyer: {
    name: "Customer Inc",
    address: {
      line1: "456 Client Ave",
      city: "New York",
      state: "NY",
      postalCode: "10001",
      country: "USA",
    },
    email: "accounts@customer.com",
  },
  items: [
    {
      description: "Professional Services",
      quantity: 10,
      unitPrice: 150,
      amount: 1500,
    },
    {
      description: "Software License",
      quantity: 1,
      unitPrice: 500,
      amount: 500,
    },
  ],
  subtotal: 2000,
  tax: [
    { name: "Sales Tax", rate: 8.5, amount: 170 },
  ],
  total: 2170,
  currency: "USD",
});

// Save invoice
const invoiceBuffer = invoice.content as Buffer;
```

## Document Processing

```typescript
// Extract text from PDF
const pdfDoc = await manager.getDocument("doc_123");
const text = await manager.extractText(pdfDoc);

// Perform OCR on image
const imageDoc = await manager.getDocument("img_456");
const ocrResult = await manager.performOCR(imageDoc, {
  language: "eng",
});
console.log(ocrResult.text);
console.log(ocrResult.confidence);

// Extract tables from Excel
const excelDoc = await manager.getDocument("excel_789");
const tables = await manager.extractTables(excelDoc);
tables.forEach(table => {
  console.log(table.headers);
  console.log(table.rows);
});

// Convert document formats
const wordDoc = await manager.getDocument("word_abc");
const pdfVersion = await manager.convertDocument(wordDoc, "pdf");
```

## PDF Operations

```typescript
// Merge multiple PDFs
const pdfs = await manager.listDocuments({ format: "pdf" });
const mergedPdf = await manager.mergePDFs(pdfs);

// Split PDF into pages
const splitPages = await manager.splitPDF(pdfDoc);
console.log(`Split into ${splitPages.length} pages`);

// Rotate PDF
const rotatedPdf = await manager.rotatePDF(pdfDoc, 90);

// Add page numbers
const numberedPdf = await manager.addPageNumbers(pdfDoc);
```

## Report Generation

```typescript
const report = await manager.generateReport({
  title: "Annual Report 2024",
  subtitle: "Financial Overview",
  author: "John Doe",
  date: new Date(),
  sections: [
    {
      title: "Executive Summary",
      content: [
        {
          type: "text",
          value: "This year has been exceptional...",
          style: {
            fontSize: 12,
            alignment: "justify",
          },
        },
        {
          type: "table",
          value: {
            headers: ["Quarter", "Revenue", "Profit"],
            rows: [
              ["Q1", "$1M", "$200K"],
              ["Q2", "$1.2M", "$250K"],
              ["Q3", "$1.5M", "$300K"],
              ["Q4", "$2M", "$400K"],
            ],
            style: {
              headerBackground: "#007bff",
              headerColor: "#ffffff",
              striped: true,
            },
          },
        },
        {
          type: "chart",
          value: {
            type: "bar",
            title: "Quarterly Revenue",
            labels: ["Q1", "Q2", "Q3", "Q4"],
            datasets: [
              {
                label: "Revenue",
                data: [1000000, 1200000, 1500000, 2000000],
                backgroundColor: "#007bff",
              },
            ],
          },
        },
      ],
    },
  ],
  pageSettings: {
    format: "A4",
    orientation: "portrait",
    margins: {
      top: 50,
      right: 50,
      bottom: 50,
      left: 50,
    },
  },
});
```

## QR Codes and Barcodes

```typescript
// Generate QR code
const qrCode = await manager.generateQRCode("https://example.com/invoice/123", {
  width: 200,
  errorCorrectionLevel: "H",
  margin: 4,
});

// Generate barcode
const barcode = await manager.generateBarcode("1234567890", {
  format: "CODE128",
  width: 300,
  height: 100,
  text: true,
});
```

## Image Processing

```typescript
// Compress image
const compressedImage = await manager.compressImage(imageDoc, {
  quality: 80,
  width: 800,
  height: 600,
});

console.log(`Compressed from ${imageDoc.size} to ${compressedImage.size} bytes`);

// Convert image format
const jpgImage = await manager.convertDocument(pngDoc, "jpg");
```

## Storage Integration

```typescript
// Use with custom storage
class S3DocumentStorage implements DocumentStorage {
  async save(document: Document): Promise<string> {
    // Upload to S3
    return uploadedId;
  }
  
  async get(id: string): Promise<Document | null> {
    // Download from S3
    return document;
  }
  
  async delete(id: string): Promise<void> {
    // Delete from S3
  }
  
  async list(filters?: DocumentFilters): Promise<Document[]> {
    // List from S3
    return documents;
  }
  
  async getUrl(id: string): Promise<string | null> {
    // Get S3 signed URL
    return url;
  }
}

const manager = new DocumentManager(new S3DocumentStorage());

// Documents are now automatically saved to S3
const invoice = await manager.generateInvoice(invoiceData);
const url = await manager.getDocumentUrl(invoice.id);
```

## API Reference

See [API Documentation](./docs/API.md) for detailed API reference.

## License

MIT