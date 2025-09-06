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
  BarChart3,
  Calendar,
  Clock,
  DollarSign,
  Package,
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
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

interface Summary {
  today: { total: number; completed: number };
  week: { revenue: number; jobCount: number };
  pending: { count: number; potentialRevenue: number };
  month: { volume: number; deliveries: number };
}

interface ReportsPageClientProps {
  initialJobs: Job[];
  initialSummary: Summary;
}

// Color palette for charts
const COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

export function ReportsPageClient({
  initialJobs,
  initialSummary,
}: ReportsPageClientProps) {
  const [timeRange, setTimeRange] = useState("month");
  const [selectedMetric, setSelectedMetric] = useState("revenue");

  // Calculate metrics from jobs data
  const metrics = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    // This month's jobs
    const thisMonthJobs = initialJobs.filter((job) => {
      if (!job.jobDate) return false;
      const jobDate = parseISO(job.jobDate);
      return isWithinInterval(jobDate, { start: monthStart, end: monthEnd });
    });

    // Last month's jobs
    const lastMonthJobs = initialJobs.filter((job) => {
      if (!job.jobDate) return false;
      const jobDate = parseISO(job.jobDate);
      return isWithinInterval(jobDate, {
        start: lastMonthStart,
        end: lastMonthEnd,
      });
    });

    // Calculate revenues
    const thisMonthRevenue =
      thisMonthJobs.reduce((total, job) => {
        return total + (Number(job.totalAmount) || 0);
      }, 0) / 100; // Convert from cents

    const lastMonthRevenue =
      lastMonthJobs.reduce((total, job) => {
        return total + (Number(job.totalAmount) || 0);
      }, 0) / 100;

    // Calculate growth
    const revenueGrowth =
      lastMonthRevenue > 0
        ? (
            ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) *
            100
          ).toFixed(1)
        : 0;

    // Job completion rate
    const completedJobs = thisMonthJobs.filter(
      (j) => j.status === "completed",
    ).length;
    const completionRate =
      thisMonthJobs.length > 0
        ? ((completedJobs / thisMonthJobs.length) * 100).toFixed(1)
        : 0;

    // Average job value
    const avgJobValue =
      thisMonthJobs.length > 0 ? thisMonthRevenue / thisMonthJobs.length : 0;

    return {
      totalRevenue: thisMonthRevenue,
      revenueGrowth: Number(revenueGrowth),
      totalJobs: thisMonthJobs.length,
      completedJobs,
      completionRate: Number(completionRate),
      avgJobValue,
      totalVolume: initialSummary.month.volume,
      pendingRevenue: initialSummary.pending.potentialRevenue,
    };
  }, [initialJobs, initialSummary]);

  // Prepare chart data
  const revenueByDayData = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return format(date, "MMM dd");
    });

    const revenueByDay = last30Days.map((day) => {
      const dayJobs = initialJobs.filter((job) => {
        if (!job.jobDate) return false;
        return format(parseISO(job.jobDate), "MMM dd") === day;
      });

      const revenue = dayJobs.reduce((total, job) => {
        return total + (Number(job.totalAmount) || 0) / 100;
      }, 0);

      return {
        date: day,
        revenue,
        jobs: dayJobs.length,
      };
    });

    return revenueByDay;
  }, [initialJobs]);

  // Jobs by status data for pie chart
  const jobsByStatusData = useMemo(() => {
    const statusCounts = initialJobs.reduce(
      (acc, job) => {
        acc[job.status] = (acc[job.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1).replace("_", " "),
      value: count,
    }));
  }, [initialJobs]);

  // Revenue by company data
  const revenueByCompanyData = useMemo(() => {
    const companyRevenue = initialJobs.reduce(
      (acc, job) => {
        const company = job.companyName || "Unknown";
        const revenue = (Number(job.totalAmount) || 0) / 100;
        acc[company] = (acc[company] || 0) + revenue;
        return acc;
      },
      {} as Record<string, number>,
    );

    return Object.entries(companyRevenue)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([company, revenue]) => ({
        company,
        revenue,
      }));
  }, [initialJobs]);

  // Volume trends data
  const volumeTrendsData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return format(date, "EEE");
    });

    return last7Days.map((day) => {
      const dayJobs = initialJobs.filter((job) => {
        if (!job.jobDate) return false;
        return format(parseISO(job.jobDate), "EEE") === day;
      });

      const volume = dayJobs.reduce((total, job) => {
        return total + (Number(job.cubicMetreCapacity) || 0);
      }, 0);

      return {
        day,
        volume,
        jobs: dayJobs.length,
      };
    });
  }, [initialJobs]);

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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  <AnimatedNumber
                    value={metrics.totalRevenue}
                    currency="AUD"
                    minimumFractionDigits={0}
                    maximumFractionDigits={0}
                  />
                </div>
                <div
                  className={`text-xs flex items-center gap-1 mt-1 ${metrics.revenueGrowth >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {metrics.revenueGrowth >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {Math.abs(metrics.revenueGrowth)}% from last month
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{metrics.totalJobs}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {metrics.completedJobs} completed ({metrics.completionRate}%)
                </div>
              </div>
              <Truck className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Average Job Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  <AnimatedNumber
                    value={metrics.avgJobValue}
                    currency="AUD"
                    minimumFractionDigits={0}
                    maximumFractionDigits={0}
                  />
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Per delivery
                </div>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {metrics.totalVolume} m³
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  This month
                </div>
              </div>
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="volume">Volume</TabsTrigger>
          <TabsTrigger value="companies">Companies</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>
                  Daily revenue for the last 30 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueByDayData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      fontSize={12}
                      tickFormatter={(value) => value.split(" ")[1]}
                    />
                    <YAxis
                      fontSize={12}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip
                      formatter={(value: number) => [
                        `$${value.toFixed(2)}`,
                        "Revenue",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10b981"
                      fill="#10b98133"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Companies by Revenue */}
            <Card>
              <CardHeader>
                <CardTitle>Top Companies</CardTitle>
                <CardDescription>Revenue by company</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueByCompanyData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      type="number"
                      fontSize={12}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <YAxis
                      type="category"
                      dataKey="company"
                      fontSize={12}
                      width={100}
                    />
                    <Tooltip
                      formatter={(value: number) => [
                        `$${value.toFixed(2)}`,
                        "Revenue",
                      ]}
                    />
                    <Bar dataKey="revenue" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Jobs by Status */}
            <Card>
              <CardHeader>
                <CardTitle>Jobs by Status</CardTitle>
                <CardDescription>
                  Current distribution of job statuses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={jobsByStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {jobsByStatusData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Jobs Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Jobs Over Time</CardTitle>
                <CardDescription>Number of jobs per day</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueByDayData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      fontSize={12}
                      tickFormatter={(value) => value.split(" ")[1]}
                    />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="jobs"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={{ fill: "#f59e0b" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="volume" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Volume Trends</CardTitle>
              <CardDescription>
                Daily volume (m³) for the last 7 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={volumeTrendsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === "volume") return [`${value} m³`, "Volume"];
                      return [value, "Jobs"];
                    }}
                  />
                  <Legend />
                  <Bar dataKey="volume" fill="#8b5cf6" name="Volume (m³)" />
                  <Bar dataKey="jobs" fill="#ec4899" name="Number of Jobs" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="companies" className="space-y-4">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Company Performance</CardTitle>
                <CardDescription>Top 10 companies by revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {revenueByCompanyData.map((company, index) => (
                    <div
                      key={company.company}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-2 h-8 rounded"
                          style={{
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                        <div>
                          <p className="font-medium">{company.company}</p>
                          <p className="text-sm text-muted-foreground">
                            {
                              initialJobs.filter(
                                (j) => j.companyName === company.company,
                              ).length
                            }{" "}
                            jobs
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">
                          ${company.revenue.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(
                            (company.revenue / metrics.totalRevenue) *
                            100
                          ).toFixed(1)}
                          % of total
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <AnimatedNumber
                value={metrics.pendingRevenue}
                currency="AUD"
                minimumFractionDigits={0}
                maximumFractionDigits={0}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From {initialSummary.pending.count} pending jobs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.completionRate}%</div>
            <div className="w-full bg-secondary rounded-full h-2 mt-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${metrics.completionRate}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Active Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                new Set(initialJobs.map((j) => j.companyName).filter(Boolean))
                  .size
              }
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Unique companies this month
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
