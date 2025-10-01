import { primaryDb } from '../src/client';
import { invoices } from '../src/schema';
import { generateToken } from '@midday/invoice-core/token';
import { eq, isNull } from 'drizzle-orm';

async function updateInvoiceTokens() {
  const db = primaryDb;
  
  try {
    console.log('Fetching invoices without tokens...');
    
    // Get all invoices that don't have tokens
    const invoicesWithoutTokens = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        token: invoices.token,
      })
      .from(invoices)
      .where(isNull(invoices.token));
    
    console.log(`Found ${invoicesWithoutTokens.length} invoices without tokens`);
    
    // Update each invoice with a new token
    for (const invoice of invoicesWithoutTokens) {
      const token = await generateToken(invoice.id);
      
      await db
        .update(invoices)
        .set({ 
          token,
          updatedAt: new Date().toISOString()
        })
        .where(eq(invoices.id, invoice.id));
      
      console.log(`Updated invoice ${invoice.invoiceNumber} with token`);
    }
    
    // Also check for invoices with tokens to display them
    const allInvoices = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        token: invoices.token,
        status: invoices.status,
        customerName: invoices.customerName,
      })
      .from(invoices)
      .limit(10);
    
    console.log('\n=== Current Invoices ===');
    for (const invoice of allInvoices) {
      if (invoice.token) {
        const previewUrl = `http://localhost:3333/i/${encodeURIComponent(invoice.token)}`;
        console.log(`\nInvoice: ${invoice.invoiceNumber}`);
        console.log(`Customer: ${invoice.customerName || 'N/A'}`);
        console.log(`Status: ${invoice.status}`);
        console.log(`Preview URL: ${previewUrl}`);
      }
    }
    
    console.log('\n✅ Invoice tokens updated successfully');
  } catch (error) {
    console.error('Error updating invoice tokens:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Set environment variables if needed
process.env.INVOICE_JWT_SECRET = process.env.INVOICE_JWT_SECRET || 'development-secret-change-in-production';

updateInvoiceTokens();