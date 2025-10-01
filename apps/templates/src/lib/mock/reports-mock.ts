export interface MockReport {
  id: string;
  name: string;
  type: "revenue" | "expenses" | "profit-loss" | "cashflow" | "client" | "project" | "time";
  frequency: "daily" | "weekly" | "monthly" | "quarterly" | "yearly" | "custom";
  filters: {
    dateRange?: {
      from: string;
      to: string;
    };
    categories?: string[];
    clients?: string[];
    projects?: string[];
    accounts?: string[];
  };
  dateRange: {
    from: string;
    to: string;
  };
  generatedAt: string;
  data: any; // JSON data for the report
  format: "pdf" | "excel" | "csv";
  scheduled: boolean;
  scheduledTime?: string;
  recipients: string[];
  createdBy: string;
  lastGenerated?: string;
  status: "draft" | "active" | "archived";
}

export interface MockMetric {
  id: string;
  name: string;
  value: number;
  previousValue?: number;
  change?: number;
  changePercentage?: number;
  trend: "up" | "down" | "stable";
  type: "currency" | "percentage" | "count" | "hours";
  category: "revenue" | "expenses" | "profit" | "cashflow" | "clients" | "projects" | "efficiency";
  description?: string;
  target?: number;
  unit?: string;
}

export interface MockDashboard {
  id: string;
  name: string;
  description?: string;
  widgets: {
    id: string;
    type: "metric" | "chart" | "table" | "report";
    title: string;
    data: any;
    position: { x: number; y: number; width: number; height: number };
  }[];
  isDefault: boolean;
  createdBy: string;
  createdAt: string;
  lastModified: string;
}

export interface MockChartData {
  revenue: {
    monthly: Array<{ month: string; revenue: number; expenses: number; profit: number }>;
    daily: Array<{ date: string; amount: number }>;
    byCategory: Array<{ category: string; amount: number; percentage: number }>;
  };
  expenses: {
    monthly: Array<{ month: string; amount: number }>;
    byCategory: Array<{ category: string; amount: number; percentage: number; change: number }>;
    trending: Array<{ category: string; currentMonth: number; previousMonth: number; change: number }>;
  };
  cashflow: {
    monthly: Array<{ month: string; inflow: number; outflow: number; net: number }>;
    forecast: Array<{ month: string; projected: number; actual?: number }>;
  };
  clients: {
    topClients: Array<{ name: string; revenue: number; projects: number; avgProjectValue: number }>;
    retention: Array<{ month: string; newClients: number; churned: number; retained: number }>;
    satisfaction: Array<{ client: string; score: number; projects: number }>;
  };
  projects: {
    profitability: Array<{ name: string; revenue: number; costs: number; profit: number; margin: number }>;
    timeline: Array<{ name: string; startDate: string; endDate: string; progress: number; budget: number; spent: number }>;
    byStatus: Array<{ status: string; count: number; revenue: number }>;
  };
  time: {
    utilization: Array<{ month: string; billableHours: number; totalHours: number; utilization: number }>;
    byProject: Array<{ project: string; hours: number; billableHours: number; rate: number; revenue: number }>;
    efficiency: Array<{ month: string; estimatedHours: number; actualHours: number; efficiency: number }>;
  };
}

// Mock data generators
function generateRevenueData(): MockChartData['revenue'] {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const categories = ['Consulting', 'Development', 'Design', 'Marketing', 'Support'];
  
  const monthly = months.map((month, index) => {
    const revenue = 120000 + Math.random() * 80000;
    const expenses = revenue * (0.6 + Math.random() * 0.2);
    return {
      month,
      revenue: Math.round(revenue),
      expenses: Math.round(expenses),
      profit: Math.round(revenue - expenses),
    };
  });

  const daily = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(2024, 0, i + 1).toISOString(),
    amount: 3000 + Math.random() * 7000,
  }));

  const totalRevenue = monthly.reduce((sum, m) => sum + m.revenue, 0);
  const byCategory = categories.map(category => {
    const amount = totalRevenue * (0.1 + Math.random() * 0.3);
    return {
      category,
      amount: Math.round(amount),
      percentage: Math.round((amount / totalRevenue) * 100),
    };
  });

  return { monthly, daily, byCategory };
}

