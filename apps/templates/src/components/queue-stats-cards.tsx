"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { Skeleton } from "@midday/ui/skeleton";
import { cn } from "@midday/ui/cn";
import { 
  Activity, 
  GitBranch, 
  CheckCircle, 
  AlertCircle, 
  Users, 
  BarChart3,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { queueAPI } from "@/lib/mock/queue-mock";

interface QueueStats {
  activeJobs: number;
  waitingJobs: number;
  completedJobs: number;
  failedJobs: number;
  workers: number;
  throughput: number;
  prevActiveJobs?: number;
  prevCompletedJobs?: number;
  prevFailedJobs?: number;
  prevThroughput?: number;
}

export function QueueStatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index}>
          <CardHeader className="pb-2">
            <CardTitle>
              <Skeleton className="h-4 w-16" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-8 w-12" />
              <Skeleton className="h-3 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  trend,
  subtitle,
}: {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  trend?: "up" | "down" | "neutral";
  subtitle?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          <Icon className={cn("h-4 w-4", color)} />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">
                {typeof value === "number" ? value.toLocaleString() : value}
              </span>
              {trend && (
                <div className={cn("flex items-center", {
                  "text-green-500": trend === "up",
                  "text-red-500": trend === "down",
                  "text-muted-foreground": trend === "neutral",
                })}>
                  {trend === "up" && <TrendingUp className="h-3 w-3" />}
                  {trend === "down" && <TrendingDown className="h-3 w-3" />}
                </div>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function QueueStatsCards() {
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [jobs, queues, workers] = await Promise.all([
        queueAPI.getJobs(),
        queueAPI.getQueues(),
        queueAPI.getWorkers(),
      ]);

      // Calculate current stats
      const activeJobs = jobs.filter(job => job.status === "processing").length;
      const waitingJobs = jobs.filter(job => job.status === "pending").length;
      const completedJobs = queues.reduce((sum, queue) => sum + queue.completed, 0);
      const failedJobs = queues.reduce((sum, queue) => sum + queue.failed, 0);
      const totalWorkers = workers.length;
      const totalThroughput = queues.reduce((sum, queue) => sum + queue.throughput, 0);

      // Mock previous stats for trend calculation
      const prevStats = {
        prevActiveJobs: activeJobs + Math.floor(Math.random() * 5 - 2),
        prevCompletedJobs: completedJobs - Math.floor(Math.random() * 100 + 50),
        prevFailedJobs: failedJobs - Math.floor(Math.random() * 10),
        prevThroughput: totalThroughput - Math.floor(Math.random() * 50),
      };

      setStats({
        activeJobs,
        waitingJobs,
        completedJobs,
        failedJobs,
        workers: totalWorkers,
        throughput: totalThroughput,
        ...prevStats,
      });
    } catch (error) {
      console.error("Failed to fetch queue stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <QueueStatsCardsSkeleton />;
  }

  if (!stats) {
    return null;
  }

  const getTrend = (current: number, previous?: number): "up" | "down" | "neutral" => {
    if (!previous) return "neutral";
    if (current > previous) return "up";
    if (current < previous) return "down";
    return "neutral";
  };

  const getTrendPercentage = (current: number, previous?: number): string => {
    if (!previous || previous === 0) return "";
    const change = ((current - previous) / previous * 100);
    return `${change > 0 ? "+" : ""}${change.toFixed(1)}%`;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <StatCard
        title="Active Jobs"
        value={stats.activeJobs}
        icon={Activity}
        color="text-blue-500"
        trend={getTrend(stats.activeJobs, stats.prevActiveJobs)}
        subtitle={getTrendPercentage(stats.activeJobs, stats.prevActiveJobs)}
      />
      
      <StatCard
        title="Waiting"
        value={stats.waitingJobs}
        icon={GitBranch}
        color="text-yellow-500"
        trend="neutral"
        subtitle="In queue"
      />
      
      <StatCard
        title="Completed"
        value={stats.completedJobs}
        icon={CheckCircle}
        color="text-green-500"
        trend={getTrend(stats.completedJobs, stats.prevCompletedJobs)}
        subtitle={getTrendPercentage(stats.completedJobs, stats.prevCompletedJobs)}
      />
      
      <StatCard
        title="Failed"
        value={stats.failedJobs}
        icon={AlertCircle}
        color="text-red-500"
        trend={getTrend(stats.failedJobs, stats.prevFailedJobs)}
        subtitle={getTrendPercentage(stats.failedJobs, stats.prevFailedJobs)}
      />
      
      <StatCard
        title="Workers"
        value={stats.workers}
        icon={Users}
        color="text-purple-500"
        trend="neutral"
        subtitle="Online"
      />
      
      <StatCard
        title="Throughput"
        value={`${stats.throughput}/h`}
        icon={BarChart3}
        color="text-indigo-500"
        trend={getTrend(stats.throughput, stats.prevThroughput)}
        subtitle={getTrendPercentage(stats.throughput, stats.prevThroughput)}
      />
    </div>
  );
}