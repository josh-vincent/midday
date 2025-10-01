export interface MockCustomer {
  id: string;
  name: string;
  email: string;
  created: Date;
  subscriptions: number;
  totalSpent: number;
  status: "active" | "inactive";
}

export interface MockSubscription {
  id: string;
  customerId: string;
  customerName: string;
  status: "active" | "trialing" | "past_due" | "canceled" | "incomplete";
  product: string;
  price: number;
  interval: "monthly" | "yearly";
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd?: Date;
}

export interface MockInvoice {
  id: string;
  number: string;
  customerId: string;
  customerName: string;
  amount: number;
  status: "draft" | "open" | "paid" | "uncollectible" | "void";
  dueDate: Date;
  paidAt?: Date;
}

export interface MockProduct {
  id: string;
  name: string;
  description: string;
  active: boolean;
  prices: MockPrice[];
}

export interface MockPrice {
  id: string;
  productId: string;
  amount: number;
  currency: string;
  interval?: "month" | "year";
  intervalCount?: number;
  active: boolean;
}

export interface MockWebhookEvent {
  id: string;
  type: string;
  created: Date;
  data: any;
  status: "pending" | "processing" | "completed" | "failed";
}

// Generate mock customers
export const mockCustomers: MockCustomer[] = [
  {
    id: "cus_1",
    name: "Acme Corporation",
    email: "billing@acme.com",
    created: new Date("2024-01-15"),
    subscriptions: 2,
    totalSpent: 4500,
    status: "active",
  },
  {
    id: "cus_2",
    name: "TechStart Inc",
    email: "admin@techstart.io",
    created: new Date("2024-02-20"),
    subscriptions: 1,
    totalSpent: 1200,
    status: "active",
  },
  {
    id: "cus_3",
    name: "Global Services Ltd",
    email: "finance@globalservices.com",
    created: new Date("2024-03-10"),
    subscriptions: 0,
    totalSpent: 800,
    status: "inactive",
  },
  {
    id: "cus_4",
    name: "Innovate Labs",
    email: "payments@innovatelabs.tech",
    created: new Date("2024-04-05"),
    subscriptions: 3,
    totalSpent: 7200,
    status: "active",
  },
  {
    id: "cus_5",
    name: "Cloud Systems",
    email: "billing@cloudsystems.net",
    created: new Date("2024-05-12"),
    subscriptions: 1,
    totalSpent: 2400,
    status: "active",
  },
];

// Generate mock subscriptions
export const mockSubscriptions: MockSubscription[] = [
  {
    id: "sub_1",
    customerId: "cus_1",
    customerName: "Acme Corporation",
    status: "active",
    product: "Pro Plan",
    price: 199,
    interval: "monthly",
    currentPeriodEnd: new Date("2025-02-15"),
    cancelAtPeriodEnd: false,
  },
  {
    id: "sub_2",
    customerId: "cus_1",
    customerName: "Acme Corporation",
    status: "active",
    product: "Add-on Storage",
    price: 50,
    interval: "monthly",
    currentPeriodEnd: new Date("2025-02-15"),
    cancelAtPeriodEnd: false,
  },
  {
    id: "sub_3",
    customerId: "cus_2",
    customerName: "TechStart Inc",
    status: "trialing",
    product: "Starter Plan",
    price: 99,
    interval: "monthly",
    currentPeriodEnd: new Date("2025-02-20"),
    cancelAtPeriodEnd: false,
    trialEnd: new Date("2025-01-30"),
  },
  {
    id: "sub_4",
    customerId: "cus_4",
    customerName: "Innovate Labs",
    status: "active",
    product: "Enterprise Plan",
    price: 599,
    interval: "monthly",
    currentPeriodEnd: new Date("2025-02-05"),
    cancelAtPeriodEnd: false,
  },
  {
    id: "sub_5",
    customerId: "cus_4",
    customerName: "Innovate Labs",
    status: "past_due",
    product: "API Access",
    price: 299,
    interval: "monthly",
    currentPeriodEnd: new Date("2025-01-05"),
    cancelAtPeriodEnd: false,
  },
  {
    id: "sub_6",
    customerId: "cus_5",
    customerName: "Cloud Systems",
    status: "active",
    product: "Pro Plan",
    price: 1999,
    interval: "yearly",
    currentPeriodEnd: new Date("2025-05-12"),
    cancelAtPeriodEnd: true,
  },
];

