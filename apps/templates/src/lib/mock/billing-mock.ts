export interface MockPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  limits: {
    users: number | 'unlimited';
    teams: number | 'unlimited';
    storage: string;
    apiCalls: number | 'unlimited';
    integrations: number | 'unlimited';
  };
  popular?: boolean;
  stripePriceId?: string;
}

export interface MockSubscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete' | 'trialing';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockPaymentMethod {
  id: string;
  type: 'card' | 'bank_account' | 'paypal';
  last4: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  createdAt: Date;
}

export interface MockInvoice {
  id: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: 'paid' | 'open' | 'void' | 'uncollectible';
  dueDate: Date;
  paidAt?: Date;
  createdAt: Date;
  description: string;
  downloadUrl?: string;
}

export interface MockUsage {
  userId: string;
  period: string; // YYYY-MM format
  users: number;
  teams: number;
  storageUsed: number; // in GB
  apiCalls: number;
  integrations: number;
  lastUpdated: Date;
}

// Available plans
const mockPlans: MockPlan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for trying out our platform',
    price: 0,
    currency: 'USD',
    interval: 'month',
    features: [
      '1 team',
      '5 team members',
      '5GB storage',
      'Basic integrations',
      'Email support',
      'Basic analytics',
    ],
    limits: {
      users: 5,
      teams: 1,
      storage: '5GB',
      apiCalls: 1000,
      integrations: 3,
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Best for growing teams and businesses',
    price: 29,
    currency: 'USD',
    interval: 'month',
    features: [
      'Unlimited teams',
      '50 team members',
      '100GB storage',
      'All integrations',
      'Priority support',
      'Advanced analytics',
      'Custom roles',
      'API access',
      'Audit logs',
    ],
    limits: {
      users: 50,
      teams: 'unlimited',
      storage: '100GB',
      apiCalls: 50000,
      integrations: 'unlimited',
    },
    popular: true,
    stripePriceId: 'price_pro_monthly',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations with advanced needs',
    price: 99,
    currency: 'USD',
    interval: 'month',
    features: [
      'Unlimited everything',
      'Unlimited team members',
      '1TB storage',
      'All integrations',
      '24/7 phone support',
      'Custom analytics',
      'Custom roles & permissions',
      'Full API access',
      'Advanced audit logs',
      'SSO & SAML',
      'Custom onboarding',
      'Dedicated account manager',
    ],
    limits: {
      users: 'unlimited',
      teams: 'unlimited',
      storage: '1TB',
      apiCalls: 'unlimited',
      integrations: 'unlimited',
    },
    stripePriceId: 'price_enterprise_monthly',
  },
];

// Yearly versions of plans (20% discount)
const yearlyPlans: MockPlan[] = mockPlans
  .filter(plan => plan.id !== 'free')
  .map(plan => ({
    ...plan,
    id: `${plan.id}_yearly`,
    interval: 'year' as const,
    price: Math.round(plan.price * 12 * 0.8), // 20% discount
    stripePriceId: plan.stripePriceId?.replace('monthly', 'yearly'),
  }));

const allPlans = [...mockPlans, ...yearlyPlans];

// Mock user subscriptions and billing data
const mockSubscriptions: MockSubscription[] = [
  {
    id: 'sub_1',
    userId: 'user_1',
    planId: 'pro',
    status: 'active',
    currentPeriodStart: new Date('2024-03-01'),
    currentPeriodEnd: new Date('2024-04-01'),
    cancelAtPeriodEnd: false,
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-01'),
  },
];

const mockPaymentMethods: MockPaymentMethod[] = [
  {
    id: 'pm_1',
    type: 'card',
    last4: '4242',
    brand: 'visa',
    expiryMonth: 12,
    expiryYear: 2027,
    isDefault: true,
    createdAt: new Date('2024-03-01'),
  },
];

const mockInvoices: MockInvoice[] = [
  {
    id: 'in_1',
    subscriptionId: 'sub_1',
    amount: 29.00,
    currency: 'USD',
    status: 'paid',
    dueDate: new Date('2024-03-01'),
    paidAt: new Date('2024-03-01'),
    createdAt: new Date('2024-03-01'),
    description: 'Pro Plan - March 2024',
    downloadUrl: 'https://example.com/invoice/in_1.pdf',
  },
  {
    id: 'in_2',
    subscriptionId: 'sub_1',
    amount: 29.00,
    currency: 'USD',
    status: 'paid',
    dueDate: new Date('2024-04-01'),
    paidAt: new Date('2024-04-01'),
    createdAt: new Date('2024-04-01'),
    description: 'Pro Plan - April 2024',
    downloadUrl: 'https://example.com/invoice/in_2.pdf',
  },
];

