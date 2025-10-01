"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { Skeleton } from "@midday/ui/skeleton";
import { Badge } from "@midday/ui/badge";
import { Progress } from "@midday/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  DollarSign, 
  Percent,
  Users,
  Clock,
  Target,
  AlertTriangle
} from "lucide-react";
import { cn } from "@midday/ui/cn";
import type { MockMetric } from "@/lib/mock/reports-mock";

type Props = {
  metrics: MockMetric[];
  loading?: boolean;
  columns?: number;
};

const iconMap = {
  currency: DollarSign,
  percentage: Percent,
  count: Users,
  hours: Clock,
};

const categoryColors = {
  revenue: "text-green-600",
  expenses: "text-red-600",
  profit: "text-blue-600",
  cashflow: "text-purple-600",
  clients: "text-orange-600",
  projects: "text-indigo-600",
  efficiency: "text-emerald-600",
};

export function MetricsGrid({ metrics, loading = false, columns = 4 }: Props) {
  if (loading) {
    return (
      <div className={`grid grid-cols-2 lg:grid-cols-${columns} gap-4`}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-3 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatValue = (metric: MockMetric) => {
    switch (metric.type) {
      case "currency":
        return `$${metric.value.toLocaleString()}`;
      case "percentage":
        return `${metric.value}%`;
      case "hours":
        return `${metric.value.toLocaleString()}h`;
      default:
        return metric.value.toLocaleString();
    }
  };

  const formatChange = (metric: MockMetric) => {
    if (!metric.change || !metric.changePercentage) return null;

    const isPositive = metric.trend === "up";
    const isNegative = metric.trend === "down";
    
    let changeText = "";
    if (metric.type === "currency") {
      changeText = `${isPositive ? "+" : ""}$${Math.abs(metric.change).toLocaleString()}`;
    } else if (metric.type === "percentage") {
      changeText = `${isPositive ? "+" : ""}${metric.change}pp`;
    } else {
      changeText = `${isPositive ? "+" : ""}${metric.change.toLocaleString()}`;
    }

    return {
      text: changeText,
      percentage: `${isPositive ? "+" : ""}${metric.changePercentage}%`,
      color: isPositive ? "text-green-600" : isNegative ? "text-red-600" : "text-gray-600",
    };
  };

  const getTrendIcon = (trend: MockMetric['trend']) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-3 w-3" />;
      case "down":
        return <TrendingDown className="h-3 w-3" />;
      default:
        return <Minus className="h-3 w-3" />;
    }
  };

  const getTargetProgress = (metric: MockMetric) => {
    if (!metric.target) return null;
    const progress = (metric.value / metric.target) * 100;
    return {
      progress: Math.min(progress, 100),
      isOnTrack: progress >= 80,
      percentage: Math.round(progress),
    };
  };

  return (
    <div className={`grid grid-cols-2 lg:grid-cols-${columns} gap-4`}>
      {metrics.map((metric) => {
        const Icon = iconMap[metric.type] || DollarSign;
        const change = formatChange(metric);
        const target = getTargetProgress(metric);

        return (
          <Card key={metric.id} className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Icon className={cn("h-4 w-4", categoryColors[metric.category])} />
                  <span>{metric.name}</span>
                </div>
                {change && (
                  <div className={cn("flex items-center space-x-1 text-xs", change.color)}>
                    {getTrendIcon(metric.trend)}
                    <span>{change.percentage}</span>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">
                  {formatValue(metric)}
                </div>
                
                {change && (
                  <div className={cn("text-xs", change.color)}>
                    {change.text} from previous period
                  </div>
                )}

                {metric.description && (
                  <p className="text-xs text-muted-foreground">
                    {metric.description}
                  </p>
                )}

                {target && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Target Progress</span>
                      <div className="flex items-center space-x-1">
                        {!target.isOnTrack && (
                          <AlertTriangle className="h-3 w-3 text-yellow-500" />
                        )}
                        <span className={target.isOnTrack ? "text-green-600" : "text-yellow-600"}>
                          {target.percentage}%
                        </span>
                      </div>
                    </div>
                    <Progress 
                      value={target.progress} 
                      className={cn(
                        "h-1",
                        target.isOnTrack ? "[&>div]:bg-green-600" : "[&>div]:bg-yellow-500"
                      )}
                    />
                    <div className="text-xs text-muted-foreground">
                      Target: {formatValue({ ...metric, value: metric.target! })}
                    </div>
                  </div>
                )}

                {metric.category && (
                  <Badge variant="outline" className="text-xs">
                    {metric.category}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}