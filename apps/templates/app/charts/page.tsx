"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { Button } from "@midday/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@midday/ui/select";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Users,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Download,
  Calendar,
  Filter,
} from "lucide-react";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { ExpenseChart } from "@/components/charts/expense-chart";
import { ProfitChart } from "@/components/charts/profit-chart";
import { BurnRateChart } from "@/components/charts/burn-rate-chart";
import { RunwayChart } from "@/components/charts/runway-chart";
import { CashFlowChart } from "@/components/charts/cash-flow-chart";
import { MetricCard } from "@/components/charts/metric-card";
import { ChartsHeader } from "@/components/charts-header";
import { format, subDays } from "date-fns";

export default function ChartsPage() {
  const [period, setPeriod] = useState("30d");
  const [currency, setCurrency] = useState("USD");
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const metrics = {
    revenue: {
      value: 125420,
      change: 12.5,
      trend: "up" as const,
    },
    expenses: {
      value: 78300,
      change: -5.2,
      trend: "down" as const,
    },
    profit: {
      value: 47120,
      change: 18.7,
      trend: "up" as const,
    },
    customers: {
      value: 1234,
      change: 8.3,
      trend: "up" as const,
    },
    burnRate: {
      value: 15000,
      change: -3.2,
      trend: "down" as const,
    },
    runway: {
      value: 14,
      change: 2,
      trend: "up" as const,
    },
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <ChartsHeader
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        currency={currency}
        onCurrencyChange={setCurrency}
        period={period}
        onPeriodChange={setPeriod}
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Revenue"
          value={metrics.revenue.value}
          change={metrics.revenue.change}
          trend={metrics.revenue.trend}
          currency={currency}
          icon={DollarSign}
        />
        <MetricCard
          title="Total Expenses"
          value={metrics.expenses.value}
          change={metrics.expenses.change}
          trend={metrics.expenses.trend}
          currency={currency}
          icon={ShoppingCart}
        />
        <MetricCard
          title="Net Profit"
          value={metrics.profit.value}
          change={metrics.profit.change}
          trend={metrics.profit.trend}
          currency={currency}
          icon={TrendingUp}
        />
        <MetricCard
          title="Active Customers"
          value={metrics.customers.value}
          change={metrics.customers.change}
          trend={metrics.customers.trend}
          icon={Users}
        />
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>
                  Your income over the selected period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RevenueChart 
                  dateRange={dateRange}
                  currency={currency}
                  period={period}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expense Overview</CardTitle>
                <CardDescription>
                  Your spending over the selected period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ExpenseChart 
                  dateRange={dateRange}
                  currency={currency}
                  period={period}
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Profit & Loss</CardTitle>
              <CardDescription>
                Revenue minus expenses over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfitChart 
                dateRange={dateRange}
                currency={currency}
                period={period}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Revenue Analysis</CardTitle>
                  <CardDescription>
                    Detailed revenue breakdown and trends
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <RevenueChart 
                dateRange={dateRange}
                currency={currency}
                period={period}
                detailed
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Average Deal Size</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$3,245</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-500">+15%</span> from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Conversion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24.8%</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-500">+2.3%</span> from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">MRR Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$42,350</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-500">+8.7%</span> from last month
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Expense Breakdown</CardTitle>
                  <CardDescription>
                    Categories and trends in spending
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ExpenseChart 
                dateRange={dateRange}
                currency={currency}
                period={period}
                detailed
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Burn Rate</CardTitle>
                <CardDescription>
                  Monthly cash consumption rate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BurnRateChart 
                  dateRange={dateRange}
                  currency={currency}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Runway</CardTitle>
                <CardDescription>
                  Months of cash remaining at current burn rate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RunwayChart 
                  dateRange={dateRange}
                  currency={currency}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="forecast" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cash Flow Forecast</CardTitle>
              <CardDescription>
                Projected cash flow for the next 6 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CashFlowChart 
                currency={currency}
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Projected Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$156,000</div>
                <p className="text-xs text-muted-foreground">
                  Next 3 months
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Projected Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$98,500</div>
                <p className="text-xs text-muted-foreground">
                  Next 3 months
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Projected Profit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$57,500</div>
                <p className="text-xs text-muted-foreground">
                  Next 3 months
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}