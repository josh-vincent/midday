import type { InvoiceTemplate, BusinessDetails, PaymentDetails } from "../types/template";
import type { TemplateProvider } from "../providers/template-provider";

export interface AutoPopulateOptions {
  templateId?: string;
  customerId?: string;
  projectId?: string;
  jobIds?: string[];
  overrides?: Partial<InvoiceFormData>;
}

export interface InvoiceFormData {
  id: string;
  status: string;
  template: Partial<InvoiceTemplate>;
  fromDetails: any; // TipTap JSON
  customerDetails: any; // TipTap JSON
  customerId?: string;
  customerName?: string;
  paymentDetails: any; // TipTap JSON
  noteDetails?: any; // TipTap JSON
  dueDate: string;
  issueDate: string;
  invoiceNumber: string;
  logoUrl?: string | null;
  vat?: number | null;
  tax?: number | null;
  discount?: number | null;
  subtotal?: number | null;
  amount: number;
  lineItems: any[];
  token?: string;
  scheduledAt?: string | null;
}

export class InvoiceAutoPopulator {
  constructor(private provider: TemplateProvider) {}
  
  async populateInvoice(options: AutoPopulateOptions = {}): Promise<InvoiceFormData> {
    // Get template data
    const templateData = options.templateId
      ? await this.provider.populateFromTemplate(options.templateId)
      : await this.provider.populateFromDefaults();
    
    // Get customer data if provided
    const customerData = options.customerId
      ? await this.fetchCustomerData(options.customerId)
      : null;
    
    // Get line items from jobs if provided
    const lineItems = options.jobIds?.length
      ? await this.fetchJobLineItems(options.jobIds)
      : [];
    
    // Calculate totals
    const subtotal = this.calculateSubtotal(lineItems);
    const tax = templateData.template.includeTax
      ? subtotal * (templateData.template.taxRate || 0) / 100
      : 0;
    const vat = templateData.template.includeVat
      ? subtotal * (templateData.template.vatRate || 0) / 100
      : 0;
    const discount = this.calculateDiscount(
      subtotal,
      templateData.template.defaultDiscountType,
      templateData.template.defaultDiscountValue
    );
    const amount = subtotal + tax + vat - discount;
    
    // Generate unique ID
    const id = this.generateId();
    
    // Build the form data
    const formData: InvoiceFormData = {
      id,
      status: "draft",
      template: templateData.template,
      fromDetails: templateData.fromDetails,
      customerDetails: customerData?.details || null,
      customerId: options.customerId,
      customerName: customerData?.name,
      paymentDetails: templateData.paymentDetails,
      noteDetails: this.formatNoteDetails(templateData.template),
      dueDate: templateData.dueDate,
      issueDate: templateData.issueDate,
      invoiceNumber: templateData.invoiceNumber,
      logoUrl: templateData.businessDetails?.logoUrl,
      vat: vat > 0 ? vat : null,
      tax: tax > 0 ? tax : null,
      discount: discount > 0 ? discount : null,
      subtotal: subtotal > 0 ? subtotal : null,
      amount,
      lineItems,
    };
    
    // Apply any overrides
    if (options.overrides) {
      Object.assign(formData, options.overrides);
    }
    
    // Increment invoice number for next time
    if (options.templateId) {
      await this.provider.incrementInvoiceNumber(options.templateId);
    }
    
    return formData;
  }
  
  async populateFromCustomer(customerId: string): Promise<Partial<InvoiceFormData>> {
    const customerData = await this.fetchCustomerData(customerId);
    
    return {
      customerId,
      customerName: customerData?.name,
      customerDetails: customerData?.details,
    };
  }
  
  async populateFromJobs(jobIds: string[]): Promise<Partial<InvoiceFormData>> {
    const lineItems = await this.fetchJobLineItems(jobIds);
    const subtotal = this.calculateSubtotal(lineItems);
    
    return {
      lineItems,
      subtotal,
      amount: subtotal,
    };
  }
  
  async updateCalculations(
    formData: Partial<InvoiceFormData>
  ): Promise<Partial<InvoiceFormData>> {
    const subtotal = formData.lineItems
      ? this.calculateSubtotal(formData.lineItems)
      : formData.subtotal || 0;
    
    const tax = formData.template?.includeTax && formData.template?.taxRate
      ? subtotal * formData.template.taxRate / 100
      : formData.tax || 0;
    
    const vat = formData.template?.includeVat && formData.template?.vatRate
      ? subtotal * formData.template.vatRate / 100
      : formData.vat || 0;
    
    const discount = formData.discount || 0;
    const amount = subtotal + tax + vat - discount;
    
    return {
      ...formData,
      subtotal,
      tax: tax > 0 ? tax : null,
      vat: vat > 0 ? vat : null,
      amount,
    };
  }
  
  private async fetchCustomerData(customerId: string): Promise<{
    name: string;
    details: any;
  } | null> {
    // This would be implemented to fetch from your database
    // For now, returning a placeholder
    return {
      name: "Customer Name",
      details: this.formatCustomerDetails({
        name: "Customer Name",
        address: "123 Main St",
        city: "City",
        state: "State",
        postalCode: "12345",
      }),
    };
  }
  
  private async fetchJobLineItems(jobIds: string[]): Promise<any[]> {
    // This would fetch job data and convert to line items
    // For now, returning empty array
    return [];
  }
  
  private calculateSubtotal(lineItems: any[]): number {
    return lineItems.reduce((sum, item) => {
      const quantity = item.quantity || 1;
      const price = item.price || 0;
      return sum + (quantity * price);
    }, 0);
  }
  
  private calculateDiscount(
    subtotal: number,
    type?: "percentage" | "fixed",
    value?: number
  ): number {
    if (!value) return 0;
    
    if (type === "percentage") {
      return subtotal * value / 100;
    }
    
    return value;
  }
  
  private formatCustomerDetails(customer: any): any {
    const content = [];
    
    if (customer.name) {
      content.push({
        type: "paragraph",
        content: [{
          type: "text",
          text: customer.name,
          marks: [{ type: "bold" }],
        }],
      });
    }
    
    const addressParts = [
      customer.address,
      [customer.city, customer.state, customer.postalCode].filter(Boolean).join(", "),
      customer.country,
    ].filter(Boolean);
    
    addressParts.forEach(part => {
      content.push({
        type: "paragraph",
        content: [{ type: "text", text: part }],
      });
    });
    
    if (customer.phone) {
      content.push({
        type: "paragraph",
        content: [{ type: "text", text: `Phone: ${customer.phone}` }],
      });
    }
    
    if (customer.email) {
      content.push({
        type: "paragraph",
        content: [{ type: "text", text: `Email: ${customer.email}` }],
      });
    }
    
    return JSON.stringify({ type: "doc", content });
  }
  
  private formatNoteDetails(template: Partial<InvoiceTemplate>): any | undefined {
    if (!template.termsAndConditions && !template.footerText) {
      return undefined;
    }
    
    const content = [];
    
    if (template.termsAndConditions) {
      content.push({
        type: "paragraph",
        content: [{
          type: "text",
          text: "Terms & Conditions",
          marks: [{ type: "bold" }],
        }],
      });
      content.push({
        type: "paragraph",
        content: [{ type: "text", text: template.termsAndConditions }],
      });
    }
    
    if (template.footerText) {
      if (content.length > 0) {
        content.push({ type: "paragraph", content: [] }); // Empty line
      }
      content.push({
        type: "paragraph",
        content: [{ type: "text", text: template.footerText }],
      });
    }
    
    return JSON.stringify({ type: "doc", content });
  }
  
  private generateId(): string {
    return `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}