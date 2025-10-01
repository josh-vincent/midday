export interface MockCustomer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  website?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  taxId?: string;
  type: "individual" | "business" | "enterprise";
  status: "active" | "inactive" | "suspended" | "prospect";
  tags: string[];
  totalRevenue: number;
  outstandingBalance: number;
  totalInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
  averagePaymentTime: number; // in days
  creditLimit?: number;
  currency: string;
  language: string;
  timezone: string;
  paymentTerms: "net15" | "net30" | "net60" | "due_on_receipt" | "custom";
  preferredPaymentMethod?: "bank_transfer" | "credit_card" | "check" | "cash";
  notes?: string;
  createdAt: string;
  updatedAt: string;
  lastActivityAt?: string;
  lastInvoiceAt?: string;
  lastPaymentAt?: string;
  contactPerson?: {
    name: string;
    title?: string;
    email?: string;
    phone?: string;
  };
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  customFields?: Record<string, any>;
}

export interface MockCustomerActivity {
  id: string;
  customerId: string;
  type: "invoice_created" | "payment_received" | "email_sent" | "note_added" | "status_changed" | "contact_updated";
  description: string;
  date: string;
  amount?: number;
  currency?: string;
  metadata?: Record<string, any>;
}

export interface MockCustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  newCustomersThisMonth: number;
  totalRevenue: number;
  averageCustomerValue: number;
  topCustomersByRevenue: MockCustomer[];
  customersByStatus: Record<string, number>;
  customersByType: Record<string, number>;
  revenueGrowth: number;
  churnRate: number;
}

const customerTypes: MockCustomer["type"][] = ["individual", "business", "enterprise"];
const customerStatuses: MockCustomer["status"][] = ["active", "inactive", "suspended", "prospect"];
const availableTags = [
  "VIP", "High Value", "Enterprise", "SMB", "Startup", "Non-profit", 
  "Government", "International", "Recurring", "One-time", "Referral",
  "Premium Support", "Beta Tester", "Partner", "Reseller"
];

const companyNames = [
  "Acme Corporation", "TechStart Inc", "Global Services Ltd", "Digital Agency Co", 
  "Enterprise Solutions", "Creative Studios", "DataFlow Systems", "CloudTech Partners",
  "InnovateLab", "FutureTech Corp", "SmartSolutions Inc", "NextGen Dynamics",
  "ProActive Systems", "StreamlineCorp", "VelocityTech", "Precision Analytics",
  "ScaleUp Ventures", "ConnectWorks", "OptimizeFirst", "TransformDigital",
  "AgileWorks Inc", "PowerFlow Systems", "CoreTech Solutions", "GrowthEngine",
  "BuildRight Corp", "FlexiTech", "RapidScale", "DeepInsights Inc",
  "ModernStack", "CloudFirst Ltd", "DataDriven Co", "AutoFlow Systems"
];

const individualNames = [
  "John Smith", "Sarah Johnson", "Michael Brown", "Emily Davis", "David Wilson",
  "Jennifer Miller", "Christopher Garcia", "Amanda Rodriguez", "Matthew Martinez",
  "Ashley Anderson", "Joshua Taylor", "Megan Thomas", "Daniel Jackson", "Nicole White",
  "Kevin Lee", "Stephanie Harris", "Brian Clark", "Rebecca Lewis", "Jason Walker",
  "Amy Hall", "Ryan Allen", "Laura Young", "Eric King", "Michelle Wright"
];

const domains = [
  "example.com", "business.co", "company.org", "enterprise.net", "corp.com",
  "solutions.io", "tech.com", "digital.co", "services.net", "systems.org"
];

const cities = [
  { name: "San Francisco", state: "CA", zip: "94105" },
  { name: "New York", state: "NY", zip: "10001" },
  { name: "Los Angeles", state: "CA", zip: "90028" },
  { name: "Chicago", state: "IL", zip: "60601" },
  { name: "Austin", state: "TX", zip: "78701" },
  { name: "Seattle", state: "WA", zip: "98101" },
  { name: "Boston", state: "MA", zip: "02101" },
  { name: "Denver", state: "CO", zip: "80202" },
  { name: "Miami", state: "FL", zip: "33101" },
  { name: "Atlanta", state: "GA", zip: "30309" }
];

function generateRandomTags(): string[] {
  const tagCount = Math.floor(Math.random() * 4) + 1;
  const shuffled = [...availableTags].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, tagCount);
}

