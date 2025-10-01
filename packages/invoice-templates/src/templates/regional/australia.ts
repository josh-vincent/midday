import type { InvoiceTemplate } from "../../types/template";
import { applyRegionalConfig } from "../../types/regional";

export const australianStandardTemplate: Partial<InvoiceTemplate> = applyRegionalConfig({
  name: "Australian Standard Invoice",
  description: "Standard invoice template for Australian businesses with GST",
  
  // Labels
  customerLabel: "Bill To",
  fromLabel: "From",
  invoiceNoLabel: "Tax Invoice #",
  issueDateLabel: "Issue Date",
  dueDateLabel: "Due Date",
  descriptionLabel: "Description",
  priceLabel: "Unit Price",
  quantityLabel: "Qty",
  totalLabel: "Amount",
  totalSummaryLabel: "Total Amount",
  vatLabel: "GST",
  subtotalLabel: "Subtotal",
  paymentLabel: "Payment Details",
  noteLabel: "Notes",
  
  // Australian defaults
  currency: "AUD",
  size: "a4",
  dateFormat: "dd/MM/yyyy",
  locale: "en-AU",
  timezone: "Australia/Sydney",
  
  // GST settings
  includeVat: true,
  vatRate: 10,
  includeDecimals: true,
  
  // Payment terms
  paymentTerms: 30,
  
  // Invoice numbering
  invoiceNumberPrefix: "INV-",
  invoiceNumberLength: 6,
  
  // Terms and conditions
  termsAndConditions: "Payment is due within 30 days of invoice date. Late payment fees may apply.",
  footerText: "Thank you for your business",
}, "AU");

export const australianConstructionTemplate: Partial<InvoiceTemplate> = {
  ...australianStandardTemplate,
  name: "Australian Construction Invoice",
  description: "Invoice template for Australian construction and dirt moving businesses",
  
  // Construction-specific labels
  quantityLabel: "Volume (m³)",
  priceLabel: "Rate per m³",
  
  // Include units for weighbridge/volume tracking
  includeUnits: true,
  
  // Custom fields for construction
  customFields: [
    {
      label: "Job Site",
      value: "",
      position: "header",
    },
    {
      label: "EPA Levy",
      value: "",
      position: "lineItem",
    },
    {
      label: "Weighbridge Docket",
      value: "",
      position: "lineItem",
    },
  ],
};

export const australianServiceTemplate: Partial<InvoiceTemplate> = {
  ...australianStandardTemplate,
  name: "Australian Service Invoice",
  description: "Invoice template for Australian service businesses",
  
  // Service-specific labels
  quantityLabel: "Hours",
  priceLabel: "Hourly Rate",
  descriptionLabel: "Service Description",
  
  // Custom fields for services
  customFields: [
    {
      label: "Service Period",
      value: "",
      position: "header",
    },
    {
      label: "Purchase Order",
      value: "",
      position: "header",
    },
  ],
};

export const australianRetailTemplate: Partial<InvoiceTemplate> = {
  ...australianStandardTemplate,
  name: "Australian Retail Invoice",
  description: "Invoice template for Australian retail businesses",
  
  // Retail-specific labels
  quantityLabel: "Qty",
  priceLabel: "Unit Price",
  descriptionLabel: "Item Description",
  
  // Include discount for retail
  includeDiscount: true,
  defaultDiscountType: "percentage",
  
  // Custom fields for retail
  customFields: [
    {
      label: "SKU",
      value: "",
      position: "lineItem",
    },
  ],
};