// Generate mock invoices
export const mockInvoices: MockInvoice[] = [
  {
    id: "inv_1",
    number: "INV-2024-001",
    customerId: "cus_1",
    customerName: "Acme Corporation",
    amount: 249,
    status: "paid",
    dueDate: new Date("2024-12-15"),
    paidAt: new Date("2024-12-14"),
  },
  {
    id: "inv_2",
    number: "INV-2024-002",
    customerId: "cus_2",
    customerName: "TechStart Inc",
    amount: 99,
    status: "open",
    dueDate: new Date("2025-01-30"),
  },
  {
    id: "inv_3",
    number: "INV-2024-003",
    customerId: "cus_4",
    customerName: "Innovate Labs",
    amount: 898,
    status: "paid",
    dueDate: new Date("2024-12-05"),
    paidAt: new Date("2024-12-05"),
  },
  {
    id: "inv_4",
    number: "INV-2025-001",
    customerId: "cus_1",
    customerName: "Acme Corporation",
    amount: 249,
    status: "draft",
    dueDate: new Date("2025-01-15"),
  },
  {
    id: "inv_5",
    number: "INV-2025-002",
    customerId: "cus_4",
    customerName: "Innovate Labs",
    amount: 299,
    status: "uncollectible",
    dueDate: new Date("2025-01-05"),
  },
];

// Generate mock products
export const mockProducts: MockProduct[] = [
  {
    id: "prod_1",
    name: "Starter Plan",
    description: "Perfect for small teams and startups",
    active: true,
    prices: [
      {
        id: "price_1",
        productId: "prod_1",
        amount: 99,
        currency: "usd",
        interval: "month",
        intervalCount: 1,
        active: true,
      },
      {
        id: "price_2",
        productId: "prod_1",
        amount: 999,
        currency: "usd",
        interval: "year",
        intervalCount: 1,
        active: true,
      },
    ],
  },
  {
    id: "prod_2",
    name: "Pro Plan",
    description: "For growing businesses with advanced needs",
    active: true,
    prices: [
      {
        id: "price_3",
        productId: "prod_2",
        amount: 199,
        currency: "usd",
        interval: "month",
        intervalCount: 1,
        active: true,
      },
      {
        id: "price_4",
        productId: "prod_2",
        amount: 1999,
        currency: "usd",
        interval: "year",
        intervalCount: 1,
        active: true,
      },
    ],
  },
  {
    id: "prod_3",
    name: "Enterprise Plan",
    description: "Custom solutions for large organizations",
    active: true,
    prices: [
      {
        id: "price_5",
        productId: "prod_3",
        amount: 599,
        currency: "usd",
        interval: "month",
        intervalCount: 1,
        active: true,
      },
    ],
  },
  {
    id: "prod_4",
    name: "Add-on Storage",
    description: "Additional storage for your account",
    active: true,
    prices: [
      {
        id: "price_6",
        productId: "prod_4",
        amount: 50,
        currency: "usd",
        interval: "month",
        intervalCount: 1,
        active: true,
      },
    ],
  },
  {
    id: "prod_5",
    name: "API Access",
    description: "Full API access with unlimited requests",
    active: true,
    prices: [
      {
        id: "price_7",
        productId: "prod_5",
        amount: 299,
        currency: "usd",
        interval: "month",
        intervalCount: 1,
        active: true,
      },
    ],
  },
];

// Generate mock webhook events
export const generateMockWebhookEvents = (): MockWebhookEvent[] => {
  const events: MockWebhookEvent[] = [];
  const eventTypes = [
    "customer.created",
    "customer.updated",
    "customer.subscription.created",
    "customer.subscription.updated",
    "invoice.paid",
    "invoice.payment_failed",
    "payment_intent.succeeded",
    "checkout.session.completed",
  ];

  // Generate 20 recent events
  for (let i = 0; i < 20; i++) {
    const hoursAgo = i * 2;
    const created = new Date();
    created.setHours(created.getHours() - hoursAgo);

    events.push({
      id: `evt_${i + 1}`,
      type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
      created,
      data: {
        object: {
          id: `obj_${i + 1}`,
          amount: Math.floor(Math.random() * 10000),
        },
      },
      status: i < 2 ? "processing" : i < 18 ? "completed" : "failed",
    });
  }

  return events;
};

// Helper functions to simulate API calls
export const stripeAPI = {
  async getCustomers(): Promise<MockCustomer[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockCustomers;
  },

  async getSubscriptions(): Promise<MockSubscription[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockSubscriptions;
  },

  async getInvoices(): Promise<MockInvoice[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockInvoices;
  },

  async getProducts(): Promise<MockProduct[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockProducts;
  },

  async getWebhookEvents(): Promise<MockWebhookEvent[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return generateMockWebhookEvents();
  },

  async createCheckoutSession(priceId: string): Promise<{ url: string }> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      url: `https://checkout.stripe.com/demo/${priceId}`,
    };
  },

  async createBillingPortalSession(customerId: string): Promise<{ url: string }> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      url: `https://billing.stripe.com/demo/${customerId}`,
    };
  },

  async cancelSubscription(subscriptionId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 1000));
  },
};