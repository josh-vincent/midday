export interface InvoiceTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  preview?: string;
  defaults: {
    paymentTerms: number; // days
    taxRate?: number;
    vatRate?: number;
    currency: string;
    paymentDetails?: string;
    notes?: string;
    lineItems?: Array<{
      name: string;
      description: string;
      quantity: number;
      price: number;
      unit?: string;
    }>;
  };
  settings: {
    includeVat: boolean;
    includeTax: boolean;
    includeDiscount: boolean;
    includeDecimals: boolean;
    includeUnits: boolean;
    includeQr: boolean;
    dateFormat: string;
    size: "a4" | "letter";
    locale: string;
  };
}

export const invoiceTemplates: InvoiceTemplate[] = [
  {
    id: "standard",
    name: "Standard Invoice",
    description: "A simple, professional invoice for general use",
    category: "General",
    defaults: {
      paymentTerms: 30,
      currency: "USD",
      paymentDetails: "Payment via bank transfer or credit card",
      notes: "Thank you for your business!"
    },
    settings: {
      includeVat: false,
      includeTax: true,
      includeDiscount: true,
      includeDecimals: true,
      includeUnits: false,
      includeQr: false,
      dateFormat: "MM/dd/yyyy",
      size: "letter",
      locale: "en-US"
    }
  },
  {
    id: "service",
    name: "Service Invoice",
    description: "Perfect for consultants and service providers",
    category: "Services",
    defaults: {
      paymentTerms: 15,
      taxRate: 10,
      currency: "USD",
      paymentDetails: "Payment due within 15 days",
      notes: "Thank you for choosing our services",
      lineItems: [
        {
          name: "Consultation",
          description: "Professional consultation services",
          quantity: 1,
          price: 150,
          unit: "hour"
        }
      ]
    },
    settings: {
      includeVat: false,
      includeTax: true,
      includeDiscount: false,
      includeDecimals: true,
      includeUnits: true,
      includeQr: false,
      dateFormat: "MM/dd/yyyy",
      size: "letter",
      locale: "en-US"
    }
  },
  {
    id: "product",
    name: "Product Invoice",
    description: "Ideal for physical product sales",
    category: "Products",
    defaults: {
      paymentTerms: 30,
      taxRate: 8.5,
      currency: "USD",
      paymentDetails: "Payment due within 30 days",
      notes: "All sales are final. Returns accepted within 14 days.",
      lineItems: [
        {
          name: "Product Name",
          description: "Product description",
          quantity: 1,
          price: 99.99,
          unit: "unit"
        }
      ]
    },
    settings: {
      includeVat: false,
      includeTax: true,
      includeDiscount: true,
      includeDecimals: true,
      includeUnits: true,
      includeQr: true,
      dateFormat: "MM/dd/yyyy",
      size: "letter",
      locale: "en-US"
    }
  },
  {
    id: "freelance",
    name: "Freelance Invoice",
    description: "For freelancers and independent contractors",
    category: "Freelance",
    defaults: {
      paymentTerms: 7,
      currency: "USD",
      paymentDetails: "Payment via PayPal, Venmo, or bank transfer",
      notes: "Thank you for the opportunity to work with you!",
      lineItems: [
        {
          name: "Project Work",
          description: "Development and design services",
          quantity: 40,
          price: 75,
          unit: "hour"
        }
      ]
    },
    settings: {
      includeVat: false,
      includeTax: false,
      includeDiscount: false,
      includeDecimals: true,
      includeUnits: true,
      includeQr: false,
      dateFormat: "MM/dd/yyyy",
      size: "letter",
      locale: "en-US"
    }
  },
  {
    id: "subscription",
    name: "Subscription Invoice",
    description: "For recurring services and subscriptions",
    category: "Subscription",
    defaults: {
      paymentTerms: 0,
      currency: "USD",
      paymentDetails: "Auto-charged to your payment method on file",
      notes: "This is a recurring charge. Cancel anytime.",
      lineItems: [
        {
          name: "Monthly Subscription",
          description: "Premium plan - Monthly",
          quantity: 1,
          price: 49.99,
          unit: "month"
        }
      ]
    },
    settings: {
      includeVat: false,
      includeTax: true,
      includeDiscount: true,
      includeDecimals: true,
      includeUnits: false,
      includeQr: false,
      dateFormat: "MM/dd/yyyy",
      size: "letter",
      locale: "en-US"
    }
  },
  {
    id: "international",
    name: "International Invoice",
    description: "For international clients with VAT",
    category: "International",
    defaults: {
      paymentTerms: 45,
      vatRate: 20,
      currency: "EUR",
      paymentDetails: "SWIFT/IBAN transfer accepted",
      notes: "VAT included as per EU regulations"
    },
    settings: {
      includeVat: true,
      includeTax: false,
      includeDiscount: true,
      includeDecimals: true,
      includeUnits: false,
      includeQr: true,
      dateFormat: "dd/MM/yyyy",
      size: "a4",
      locale: "en-GB"
    }
  },
  {
    id: "contractor",
    name: "Contractor Invoice",
    description: "For construction and contractor work",
    category: "Construction",
    defaults: {
      paymentTerms: 30,
      taxRate: 7,
      currency: "USD",
      paymentDetails: "Payment due upon completion",
      notes: "Work guaranteed for 1 year",
      lineItems: [
        {
          name: "Labor",
          description: "Installation and setup",
          quantity: 8,
          price: 85,
          unit: "hour"
        },
        {
          name: "Materials",
          description: "All required materials",
          quantity: 1,
          price: 500,
          unit: "lot"
        }
      ]
    },
    settings: {
      includeVat: false,
      includeTax: true,
      includeDiscount: false,
      includeDecimals: true,
      includeUnits: true,
      includeQr: false,
      dateFormat: "MM/dd/yyyy",
      size: "letter",
      locale: "en-US"
    }
  },
  {
    id: "retail",
    name: "Retail Invoice",
    description: "For retail and e-commerce businesses",
    category: "Retail",
    defaults: {
      paymentTerms: 0,
      taxRate: 8.875,
      currency: "USD",
      paymentDetails: "Payment received",
      notes: "Thank you for shopping with us!"
    },
    settings: {
      includeVat: false,
      includeTax: true,
      includeDiscount: true,
      includeDecimals: true,
      includeUnits: true,
      includeQr: true,
      dateFormat: "MM/dd/yyyy",
      size: "letter",
      locale: "en-US"
    }
  }
];

export function getTemplateById(id: string): InvoiceTemplate | undefined {
  return invoiceTemplates.find(template => template.id === id);
}

export function getTemplatesByCategory(category: string): InvoiceTemplate[] {
  return invoiceTemplates.filter(template => template.category === category);
}

export function getCategories(): string[] {
  return Array.from(new Set(invoiceTemplates.map(t => t.category)));
}