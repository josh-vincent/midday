import type { InvoiceTemplate, BusinessDetails, PaymentDetails } from "../types/template";

export interface TemplateProviderOptions {
  teamId?: string;
  businessId?: string;
  userId?: string;
}

export interface TemplateProvider {
  // Template CRUD
  getTemplate(id: string): Promise<InvoiceTemplate | null>;
  getDefaultTemplate(): Promise<InvoiceTemplate | null>;
  listTemplates(options?: ListTemplatesOptions): Promise<InvoiceTemplate[]>;
  createTemplate(template: Partial<InvoiceTemplate>): Promise<InvoiceTemplate>;
  updateTemplate(id: string, updates: Partial<InvoiceTemplate>): Promise<InvoiceTemplate>;
  deleteTemplate(id: string): Promise<void>;
  
  // Business details management
  getBusinessDetails(): Promise<BusinessDetails | null>;
  updateBusinessDetails(details: Partial<BusinessDetails>): Promise<BusinessDetails>;
  
  // Payment details management
  getPaymentDetails(): Promise<PaymentDetails | null>;
  updatePaymentDetails(details: Partial<PaymentDetails>): Promise<PaymentDetails>;
  
  // Auto-population
  populateFromTemplate(templateId: string): Promise<PopulatedInvoiceData>;
  populateFromDefaults(): Promise<PopulatedInvoiceData>;
  
  // Utilities
  generateInvoiceNumber(template: InvoiceTemplate): Promise<string>;
  incrementInvoiceNumber(templateId: string): Promise<void>;
}

export interface ListTemplatesOptions {
  category?: string;
  isDefault?: boolean;
  limit?: number;
  offset?: number;
  searchTerm?: string;
}

export interface PopulatedInvoiceData {
  template: Partial<InvoiceTemplate>;
  fromDetails: any; // TipTap JSON format
  paymentDetails: any; // TipTap JSON format
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  businessDetails?: BusinessDetails;
  customFields?: Array<{ label: string; value: string }>;
}

// Base implementation that can be extended
export abstract class BaseTemplateProvider implements TemplateProvider {
  constructor(protected options: TemplateProviderOptions) {}
  
  abstract getTemplate(id: string): Promise<InvoiceTemplate | null>;
  abstract getDefaultTemplate(): Promise<InvoiceTemplate | null>;
  abstract listTemplates(options?: ListTemplatesOptions): Promise<InvoiceTemplate[]>;
  abstract createTemplate(template: Partial<InvoiceTemplate>): Promise<InvoiceTemplate>;
  abstract updateTemplate(id: string, updates: Partial<InvoiceTemplate>): Promise<InvoiceTemplate>;
  abstract deleteTemplate(id: string): Promise<void>;
  abstract getBusinessDetails(): Promise<BusinessDetails | null>;
  abstract updateBusinessDetails(details: Partial<BusinessDetails>): Promise<BusinessDetails>;
  abstract getPaymentDetails(): Promise<PaymentDetails | null>;
  abstract updatePaymentDetails(details: Partial<PaymentDetails>): Promise<PaymentDetails>;
  
  async populateFromTemplate(templateId: string): Promise<PopulatedInvoiceData> {
    const template = await this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }
    
    const businessDetails = await this.getBusinessDetails();
    const paymentDetails = await this.getPaymentDetails();
    const invoiceNumber = await this.generateInvoiceNumber(template);
    
    const issueDate = new Date().toISOString().split('T')[0];
    const dueDate = new Date(Date.now() + (template.paymentTerms || 30) * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];
    