function generateExpensesData(): MockChartData['expenses'] {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const categories = ['Salaries', 'Software', 'Marketing', 'Office', 'Travel', 'Utilities'];
  
  const monthly = months.map(month => ({
    month,
    amount: 50000 + Math.random() * 30000,
  }));

  const totalExpenses = monthly.reduce((sum, m) => sum + m.amount, 0);
  const byCategory = categories.map(category => {
    const amount = totalExpenses * (0.1 + Math.random() * 0.25);
    const change = (Math.random() - 0.5) * 0.3;
    return {
      category,
      amount: Math.round(amount),
      percentage: Math.round((amount / totalExpenses) * 100),
      change: Math.round(change * 100),
    };
  });

  const trending = categories.slice(0, 4).map(category => {
    const currentMonth = 8000 + Math.random() * 12000;
    const previousMonth = currentMonth * (0.8 + Math.random() * 0.4);
    return {
      category,
      currentMonth: Math.round(currentMonth),
      previousMonth: Math.round(previousMonth),
      change: Math.round(((currentMonth - previousMonth) / previousMonth) * 100),
    };
  });

  return { monthly, byCategory, trending };
}

function generateCashflowData(): MockChartData['cashflow'] {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const monthly = months.map(month => {
    const inflow = 150000 + Math.random() * 100000;
    const outflow = 80000 + Math.random() * 60000;
    return {
      month,
      inflow: Math.round(inflow),
      outflow: Math.round(outflow),
      net: Math.round(inflow - outflow),
    };
  });

  const forecast = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map(month => {
    const projected = 180000 + Math.random() * 80000;
    const actual = Math.random() > 0.3 ? projected * (0.9 + Math.random() * 0.2) : undefined;
    return {
      month,
      projected: Math.round(projected),
      actual: actual ? Math.round(actual) : undefined,
    };
  });

  return { monthly, forecast };
}