const mockUsage: MockUsage[] = [
  {
    userId: 'user_1',
    period: '2024-03',
    users: 8,
    teams: 2,
    storageUsed: 15.5,
    apiCalls: 12500,
    integrations: 5,
    lastUpdated: new Date('2024-03-31'),
  },
  {
    userId: 'user_1',
    period: '2024-04',
    users: 12,
    teams: 3,
    storageUsed: 22.8,
    apiCalls: 18750,
    integrations: 7,
    lastUpdated: new Date('2024-04-30'),
  },
];

export const billingAPI = {
  // Plans
  async getPlans(): Promise<MockPlan[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return allPlans;
  },

  async getPlan(planId: string): Promise<MockPlan | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return allPlans.find(plan => plan.id === planId) || null;
  },

  // Subscriptions
  async getUserSubscription(userId: string): Promise<MockSubscription | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockSubscriptions.find(sub => sub.userId === userId) || null;
  },

  async createSubscription(userId: string, planId: string, paymentMethodId: string): Promise<MockSubscription> {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate payment processing
    
    const plan = allPlans.find(p => p.id === planId);
    if (!plan) {
      throw new Error('Plan not found');
    }

    const paymentMethod = mockPaymentMethods.find(pm => pm.id === paymentMethodId);
    if (!paymentMethod) {
      throw new Error('Payment method not found');
    }

    // Cancel existing subscription if any
    const existingSubscription = mockSubscriptions.find(sub => sub.userId === userId);
    if (existingSubscription) {
      existingSubscription.status = 'canceled';
      existingSubscription.updatedAt = new Date();
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    if (plan.interval === 'month') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    const newSubscription: MockSubscription = {
      id: `sub_${Date.now()}`,
      userId,
      planId,
      status: 'active',
      currentPeriodStart: startDate,
      currentPeriodEnd: endDate,
      cancelAtPeriodEnd: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockSubscriptions.push(newSubscription);
    return newSubscription;
  },

  async updateSubscription(subscriptionId: string, planId: string): Promise<MockSubscription> {
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate processing
    
    const subscription = mockSubscriptions.find(sub => sub.id === subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const plan = allPlans.find(p => p.id === planId);
    if (!plan) {
      throw new Error('Plan not found');
    }

    subscription.planId = planId;
    subscription.updatedAt = new Date();

    return subscription;
  },

  async cancelSubscription(subscriptionId: string, immediately: boolean = false): Promise<MockSubscription> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const subscription = mockSubscriptions.find(sub => sub.id === subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    if (immediately) {
      subscription.status = 'canceled';
      subscription.currentPeriodEnd = new Date();
    } else {
      subscription.cancelAtPeriodEnd = true;
    }
    
    subscription.updatedAt = new Date();
    return subscription;
  },

  async resumeSubscription(subscriptionId: string): Promise<MockSubscription> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const subscription = mockSubscriptions.find(sub => sub.id === subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    subscription.cancelAtPeriodEnd = false;
    subscription.updatedAt = new Date();
    return subscription;
  },

  // Payment methods
  async getPaymentMethods(userId: string): Promise<MockPaymentMethod[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    // In real app, filter by userId
    return mockPaymentMethods;
  },

  async addPaymentMethod(
    userId: string, 
    type: 'card' | 'bank_account', 
    details: Partial<MockPaymentMethod>
  ): Promise<MockPaymentMethod> {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate payment processing
    
    const newPaymentMethod: MockPaymentMethod = {
      id: `pm_${Date.now()}`,
      type,
      last4: details.last4 || '0000',
      brand: details.brand,
      expiryMonth: details.expiryMonth,
      expiryYear: details.expiryYear,
      isDefault: mockPaymentMethods.length === 0, // First payment method is default
      createdAt: new Date(),
    };

    mockPaymentMethods.push(newPaymentMethod);
    return newPaymentMethod;
  },

  async setDefaultPaymentMethod(paymentMethodId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // Unset current default
    mockPaymentMethods.forEach(pm => pm.isDefault = false);
    
    // Set new default
    const paymentMethod = mockPaymentMethods.find(pm => pm.id === paymentMethodId);
    if (paymentMethod) {
      paymentMethod.isDefault = true;
    }
  },

  async deletePaymentMethod(paymentMethodId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const index = mockPaymentMethods.findIndex(pm => pm.id === paymentMethodId);
    if (index > -1) {
      mockPaymentMethods.splice(index, 1);
    }
  },

  // Invoices
  async getInvoices(userId: string): Promise<MockInvoice[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const userSubscription = mockSubscriptions.find(sub => sub.userId === userId);
    if (!userSubscription) return [];
    
    return mockInvoices.filter(invoice => invoice.subscriptionId === userSubscription.id);
  },

  async getInvoice(invoiceId: string): Promise<MockInvoice | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockInvoices.find(invoice => invoice.id === invoiceId) || null;
  },

  async downloadInvoice(invoiceId: string): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const invoice = mockInvoices.find(inv => inv.id === invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    return invoice.downloadUrl || '#';
  },

  // Usage tracking
  async getUsage(userId: string, period?: string): Promise<MockUsage[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    let usage = mockUsage.filter(u => u.userId === userId);
    
    if (period) {
      usage = usage.filter(u => u.period === period);
    }
    
    return usage.sort((a, b) => b.period.localeCompare(a.period));
  },

  async getCurrentUsage(userId: string): Promise<MockUsage | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM
    return mockUsage.find(u => u.userId === userId && u.period === currentPeriod) || null;
  },

  // Utility methods
  async checkLimits(userId: string): Promise<{
    withinLimits: boolean;
    warnings: string[];
    limits: MockPlan['limits'];
    usage: MockUsage | null;
  }> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const subscription = await this.getUserSubscription(userId);
    const plan = subscription ? await this.getPlan(subscription.planId) : await this.getPlan('free');
    const usage = await this.getCurrentUsage(userId);
    
    if (!plan) {
      throw new Error('Plan not found');
    }

    const warnings: string[] = [];
    let withinLimits = true;

    if (usage) {
      // Check user limits
      if (typeof plan.limits.users === 'number' && usage.users > plan.limits.users) {
        warnings.push(`User limit exceeded: ${usage.users}/${plan.limits.users}`);
        withinLimits = false;
      }

      // Check team limits
      if (typeof plan.limits.teams === 'number' && usage.teams > plan.limits.teams) {
        warnings.push(`Team limit exceeded: ${usage.teams}/${plan.limits.teams}`);
        withinLimits = false;
      }

      // Check API call limits
      if (typeof plan.limits.apiCalls === 'number' && usage.apiCalls > plan.limits.apiCalls) {
        warnings.push(`API call limit exceeded: ${usage.apiCalls}/${plan.limits.apiCalls}`);
        withinLimits = false;
      }

      // Check integration limits
      if (typeof plan.limits.integrations === 'number' && usage.integrations > plan.limits.integrations) {
        warnings.push(`Integration limit exceeded: ${usage.integrations}/${plan.limits.integrations}`);
        withinLimits = false;
      }

      // Storage warnings (convert plan storage to GB for comparison)
      const storageLimit = parseFloat(plan.limits.storage.replace(/[^0-9.]/g, ''));
      if (usage.storageUsed > storageLimit * 0.9) {
        warnings.push(`Storage usage high: ${usage.storageUsed}GB/${plan.limits.storage}`);
      }
      if (usage.storageUsed > storageLimit) {
        withinLimits = false;
      }
    }

    return {
      withinLimits,
      warnings,
      limits: plan.limits,
      usage,
    };
  },

  async previewPlanChange(userId: string, newPlanId: string): Promise<{
    currentPlan: MockPlan;
    newPlan: MockPlan;
    prorationAmount: number;
    nextBillingDate: Date;
  }> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const subscription = await this.getUserSubscription(userId);
    const currentPlan = subscription ? await this.getPlan(subscription.planId) : await this.getPlan('free');
    const newPlan = await this.getPlan(newPlanId);
    
    if (!currentPlan || !newPlan) {
      throw new Error('Plan not found');
    }

    // Simple proration calculation (in real app, this would be more complex)
    const daysRemaining = subscription ? 
      Math.ceil((subscription.currentPeriodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
    
    const dailyRateOld = currentPlan.price / 30;
    const dailyRateNew = newPlan.price / 30;
    const prorationAmount = (dailyRateNew - dailyRateOld) * daysRemaining;

    const nextBillingDate = subscription ? subscription.currentPeriodEnd : new Date();

    return {
      currentPlan,
      newPlan,
      prorationAmount: Math.round(prorationAmount * 100) / 100,
      nextBillingDate,
    };
  },

  // Helper methods for development
  getMockData: () => ({
    plans: allPlans,
    subscriptions: mockSubscriptions,
    paymentMethods: mockPaymentMethods,
    invoices: mockInvoices,
    usage: mockUsage,
  }),
};