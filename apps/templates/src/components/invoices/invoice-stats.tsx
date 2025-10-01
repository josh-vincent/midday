"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { Progress } from "@midday/ui/progress";
import { Badge } from "@midday/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  Users,
  Receipt,
  CreditCard
} from "lucide-react";
import { cn } from "@midday/ui/cn";
import type { MockInvoice } from "@/lib/mock/invoices-mock";

type Props = {
  invoices: MockInvoice[];
};

export function InvoiceStats({ invoices }: Props) {
  // Calculate statistics
  const totalInvoices = invoices.length;
  
  // Status breakdown
  const statusCounts = invoices.reduce((acc, invoice) => {
    acc[invoice.status] = (acc[invoice.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const draftCount = statusCounts.draft || 0;
  const sentCount = statusCounts.sent || 0;
  const paidCount = statusCounts.paid || 0;
  const overdueCount = statusCounts.overdue || 0;
  const cancelledCount = statusCounts.cancelled || 0;
  const partiallyPaidCount = statusCounts.partially_paid || 0;
  
  // Financial calculations
  const totalValue = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const totalPaid = invoices.reduce((sum, invoice) => sum + invoice.amountPaid, 0);
  const totalOutstanding = invoices.reduce((sum, invoice) => sum + invoice.amountDue, 0);
  
  const paidInvoices = invoices.filter(i => i.status === "paid");
  const overdueInvoices = invoices.filter(i => i.status === "overdue");
  const sentInvoices = invoices.filter(i => i.status === "sent" || i.status === "partially_paid");
  
  const averageInvoiceValue = totalInvoices > 0 ? totalValue / totalInvoices : 0;
  const collectionRate = totalValue > 0 ? (totalPaid / totalValue) * 100 : 0;
  
  // Time analysis
  const now = new Date();
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const recentInvoices = invoices.filter(i => new Date(i.date) >= last30Days);
  const thisWeekInvoices = invoices.filter(i => new Date(i.date) >= last7Days);
  
  const recentValue = recentInvoices.reduce((sum, i) => sum + i.total, 0);
  const thisWeekValue = thisWeekInvoices.reduce((sum, i) => sum + i.total, 0);
  
  // Customer analysis
  const customerInvoices = invoices.reduce((acc, invoice) => {
    const customerId = invoice.customer.id;
    if (!acc[customerId]) {
      acc[customerId] = {
        customer: invoice.customer,
        count: 0,
        total: 0,
        paid: 0,
      };
    }
    acc[customerId].count++;
    acc[customerId].total += invoice.total;
    acc[customerId].paid += invoice.amountPaid;
    return acc;
  }, {} as Record<string, any>);
  
  const topCustomers = Object.values(customerInvoices)
    .sort((a: any, b: any) => b.total - a.total)
    .slice(0, 5);
  
  // Payment terms analysis
  const paymentTermsBreakdown = invoices.reduce((acc, invoice) => {
    acc[invoice.paymentTerms] = (acc[invoice.paymentTerms] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Average days to payment for paid invoices
  const paidInvoicesWithDays = paidInvoices
    .filter(i => i.paidAt && i.sentAt)
    .map(i => {
      const sentDate = new Date(i.sentAt!);
      const paidDate = new Date(i.paidAt!);
      return Math.floor((paidDate.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24));
    });
  
  const averagePaymentDays = paidInvoicesWithDays.length > 0 
    ? paidInvoicesWithDays.reduce((sum, days) => sum + days, 0) / paidInvoicesWithDays.length 
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Total Outstanding
              <DollarSign className="h-4 w-4 text-orange-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalOutstanding.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {sentCount + overdueCount + partiallyPaidCount} unpaid invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Collection Rate
              {collectionRate > 80 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {collectionRate.toFixed(1)}%
            </div>
            <Progress value={collectionRate} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Avg Invoice Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${averageInvoiceValue.toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalInvoices} total invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Avg Payment Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {averagePaymentDays.toFixed(0)} days
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From sent to paid
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Invoice Status</span>
            </CardTitle>
            <CardDescription>
              Current status distribution of all invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Paid</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    {paidCount} invoices
                  </span>
                  <Badge variant="secondary">
                    {totalInvoices > 0 ? ((paidCount / totalInvoices) * 100).toFixed(1) : 0}%
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Sent</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    {sentCount} invoices
                  </span>
                  <Badge variant="secondary">
                    {totalInvoices > 0 ? ((sentCount / totalInvoices) * 100).toFixed(1) : 0}%
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">Overdue</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    {overdueCount} invoices
                  </span>
                  <Badge variant="destructive">
                    {totalInvoices > 0 ? ((overdueCount / totalInvoices) * 100).toFixed(1) : 0}%
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Draft</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    {draftCount} invoices
                  </span>
                  <Badge variant="outline">
                    {totalInvoices > 0 ? ((draftCount / totalInvoices) * 100).toFixed(1) : 0}%
                  </Badge>
                </div>
              </div>

              {partiallyPaidCount > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">Partially Paid</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">
                      {partiallyPaidCount} invoices
                    </span>
                    <Badge variant="secondary">
                      {totalInvoices > 0 ? ((partiallyPaidCount / totalInvoices) * 100).toFixed(1) : 0}%
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Recent Activity</span>
            </CardTitle>
            <CardDescription>
              Invoice activity over recent periods
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">This Week</span>
                  <span className="text-sm text-muted-foreground">
                    {thisWeekInvoices.length} invoices
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Total Value</span>
                  <span className="text-sm font-medium">
                    ${thisWeekValue.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Last 30 Days</span>
                  <span className="text-sm text-muted-foreground">
                    {recentInvoices.length} invoices
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Total Value</span>
                  <span className="text-sm font-medium">
                    ${recentValue.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overdue Amount</span>
                  <span className="text-sm font-medium text-red-600">
                    ${overdueInvoices.reduce((sum, i) => sum + i.amountDue, 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Average Days Overdue</span>
                  <span className="text-sm text-muted-foreground">
                    {overdueInvoices.length > 0 
                      ? Math.round(overdueInvoices.reduce((sum, i) => {
                          const daysOverdue = Math.floor((now.getTime() - new Date(i.dueDate).getTime()) / (1000 * 60 * 60 * 24));
                          return sum + daysOverdue;
                        }, 0) / overdueInvoices.length)
                      : 0
                    } days
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Customers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Top Customers</span>
          </CardTitle>
          <CardDescription>
            Customers by total invoice value
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topCustomers.map((customerData: any, index) => {
              const maxValue = topCustomers[0]?.total || 1;
              const percentage = (customerData.total / maxValue) * 100;
              const collectionRate = customerData.total > 0 ? (customerData.paid / customerData.total) * 100 : 0;
              
              return (
                <div key={customerData.customer.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{customerData.customer.name}</p>
                      <p className="text-xs text-muted-foreground">{customerData.count} invoices</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        ${customerData.total.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {collectionRate.toFixed(0)}% collected
                      </p>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}