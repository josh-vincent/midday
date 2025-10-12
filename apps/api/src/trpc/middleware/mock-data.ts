import { TRPCError } from "@trpc/server";
import type { Database } from "@midday/db/client";

// Enable mock mode via environment variable
export const isMockMode = () => process.env.MOCK_MODE === "true";

// Mock data generators
export const generateMockJobs = (teamId: string, count = 10) => {
  const statuses = ["pending", "in_progress", "completed", "cancelled", "delivered", "invoiced"] as const;
  const invoiceStatuses = ["draft", "unpaid", "paid", "canceled", "overdue"] as const;
  const companies = ["Acme Corp", "TechStart Inc", "BuildCo", "Transport Ltd", "Construction Pro"];
  const contacts = ["John Smith", "Jane Doe", "Mike Johnson", "Sarah Williams"];
  const regos = ["ABC123", "XYZ789", "DEF456", "GHI012", "JKL345"];

  return Array.from({ length: count }, (_, i) => {
    const hasInvoice = Math.random() > 0.5;
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const invoiceStatus = hasInvoice ? invoiceStatuses[Math.floor(Math.random() * invoiceStatuses.length)] : null;

    return {
      id: `mock-job-${i + 1}`,
      jobNumber: `JOB-2024-${String(i + 1).padStart(4, "0")}`,
      jobDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      companyName: companies[Math.floor(Math.random() * companies.length)],
      customerName: companies[Math.floor(Math.random() * companies.length)],
      description: `Mock job description for job ${i + 1}`,
      status,
      totalAmount: Math.floor(Math.random() * 50000) + 10000, // in cents
      currency: "USD",
      rego: regos[Math.floor(Math.random() * regos.length)],
      pricePerUnit: Math.floor(Math.random() * 500) + 100,
      cubicMetreCapacity: Math.floor(Math.random() * 50) + 10,
      loadNumber: Math.floor(Math.random() * 100) + 1,
      contactPerson: contacts[Math.floor(Math.random() * contacts.length)],
      contactNumber: `+1-555-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      notes: Math.random() > 0.5 ? `Notes for job ${i + 1}` : null,
      teamId,
      customerId: Math.random() > 0.3 ? `mock-customer-${Math.floor(Math.random() * 5) + 1}` : null,
      volume: Math.floor(Math.random() * 100) + 10,
      weight: Math.floor(Math.random() * 5000) + 500,
      invoiceId: hasInvoice ? `mock-invoice-${i + 1}` : null,
      invoiceNumber: hasInvoice ? `INV-2024-${String(i + 1).padStart(4, "0")}` : null,
      invoiceStatus,
      createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
  });
};

export const generateMockInvoices = (teamId: string, count = 10) => {
  const statuses = ["draft", "unpaid", "paid", "canceled", "overdue"] as const;
  const customers = ["Acme Corp", "TechStart Inc", "BuildCo", "Transport Ltd", "Construction Pro"];

  return Array.from({ length: count }, (_, i) => {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const amount = Math.floor(Math.random() * 100000) + 10000; // in cents
    const isPaid = status === "paid";

    return {
      id: `mock-invoice-${i + 1}`,
      invoiceNumber: `INV-2024-${String(i + 1).padStart(4, "0")}`,
      status,
      dueDate: new Date(Date.now() + Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
      issueDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      amount: amount / 100, // convert to dollars for response
      currency: "USD",
      customer: {
        id: `mock-customer-${Math.floor(Math.random() * 5) + 1}`,
        name: customers[Math.floor(Math.random() * customers.length)],
        website: `https://${customers[Math.floor(Math.random() * customers.length)].toLowerCase().replace(/\s+/g, "")}.com`,
        email: `contact@${customers[Math.floor(Math.random() * customers.length)].toLowerCase().replace(/\s+/g, "")}.com`,
      },
      paidAt: isPaid ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : null,
      reminderSentAt: Math.random() > 0.7 ? new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString() : null,
      note: Math.random() > 0.5 ? `Thank you for your business!` : null,
      vat: Math.floor(amount * 0.1) / 100,
      tax: Math.floor(amount * 0.05) / 100,
      discount: Math.random() > 0.7 ? Math.floor(amount * 0.1) / 100 : null,
      subtotal: (amount - Math.floor(amount * 0.15)) / 100,
      viewedAt: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString() : null,
      customerName: customers[Math.floor(Math.random() * customers.length)],
      sentTo: Math.random() > 0.3 ? `billing@${customers[Math.floor(Math.random() * customers.length)].toLowerCase().replace(/\s+/g, "")}.com` : null,
      sentAt: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString() : null,
      createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      teamId,
      customerId: `mock-customer-${Math.floor(Math.random() * 5) + 1}`,
    };
  });
};

export const generateMockCustomers = (teamId: string, count = 5) => {
  const companies = ["Acme Corp", "TechStart Inc", "BuildCo", "Transport Ltd", "Construction Pro"];

  return Array.from({ length: count }, (_, i) => ({
    id: `mock-customer-${i + 1}`,
    name: companies[i],
    email: `contact@${companies[i].toLowerCase().replace(/\s+/g, "")}.com`,
    phone: `+1-555-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    website: `https://${companies[i].toLowerCase().replace(/\s+/g, "")}.com`,
    address: `${Math.floor(Math.random() * 9999) + 1} Main St, City, State ${String(Math.floor(Math.random() * 90000) + 10000)}`,
    teamId,
    token: `cust_mock_${i + 1}`,
    createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  }));
};

