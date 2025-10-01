"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { 
  Mail, 
  Inbox, 
  Send, 
  Clock
} from "lucide-react";

interface EmailMetricsProps {
  provider?: "gmail" | "outlook" | "all";
}

export function EmailMetrics({ provider = "all" }: EmailMetricsProps) {
  const metrics = [
    {
      title: "Total Emails",
      value: provider === "gmail" ? "1,245" : provider === "outlook" ? "567" : "1,812",
      change: "+125",
      icon: Mail,
      description: "Last 7 days",
    },
    {
      title: "Unread",
      value: provider === "gmail" ? "23" : provider === "outlook" ? "12" : "35",
      change: "-5",
      icon: Inbox,
      description: "Pending attention",
    },
    {
      title: "Sent Today",
      value: provider === "gmail" ? "18" : provider === "outlook" ? "9" : "27",
      change: "+3",
      icon: Send,
      description: "Outgoing messages",
    },
    {
      title: "Response Time",
      value: provider === "gmail" ? "2.3h" : provider === "outlook" ? "1.8h" : "2.1h",
      change: "-0.5h",
      icon: Clock,
      description: "Average response",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        const isPositive = metric.change.startsWith("+") || metric.change.includes("-") && metric.title === "Response Time";
        
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
                <span className={isPositive ? "text-green-600" : "text-red-600"}>
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