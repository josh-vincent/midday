export interface MockCustomer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  taxId?: string;
}

export interface MockInvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  tax?: number;
  discount?: number;
}

export interface MockInvoice {
  id: string;
  number: string;
  token?: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled" | "partially_paid";
  date: string;
  dueDate: string;
  customer: MockCustomer;
  items: MockInvoiceItem[];
  subtotal: number;
  tax: number;
  taxRate: number;
  discount: number;
  discountType: "percentage" | "fixed";
  total: number;
  amountPaid: number;
  amountDue: number;
  currency: string;
  notes?: string;
  terms?: string;
  paymentMethod?: string;
  paymentTerms: "net15" | "net30" | "net60" | "due_on_receipt" | "custom";
  sentAt?: string;
  paidAt?: string;
  viewedAt?: string;
  template: "standard" | "modern" | "minimal";
  logo?: string;
  recurring?: {
    frequency: "monthly" | "quarterly" | "yearly";
    nextDate: string;
    endDate?: string;
  };
  attachments?: string[];
  customFields?: Record<string, any>;
  lineItems?: Array<{
    name: string;
    description?: string;
    quantity?: number;
    price?: number;
    total?: number;
    jobId?: string;
    jobNumber?: string;
  }>;
}

const customers: MockCustomer[] = [
  {
    id: "cust_1",
    name: "Acme Corporation",
    email: "billing@acme.com",
    phone: "+1 555-0123",
    address: {
      street: "123 Business Ave",
      city: "San Francisco",
      state: "CA",
      zip: "94105",
      country: "USA",
    },
    taxId: "12-3456789",
  },
  {
    id: "cust_2",
    name: "TechStart Inc",
    email: "accounts@techstart.io",
    phone: "+1 555-0124",
    address: {
      street: "456 Innovation Way",
      city: "Austin",
      state: "TX",
      zip: "78701",
      country: "USA",
    },
    taxId: "98-7654321",
  },
  {
    id: "cust_3",
    name: "Global Services Ltd",
    email: "finance@globalservices.com",
    phone: "+1 555-0125",
    address: {
      street: "789 Commerce St",
      city: "New York",
      state: "NY",
      zip: "10001",
      country: "USA",
    },
  },
  {
    id: "cust_4",
    name: "Digital Agency Co",
    email: "invoices@digitalagency.co",
    phone: "+1 555-0126",
    address: {
      street: "321 Creative Blvd",
      city: "Los Angeles",
      state: "CA",
      zip: "90028",
      country: "USA",
    },
  },
  {
    id: "cust_5",
    name: "Enterprise Solutions",
    email: "ap@enterprise.com",
    phone: "+1 555-0127",
    address: {
      street: "555 Corporate Dr",
      city: "Chicago",
      state: "IL",
      zip: "60601",
      country: "USA",
    },
    taxId: "45-6789012",
  },
];

const serviceDescriptions = [
  "Web Development Services",
  "UI/UX Design",
  "Consulting Services",
  "API Integration",
  "Cloud Infrastructure Setup",
  "Mobile App Development",
  "SEO Optimization",
  "Content Creation",
  "Data Analytics",
  "Security Audit",
  "Training & Support",
  "Custom Software Development",
];

function generateInvoiceItems(): MockInvoiceItem[] {
  const itemCount = Math.floor(Math.random() * 4) + 1;
  const items: MockInvoiceItem[] = [];
  
  for (let i = 0; i < itemCount; i++) {
    const description = serviceDescriptions[Math.floor(Math.random() * serviceDescriptions.length)];
    const quantity = Math.floor(Math.random() * 10) + 1;
    const rate = Math.floor(Math.random() * 500) * 10 + 500;
    const amount = quantity * rate;
    
    items.push({
      id: `item_${i + 1}`,
      description,
      quantity,
      rate,
      amount,
      tax: 0,
      discount: 0,
    });
  }
  
  return items;
}

