import type { Invoice } from "../types";

/**
 * Generates a PDF blob from an invoice
 */
export async function generateInvoicePDF(invoice: Invoice): Promise<Blob> {
  // This would integrate with @react-pdf/renderer or similar
  // For now, we'll simulate PDF generation
  
  const pdfContent = `
    Invoice ${invoice.number}
    Date: ${invoice.date}
    Customer: ${invoice.customer.name}
    Total: ${invoice.currency} ${invoice.total}
  `;
  
  // Create a blob with PDF mime type
  const blob = new Blob([pdfContent], { type: 'application/pdf' });
  return blob;
}

/**
 * Downloads an invoice as PDF
 */
export async function downloadInvoicePDF(invoice: Invoice): Promise<void> {
  const blob = await generateInvoicePDF(invoice);
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `invoice-${invoice.number}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Generates a base64 encoded PDF
 */
export async function generateInvoicePDFBase64(invoice: Invoice): Promise<string> {
  const blob = await generateInvoicePDF(invoice);
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      resolve(base64.split(',')[1]); // Remove data:application/pdf;base64, prefix
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Opens invoice PDF in a new window/tab
 */
export async function openInvoicePDF(invoice: Invoice): Promise<void> {
  const blob = await generateInvoicePDF(invoice);
  const url = URL.createObjectURL(blob);
  
  window.open(url, '_blank');
  
  // Clean up after a delay
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 60000); // 1 minute
}