export const generateMockUser = (userId = "mock-user-id", teamId = "mock-team-id") => ({
  id: userId,
  email: "mock@example.com",
  fullName: "Mock User",
  avatarUrl: null,
  teamId,
  locale: "en",
  timezone: "America/New_York",
  dateFormat: "MM/dd/yyyy",
  createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date().toISOString(),
});

export const generateMockTeam = (teamId = "mock-team-id") => ({
  id: teamId,
  name: "Mock Team",
  email: "team@mockcompany.com",
  logoUrl: null,
  baseCurrency: "USD",
  inboxEmail: `inbox-${teamId}@midday.ai`,
  inboxForwarding: false,
  createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date().toISOString(),
});

export const generateMockTeamMembers = (teamId = "mock-team-id") => [
  {
    id: "mock-member-1",
    userId: "mock-user-id",
    teamId,
    role: "owner",
    user: {
      id: "mock-user-id",
      email: "mock@example.com",
      fullName: "Mock User",
      avatarUrl: null,
    },
    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "mock-member-2",
    userId: "mock-user-2",
    teamId,
    role: "member",
    user: {
      id: "mock-user-2",
      email: "member@example.com",
      fullName: "Team Member",
      avatarUrl: null,
    },
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const generateMockInvoiceTemplate = (teamId = "mock-team-id") => ({
  id: "mock-template-1",
  teamId,
  title: "Invoice",
  customerLabel: "Bill To",
  fromLabel: "From",
  invoiceNoLabel: "Invoice No.",
  issueDateLabel: "Issue Date",
  dueDateLabel: "Due Date",
  descriptionLabel: "Description",
  priceLabel: "Price",
  quantityLabel: "Quantity",
  totalLabel: "Total",
  vatLabel: "VAT",
  taxLabel: "Tax",
  paymentLabel: "Payment Details",
  noteLabel: "Note",
  logoUrl: null,
  currency: "USD",
  size: "a4" as const,
  includeVat: true,
  includeTax: false,
  includeDiscount: false,
  includeDecimals: true,
  includeUnits: false,
  includeQr: false,
  taxRate: 0,
  vatRate: 20,
  dateFormat: "MM/dd/yyyy" as const,
  deliveryType: "create" as const,
  locale: "en",
  timezone: "America/New_York",
  fromDetails: "Mock Company\n123 Business St\nCity, State 12345\nTax ID: 123456789",
  paymentDetails: "Bank: Mock Bank\nAccount: 1234567890\nRouting: 987654321",
  createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date().toISOString(),
});

export const generateMockProducts = (teamId = "mock-team-id", count = 10) => {
  const productNames = [
    "Consulting Services",
    "Web Development",
    "Mobile App Development",
    "UI/UX Design",
    "Project Management",
    "Technical Support",
    "Software License",
    "Training Session",
    "Maintenance Package",
    "Custom Integration",
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: `mock-product-${i + 1}`,
    teamId,
    name: productNames[i],
    description: `Professional ${productNames[i].toLowerCase()} services`,
    price: (Math.floor(Math.random() * 500) + 50) * 100, // in cents
    unit: "hour",
    currency: "USD",
    usage_count: Math.floor(Math.random() * 50) + 1,
    createdAt: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  }));
};

export const generateMockTags = (teamId = "mock-team-id") => [
  { id: "mock-tag-1", teamId, name: "Urgent", color: "#ef4444", createdAt: new Date().toISOString() },
  { id: "mock-tag-2", teamId, name: "Recurring", color: "#3b82f6", createdAt: new Date().toISOString() },
  { id: "mock-tag-3", teamId, name: "Large Project", color: "#8b5cf6", createdAt: new Date().toISOString() },
  { id: "mock-tag-4", teamId, name: "New Client", color: "#10b981", createdAt: new Date().toISOString() },
  { id: "mock-tag-5", teamId, name: "Follow-up", color: "#f59e0b", createdAt: new Date().toISOString() },
];

export const generateMockRevenueData = () => {
  const months = 12;
  const data = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    data.push({
      date: date.toISOString().split('T')[0],
      revenue: Math.floor(Math.random() * 50000) + 20000,
      count: Math.floor(Math.random() * 30) + 5,
    });
  }

  return data;
};

export const generateMockJobSummary = (teamId = "mock-team-id") => ({
  today: Math.floor(Math.random() * 10) + 5,
  thisWeek: Math.floor(Math.random() * 40) + 20,
  pending: Math.floor(Math.random() * 15) + 3,
  thisMonth: Math.floor(Math.random() * 100) + 50,
  totalRevenue: Math.floor(Math.random() * 500000) + 100000,
});