function generateInvoices(count: number): MockInvoice[] {
  const invoices: MockInvoice[] = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const items = generateInvoiceItems();
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const taxRate = Math.random() > 0.3 ? 0.1 : 0; // 10% tax or no tax
    const tax = subtotal * taxRate;
    const discountType = Math.random() > 0.5 ? "percentage" : "fixed";
    const discount = Math.random() > 0.7 
      ? (discountType === "percentage" ? Math.floor(Math.random() * 20) : Math.floor(Math.random() * 500))
      : 0;
    const discountAmount = discountType === "percentage" 
      ? (subtotal * discount / 100)
      : discount;
    const total = subtotal + tax - discountAmount;
    
    // Generate dates
    const daysAgo = Math.floor(Math.random() * 90);
    const invoiceDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const paymentTermsDays = [15, 30, 60][Math.floor(Math.random() * 3)];
    const dueDate = new Date(invoiceDate.getTime() + paymentTermsDays * 24 * 60 * 60 * 1000);
    
    // Determine status based on dates and random
    let status: MockInvoice["status"] = "draft";
    let amountPaid = 0;
    let sentAt: string | undefined;
    let paidAt: string | undefined;
    let viewedAt: string | undefined;
    
    const random = Math.random();
    if (random > 0.9) {
      status = "draft";
    } else if (random > 0.7) {
      status = "cancelled";
    } else if (random > 0.4) {
      status = "paid";
      amountPaid = total;
      sentAt = new Date(invoiceDate.getTime() + 24 * 60 * 60 * 1000).toISOString();
      paidAt = new Date(invoiceDate.getTime() + Math.floor(Math.random() * paymentTermsDays) * 24 * 60 * 60 * 1000).toISOString();
      viewedAt = sentAt;
    } else if (dueDate < now) {
      status = "overdue";
      sentAt = new Date(invoiceDate.getTime() + 24 * 60 * 60 * 1000).toISOString();
      viewedAt = sentAt;
    } else {
      status = "sent";
      sentAt = new Date(invoiceDate.getTime() + 24 * 60 * 60 * 1000).toISOString();
      if (Math.random() > 0.3) {
        viewedAt = new Date(sentAt).toISOString();
      }
    }
    
    // Partial payment
    if (status === "sent" && Math.random() > 0.8) {
      status = "partially_paid";
      amountPaid = total * (0.3 + Math.random() * 0.5);
    }
    
    const invoice: MockInvoice = {
      id: `inv_${i + 1}`,
      number: `INV-${(2024001 + i).toString()}`,
      status,
      date: invoiceDate.toISOString(),
      dueDate: dueDate.toISOString(),
      customer,
      items,
      subtotal,
      tax,
      taxRate,
      discount,
      discountType,
      total,
      amountPaid,
      amountDue: total - amountPaid,
      currency: "USD",
      notes: Math.random() > 0.5 ? "Thank you for your business!" : undefined,
      terms: "Payment is due within " + paymentTermsDays + " days",
      paymentTerms: paymentTermsDays === 15 ? "net15" : paymentTermsDays === 30 ? "net30" : "net60",
      sentAt,
      paidAt,
      viewedAt,
      template: ["standard", "modern", "minimal"][Math.floor(Math.random() * 3)] as any,
      recurring: Math.random() > 0.9 ? {
        frequency: "monthly",
        nextDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } : undefined,
    };
    
    invoices.push(invoice);
  }
  
  return invoices.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

// Mock API
export const invoicesAPI = {
  getInvoices: async (): Promise<MockInvoice[]> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return generateInvoices(50);
  },

  getInvoice: async (id: string): Promise<MockInvoice | null> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const invoices = generateInvoices(50);
    return invoices.find(i => i.id === id) || null;
  },

  createInvoice: async (data: Partial<MockInvoice>): Promise<MockInvoice> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const items = data.items || generateInvoiceItems();
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const tax = subtotal * (data.taxRate || 0.1);
    const total = subtotal + tax - (data.discount || 0);
    
    return {
      id: `inv_${Date.now()}`,
      number: `INV-${Date.now()}`,
      status: "draft",
      date: new Date().toISOString(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      customer: data.customer || customers[0],
      items,
      subtotal,
      tax,
      taxRate: data.taxRate || 0.1,
      discount: data.discount || 0,
      discountType: data.discountType || "fixed",
      total,
      amountPaid: 0,
      amountDue: total,
      currency: "USD",
      paymentTerms: "net30",
      template: "standard",
      ...data,
    } as MockInvoice;
  },

  updateInvoice: async (id: string, data: Partial<MockInvoice>): Promise<MockInvoice> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    const invoices = generateInvoices(50);
    const invoice = invoices.find(i => i.id === id);
    if (!invoice) throw new Error("Invoice not found");
    return { ...invoice, ...data };
  },

  deleteInvoice: async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));
  },

  duplicateInvoice: async (id: string): Promise<MockInvoice> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    const invoices = generateInvoices(50);
    const invoice = invoices.find(i => i.id === id);
    if (!invoice) throw new Error("Invoice not found");
    
    return {
      ...invoice,
      id: `inv_${Date.now()}`,
      number: `INV-${Date.now()}`,
      status: "draft",
      date: new Date().toISOString(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      sentAt: undefined,
      paidAt: undefined,
      viewedAt: undefined,
      amountPaid: 0,
      amountDue: invoice.total,
    };
  },

  getCustomers: async (): Promise<MockCustomer[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return customers;
  },

  getInvoiceByToken: async (token: string): Promise<MockInvoice | null> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const invoices = generateInvoices(50);
    
    // Assign tokens to invoices for demo purposes
    const invoiceWithTokens = invoices.map(invoice => ({
      ...invoice,
      token: `token_${invoice.id}`,
      lineItems: invoice.items.map((item, index) => ({
        name: item.description,
        description: item.description,
        quantity: item.quantity,
        price: item.rate,
        total: item.amount,
        jobId: index % 3 === 0 ? `job_${invoice.id}_${index}` : undefined,
        jobNumber: index % 3 === 0 ? `JOB-${1000 + index}` : undefined,
      })),
      customerName: invoice.customer.name,
      invoiceNumber: invoice.number,
      template: {
        size: 'letter' as const,
      }
    }));
    
    return invoiceWithTokens.find(invoice => invoice.token === token) || null;
  },
};