function generateCustomerActivity(customerId: string, count: number): MockCustomerActivity[] {
  const activities: MockCustomerActivity[] = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * 180);
    const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    
    const types: MockCustomerActivity["type"][] = [
      "invoice_created", "payment_received", "email_sent", "note_added", "status_changed", "contact_updated"
    ];
    const type = types[Math.floor(Math.random() * types.length)];
    
    let description = "";
    let amount: number | undefined;
    
    switch (type) {
      case "invoice_created":
        amount = Math.floor(Math.random() * 10000) + 500;
        description = `Invoice #INV-${2024000 + i} created for $${amount.toLocaleString()}`;
        break;
      case "payment_received":
        amount = Math.floor(Math.random() * 8000) + 500;
        description = `Payment of $${amount.toLocaleString()} received`;
        break;
      case "email_sent":
        description = "Email sent to customer";
        break;
      case "note_added":
        description = "Note added to customer record";
        break;
      case "status_changed":
        description = "Customer status updated";
        break;
      case "contact_updated":
        description = "Contact information updated";
        break;
    }
    
    activities.push({
      id: `activity_${i + 1}`,
      customerId,
      type,
      description,
      date: date.toISOString(),
      amount,
      currency: amount ? "USD" : undefined,
    });
  }
  
  return activities.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

