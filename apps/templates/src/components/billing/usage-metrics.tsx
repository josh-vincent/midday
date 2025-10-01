"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { Progress } from "@midday/ui/progress";
import { Badge } from "@midday/ui/badge";
import { 
  Users, 
  Database, 
  Zap, 
  TrendingUp, 
  Calendar,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import { type MockUsage, type MockPlan } from "@/lib/mock/billing-mock";

interface UsageMetricsProps {
  usage: MockUsage;
  plan: MockPlan;
  className?: string;
}

export function UsageMetrics({ usage, plan, className }: UsageMetricsProps) {
  const getUsagePercentage = (used: number, limit: number | string) => {
    if (limit === 'unlimited') return 0;
    return Math.min((used / (limit as number)) * 100, 100);
  };

  const getUsageStatus = (percentage: number) => {
    if (percentage >= 90) return { color: 'text-red-500', icon: AlertTriangle, label: 'Critical' };
    if (percentage >= 75) return { color: 'text-yellow-500', icon: AlertTriangle, label: 'Warning' };
    return { color: 'text-green-500', icon: CheckCircle2, label: 'Good' };
  };

  const formatStorage = (gb: number) => {
    if (gb < 1) return `${(gb * 1024).toFixed(0)} MB`;
    return `${gb.toFixed(1)} GB`;
  };

  const formatLimit = (value: number | string) => {
    if (value === 'unlimited') return '∞';
    if (typeof value === 'number') return value.toLocaleString();
    return value;
  };

  const metrics = [
    {
      icon: Users,
      title: "Team Members",
      used: usage.users,
      limit: plan.limits.users,
      unit: "",
      color: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400",
    },
    {
      icon: Database,
      title: "Storage",
      used: usage.storageUsed,
      limit: parseFloat(plan.limits.storage.replace(/[^0-9.]/g, '')),
      unit: "GB",
      format: (value: number) => formatStorage(value),
      color: "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400",
    },
    {
      icon: Zap,
      title: "API Calls",
      used: usage.apiCalls,
      limit: plan.limits.apiCalls,
      unit: "/month",
      color: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400",
    },
    {
      icon: TrendingUp,
      title: "Integrations",
      used: usage.integrations,
      limit: plan.limits.integrations,
      unit: "",
      color: "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400",
    },
  ];

  return (
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {metrics.map((metric) => {
          const percentage = getUsagePercentage(metric.used, metric.limit);
          const status = getUsageStatus(percentage);
          const Icon = metric.icon;
          const StatusIcon = status.icon;

          return (
            <Card key={metric.title}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${metric.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span>{metric.title}</span>
                  </div>
                  <Badge variant="outline" className="gap-1">
                    <StatusIcon className={`h-3 w-3 ${status.color}`} />
                    {status.label}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    {metric.format ? metric.format(metric.used) : metric.used.toLocaleString()}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    of {formatLimit(metric.limit)} {metric.unit}
                  </span>
                </div>
                
                {metric.limit !== 'unlimited' && (
                  <div className="space-y-1">
                    <Progress value={percentage} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{percentage.toFixed(0)}% used</span>
                      <span>
                        {metric.limit !== 'unlimited' && 
                          `${(metric.limit as number) - metric.used} remaining`
                        }
                      </span>
                    </div>
                  </div>
                )}

                {metric.limit === 'unlimited' && (
                  <div className="text-sm text-muted-foreground">
                    Unlimited usage available
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Usage Summary */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Usage Period
          </CardTitle>
          <CardDescription>
            Current billing period usage statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">Period</div>
              <div className="font-medium">{usage.period}</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">Last Updated</div>
              <div className="font-medium">{usage.lastUpdated.toLocaleDateString()}</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">Active Teams</div>
              <div className="font-medium">{usage.teams}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}