    return {
      template,
      fromDetails: this.formatBusinessDetailsForEditor(businessDetails),
      paymentDetails: this.formatPaymentDetailsForEditor(paymentDetails),
      invoiceNumber,
      issueDate,
      dueDate,
      businessDetails: businessDetails || undefined,
      customFields: template.customFields,
    };
  }
  
  async populateFromDefaults(): Promise<PopulatedInvoiceData> {
    const defaultTemplate = await this.getDefaultTemplate();
    if (defaultTemplate) {
      return this.populateFromTemplate(defaultTemplate.id);
    }
    
    // Fallback to business details only
    const businessDetails = await this.getBusinessDetails();
    const paymentDetails = await this.getPaymentDetails();
    
    return {
      template: {},
      fromDetails: this.formatBusinessDetailsForEditor(businessDetails),
      paymentDetails: this.formatPaymentDetailsForEditor(paymentDetails),
      invoiceNumber: await this.generateDefaultInvoiceNumber(),
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      businessDetails: businessDetails || undefined,
    };
  }
  
  async generateInvoiceNumber(template: InvoiceTemplate): Promise<string> {
    const prefix = template.invoiceNumberPrefix || "INV";
    const suffix = template.invoiceNumberSuffix || "";
    const number = String(template.nextInvoiceNumber || 1).padStart(
      template.invoiceNumberLength || 6,
      "0"
    );
    
    return `${prefix}${number}${suffix}`;
  }
  
  async incrementInvoiceNumber(templateId: string): Promise<void> {
    const template = await this.getTemplate(templateId);
    if (template) {
      await this.updateTemplate(templateId, {
        nextInvoiceNumber: (template.nextInvoiceNumber || 1) + 1,
      });
    }
  }
  
  protected formatBusinessDetailsForEditor(details: BusinessDetails | null): any {
    if (!details) return null;
    
    const content = [];
    
    // Add business name
    if (details.name) {
      content.push({
        type: "paragraph",
        content: [{
          type: "text",
          text: details.name,
          marks: [{ type: "bold" }],
        }],
      });
    }
    
    // Add legal name if different
    if (details.legalName && details.legalName !== details.name) {
      content.push({
        type: "paragraph",
        content: [{ type: "text", text: details.legalName }],
      });
    }
    
    // Add address
    const addressParts = [
      details.address,
      [details.city, details.state, details.postalCode].filter(Boolean).join(", "),
      details.country,
    ].filter(Boolean);
    
    addressParts.forEach(part => {
      content.push({
        type: "paragraph",
        content: [{ type: "text", text: part }],
      });
    });
    
    // Add contact info
    if (details.phone) {
      content.push({
        type: "paragraph",
        content: [{ type: "text", text: `Phone: ${details.phone}` }],
      });
    }
    
    if (details.email) {
      content.push({
        type: "paragraph",
        content: [{ type: "text", text: `Email: ${details.email}` }],
      });
    }
    
    // Add tax identifiers
    const taxIds = [];
    if (details.abn) taxIds.push(`ABN: ${details.abn}`);
    if (details.acn) taxIds.push(`ACN: ${details.acn}`);
    if (details.gst) taxIds.push(`GST: ${details.gst}`);
    if (details.ein) taxIds.push(`EIN: ${details.ein}`);
    if (details.vat) taxIds.push(`VAT: ${details.vat}`);
    
    taxIds.forEach(taxId => {
      content.push({
        type: "paragraph",
        content: [{ type: "text", text: taxId }],
      });
    });
    
    return JSON.stringify({ type: "doc", content });
  }
  
  protected formatPaymentDetailsForEditor(details: PaymentDetails | null): any {
    if (!details) return null;
    
    const content = [];
    
    // Add bank details
    if (details.bankName) {
      content.push({
        type: "paragraph",
        content: [{
          type: "text",
          text: "Bank Details",
          marks: [{ type: "bold" }],
        }],
      });
      
      const bankInfo = [
        details.bankName && `Bank: ${details.bankName}`,
        details.accountName && `Account Name: ${details.accountName}`,
        details.accountNumber && `Account: ${details.accountNumber}`,
        details.bsb && `BSB: ${details.bsb}`,
        details.routingNumber && `Routing: ${details.routingNumber}`,
        details.swiftCode && `SWIFT: ${details.swiftCode}`,
        details.iban && `IBAN: ${details.iban}`,
      ].filter(Boolean);
      
      bankInfo.forEach(info => {
        content.push({
          type: "paragraph",
          content: [{ type: "text", text: info }],
        });
      });
    }
    
    // Add online payment methods
    const onlinePayments = [];
    if (details.paypalEmail) onlinePayments.push(`PayPal: ${details.paypalEmail}`);
    if (details.stripeAccount) onlinePayments.push(`Stripe: ${details.stripeAccount}`);
    if (details.squareAccount) onlinePayments.push(`Square: ${details.squareAccount}`);
    
    if (onlinePayments.length > 0) {
      content.push({
        type: "paragraph",
        content: [{
          type: "text",
          text: "Online Payment",
          marks: [{ type: "bold" }],
        }],
      });
      
      onlinePayments.forEach(payment => {
        content.push({
          type: "paragraph",
          content: [{ type: "text", text: payment }],
        });
      });
    }
    
    // Add payment instructions
    if (details.instructions) {
      content.push({
        type: "paragraph",
        content: [{
          type: "text",
          text: "Payment Instructions",
          marks: [{ type: "bold" }],
        }],
      });
      content.push({
        type: "paragraph",
        content: [{ type: "text", text: details.instructions }],
      });
    }
    
    return content.length > 0 ? JSON.stringify({ type: "doc", content }) : null;
  }
  
  protected async generateDefaultInvoiceNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    return `INV${year}${month}${random}`;
  }
}