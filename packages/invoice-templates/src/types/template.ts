import { z } from "zod";

// Base template schema that all templates extend
export const baseTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  isDefault: z.boolean().default(false),
  businessId: z.string().uuid().optional(),
  teamId: z.string().uuid().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  
  // Template content
  title: z.string().optional(),
  customerLabel: z.string().default("Bill To"),
  fromLabel: z.string().default("From"),
  invoiceNoLabel: z.string().default("Invoice #"),
  issueDateLabel: z.string().default("Issue Date"),
  dueDateLabel: z.string().default("Due Date"),
  descriptionLabel: z.string().default("Description"),
  priceLabel: z.string().default("Price"),
  quantityLabel: z.string().default("Quantity"),
  totalLabel: z.string().default("Total"),
  totalSummaryLabel: z.string().default("Total"),
  vatLabel: z.string().default("VAT"),
  subtotalLabel: z.string().default("Subtotal"),
  taxLabel: z.string().default("Tax"),
  discountLabel: z.string().default("Discount"),
  paymentLabel: z.string().default("Payment Details"),
  noteLabel: z.string().default("Notes"),
  
  // Default values
  currency: z.string().default("USD"),
  size: z.enum(["a4", "letter"]).default("a4"),
  dateFormat: z.enum(["dd/MM/yyyy", "MM/dd/yyyy", "yyyy-MM-dd", "dd.MM.yyyy"]).default("MM/dd/yyyy"),
  locale: z.string().default("en-US"),
  timezone: z.string().default("America/New_York"),
  
  // Feature flags
  includeVat: z.boolean().default(false),
  includeTax: z.boolean().default(false),
  includeDiscount: z.boolean().default(false),
  includeDecimals: z.boolean().default(true),
  includePdf: z.boolean().default(true),
  includeUnits: z.boolean().default(true),
  includeQr: z.boolean().default(false),
  
  // Default rates
  taxRate: z.number().min(0).max(100).optional(),
  vatRate: z.number().min(0).max(100).optional(),
  defaultDiscountType: z.enum(["percentage", "fixed"]).optional(),
  defaultDiscountValue: z.number().optional(),
  
  // Payment terms
  paymentTerms: z.number().default(30), // days
  lateFeePercentage: z.number().optional(),
  
  // Numbering
  invoiceNumberPrefix: z.string().optional(),
  invoiceNumberSuffix: z.string().optional(),
  invoiceNumberLength: z.number().default(6),
  nextInvoiceNumber: z.number().default(1),
});

export type BaseTemplate = z.infer<typeof baseTemplateSchema>;

// Business details that can be stored
export const businessDetailsSchema = z.object({
  name: z.string(),
  legalName: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  website: z.string().optional(),
  logoUrl: z.string().optional(),
  
  // Tax identifiers
  abn: z.string().optional(), // Australian Business Number
  acn: z.string().optional(), // Australian Company Number
  gst: z.string().optional(), // GST Number
  ein: z.string().optional(), // US EIN
  vat: z.string().optional(), // VAT Number
  pan: z.string().optional(), // PAN Number
  
  // Additional business info
  registrationNumber: z.string().optional(),
  licenseNumber: z.string().optional(),
});

export type BusinessDetails = z.infer<typeof businessDetailsSchema>;

// Payment details that can be stored
export const paymentDetailsSchema = z.object({
  bankName: z.string().optional(),
  accountName: z.string().optional(),
  accountNumber: z.string().optional(),
  routingNumber: z.string().optional(),
  swiftCode: z.string().optional(),
  iban: z.string().optional(),
  bsb: z.string().optional(), // Australian BSB
  
  // Online payment
  paypalEmail: z.string().optional(),
  stripeAccount: z.string().optional(),
  squareAccount: z.string().optional(),
  
  // Crypto
  btcAddress: z.string().optional(),
  ethAddress: z.string().optional(),
  
  // Payment instructions
  instructions: z.string().optional(),
});

export type PaymentDetails = z.infer<typeof paymentDetailsSchema>;

// Complete template with all details
export const invoiceTemplateSchema = baseTemplateSchema.extend({
  businessDetails: businessDetailsSchema.optional(),
  paymentDetails: paymentDetailsSchema.optional(),
  
  // Custom fields
  customFields: z.array(z.object({
    label: z.string(),
    value: z.string(),
    position: z.enum(["header", "footer", "lineItem"]),
  })).optional(),
  
  // Terms and conditions
  termsAndConditions: z.string().optional(),
  footerText: z.string().optional(),
});

export type InvoiceTemplate = z.infer<typeof invoiceTemplateSchema>;

// Template categories for organization
export enum TemplateCategory {
  STANDARD = "standard",
  SERVICE = "service",
  PRODUCT = "product",
  CONSTRUCTION = "construction",
  CONSULTING = "consulting",
  FREELANCE = "freelance",
  SUBSCRIPTION = "subscription",
  REGIONAL = "regional",
  CUSTOM = "custom",
}

// Template metadata for search and filtering
export interface TemplateMetadata {
  category: TemplateCategory;
  tags: string[];
  industry?: string;
  region?: string;
  compliance?: string[]; // e.g., ["GST", "VAT", "Sales Tax"]
}