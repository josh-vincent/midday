"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { 
  DollarSign, 
  Users, 
  CreditCard, 
  TrendingUp,
  ArrowUp,
  ArrowDown
} from "lucide-react";

const metrics = [
  {
    title: "Monthly Recurring Revenue",
    value: "$12,459",
    change: "+12.5%",
    trend: "up",
    icon: DollarSign,
    description: "vs last month",
  },
  {
    title: "Active Subscriptions",
    value: "47",
    change: "+3",
    trend: "up",
    icon: CreditCard,
    description: "Currently active",
  },
  {
    title: "Total Customers",
    value: "124",
    change: "+8",
    trend: "up",
    icon: Users,
    description: "This month",
  },
  {
    title: "Average Revenue",
    value: "$265",
    change: "+5.2%",
    trend: "up",
    icon: TrendingUp,
    description: "Per customer",
  },
];

export function StripeMetrics() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        const TrendIcon = metric.trend === "up" ? ArrowUp : ArrowDown;
        
        return (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <span className={`flex items-center ${
                  metric.trend === "up" ? "text-green-600" : "text-red-600"
                }`}>
                  <TrendIcon className="h-3 w-3 mr-1" />
                  {metric.change}
                </span>
                <span>{metric.description}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}