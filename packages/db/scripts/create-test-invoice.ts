import { primaryDb } from '../src/client';
import { invoices, invoiceTemplates } from '../src/schema';
import { generateToken } from '@midday/invoice-core/token';
import { v4 as uuidv4 } from 'uuid';

async function createTestInvoice() {
  const db = primaryDb;
  
  try {
    const invoiceId = uuidv4();
    const token = await generateToken(invoiceId);
    
    // Get a team ID from existing invoices
    const existingInvoice = await db
      .select({ teamId: invoices.teamId })
      .from(invoices)
      .limit(1);
    
    const teamId = existingInvoice[0]?.teamId || 'test-team-id';
    
    // Create a test invoice
    const [newInvoice] = await db.insert(invoices).values({
      id: invoiceId,
      teamId,
      invoiceNumber: `TEST-${Date.now()}`,
      status: 'draft',
      currency: 'USD',
      amount: 10000, // $100.00 in cents
      subtotal: 10000,
      issueDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      customerName: 'Test Customer',
      customerDetails: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Test Customer' }
            ]
          }
        ]
      },
      fromDetails: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Your Company Name' }
            ]
          }
        ]
      },
      lineItems: [
        {
          name: 'Test Service',
          description: 'Test service description',
          quantity: 1,
          price: 10000,
          total: 10000
        }
      ],
      template: {
        title: "Invoice",
        customerLabel: "To",
        fromLabel: "From",
        invoiceNoLabel: "Invoice No",
        issueDateLabel: "Issue Date",
        dueDateLabel: "Due Date",
        descriptionLabel: "Description",
        priceLabel: "Price",
        quantityLabel: "Quantity",
        totalLabel: "Total",
        totalSummaryLabel: "Total",
        subtotalLabel: "Subtotal",
        vatLabel: "VAT",
        taxLabel: "Tax",
        discountLabel: "Discount",
        paymentLabel: "Payment Details",
        noteLabel: "Note",
        logoUrl: null,
        currency: "USD",
        paymentDetails: null,
        fromDetails: null,
        dateFormat: "dd/MM/yyyy",
        includeVat: false,
        includeTax: false,
        includeDiscount: false,
        includeUnits: false,
        includeDecimals: true,
        includePdf: false,
        sendCopy: false,
        includeQr: true,
        timezone: "UTC",
        locale: "en",
        size: "a4",
        taxRate: 0,
        vatRate: 0,
        deliveryType: "create",
      },
      token,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }).returning();
    
    console.log('\n✅ Test invoice created successfully!');
    console.log('\n=== Invoice Details ===');
    console.log(`Invoice ID: ${invoiceId}`);
    console.log(`Invoice Number: ${newInvoice.invoiceNumber}`);
    console.log(`Customer: ${newInvoice.customerName}`);
    console.log(`Amount: $${(newInvoice.amount / 100).toFixed(2)}`);
    console.log(`Token: ${token}`);
    console.log(`\n🔗 Preview URL:`);
    console.log(`http://localhost:3333/i/${encodeURIComponent(token)}`);
    
  } catch (error) {
    console.error('Error creating test invoice:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Set environment variables if needed
process.env.INVOICE_JWT_SECRET = process.env.INVOICE_JWT_SECRET || 'development-secret-change-in-production';

createTestInvoice();