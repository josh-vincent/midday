import { BaseTemplateProvider, type TemplateProviderOptions, type ListTemplatesOptions } from "./template-provider";
import type { InvoiceTemplate, BusinessDetails, PaymentDetails } from "../types/template";

export interface DatabaseAdapter {
  // Template operations
  findTemplateById(id: string, teamId?: string): Promise<any>;
  findDefaultTemplate(teamId?: string, businessId?: string): Promise<any>;
  findTemplates(options: ListTemplatesOptions & { teamId?: string; businessId?: string }): Promise<any[]>;
  createTemplate(data: any): Promise<any>;
  updateTemplate(id: string, data: any, teamId?: string): Promise<any>;
  deleteTemplate(id: string, teamId?: string): Promise<void>;
  
  // Business operations
  findBusinessDetails(teamId?: string, businessId?: string): Promise<any>;
  upsertBusinessDetails(data: any, teamId?: string, businessId?: string): Promise<any>;
  
  // Payment operations
  findPaymentDetails(teamId?: string, businessId?: string): Promise<any>;
  upsertPaymentDetails(data: any, teamId?: string, businessId?: string): Promise<any>;
}

export class DatabaseTemplateProvider extends BaseTemplateProvider {
  constructor(
    protected options: TemplateProviderOptions,
    private adapter: DatabaseAdapter
  ) {
    super(options);
  }
  
  async getTemplate(id: string): Promise<InvoiceTemplate | null> {
    const data = await this.adapter.findTemplateById(id, this.options.teamId);
    return data ? this.mapToTemplate(data) : null;
  }
  
  async getDefaultTemplate(): Promise<InvoiceTemplate | null> {
    const data = await this.adapter.findDefaultTemplate(
      this.options.teamId,
      this.options.businessId
    );
    return data ? this.mapToTemplate(data) : null;
  }
  
  async listTemplates(options?: ListTemplatesOptions): Promise<InvoiceTemplate[]> {
    const templates = await this.adapter.findTemplates({
      ...options,
      teamId: this.options.teamId,
      businessId: this.options.businessId,
    });
    return templates.map(t => this.mapToTemplate(t));
  }
  
