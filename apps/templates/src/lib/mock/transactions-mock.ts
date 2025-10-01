export interface MockTransaction {
  id: string;
  date: string;
  description: string;
  merchant?: string;
  amount: number;
  currency: string;
  category: string;
  account: string;
  accountId: string;
  status: "pending" | "completed" | "failed" | "cancelled";
  type: "debit" | "credit";
  isRecurring: boolean;
  recurringFrequency?: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
  tags: string[];
  notes?: string;
  attachments?: string[];
  balance?: number;
  reference?: string;
  method?: "card" | "transfer" | "direct_debit" | "cash" | "check";
}

const categories = [
  "Software & Tools",
  "Salaries & Wages",
  "Marketing",
  "Office Supplies",
  "Travel",
  "Entertainment",
  "Utilities",
  "Rent",
  "Insurance",
  "Taxes",
  "Consulting",
  "Equipment",
  "Food & Beverage",
  "Transportation",
  "Other",
];

const merchants = [
  "Amazon Web Services",
  "Google Ads",
  "Facebook Ads",
  "Slack",
  "Zoom",
  "Microsoft",
  "Adobe Creative Cloud",
  "Dropbox",
  "Spotify",
  "Netflix",
  "Uber",
  "Lyft",
  "Starbucks",
  "Office Depot",
  "WeWork",
  "FedEx",
  "AT&T",
  "Verizon",
  "Chase Bank",
  "PayPal",
];

const accounts = [
  { id: "acc_1", name: "Business Checking", type: "checking" },
  { id: "acc_2", name: "Business Savings", type: "savings" },
  { id: "acc_3", name: "Corporate Card", type: "credit" },
  { id: "acc_4", name: "Petty Cash", type: "cash" },
];

function generateTransactions(count: number): MockTransaction[] {
  const transactions: MockTransaction[] = [];
  const now = new Date();
  let runningBalance = 125000;

  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * 90);
    const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const isIncome = Math.random() > 0.7;
    const amount = isIncome 
      ? Math.floor(Math.random() * 50000) + 5000
      : -(Math.floor(Math.random() * 10000) + 100);
    
    runningBalance += amount;
    const account = accounts[Math.floor(Math.random() * accounts.length)];
    const isRecurring = Math.random() > 0.85;
    const status = Math.random() > 0.9 ? "pending" : 
                  Math.random() > 0.95 ? "failed" : "completed";

    transactions.push({
      id: `txn_${i + 1}`,
      date: date.toISOString(),
      description: isIncome 
        ? `Payment from Client ${Math.floor(Math.random() * 100)}`
        : `Purchase at ${merchants[Math.floor(Math.random() * merchants.length)]}`,
      merchant: !isIncome ? merchants[Math.floor(Math.random() * merchants.length)] : undefined,
      amount,
      currency: "USD",
      category: categories[Math.floor(Math.random() * categories.length)],
      account: account.name,
      accountId: account.id,
      status,
      type: amount > 0 ? "credit" : "debit",
      isRecurring,
      recurringFrequency: isRecurring 
        ? ["daily", "weekly", "monthly", "quarterly", "yearly"][Math.floor(Math.random() * 5)] as any
        : undefined,
      tags: Math.random() > 0.5 
        ? ["business", "deductible", "client", "project"].slice(0, Math.floor(Math.random() * 3) + 1)
        : [],
      notes: Math.random() > 0.7 ? "Additional notes about this transaction" : undefined,
      balance: runningBalance,
      reference: `REF-${Math.floor(Math.random() * 1000000)}`,
      method: ["card", "transfer", "direct_debit", "cash", "check"][Math.floor(Math.random() * 5)] as any,
    });
  }

  return transactions.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

// Mock API
export const transactionsAPI = {
  getTransactions: async (): Promise<MockTransaction[]> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return generateTransactions(150);
  },

  getTransaction: async (id: string): Promise<MockTransaction | null> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const transactions = generateTransactions(150);
    return transactions.find(t => t.id === id) || null;
  },

  createTransaction: async (data: Partial<MockTransaction>): Promise<MockTransaction> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
      id: `txn_${Date.now()}`,
      date: new Date().toISOString(),
      description: data.description || "New transaction",
      amount: data.amount || 0,
      currency: data.currency || "USD",
      category: data.category || "Other",
      account: data.account || accounts[0].name,
      accountId: data.accountId || accounts[0].id,
      status: "pending",
      type: (data.amount || 0) > 0 ? "credit" : "debit",
      isRecurring: false,
      tags: [],
      ...data,
    } as MockTransaction;
  },

  updateTransaction: async (id: string, data: Partial<MockTransaction>): Promise<MockTransaction> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    const transactions = generateTransactions(150);
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) throw new Error("Transaction not found");
    return { ...transaction, ...data };
  },

  deleteTransaction: async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));
  },

  getCategories: async (): Promise<string[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return categories;
  },

  getAccounts: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return accounts;
  },
};