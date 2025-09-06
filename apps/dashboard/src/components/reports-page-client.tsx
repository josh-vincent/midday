"use client";

import { AnimatedNumber } from "@/components/animated-number";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import {
  differenceInDays,
  endOfMonth,
  endOfWeek,
  format,
  isWithinInterval,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import {
  Activity,
  AlertCircle,
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  FileText,
  Package,
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Job {
  id: string;
  jobNumber: string | null;
  companyName?: string | null;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  jobDate?: string | null;
  pricePerUnit?: number | null;
  cubicMetreCapacity?: number | null;
  totalAmount?: number | null;
  createdAt: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  status:
    | "draft"
    | "unpaid"
    | "paid"
    | "canceled"
    | "overdue"
    | "partially_paid"
    | "scheduled";
  amount: number;
  dueDate?: string | null;
  issueDate?: string | null;
  paidAt?: string | null;
  customerId?: string | null;
  customerName?: string | null;
  currency?: string;
  createdAt: string;
}

interface JobSummary {
  today: { total: number; completed: number };
  week: { revenue: number; jobCount: number };
  pending: { count: number; potentialRevenue: number };
  month: { volume: number; deliveries: number };
}

interface InvoiceSummary {
  summary: {
    totalPaid?: number;
    totalUnpaid?: number;
    totalOverdue?: number;
    totalDraft?: number;
    totalCanceled?: number;
    total?: number;
  };
  currency?: string;
}

interface PaymentStatus {
  paid?: number;
  unpaid?: number;
  overdue?: number;
  draft?: number;
}

interface ReportsPageClientProps {
  initialJobs: Job[];
  initialSummary: JobSummary;
  initialInvoices?: Invoice[];
  initialInvoiceSummary?: InvoiceSummary;
  initialPaymentStatus?: PaymentStatus;
}

// Color palette for charts
const COLORS = {
  paid: "#10b981",
  unpaid: "#3b82f6",
  overdue: "#ef4444",
  draft: "#6b7280",
  canceled: "#991b1b",
  partially_paid: "#f59e0b",
  scheduled: "#8b5cf6",
  pending: "#f59e0b",
  in_progress: "#3b82f6",
  completed: "#10b981",
  cancelled: "#ef4444",
};

const STATUS_ICONS = {
  paid: <CheckCircle className="h-4 w-4" />,
  unpaid: <Clock className="h-4 w-4" />,
  overdue: <AlertCircle className="h-4 w-4" />,
  draft: <FileText className="h-4 w-4" />,
  canceled: <XCircle className="h-4 w-4" />,
};

export function ReportsPageClient({
  initialJobs,
  initialSummary,
  initialInvoices = [],
  initialInvoiceSummary,
  initialPaymentStatus,
}: ReportsPageClientProps) {
  const [timeRange, setTimeRange] = useState("month");
  const [selectedMetric, setSelectedMetric] = useState("revenue");

  // Calculate invoice metrics
  const invoiceMetrics = useMemo(() => {
    const totalInvoiced = initialInvoiceSummary?.summary?.total || 0;
    const totalPaid = initialInvoiceSummary?.summary?.totalPaid || 0;
    const totalUnpaid = initialInvoiceSummary?.summary?.totalUnpaid || 0;
    const totalOverdue = initialInvoiceSummary?.summary?.totalOverdue || 0;
    const totalDraft = initialInvoiceSummary?.summary?.totalDraft || 0;

    // Collection rate
    const collectionRate =
      totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0;

    // Average days to payment
    const paidInvoices = initialInvoices.filter(
      (inv) => inv.status === "paid" && inv.paidAt && inv.issueDate,
    );
    const avgDaysToPayment =
      paidInvoices.length > 0
        ? paidInvoices.reduce((sum, inv) => {
            const days = differenceInDays(
              parseISO(inv.paidAt!),
              parseISO(inv.issueDate!),
            );
            return sum + days;
          }, 0) / paidInvoices.length
        : 0;

    // Outstanding balance
    const outstandingBalance = totalUnpaid + totalOverdue;

    return {
      totalInvoiced,
      totalPaid,
      totalUnpaid,
      totalOverdue,
      totalDraft,
      collectionRate,
      avgDaysToPayment,
      outstandingBalance,
      currency: initialInvoiceSummary?.currency || "USD",
    };
  }, [initialInvoices, initialInvoiceSummary]);

  // Calculate job metrics (existing code)
  const jobMetrics = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const thisMonthJobs = initialJobs.filter((job) => {
      if (!job.jobDate) return false;
      const jobDate = parseISO(job.jobDate);
      return isWithinInterval(jobDate, { start: monthStart, end: monthEnd });
    });

    const totalRevenue =
      thisMonthJobs.reduce((total, job) => {
        return total + (Number(job.totalAmount) || 0);
      }, 0) / 100;

    return {
      totalRevenue,
      totalJobs: thisMonthJobs.length,
      completedJobs: thisMonthJobs.filter((j) => j.status === "completed")
        .length,
      totalVolume: initialSummary.month.volume,
    };
  }, [initialJobs, initialSummary]);

  // Invoice status distribution data for pie chart
  const invoiceStatusData = useMemo(() => {
    const statusCounts = initialInvoices.reduce(
      (acc, invoice) => {
        acc[invoice.status] = (acc[invoice.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1).replace("_", " "),
      value: count,
      amount:
        initialInvoices
          .filter((inv) => inv.status === status)
          .reduce((sum, inv) => sum + inv.amount, 0) / 100,
    }));
  }, [initialInvoices]);

  // Invoice aging data
  const invoiceAgingData = useMemo(() => {
    const now = new Date();
    const unpaidInvoices = initialInvoices.filter(
      (inv) => inv.status === "unpaid" || inv.status === "overdue",
    );

    const aging = {
      current: { count: 0, amount: 0 },
      "1-30": { count: 0, amount: 0 },
      "31-60": { count: 0, amount: 0 },
      "61-90": { count: 0, amount: 0 },
      "90+": { count: 0, amount: 0 },
    };

    unpaidInvoices.forEach((invoice) => {
      if (!invoice.dueDate) return;
      const daysPastDue = differenceInDays(now, parseISO(invoice.dueDate));
      const amount = invoice.amount / 100;

      if (daysPastDue <= 0) {
        aging.current.count++;
        aging.current.amount += amount;
      } else if (daysPastDue <= 30) {
        aging["1-30"].count++;
        aging["1-30"].amount += amount;
      } else if (daysPastDue <= 60) {
        aging["31-60"].count++;
        aging["31-60"].amount += amount;
      } else if (daysPastDue <= 90) {
        aging["61-90"].count++;
        aging["61-90"].amount += amount;
      } else {
        aging["90+"].count++;
        aging["90+"].amount += amount;
      }
    });

    return Object.entries(aging).map(([period, data]) => ({
      period,
      count: data.count,
      amount: data.amount,
    }));
  }, [initialInvoices]);

  // Monthly invoice trends
  const monthlyInvoiceTrends = useMemo(() => {
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), 5 - i);
      return format(date, "MMM yyyy");
    });

    return last6Months.map((month) => {
      const monthInvoices = initialInvoices.filter((invoice) => {
        if (!invoice.issueDate) return false;
        return format(parseISO(invoice.issueDate), "MMM yyyy") === month;
      });

      const issued = monthInvoices.length;
      const paid = monthInvoices.filter((inv) => inv.status === "paid").length;
      const revenue = monthInvoices
        .filter((inv) => inv.status === "paid")
        .reduce((sum, inv) => sum + inv.amount / 100, 0);

      return {
        month,
        issued,
        paid,
        revenue,
      };
    });
  }, [initialInvoices]);

  // Top customers by invoice value
  const topCustomersByInvoice = useMemo(() => {
    const customerTotals = initialInvoices.reduce(
      (acc, invoice) => {
        const customer = invoice.customerName || "Unknown";
        if (!acc[customer]) {
          acc[customer] = {
            total: 0,
            paid: 0,
            unpaid: 0,
            count: 0,
          };
        }
        acc[customer].count++;
        acc[customer].total += invoice.amount / 100;
        if (invoice.status === "paid") {
          acc[customer].paid += invoice.amount / 100;
        } else if (
          invoice.status === "unpaid" ||
          invoice.status === "overdue"
        ) {
          acc[customer].unpaid += invoice.amount / 100;
        }
        return acc;
      },
      {} as Record<string, any>,
    );

    return Object.entries(customerTotals)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 10)
      .map(([customer, data]) => ({
        customer,
        ...data,
      }));
  }, [initialInvoices]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Monitor your business performance
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invoice Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Invoiced
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  <AnimatedNumber
                    value={invoiceMetrics.totalInvoiced}
                    currency={invoiceMetrics.currency}
                    minimumFractionDigits={0}
                    maximumFractionDigits={0}
                  />
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {initialInvoices.length} invoices
                </div>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Paid Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  <AnimatedNumber
                    value={invoiceMetrics.totalPaid}
                    currency={invoiceMetrics.currency}
                    minimumFractionDigits={0}
                    maximumFractionDigits={0}
                  />
                </div>
                <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  {invoiceMetrics.collectionRate.toFixed(1)}% collected
                </div>
              </div>
              <CreditCard className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  <AnimatedNumber
                    value={invoiceMetrics.outstandingBalance}
                    currency={invoiceMetrics.currency}
                    minimumFractionDigits={0}
                    maximumFractionDigits={0}
                  />
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Unpaid + Overdue
                </div>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  <AnimatedNumber
                    value={invoiceMetrics.totalOverdue}
                    currency={invoiceMetrics.currency}
                    minimumFractionDigits={0}
                    maximumFractionDigits={0}
                  />
                </div>
                <div className="text-xs text-red-600 mt-1">
                  Requires attention
                </div>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Invoice Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Invoice Status Distribution</CardTitle>
                <CardDescription>
                  Current status of all invoices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={invoiceStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {invoiceStatusData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            COLORS[entry.name.toLowerCase().replace(" ", "_")]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name, props) => [
                        `Count: ${value}`,
                        `Amount: $${props.payload.amount.toFixed(2)}`,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Invoice Aging */}
            <Card>
              <CardHeader>
                <CardTitle>Invoice Aging</CardTitle>
                <CardDescription>Outstanding invoices by age</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={invoiceAgingData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip
                      formatter={(value, name) => {
                        if (name === "amount")
                          return [`$${Number(value).toFixed(2)}`, "Amount"];
                        return [value, "Count"];
                      }}
                    />
                    <Legend />
                    <Bar dataKey="count" fill="#3b82f6" name="Count" />
                    <Bar dataKey="amount" fill="#10b981" name="Amount ($)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Invoice Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Invoice Trends</CardTitle>
              <CardDescription>
                Invoice activity over the last 6 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyInvoiceTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis yAxisId="left" fontSize={12} />
                  <YAxis yAxisId="right" orientation="right" fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="issued"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Issued"
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="paid"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Paid"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    name="Revenue ($)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Invoice Payment Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Collection Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {invoiceMetrics.collectionRate.toFixed(1)}%
                </div>
                <div className="w-full bg-secondary rounded-full h-2 mt-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${invoiceMetrics.collectionRate}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Paid vs Total Invoiced
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Avg. Days to Payment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {invoiceMetrics.avgDaysToPayment.toFixed(0)} days
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Average time to get paid
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Draft Invoices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <AnimatedNumber
                    value={invoiceMetrics.totalDraft}
                    currency={invoiceMetrics.currency}
                    minimumFractionDigits={0}
                    maximumFractionDigits={0}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Ready to be sent
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Customers by Invoice Value</CardTitle>
              <CardDescription>Your most valuable customers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topCustomersByInvoice.map((customer, index) => (
                  <div
                    key={customer.customer}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-2 h-8 rounded"
                        style={{
                          backgroundColor:
                            COLORS[
                              Object.keys(COLORS)[
                                index % Object.keys(COLORS).length
                              ]
                            ],
                        }}
                      />
                      <div>
                        <p className="font-medium">{customer.customer}</p>
                        <p className="text-sm text-muted-foreground">
                          {customer.count} invoices
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${customer.total.toFixed(2)}</p>
                      <div className="text-xs">
                        <span className="text-green-600">
                          Paid: ${customer.paid.toFixed(2)}
                        </span>
                        {customer.unpaid > 0 && (
                          <span className="text-yellow-600 ml-2">
                            Due: ${customer.unpaid.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue tab (existing + invoice revenue) */}
        <TabsContent value="revenue" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Sources</CardTitle>
                <CardDescription>Jobs vs Invoices</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart
                    data={[
                      {
                        metric: "Jobs Revenue",
                        value: jobMetrics.totalRevenue,
                      },
                      {
                        metric: "Invoices Paid",
                        value: invoiceMetrics.totalPaid,
                      },
                      {
                        metric: "Outstanding",
                        value: invoiceMetrics.outstandingBalance,
                      },
                      {
                        metric: "Volume (m³)",
                        value: jobMetrics.totalVolume * 10,
                      }, // Scale for visibility
                    ]}
                  >
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis />
                    <Radar
                      name="Performance"
                      dataKey="value"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Comparison</CardTitle>
                <CardDescription>Jobs vs Invoice Performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Jobs Revenue</span>
                      <span className="text-sm font-bold">
                        ${jobMetrics.totalRevenue.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: "70%" }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Invoices Paid</span>
                      <span className="text-sm font-bold">
                        ${invoiceMetrics.totalPaid.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${invoiceMetrics.collectionRate}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Outstanding</span>
                      <span className="text-sm font-bold">
                        ${invoiceMetrics.outstandingBalance.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-yellow-600 h-2 rounded-full"
                        style={{ width: "30%" }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Jobs tab remains the same */}
        <TabsContent value="jobs" className="space-y-4">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Jobs Overview</CardTitle>
                <CardDescription>Current job statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{jobMetrics.totalJobs}</p>
                    <p className="text-sm text-muted-foreground">Total Jobs</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">
                      {jobMetrics.completedJobs}
                    </p>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">
                      ${jobMetrics.totalRevenue.toFixed(0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Revenue</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">
                      {jobMetrics.totalVolume} m³
                    </p>
                    <p className="text-sm text-muted-foreground">Volume</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