function generateClientsData(): MockChartData['clients'] {
  const clientNames = ['Acme Corp', 'TechStart Inc', 'Global Solutions', 'Innovation Labs', 'Digital Ventures', 'Future Systems'];
  
  const topClients = clientNames.map(name => ({
    name,
    revenue: 50000 + Math.random() * 200000,
    projects: Math.floor(2 + Math.random() * 8),
    avgProjectValue: 25000 + Math.random() * 75000,
  })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const retention = months.map(month => ({
    month,
    newClients: Math.floor(2 + Math.random() * 8),
    churned: Math.floor(Math.random() * 3),
    retained: Math.floor(15 + Math.random() * 10),
  }));

  const satisfaction = clientNames.slice(0, 5).map(client => ({
    client,
    score: 3.5 + Math.random() * 1.5,
    projects: Math.floor(1 + Math.random() * 5),
  }));

  return { topClients, retention, satisfaction };
}

function generateProjectsData(): MockChartData['projects'] {
  const projectNames = ['Website Redesign', 'Mobile App', 'CRM Integration', 'Data Migration', 'API Development', 'E-commerce Platform'];
  
  const profitability = projectNames.map(name => {
    const revenue = 30000 + Math.random() * 120000;
    const costs = revenue * (0.4 + Math.random() * 0.3);
    const profit = revenue - costs;
    return {
      name,
      revenue: Math.round(revenue),
      costs: Math.round(costs),
      profit: Math.round(profit),
      margin: Math.round((profit / revenue) * 100),
    };
  });

  const timeline = projectNames.slice(0, 4).map(name => {
    const startDate = new Date(2024, Math.floor(Math.random() * 6), 1);
    const endDate = new Date(startDate.getTime() + (60 + Math.random() * 120) * 24 * 60 * 60 * 1000);
    const budget = 40000 + Math.random() * 80000;
    const spent = budget * (0.3 + Math.random() * 0.5);
    return {
      name,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      progress: Math.round(30 + Math.random() * 60),
      budget: Math.round(budget),
      spent: Math.round(spent),
    };
  });

  const statuses = ['Active', 'Completed', 'On Hold', 'Planning'];
  const byStatus = statuses.map(status => ({
    status,
    count: Math.floor(2 + Math.random() * 8),
    revenue: Math.round(50000 + Math.random() * 200000),
  }));

  return { profitability, timeline, byStatus };
}

function generateTimeData(): MockChartData['time'] {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  
  const utilization = months.map(month => {
    const totalHours = 160 + Math.random() * 40;
    const billableHours = totalHours * (0.6 + Math.random() * 0.3);
    return {
      month,
      billableHours: Math.round(billableHours),
      totalHours: Math.round(totalHours),
      utilization: Math.round((billableHours / totalHours) * 100),
    };
  });

  const projects = ['Project Alpha', 'Project Beta', 'Project Gamma', 'Project Delta'];
  const byProject = projects.map(project => {
    const hours = 40 + Math.random() * 120;
    const billableHours = hours * (0.8 + Math.random() * 0.2);
    const rate = 100 + Math.random() * 100;
    return {
      project,
      hours: Math.round(hours),
      billableHours: Math.round(billableHours),
      rate: Math.round(rate),
      revenue: Math.round(billableHours * rate),
    };
  });

  const efficiency = months.map(month => {
    const estimatedHours = 160 + Math.random() * 40;
    const actualHours = estimatedHours * (0.9 + Math.random() * 0.3);
    return {
      month,
      estimatedHours: Math.round(estimatedHours),
      actualHours: Math.round(actualHours),
      efficiency: Math.round((estimatedHours / actualHours) * 100),
    };
  });

  return { utilization, byProject, efficiency };
}

function generateMetrics(): MockMetric[] {
  return [
    {
      id: "revenue_total",
      name: "Total Revenue",
      value: 1450000,
      previousValue: 1280000,
      change: 170000,
      changePercentage: 13.3,
      trend: "up",
      type: "currency",
      category: "revenue",
      description: "Total revenue this year",
      target: 1500000,
    },
    {
      id: "expenses_total",
      name: "Total Expenses",
      value: 890000,
      previousValue: 920000,
      change: -30000,
      changePercentage: -3.3,
      trend: "down",
      type: "currency",
      category: "expenses",
      description: "Total expenses this year",
    },
    {
      id: "profit_margin",
      name: "Profit Margin",
      value: 38.6,
      previousValue: 35.2,
      change: 3.4,
      changePercentage: 9.7,
      trend: "up",
      type: "percentage",
      category: "profit",
      description: "Net profit margin",
      target: 40,
    },
    {
      id: "cash_balance",
      name: "Cash Balance",
      value: 425000,
      previousValue: 380000,
      change: 45000,
      changePercentage: 11.8,
      trend: "up",
      type: "currency",
      category: "cashflow",
      description: "Current cash balance",
    },
    {
      id: "active_clients",
      name: "Active Clients",
      value: 48,
      previousValue: 45,
      change: 3,
      changePercentage: 6.7,
      trend: "up",
      type: "count",
      category: "clients",
      description: "Number of active clients",
    },
    {
      id: "avg_project_value",
      name: "Avg Project Value",
      value: 75000,
      previousValue: 68000,
      change: 7000,
      changePercentage: 10.3,
      trend: "up",
      type: "currency",
      category: "projects",
      description: "Average project value",
    },
    {
      id: "billable_hours",
      name: "Billable Hours",
      value: 1840,
      previousValue: 1720,
      change: 120,
      changePercentage: 7.0,
      trend: "up",
      type: "hours",
      category: "efficiency",
      description: "Total billable hours this month",
      target: 2000,
    },
    {
      id: "utilization_rate",
      name: "Utilization Rate",
      value: 82.5,
      previousValue: 78.2,
      change: 4.3,
      changePercentage: 5.5,
      trend: "up",
      type: "percentage",
      category: "efficiency",
      description: "Team utilization rate",
      target: 85,
    },
  ];
}

function generateReports(): MockReport[] {
  return [
    {
      id: "report_1",
      name: "Monthly Revenue Report",
      type: "revenue",
      frequency: "monthly",
      filters: {
        dateRange: {
          from: "2024-01-01",
          to: "2024-12-31",
        },
        categories: ["Consulting", "Development"],
      },
      dateRange: {
        from: "2024-01-01",
        to: "2024-12-31",
      },
      generatedAt: new Date().toISOString(),
      data: generateRevenueData(),
      format: "pdf",
      scheduled: true,
      scheduledTime: "0 0 1 * *", // First day of each month
      recipients: ["ceo@company.com", "cfo@company.com"],
      createdBy: "admin@company.com",
      lastGenerated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: "active",
    },
    {
      id: "report_2",
      name: "Quarterly Profit & Loss",
      type: "profit-loss",
      frequency: "quarterly",
      filters: {
        dateRange: {
          from: "2024-01-01",
          to: "2024-03-31",
        },
      },
      dateRange: {
        from: "2024-01-01",
        to: "2024-03-31",
      },
      generatedAt: new Date().toISOString(),
      data: { revenue: generateRevenueData(), expenses: generateExpensesData() },
      format: "excel",
      scheduled: true,
      scheduledTime: "0 0 1 */3 *", // First day of every quarter
      recipients: ["board@company.com"],
      createdBy: "cfo@company.com",
      status: "active",
    },
    {
      id: "report_3",
      name: "Client Performance Analysis",
      type: "client",
      frequency: "monthly",
      filters: {
        dateRange: {
          from: "2024-01-01",
          to: "2024-12-31",
        },
        clients: ["Acme Corp", "TechStart Inc"],
      },
      dateRange: {
        from: "2024-01-01",
        to: "2024-12-31",
      },
      generatedAt: new Date().toISOString(),
      data: generateClientsData(),
      format: "pdf",
      scheduled: false,
      recipients: ["sales@company.com"],
      createdBy: "sales@company.com",
      status: "draft",
    },
  ];
}

// Mock API
export const reportsAPI = {
  getReports: async (): Promise<MockReport[]> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    return generateReports();
  },

  getReport: async (id: string): Promise<MockReport | null> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const reports = generateReports();
    return reports.find(r => r.id === id) || null;
  },

  generateReport: async (config: Partial<MockReport>): Promise<MockReport> => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return {
      id: `report_${Date.now()}`,
      name: config.name || "New Report",
      type: config.type || "revenue",
      frequency: config.frequency || "monthly",
      filters: config.filters || {},
      dateRange: config.dateRange || {
        from: new Date(2024, 0, 1).toISOString(),
        to: new Date().toISOString(),
      },
      generatedAt: new Date().toISOString(),
      data: generateRevenueData(),
      format: config.format || "pdf",
      scheduled: config.scheduled || false,
      recipients: config.recipients || [],
      createdBy: "user@company.com",
      status: "active",
    };
  },

  getMetrics: async (): Promise<MockMetric[]> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    return generateMetrics();
  },

  getChartData: async (type: keyof MockChartData): Promise<any> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const data = {
      revenue: generateRevenueData(),
      expenses: generateExpensesData(),
      cashflow: generateCashflowData(),
      clients: generateClientsData(),
      projects: generateProjectsData(),
      time: generateTimeData(),
    };
    return data[type];
  },

  exportReport: async (reportId: string, format: "pdf" | "excel" | "csv"): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    return `report_${reportId}_${Date.now()}.${format}`;
  },

  scheduleReport: async (reportId: string, schedule: string, recipients: string[]): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 800));
  },

  deleteReport: async (reportId: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));
  },
};