import type { InvoiceTemplate } from "../../types/template";
import { applyRegionalConfig } from "../../types/regional";

export const usStandardTemplate: Partial<InvoiceTemplate> = applyRegionalConfig({
  name: "US Standard Invoice",
  description: "Standard invoice template for US businesses",
  
  // Labels
  customerLabel: "Bill To",
  fromLabel: "From",
  invoiceNoLabel: "Invoice #",
  issueDateLabel: "Invoice Date",
  dueDateLabel: "Payment Due",
  descriptionLabel: "Description",
  priceLabel: "Rate",
  quantityLabel: "Quantity",
  totalLabel: "Amount",
  totalSummaryLabel: "Total Due",
  taxLabel: "Sales Tax",
  subtotalLabel: "Subtotal",
  paymentLabel: "Payment Information",
  noteLabel: "Notes",
  
  // US defaults
  currency: "USD",
  size: "letter",
  dateFormat: "MM/dd/yyyy",
  locale: "en-US",
  timezone: "America/New_York",
  
  // Tax settings (varies by state)
  includeTax: true,
  taxRate: 0, // Set based on state
  includeDecimals: true,
  
  // Payment terms
  paymentTerms: 30,
  lateFeePercentage: 1.5, // Common late fee percentage
  
  // Invoice numbering
  invoiceNumberPrefix: "INV-",
  invoiceNumberLength: 6,
  
  // Terms and conditions
  termsAndConditions: "Payment is due within 30 days. A 1.5% monthly finance charge will be applied to overdue accounts.",
  footerText: "Thank you for your business!",
}, "US");

export const usFreelanceTemplate: Partial<InvoiceTemplate> = {
  ...usStandardTemplate,
  name: "US Freelance Invoice",
  description: "Invoice template for US freelancers and consultants",
  
  // Freelance-specific labels
  quantityLabel: "Hours",
  priceLabel: "Hourly Rate",
  descriptionLabel: "Project/Task Description",
  
  // Payment terms for freelance (often Net 15)
  paymentTerms: 15,
  
  // Custom fields for freelance
  customFields: [
    {
      label: "Project Name",
      value: "",
      position: "header",
    },
    {
      label: "Contract Number",
      value: "",
      position: "header",
    },
  ],
};

export const usContractorTemplate: Partial<InvoiceTemplate> = {
  ...usStandardTemplate,
  name: "US Contractor Invoice",
  description: "Invoice template for US contractors and construction",
  
  // Contractor-specific labels
  quantityLabel: "Units",
  priceLabel: "Unit Price",
  descriptionLabel: "Work Description",
  
  // Custom fields for contractors
  customFields: [
    {
      label: "Job Location",
      value: "",
      position: "header",
    },
    {
      label: "Purchase Order",
      value: "",
      position: "header",
    },
    {
      label: "Change Order",
      value: "",
      position: "header",
    },
  ],
};

export const usSaaSTemplate: Partial<InvoiceTemplate> = {
  ...usStandardTemplate,
  name: "US SaaS Invoice",
  description: "Invoice template for US software and subscription services",
  
  // SaaS-specific labels
  quantityLabel: "Licenses",
  priceLabel: "Price/License",
  descriptionLabel: "Service/Product",
  
  // Custom fields for SaaS
  customFields: [
    {
      label: "Billing Period",
      value: "",
      position: "header",
    },
    {
      label: "Account ID",
      value: "",
      position: "header",
    },
    {
      label: "Subscription Plan",
      value: "",
      position: "header",
    },
  ],
  
  // Terms for subscription services
  termsAndConditions: "This invoice represents charges for the billing period indicated above. Services will continue uninterrupted upon payment.",
};