  async createTemplate(template: Partial<InvoiceTemplate>): Promise<InvoiceTemplate> {
    const data = await this.adapter.createTemplate({
      ...template,
      teamId: this.options.teamId,
      businessId: this.options.businessId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return this.mapToTemplate(data);
  }
  
  async updateTemplate(id: string, updates: Partial<InvoiceTemplate>): Promise<InvoiceTemplate> {
    const data = await this.adapter.updateTemplate(
      id,
      {
        ...updates,
        updatedAt: new Date(),
      },
      this.options.teamId
    );
    return this.mapToTemplate(data);
  }
  
  async deleteTemplate(id: string): Promise<void> {
    await this.adapter.deleteTemplate(id, this.options.teamId);
  }
  
  async getBusinessDetails(): Promise<BusinessDetails | null> {
    const data = await this.adapter.findBusinessDetails(
      this.options.teamId,
      this.options.businessId
    );
    return data ? this.mapToBusinessDetails(data) : null;
  }
  
  async updateBusinessDetails(details: Partial<BusinessDetails>): Promise<BusinessDetails> {
    const data = await this.adapter.upsertBusinessDetails(
      details,
      this.options.teamId,
      this.options.businessId
    );
    return this.mapToBusinessDetails(data);
  }
  
  async getPaymentDetails(): Promise<PaymentDetails | null> {
    const data = await this.adapter.findPaymentDetails(
      this.options.teamId,
      this.options.businessId
    );
    return data ? this.mapToPaymentDetails(data) : null;
  }
  
  async updatePaymentDetails(details: Partial<PaymentDetails>): Promise<PaymentDetails> {
    const data = await this.adapter.upsertPaymentDetails(
      details,
      this.options.teamId,
      this.options.businessId
    );
    return this.mapToPaymentDetails(data);
  }
  
  private mapToTemplate(data: any): InvoiceTemplate {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      isDefault: data.isDefault || false,
      businessId: data.businessId,
      teamId: data.teamId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      
      // Template content
      title: data.title,
      customerLabel: data.customerLabel || "Bill To",
      fromLabel: data.fromLabel || "From",
      invoiceNoLabel: data.invoiceNoLabel || "Invoice #",
      issueDateLabel: data.issueDateLabel || "Issue Date",
      dueDateLabel: data.dueDateLabel || "Due Date",
      descriptionLabel: data.descriptionLabel || "Description",
      priceLabel: data.priceLabel || "Price",
      quantityLabel: data.quantityLabel || "Quantity",
      totalLabel: data.totalLabel || "Total",
      totalSummaryLabel: data.totalSummaryLabel || "Total",
      vatLabel: data.vatLabel || "VAT",
      subtotalLabel: data.subtotalLabel || "Subtotal",
      taxLabel: data.taxLabel || "Tax",
      discountLabel: data.discountLabel || "Discount",
      paymentLabel: data.paymentLabel || "Payment Details",
      noteLabel: data.noteLabel || "Notes",
      
      // Default values
      currency: data.currency || "USD",
      size: data.size || "a4",
      dateFormat: data.dateFormat || "MM/dd/yyyy",
      locale: data.locale || "en-US",
      timezone: data.timezone || "America/New_York",
      
      // Feature flags
      includeVat: data.includeVat || false,
      includeTax: data.includeTax || false,
      includeDiscount: data.includeDiscount || false,
      includeDecimals: data.includeDecimals !== false,
      includePdf: data.includePdf !== false,
      includeUnits: data.includeUnits !== false,
      includeQr: data.includeQr || false,
      
      // Rates
      taxRate: data.taxRate,
      vatRate: data.vatRate,
      defaultDiscountType: data.defaultDiscountType,
      defaultDiscountValue: data.defaultDiscountValue,
      
      // Payment terms
      paymentTerms: data.paymentTerms || 30,
      lateFeePercentage: data.lateFeePercentage,
      
      // Numbering
      invoiceNumberPrefix: data.invoiceNumberPrefix,
      invoiceNumberSuffix: data.invoiceNumberSuffix,
      invoiceNumberLength: data.invoiceNumberLength || 6,
      nextInvoiceNumber: data.nextInvoiceNumber || 1,
      
      // Additional data
      businessDetails: data.businessDetails,
      paymentDetails: data.paymentDetails,
      customFields: data.customFields,
      termsAndConditions: data.termsAndConditions,
      footerText: data.footerText,
    };
  }
  
  private mapToBusinessDetails(data: any): BusinessDetails {
    return {
      name: data.name,
      legalName: data.legalName,
      address: data.address,
      city: data.city,
      state: data.state,
      postalCode: data.postalCode,
      country: data.country,
      phone: data.phone,
      email: data.email,
      website: data.website,
      logoUrl: data.logoUrl,
      abn: data.abn,
      acn: data.acn,
      gst: data.gst,
      ein: data.ein,
      vat: data.vat,
      pan: data.pan,
      registrationNumber: data.registrationNumber,
      licenseNumber: data.licenseNumber,
    };
  }
  
  private mapToPaymentDetails(data: any): PaymentDetails {
    return {
      bankName: data.bankName,
      accountName: data.accountName,
      accountNumber: data.accountNumber,
      routingNumber: data.routingNumber,
      swiftCode: data.swiftCode,
      iban: data.iban,
      bsb: data.bsb,
      paypalEmail: data.paypalEmail,
      stripeAccount: data.stripeAccount,
      squareAccount: data.squareAccount,
      btcAddress: data.btcAddress,
      ethAddress: data.ethAddress,
      instructions: data.instructions,
    };
  }
}