function generateCustomers(count: number): MockCustomer[] {
  const customers: MockCustomer[] = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const type = customerTypes[Math.floor(Math.random() * customerTypes.length)];
    const status = customerStatuses[Math.floor(Math.random() * customerStatuses.length)];
    const city = cities[Math.floor(Math.random() * cities.length)];
    const tags = generateRandomTags();
    
    // Generate name and email based on type
    let name: string;
    let email: string;
    let website: string | undefined;
    
    if (type === "individual") {
      name = individualNames[Math.floor(Math.random() * individualNames.length)];
      const emailDomain = domains[Math.floor(Math.random() * domains.length)];
      email = `${name.toLowerCase().replace(" ", ".")}@${emailDomain}`;
    } else {
      name = companyNames[Math.floor(Math.random() * companyNames.length)];
      const emailDomain = name.toLowerCase().replace(/[^a-z0-9]/g, "") + ".com";
      email = `contact@${emailDomain}`;
      website = `https://www.${emailDomain}`;
    }
    
    // Generate financial data
    const totalInvoices = Math.floor(Math.random() * 50) + 1;
    const paidInvoices = Math.floor(totalInvoices * (0.6 + Math.random() * 0.3));
    const overdueInvoices = Math.floor((totalInvoices - paidInvoices) * 0.3);
    const totalRevenue = Math.floor(Math.random() * 100000) + 1000;
    const outstandingBalance = Math.floor(Math.random() * 10000);
    const averagePaymentTime = Math.floor(Math.random() * 45) + 15;
    
    // Generate dates
    const daysAgo = Math.floor(Math.random() * 730); // Up to 2 years ago
    const createdAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const updatedAt = new Date(createdAt.getTime() + Math.random() * (now.getTime() - createdAt.getTime()));
    
    // Last activity dates
    const lastActivityDays = Math.floor(Math.random() * 30);
    const lastActivityAt = status === "active" 
      ? new Date(now.getTime() - lastActivityDays * 24 * 60 * 60 * 1000).toISOString()
      : undefined;
    
    const lastInvoiceDays = Math.floor(Math.random() * 60);
    const lastInvoiceAt = new Date(now.getTime() - lastInvoiceDays * 24 * 60 * 60 * 1000).toISOString();
    
    const lastPaymentDays = Math.floor(Math.random() * 45);
    const lastPaymentAt = paidInvoices > 0 
      ? new Date(now.getTime() - lastPaymentDays * 24 * 60 * 60 * 1000).toISOString()
      : undefined;
    
    const customer: MockCustomer = {
      id: `cust_${(i + 1).toString().padStart(4, '0')}`,
      name,
      email,
      phone: Math.random() > 0.3 ? `+1 555-${Math.floor(Math.random() * 9000) + 1000}` : undefined,
      website,
      address: {
        street: `${Math.floor(Math.random() * 9999) + 1} ${["Main", "Oak", "Pine", "First", "Second", "Third", "Business", "Commerce"][Math.floor(Math.random() * 8)]} St`,
        city: city.name,
        state: city.state,
        zip: city.zip,
        country: "USA",
      },
      taxId: type !== "individual" && Math.random() > 0.5 
        ? `${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 9000000) + 1000000}`
        : undefined,
      type,
      status,
      tags,
      totalRevenue,
      outstandingBalance,
      totalInvoices,
      paidInvoices,
      overdueInvoices,
      averagePaymentTime,
      creditLimit: type === "enterprise" ? Math.floor(Math.random() * 50000) + 10000 : undefined,
      currency: "USD",
      language: "en",
      timezone: "America/New_York",
      paymentTerms: ["net15", "net30", "net60", "due_on_receipt"][Math.floor(Math.random() * 4)] as any,
      preferredPaymentMethod: Math.random() > 0.3 
        ? ["bank_transfer", "credit_card", "check"][Math.floor(Math.random() * 3)] as any
        : undefined,
      notes: Math.random() > 0.7 ? "Important customer - handle with care" : undefined,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
      lastActivityAt,
      lastInvoiceAt,
      lastPaymentAt,
      contactPerson: type !== "individual" && Math.random() > 0.4 ? {
        name: individualNames[Math.floor(Math.random() * individualNames.length)],
        title: ["CEO", "CFO", "Accounting Manager", "Finance Director", "Operations Manager"][Math.floor(Math.random() * 5)],
        email: `contact@${name.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
        phone: `+1 555-${Math.floor(Math.random() * 9000) + 1000}`,
      } : undefined,
      billingAddress: Math.random() > 0.5 ? {
        street: `${Math.floor(Math.random() * 9999) + 1} ${["Main", "Oak", "Pine", "First", "Second", "Third", "Business", "Commerce"][Math.floor(Math.random() * 8)]} St`,
        city: city.name,
        state: city.state,
        zip: city.zip,
        country: "USA",
      } : undefined,
    };
    
    customers.push(customer);
  }
  
  return customers.sort((a, b) => 
    new Date(b.lastActivityAt || b.updatedAt).getTime() - new Date(a.lastActivityAt || a.updatedAt).getTime()
  );
}

function generateCustomerStats(customers: MockCustomer[]): MockCustomerStats {
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const activeCustomers = customers.filter(c => c.status === "active").length;
  const newCustomersThisMonth = customers.filter(c => 
    new Date(c.createdAt) >= thisMonth
  ).length;
  
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalRevenue, 0);
  const averageCustomerValue = totalRevenue / customers.length;
  
  const topCustomersByRevenue = [...customers]
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 5);
  
  const customersByStatus = customers.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const customersByType = customers.reduce((acc, c) => {
    acc[c.type] = (acc[c.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    totalCustomers: customers.length,
    activeCustomers,
    newCustomersThisMonth,
    totalRevenue,
    averageCustomerValue,
    topCustomersByRevenue,
    customersByStatus,
    customersByType,
    revenueGrowth: 12.5, // Mock percentage
    churnRate: 2.3, // Mock percentage
  };
}

// Mock API
export const customersAPI = {
  getCustomers: async (): Promise<MockCustomer[]> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return generateCustomers(75);
  },

  getCustomer: async (id: string): Promise<MockCustomer | null> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const customers = generateCustomers(75);
    return customers.find(c => c.id === id) || null;
  },

  createCustomer: async (data: Partial<MockCustomer>): Promise<MockCustomer> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const now = new Date().toISOString();
    
    return {
      id: `cust_${Date.now()}`,
      name: data.name || "New Customer",
      email: data.email || "customer@example.com",
      type: data.type || "business",
      status: data.status || "prospect",
      tags: data.tags || [],
      totalRevenue: 0,
      outstandingBalance: 0,
      totalInvoices: 0,
      paidInvoices: 0,
      overdueInvoices: 0,
      averagePaymentTime: 30,
      currency: "USD",
      language: "en",
      timezone: "America/New_York",
      paymentTerms: "net30",
      createdAt: now,
      updatedAt: now,
      ...data,
    } as MockCustomer;
  },

  updateCustomer: async (id: string, data: Partial<MockCustomer>): Promise<MockCustomer> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    const customers = generateCustomers(75);
    const customer = customers.find(c => c.id === id);
    if (!customer) throw new Error("Customer not found");
    return { 
      ...customer, 
      ...data, 
      updatedAt: new Date().toISOString() 
    };
  },

  deleteCustomer: async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));
  },

  getCustomerActivity: async (customerId: string): Promise<MockCustomerActivity[]> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    return generateCustomerActivity(customerId, 20);
  },

  getCustomerStats: async (): Promise<MockCustomerStats> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const customers = generateCustomers(75);
    return generateCustomerStats(customers);
  },

  importCustomers: async (file: File): Promise<{ imported: number; errors: string[] }> => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    // Mock import response
    return {
      imported: Math.floor(Math.random() * 50) + 10,
      errors: Math.random() > 0.8 ? ["Row 5: Invalid email format", "Row 12: Missing required field 'name'"] : [],
    };
  },

  exportCustomers: async (format: "csv" | "xlsx" = "csv"): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    // Mock export URL
    return `https://example.com/exports/customers-${Date.now()}.${format}`;
  },
};