"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { Progress } from "@midday/ui/progress";
import { Badge } from "@midday/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart,
  PieChart,
  Calendar,
  CreditCard,
  Banknote
} from "lucide-react";
import { cn } from "@midday/ui/cn";
import type { MockTransaction } from "@/lib/mock/transactions-mock";

type Props = {
  transactions: MockTransaction[];
};

export function TransactionStats({ transactions }: Props) {
  // Calculate statistics
  const completedTransactions = transactions.filter(t => t.status === "completed");
  
  const totalIncome = completedTransactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpenses = completedTransactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  const netAmount = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
  
  // Category breakdown
  const categoryBreakdown = completedTransactions
    .filter(t => t.amount < 0)
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
      return acc;
    }, {} as Record<string, number>);
  
  const topCategories = Object.entries(categoryBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
  
  const maxCategoryAmount = Math.max(...topCategories.map(([, amount]) => amount));
  
  // Payment method breakdown
  const methodBreakdown = completedTransactions.reduce((acc, t) => {
    const method = t.method || "other";
    acc[method] = (acc[method] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Recent activity
  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);
  
  const recentTransactions = completedTransactions.filter(
    t => new Date(t.date) >= last30Days
  );
  
  const recentIncome = recentTransactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  
  const recentExpenses = recentTransactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Net Amount
              {netAmount > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              netAmount > 0 ? "text-green-500" : "text-red-500"
            )}>
              ${Math.abs(netAmount).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Savings Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {savingsRate.toFixed(1)}%
            </div>
            <Progress value={savingsRate} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Avg Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${Math.abs(totalExpenses / completedTransactions.filter(t => t.amount < 0).length).toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Per expense
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">In</span>
                <span className="text-sm font-medium text-green-500">
                  +${recentIncome.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Out</span>
                <span className="text-sm font-medium text-red-500">
                  -${recentExpenses.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="h-4 w-4" />
              <span>Top Categories</span>
            </CardTitle>
            <CardDescription>
              Your highest spending categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCategories.map(([category, amount]) => (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{category}</span>
                    <span className="text-sm text-muted-foreground">
                      ${amount.toLocaleString()}
                    </span>
                  </div>
                  <Progress 
                    value={(amount / maxCategoryAmount) * 100} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4" />
              <span>Payment Methods</span>
            </CardTitle>
            <CardDescription>
              Transaction distribution by payment type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(methodBreakdown).map(([method, count]) => {
                const Icon = method === "card" ? CreditCard : Banknote;
                const percentage = ((count / completedTransactions.length) * 100).toFixed(1);
                
                return (
                  <div key={method} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium capitalize">
                        {method}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">
                        {count} transactions
                      </span>
                      <Badge variant="secondary">
                        {percentage}%
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}