// Mock middleware for tRPC
export const withMockData = async (opts: {
  ctx: any;
  type: string;
  path: string;
  next: any;
  input: any;
}) => {
  const { ctx, type, path, next, input } = opts;

  // Only enable in development with MOCK_MODE=true
  if (!isMockMode() || process.env.NODE_ENV === "production") {
    return next();
  }

  console.log(`[MOCK MODE] Intercepting ${type} call to ${path}`);

  const teamId = ctx.teamId || "mock-team-id";

  // Mock job endpoints
  if (path.startsWith("job.")) {
    if (path === "job.list" || path === "job.get") {
      const mockJobs = generateMockJobs(teamId, 25);
      let filteredJobs = [...mockJobs];

      // Apply filters from input
      if (input?.q) {
        const searchLower = input.q.toLowerCase();
        filteredJobs = filteredJobs.filter((job) =>
          job.jobNumber.toLowerCase().includes(searchLower) ||
          job.companyName?.toLowerCase().includes(searchLower) ||
          job.description?.toLowerCase().includes(searchLower)
        );
      }

      if (input?.customerId) {
        filteredJobs = filteredJobs.filter((job) => job.customerId === input.customerId);
      }

      if (input?.status && input.status.length > 0) {
        filteredJobs = filteredJobs.filter((job) => input.status.includes(job.status));
      }

      // Pagination
      const limit = input?.limit || input?.pageSize || 50;
      const page = input?.page || 1;
      const offset = (page - 1) * limit;
      const paginatedJobs = filteredJobs.slice(offset, offset + limit);

      return {
        ok: true,
        data: {
          data: paginatedJobs,
          total: filteredJobs.length,
          page,
          pageSize: limit,
        },
      };
    }

    if (path === "job.getById") {
      const mockJobs = generateMockJobs(teamId, 25);
      const job = mockJobs.find((j) => j.id === input?.id);

      if (!job) {
        throw new Error("Job not found");
      }

      return {
        ok: true,
        data: job,
      };
    }

    if (path === "job.unlinkedByCompany") {
      const mockJobs = generateMockJobs(teamId, 10);
      const unlinkedJobs = mockJobs.filter((job) => !job.customerId && job.companyName);

      return {
        ok: true,
        data: unlinkedJobs.slice(0, input?.limit || 50),
      };
    }

    if (path === "job.create") {
      const newJob = {
        id: `mock-job-new-${Date.now()}`,
        jobNumber: input?.jobNumber || `JOB-2024-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0")}`,
        jobDate: input?.jobDate || new Date().toISOString(),
        companyName: input?.companyName || "New Company",
        customerName: input?.companyName || "New Company",
        description: input?.description || "",
        status: input?.status || "pending",
        totalAmount: input?.pricePerUnit && input?.cubicMetreCapacity ? (input.pricePerUnit * input.cubicMetreCapacity) : 0,
        currency: "USD",
        rego: input?.rego || "",
        pricePerUnit: input?.pricePerUnit || 85,
        cubicMetreCapacity: input?.cubicMetreCapacity || 22,
        loadNumber: input?.loadNumber || 1,
        contactPerson: null,
        contactNumber: null,
        notes: input?.notes || null,
        teamId,
        customerId: input?.customerId || null,
        volume: input?.volume || null,
        weight: input?.weight || null,
        invoiceId: null,
        invoiceNumber: null,
        invoiceStatus: null,
        materialType: input?.materialType || null,
        addressSite: input?.addressSite || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return {
        ok: true,
        data: newJob,
      };
    }

    if (path === "job.update") {
      const mockJobs = generateMockJobs(teamId, 25);
      const job = mockJobs.find((j) => j.id === input?.id);

      if (!job) {
        throw new Error("Job not found");
      }

      const updatedJob = {
        ...job,
        ...input,
        updatedAt: new Date().toISOString(),
      };

      return {
        ok: true,
        data: updatedJob,
      };
    }

    if (path === "job.delete") {
      return {
        ok: true,
        data: { success: true },
      };
    }

    if (path === "job.updateManyStatus") {
      return {
        ok: true,
        data: {
          count: input?.ids?.length || 0,
          updated: input?.ids || [],
        },
      };
    }

    if (path === "job.bulkImport") {
      const importedJobs = (input?.jobs || []).map((jobData: any, i: number) => ({
        id: `mock-job-import-${Date.now()}-${i}`,
        ...jobData,
        teamId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      return {
        ok: true,
        data: {
          imported: importedJobs.length,
          jobs: importedJobs,
        },
      };
    }
  }

  // Mock invoice endpoints
  if (path.startsWith("invoice.")) {
    if (path === "invoice.list" || path === "invoice.get") {
      const mockInvoices = generateMockInvoices(teamId, 20);
      let filteredInvoices = [...mockInvoices];

      // Apply filters
      if (input?.q) {
        const searchLower = input.q.toLowerCase();
        filteredInvoices = filteredInvoices.filter((inv) =>
          inv.invoiceNumber.toLowerCase().includes(searchLower) ||
          inv.customerName?.toLowerCase().includes(searchLower)
        );
      }

      if (input?.statuses && input.statuses.length > 0) {
        filteredInvoices = filteredInvoices.filter((inv) => input.statuses.includes(inv.status));
      }

      // Pagination
      const pageSize = input?.pageSize || 25;
      const cursor = input?.cursor ? parseInt(input.cursor) : 0;
      const paginatedInvoices = filteredInvoices.slice(cursor, cursor + pageSize);

      return {
        ok: true,
        data: {
          data: paginatedInvoices,
          meta: {
            cursor: cursor + pageSize < filteredInvoices.length ? String(cursor + pageSize) : null,
            hasPreviousPage: cursor > 0,
            hasNextPage: cursor + pageSize < filteredInvoices.length,
          },
        },
      };
    }

    if (path === "invoice.paymentStatus") {
      // Generate realistic payment status summary
      const mockInvoices = generateMockInvoices(teamId, 20);
      const total = mockInvoices.length;
      const paid = mockInvoices.filter(inv => inv.status === "paid").length;
      const unpaid = mockInvoices.filter(inv => inv.status === "unpaid").length;
      const overdue = mockInvoices.filter(inv => inv.status === "overdue").length;
      const cancelled = mockInvoices.filter(inv => inv.status === "canceled").length;

      return {
        ok: true,
        data: { total, paid, unpaid, overdue, cancelled },
      };
    }

    if (path === "invoice.invoiceSummary") {
      // Generate realistic invoice summary grouped by currency
      const mockInvoices = generateMockInvoices(teamId, 20);

      // Calculate summary based on status filter if provided
      let filteredInvoices = mockInvoices;
      if (input?.status) {
        filteredInvoices = mockInvoices.filter(inv => inv.status === input.status);
      }

      // Group by currency (in this mock, all are USD)
      const totalAmount = filteredInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
      const invoiceCount = filteredInvoices.length;

      // Return array format matching database query result
      return {
        ok: true,
        data: [
          {
            currency: "USD",
            totalAmount,
            invoiceCount,
          }
        ],
      };
    }

    if (path === "invoice.mostActiveClient") {
      return {
        ok: true,
        data: { name: "Acme Corp", count: 12 },
      };
    }

    if (path === "invoice.inactiveClientsCount") {
      return {
        ok: true,
        data: { count: 3 },
      };
    }

    if (path === "invoice.averageDaysToPayment") {
      return {
        ok: true,
        data: { days: 21 },
      };
    }

    if (path === "invoice.averageInvoiceSize") {
      return {
        ok: true,
        data: { average: 45000, currency: "USD" }, // $450 in cents
      };
    }

    if (path === "invoice.topRevenueClient") {
      return {
        ok: true,
        data: { name: "TechStart Inc", revenue: 125000, currency: "USD" },
      };
    }

    if (path === "invoice.newCustomersCount") {
      return {
        ok: true,
        data: { count: 5 },
      };
    }

    if (path === "invoice.templateIsConfigured") {
      return {
        ok: true,
        data: {
          isConfigured: true,
          needsSetup: [],
        },
      };
    }

    if (path === "invoice.getById") {
      const mockInvoices = generateMockInvoices(teamId, 20);
      const invoice = mockInvoices.find(inv => inv.id === input?.id) || mockInvoices[0];
      return {
        ok: true,
        data: invoice,
      };
    }

    if (path === "invoice.defaultSettings") {
      return {
        ok: true,
        data: {
          id: "mock-new-invoice-id",
          invoiceNumber: "INV-2024-0021",
          currency: "USD",
          status: "draft",
          template: {
            currency: "USD",
            size: "a4",
            includeTax: false,
            includeVat: true,
            includeDiscount: false,
            includeDecimals: true,
            includeUnits: true,
            includeQr: true,
            includePdf: false,
            sendCopy: false,
            dateFormat: "MM/DD/YYYY",
          },
        },
      };
    }

    if (path === "invoice.draft") {
      const newInvoice = {
        id: `mock-invoice-draft-${Date.now()}`,
        invoiceNumber: input?.invoiceNumber || `INV-2024-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0")}`,
        status: "draft",
        dueDate: input?.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        issueDate: input?.issueDate || new Date().toISOString(),
        amount: input?.amount || 0,
        currency: input?.currency || "USD",
        customer: input?.customer || null,
        customerId: input?.customerId || null,
        customerName: input?.customerName || "",
        note: input?.note || null,
        teamId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return {
        ok: true,
        data: newInvoice,
      };
    }

    if (path === "invoice.create") {
      const newInvoice = {
        id: `mock-invoice-new-${Date.now()}`,
        invoiceNumber: input?.invoiceNumber || `INV-2024-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0")}`,
        status: input?.status || "unpaid",
        dueDate: input?.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        issueDate: input?.issueDate || new Date().toISOString(),
        amount: input?.amount || 0,
        currency: input?.currency || "USD",
        customer: input?.customer || null,
        customerId: input?.customerId || null,
        customerName: input?.customerName || "",
        note: input?.note || null,
        teamId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return {
        ok: true,
        data: newInvoice,
      };
    }

    if (path === "invoice.update") {
      const mockInvoices = generateMockInvoices(teamId, 20);
      const invoice = mockInvoices.find((inv) => inv.id === input?.id);

      if (!invoice) {
        throw new Error("Invoice not found");
      }

      const updatedInvoice = {
        ...invoice,
        ...input,
        updatedAt: new Date().toISOString(),
      };

      return {
        ok: true,
        data: updatedInvoice,
      };
    }

    if (path === "invoice.remind") {
      return {
        ok: true,
        data: {
          success: true,
          reminderSentAt: new Date().toISOString(),
        },
      };
    }

    if (path === "invoice.delete") {
      return {
        ok: true,
        data: { success: true },
      };
    }

    if (path === "invoice.getInvoiceByToken") {
      const mockInvoices = generateMockInvoices(teamId, 20);
      const invoice = mockInvoices[0];

      return {
        ok: true,
        data: {
          ...invoice,
          token: input?.token || "mock-token",
        },
      };
    }

    if (path === "invoice.searchInvoiceNumber") {
      const query = input?.query?.toLowerCase() || "";
      const mockInvoices = generateMockInvoices(teamId, 20);
      const results = mockInvoices
        .filter((inv) => inv.invoiceNumber.toLowerCase().includes(query))
        .slice(0, 10)
        .map((inv) => inv.invoiceNumber);

      return {
        ok: true,
        data: results,
      };
    }
  }

  // Mock customer endpoints
  if (path.startsWith("customers.")) {
    if (path === "customers.get") {
      const mockCustomers = generateMockCustomers(teamId, 10);
      let filteredCustomers = [...mockCustomers];

      if (input?.q) {
        const searchLower = input.q.toLowerCase();
        filteredCustomers = filteredCustomers.filter((cust) =>
          cust.name.toLowerCase().includes(searchLower) ||
          cust.email?.toLowerCase().includes(searchLower)
        );
      }

      const pageSize = input?.pageSize || 10;
      const cursor = input?.cursor ? parseInt(input.cursor) : 0;
      const paginatedCustomers = filteredCustomers.slice(cursor, cursor + pageSize);

      return {
        ok: true,
        data: {
          data: paginatedCustomers,
          meta: {
            cursor: cursor + pageSize < filteredCustomers.length ? String(cursor + pageSize) : null,
            hasPreviousPage: cursor > 0,
            hasNextPage: cursor + pageSize < filteredCustomers.length,
          },
        },
      };
    }

    if (path === "customers.getById") {
      const mockCustomers = generateMockCustomers(teamId, 10);
      const customer = mockCustomers.find((c) => c.id === input?.id);

      if (!customer) {
        throw new Error("Customer not found");
      }

      return {
        ok: true,
        data: customer,
      };
    }

    if (path === "customers.upsert") {
      const mockCustomers = generateMockCustomers(teamId, 10);
      const existingCustomer = input?.id ? mockCustomers.find((c) => c.id === input.id) : null;

      if (existingCustomer) {
        // Update existing customer
        const updatedCustomer = {
          ...existingCustomer,
          ...input,
          updatedAt: new Date().toISOString(),
        };

        return {
          ok: true,
          data: updatedCustomer,
        };
      } else {
        // Create new customer
        const newCustomer = {
          id: `mock-customer-new-${Date.now()}`,
          name: input?.name || "New Customer",
          email: input?.email || null,
          phone: input?.phone || null,
          website: input?.website || null,
          address: input?.address || null,
          teamId,
          token: `cust_mock_${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        return {
          ok: true,
          data: newCustomer,
        };
      }
    }

    if (path === "customers.delete") {
      return {
        ok: true,
        data: { success: true },
      };
    }
  }

  // Mock user endpoints
  if (path.startsWith("user.")) {
    if (path === "user.me") {
      return {
        ok: true,
        data: generateMockUser("mock-user-id", teamId),
      };
    }

    if (path === "user.invites") {
      return {
        ok: true,
        data: [], // No pending invites
      };
    }

    if (path === "user.update") {
      const currentUser = generateMockUser("mock-user-id", teamId);
      const updatedUser = {
        ...currentUser,
        ...input,
        updatedAt: new Date().toISOString(),
      };

      return {
        ok: true,
        data: updatedUser,
      };
    }
  }

  // Mock team endpoints
  if (path.startsWith("team.")) {
    if (path === "team.current") {
      return {
        ok: true,
        data: generateMockTeam(teamId),
      };
    }

    if (path === "team.list") {
      return {
        ok: true,
        data: [generateMockTeam(teamId)],
      };
    }

    if (path === "team.members") {
      return {
        ok: true,
        data: generateMockTeamMembers(teamId),
      };
    }

    if (path === "team.teamInvites" || path === "team.invitesByEmail") {
      return {
        ok: true,
        data: [], // No pending invites
      };
    }
  }

  // Mock invoice template endpoints
  if (path.startsWith("invoiceTemplate.")) {
    if (path === "invoiceTemplate.get") {
      return {
        ok: true,
        data: generateMockInvoiceTemplate(teamId),
      };
    }

    if (path === "invoiceTemplate.isConfigured") {
      return {
        ok: true,
        data: true, // Template is configured
      };
    }

    if (path === "invoiceTemplate.list") {
      return {
        ok: true,
        data: [generateMockInvoiceTemplate(teamId)],
      };
    }

    if (path === "invoiceTemplate.upsert") {
      const currentTemplate = generateMockInvoiceTemplate(teamId);
      const updatedTemplate = {
        ...currentTemplate,
        ...input,
        updatedAt: new Date().toISOString(),
      };

      return {
        ok: true,
        data: updatedTemplate,
      };
    }
  }

  // Mock invoice products endpoints
  if (path.startsWith("invoiceProducts.")) {
    const mockProducts = generateMockProducts(teamId, 10);

    if (path === "invoiceProducts.search") {
      let filteredProducts = [...mockProducts];

      if (input?.query) {
        const searchLower = input.query.toLowerCase();
        filteredProducts = filteredProducts.filter((prod) =>
          prod.name.toLowerCase().includes(searchLower) ||
          prod.description?.toLowerCase().includes(searchLower)
        );
      }

      return {
        ok: true,
        data: filteredProducts.slice(0, 10),
      };
    }

    if (path === "invoiceProducts.getTop") {
      // Return top 5 most used products
      const sorted = [...mockProducts].sort((a, b) => b.usage_count - a.usage_count);
      return {
        ok: true,
        data: sorted.slice(0, 5),
      };
    }
  }

  // Mock tags endpoints
  if (path.startsWith("tags.")) {
    if (path === "tags.get") {
      return {
        ok: true,
        data: generateMockTags(teamId),
      };
    }

    if (path === "tags.create") {
      const newTag = {
        id: `mock-tag-new-${Date.now()}`,
        teamId,
        name: input?.name || "New Tag",
        color: input?.color || "#3b82f6",
        createdAt: new Date().toISOString(),
      };

      return {
        ok: true,
        data: newTag,
      };
    }

    if (path === "tags.delete") {
      return {
        ok: true,
        data: { success: true },
      };
    }
  }

  // Mock reports endpoints
  if (path.startsWith("reports.")) {
    if (path === "reports.revenue") {
      return {
        ok: true,
        data: generateMockRevenueData(),
      };
    }

    if (path === "reports.jobs") {
      const monthsData = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        monthsData.push({
          date: date.toISOString().split('T')[0],
          count: Math.floor(Math.random() * 50) + 10,
        });
      }
      return {
        ok: true,
        data: monthsData,
      };
    }

    if (path === "reports.volume") {
      const monthsData = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        monthsData.push({
          date: date.toISOString().split('T')[0],
          volume: Math.floor(Math.random() * 1000) + 200,
        });
      }
      return {
        ok: true,
        data: monthsData,
      };
    }

    if (path === "reports.invoice") {
      return {
        ok: true,
        data: {
          total: 150,
          paid: 120,
          unpaid: 20,
          overdue: 10,
          totalAmount: 250000,
          paidAmount: 200000,
          unpaidAmount: 50000,
        },
      };
    }

    if (path === "reports.burnRate") {
      return {
        ok: true,
        data: {
          rate: 35000,
          currency: "USD",
          period: "month",
        },
      };
    }

    if (path === "reports.runway") {
      return {
        ok: true,
        data: {
          months: 18,
          endDate: new Date(Date.now() + 18 * 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
      };
    }

    if (path === "reports.profit") {
      const monthsData = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        monthsData.push({
          date: date.toISOString().split('T')[0],
          profit: Math.floor(Math.random() * 30000) + 10000,
          revenue: Math.floor(Math.random() * 50000) + 30000,
          expenses: Math.floor(Math.random() * 25000) + 15000,
        });
      }
      return {
        ok: true,
        data: monthsData,
      };
    }

    if (path === "reports.spending") {
      const monthsData = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        monthsData.push({
          date: date.toISOString().split('T')[0],
          amount: Math.floor(Math.random() * 40000) + 10000,
        });
      }
      return {
        ok: true,
        data: monthsData,
      };
    }

    if (path === "reports.expense") {
      const categories = ["Travel", "Office", "Software", "Marketing", "Utilities"];
      const expenseData = categories.map((category) => ({
        category,
        amount: Math.floor(Math.random() * 15000) + 5000,
        count: Math.floor(Math.random() * 20) + 5,
      }));

      return {
        ok: true,
        data: expenseData,
      };
    }
  }

  // Mock job summary
  if (path === "job.summary") {
    return {
      ok: true,
      data: generateMockJobSummary(teamId),
    };
  }

  // Mock billing endpoints
  if (path.startsWith("billing.")) {
    if (path === "billing.orders") {
      const mockOrders = [
        {
          id: "order-1",
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          amount: { amount: 9900, currency: "USD" },
          status: "succeeded",
          product: { name: "Pro Plan" },
          invoiceId: "inv-1",
        },
        {
          id: "order-2",
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          amount: { amount: 9900, currency: "USD" },
          status: "succeeded",
          product: { name: "Pro Plan" },
          invoiceId: "inv-2",
        },
      ];

      return {
        ok: true,
        data: {
          data: mockOrders,
          meta: {
            hasNextPage: false,
            cursor: undefined,
          },
        },
      };
    }

    if (path === "billing.getSubscriptions") {
      return {
        ok: true,
        data: [
          {
            id: "sub-1",
            status: "active",
            currentPeriodStart: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
            cancelAtPeriodEnd: false,
            product: { name: "Pro Plan" },
            price: {
              amount: 9900,
              currency: "USD",
              recurringInterval: "month",
            },
          },
        ],
      };
    }

    if (path === "billing.getCustomerPortalUrl") {
      return {
        ok: true,
        data: {
          url: "https://billing.stripe.com/session/mock_portal_session",
        },
      };
    }

    if (path === "billing.getInvoice") {
      return {
        ok: true,
        data: {
          status: "ready",
          downloadUrl: "https://example.com/invoice.pdf",
        },
      };
    }

    if (path === "billing.getProducts") {
      return {
        ok: true,
        data: [
          {
            id: "prod-1",
            name: "Pro Plan",
            description: "Professional plan with all features",
            prices: [
              {
                id: "price-1",
                amount: 9900,
                currency: "USD",
                recurringInterval: "month",
                type: "recurring",
              },
            ],
          },
        ],
      };
    }

    if (path === "billing.createCheckout") {
      return {
        ok: true,
        data: {
          url: "https://checkout.stripe.com/c/pay/mock_session",
        },
      };
    }
  }

  // Mock bank accounts endpoints
  if (path.startsWith("bankAccounts.")) {
    if (path === "bankAccounts.get") {
      return {
        ok: true,
        data: [
          {
            id: "bank-1",
            name: "Business Checking",
            currency: "USD",
            balance: 125000.50,
            type: "depository",
            enabled: true,
            manual: false,
            createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: "bank-2",
            name: "Savings Account",
            currency: "USD",
            balance: 50000.00,
            type: "depository",
            enabled: true,
            manual: false,
            createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ],
      };
    }

    if (path === "bankAccounts.currencies") {
      return {
        ok: true,
        data: ["USD", "EUR", "GBP"],
      };
    }

    if (path === "bankAccounts.balances") {
      return {
        ok: true,
        data: {
          USD: 175000.50,
          EUR: 0,
          GBP: 0,
        },
      };
    }

    if (path === "bankAccounts.create") {
      return {
        ok: true,
        data: {
          id: "bank-new",
          name: input?.name || "New Account",
          currency: input?.currency || "USD",
          balance: 0,
          type: "depository",
          enabled: true,
          manual: true,
          createdAt: new Date().toISOString(),
        },
      };
    }
  }

  // Mock bank connections endpoints
  if (path.startsWith("bankConnections.")) {
    if (path === "bankConnections.get") {
      return {
        ok: true,
        data: [
          {
            id: "conn-1",
            institutionId: "ins_1",
            name: "Chase Bank",
            logo: "https://logo.clearbit.com/chase.com",
            status: "connected",
            lastSyncedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            accountsCount: 2,
          },
        ],
      };
    }

    if (path === "bankConnections.delete") {
      return {
        ok: true,
        data: { success: true },
      };
    }
  }

  // Mock documents endpoints
  if (path.startsWith("documents.")) {
    if (path === "documents.get") {
      return {
        ok: true,
        data: {
          data: [
            {
              id: "doc-1",
              name: "invoice_2024_001.pdf",
              size: 245678,
              contentType: "application/pdf",
              createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
              tag: { id: "tag-1", name: "Invoice" },
            },
            {
              id: "doc-2",
              name: "receipt_hotel.jpg",
              size: 123456,
              contentType: "image/jpeg",
              createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
              tag: { id: "tag-2", name: "Receipt" },
            },
          ],
          meta: {
            hasNextPage: false,
            cursor: null,
          },
        },
      };
    }

    if (path === "documents.getById") {
      return {
        ok: true,
        data: {
          id: input?.id || "doc-1",
          name: "invoice_2024_001.pdf",
          size: 245678,
          contentType: "application/pdf",
          pathTokens: ["team-id", "documents", "invoice_2024_001.pdf"],
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
      };
    }

    if (path === "documents.delete") {
      return {
        ok: true,
        data: { success: true },
      };
    }

    if (path === "documents.processDocument") {
      return {
        ok: true,
        data: {
          jobId: "job_mock_123",
          status: "processing",
        },
      };
    }

    if (path === "documents.signedUrls") {
      return {
        ok: true,
        data: input?.paths?.map((path: string) => ({
          path,
          url: `https://storage.example.com/signed/${path}?token=mock_token`,
        })) || [],
      };
    }
  }

  // Mock document tags endpoints
  if (path.startsWith("documentTags.")) {
    if (path === "documentTags.get") {
      return {
        ok: true,
        data: [
          { id: "dtag-1", name: "Invoice", color: "#3b82f6" },
          { id: "dtag-2", name: "Receipt", color: "#10b981" },
          { id: "dtag-3", name: "Contract", color: "#8b5cf6" },
        ],
      };
    }
  }

  // Mock inbox endpoints
  if (path.startsWith("inbox.")) {
    if (path === "inbox.get") {
      return {
        ok: true,
        data: {
          data: [
            {
              id: "inbox-1",
              displayName: "receipt_restaurant.jpg",
              status: "pending",
              amount: 12500,
              currency: "USD",
              date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: "inbox-2",
              displayName: "invoice_supplier.pdf",
              status: "pending",
              amount: 45000,
              currency: "USD",
              date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
              createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            },
          ],
          meta: {
            hasNextPage: false,
          },
        },
      };
    }

    if (path === "inbox.getById") {
      return {
        ok: true,
        data: {
          id: input?.id || "inbox-1",
          displayName: "receipt_restaurant.jpg",
          status: "pending",
          amount: 12500,
          currency: "USD",
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
      };
    }
  }

  // Mock search endpoints
  if (path.startsWith("search.")) {
    if (path === "search.global") {
      return {
        ok: true,
        data: [
          {
            id: "result-1",
            type: "transaction",
            name: "Office Supplies",
            description: "Purchase from Staples",
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            amount: 15000,
          },
          {
            id: "result-2",
            type: "invoice",
            name: "INV-2024-0015",
            description: "Invoice for Acme Corp",
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            amount: 50000,
          },
        ],
      };
    }
  }

  // Mock transactions endpoints
  if (path.startsWith("transactions.")) {
    if (path === "transactions.get") {
      return {
        ok: true,
        data: {
          data: [
            {
              id: "trans-1",
              date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              name: "Office Depot",
              amount: -15000,
              currency: "USD",
              category: { name: "Office Supplies", slug: "office-supplies" },
              status: "posted",
              method: "card_purchase",
            },
            {
              id: "trans-2",
              date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
              name: "Client Payment",
              amount: 250000,
              currency: "USD",
              category: { name: "Income", slug: "income" },
              status: "posted",
              method: "ach",
            },
          ],
          meta: {
            hasNextPage: false,
            cursor: null,
          },
        },
      };
    }

    if (path === "transactions.getById") {
      return {
        ok: true,
        data: {
          id: input?.id || "trans-1",
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          name: "Office Depot",
          amount: -15000,
          currency: "USD",
          category: { name: "Office Supplies", slug: "office-supplies" },
          status: "posted",
          method: "card_purchase",
        },
      };
    }

    if (path === "transactions.getAmountRange") {
      return {
        ok: true,
        data: {
          min: -500000,
          max: 500000,
        },
      };
    }
  }

  // Mock short links endpoints
  if (path.startsWith("shortLinks.")) {
    if (path === "shortLinks.createForDocument") {
      return {
        ok: true,
        data: {
          id: "short-1",
          shortId: "abc123",
          shortUrl: `${process.env.MIDDAY_DASHBOARD_URL}/s/abc123`,
          originalUrl: "https://storage.example.com/document.pdf",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      };
    }

    if (path === "shortLinks.get") {
      return {
        ok: true,
        data: {
          id: "short-1",
          shortId: input?.shortId || "abc123",
          url: "https://storage.example.com/document.pdf",
          type: "download",
          fileName: "document.pdf",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      };
    }
  }

  // Mock notification settings endpoints
  if (path.startsWith("notificationSettings.")) {
    if (path === "notificationSettings.getAll") {
      return {
        ok: true,
        data: [
          { id: "ns-1", type: "invoice_paid", enabled: true, channels: ["email", "in_app"] },
          { id: "ns-2", type: "invoice_overdue", enabled: true, channels: ["email", "in_app"] },
          { id: "ns-3", type: "new_transaction", enabled: false, channels: ["in_app"] },
        ],
      };
    }

    if (path === "notificationSettings.update") {
      return {
        ok: true,
        data: {
          id: input?.id,
          type: input?.type,
          enabled: input?.enabled,
          channels: input?.channels,
        },
      };
    }
  }

  // Mock notifications endpoints
  if (path.startsWith("notifications.")) {
    if (path === "notifications.list") {
      return {
        ok: true,
        data: [
          {
            id: "notif-1",
            type: "invoice_paid",
            title: "Invoice Paid",
            message: "Invoice INV-2024-0015 has been paid",
            read: false,
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: "notif-2",
            type: "new_transaction",
            title: "New Transaction",
            message: "New transaction detected: Office Supplies -$150.00",
            read: true,
            createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          },
        ],
      };
    }

    if (path === "notifications.updateStatus") {
      return {
        ok: true,
        data: { success: true },
      };
    }

    if (path === "notifications.updateAllStatus") {
      return {
        ok: true,
        data: { success: true },
      };
    }
  }

  // Mock OAuth applications endpoints
  if (path.startsWith("oauthApplications.")) {
    if (path === "oauthApplications.list") {
      return {
        ok: true,
        data: [
          {
            id: "quickbooks",
            provider: "quickbooks",
            name: "QuickBooks",
            description: "Connect your QuickBooks account for accounting integration",
            logo: "/integrations/quickbooks.svg",
            configured: true,
            environment: "production",
          },
          {
            id: "xero",
            provider: "xero",
            name: "Xero",
            description: "Connect your Xero account for accounting integration",
            logo: "/integrations/xero.svg",
            configured: false,
            environment: "production",
          },
        ],
      };
    }

    if (path === "oauthApplications.authorized") {
      return {
        ok: true,
        data: [],
      };
    }
  }

  // Mock apps endpoints
  if (path.startsWith("apps.")) {
    if (path === "apps.get") {
      return {
        ok: true,
        data: [
          {
            id: "app-1",
            appId: "quickbooks",
            teamId,
            settings: {},
            config: {},
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ],
      };
    }

    if (path === "apps.disconnect") {
      return {
        ok: true,
        data: { success: true },
      };
    }
  }

  // Mock API keys endpoints
  if (path.startsWith("apiKeys.")) {
    if (path === "apiKeys.get") {
      return {
        ok: true,
        data: [
          {
            id: "key-1",
            name: "Production API Key",
            keyHash: "sk_live_***********",
            createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
            lastUsedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: "key-2",
            name: "Development API Key",
            keyHash: "sk_dev_***********",
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            lastUsedAt: null,
          },
        ],
      };
    }

    if (path === "apiKeys.upsert") {
      return {
        ok: true,
        data: {
          key: "sk_live_mock_key_123456789",
          data: {
            id: "key-new",
            name: input?.name || "New API Key",
            keyHash: "sk_live_***********",
            createdAt: new Date().toISOString(),
            lastUsedAt: null,
          },
        },
      };
    }

    if (path === "apiKeys.delete") {
      return {
        ok: true,
        data: "sk_live_deleted_key_hash",
      };
    }
  }

  // Mock tracker entries endpoints
  if (path.startsWith("trackerEntries.")) {
    if (path === "trackerEntries.byRange") {
      return {
        ok: true,
        data: [
          {
            id: "entry-1",
            date: new Date().toISOString().split('T')[0],
            description: "Client meeting",
            duration: 3600,
            project: { id: "proj-1", name: "Project Alpha" },
            assignedId: "mock-user-id",
          },
          {
            id: "entry-2",
            date: new Date().toISOString().split('T')[0],
            description: "Code review",
            duration: 1800,
            project: { id: "proj-2", name: "Project Beta" },
            assignedId: "mock-user-id",
          },
        ],
      };
    }

    if (path === "trackerEntries.getTimerStatus") {
      return {
        ok: true,
        data: {
          isRunning: false,
          entry: null,
        },
      };
    }
  }

  // Catch-all: Log unmocked endpoints and return a safe default
  console.warn(`[MOCK MODE] No mock found for endpoint: ${path} - falling through to real implementation`);

  // Fall through to real implementation
  return next();
};
