"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { Progress } from "@midday/ui/progress";
import { Badge } from "@midday/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Clock,
  DollarSign,
  Activity,
  Target,
  Briefcase,
  Calendar
} from "lucide-react";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import type { TimeEntry } from "@/lib/mock/tracker-mock";

interface TrackerStatsProps {
  entries: TimeEntry[];
  projects: any[];
  jobs: any[];
}

export function TrackerStats({ entries, projects, jobs }: TrackerStatsProps) {
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Calculate stats
  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const weekEntries = entries.filter(e => {
    const date = new Date(e.startTime);
    return date >= weekStart && date <= weekEnd;
  });

  const monthEntries = entries.filter(e => {
    const date = new Date(e.startTime);
    return date >= monthStart && date <= monthEnd;
  });

  const totalHours = entries.reduce((sum, e) => sum + e.duration, 0) / 3600;
  const weekHours = weekEntries.reduce((sum, e) => sum + e.duration, 0) / 3600;
  const monthHours = monthEntries.reduce((sum, e) => sum + e.duration, 0) / 3600;

  const billableHours = entries
    .filter(e => e.billable)
    .reduce((sum, e) => sum + e.duration, 0) / 3600;

  const totalRevenue = entries
    .filter(e => e.billable && e.rate)
    .reduce((sum, e) => sum + (e.duration / 3600 * (e.rate || 0)), 0);

  const weekRevenue = weekEntries
    .filter(e => e.billable && e.rate)
    .reduce((sum, e) => sum + (e.duration / 3600 * (e.rate || 0)), 0);

  const monthRevenue = monthEntries
    .filter(e => e.billable && e.rate)
    .reduce((sum, e) => sum + (e.duration / 3600 * (e.rate || 0)), 0);

  const utilizationRate = totalHours > 0 ? (billableHours / totalHours) * 100 : 0;

  // Project breakdown
  const projectStats = new Map();
  entries.forEach(entry => {
    const existing = projectStats.get(entry.projectId) || {
      time: 0,
      revenue: 0,
      entries: 0
    };
    existing.time += entry.duration;
    existing.entries += 1;
    if (entry.billable && entry.rate) {
      existing.revenue += (entry.duration / 3600 * entry.rate);
    }
    projectStats.set(entry.projectId, existing);
  });

  const topProjects = Array.from(projectStats.entries())
    .map(([projectId, stats]) => {
      const project = projects.find(p => p.id === projectId);
      return {
        id: projectId,
        name: project?.name || 'Unknown',
        ...stats
      };
    })
    .sort((a, b) => b.time - a.time)
    .slice(0, 5);

  // Daily average
  const uniqueDays = new Set(
    entries.map(e => new Date(e.startTime).toDateString())
  ).size;
  const avgDailyHours = uniqueDays > 0 ? totalHours / uniqueDays : 0;

  // Trend calculation (mock)
  const weekTrend = 12; // +12% from last week
  const monthTrend = -5; // -5% from last month

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Total Hours
              <Clock className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">
              All time tracked
            </p>
            <Progress value={75} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Total Revenue
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              From billable hours
            </p>
            <Progress value={85} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Utilization Rate
              <Activity className="h-4 w-4 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{utilizationRate.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">
              Billable vs total
            </p>
            <Progress value={utilizationRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Daily Average
              <Target className="h-4 w-4 text-purple-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgDailyHours.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">
              Hours per day
            </p>
            <Progress value={(avgDailyHours / 8) * 100} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Period Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>This Week</CardTitle>
            <CardDescription>Performance metrics for current week</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Hours Tracked</span>
              <div className="flex items-center gap-2">
                <span className="font-bold">{weekHours.toFixed(1)}h</span>
                <Badge variant={weekTrend > 0 ? "default" : "destructive"} className="flex items-center gap-1">
                  {weekTrend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(weekTrend)}%
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Revenue</span>
              <div className="flex items-center gap-2">
                <span className="font-bold">{formatCurrency(weekRevenue)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Entries</span>
              <span className="font-bold">{weekEntries.length}</span>
            </div>

            <Progress value={(weekHours / 40) * 100} />
            <p className="text-xs text-muted-foreground text-right">
              {((weekHours / 40) * 100).toFixed(0)}% of 40h goal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>This Month</CardTitle>
            <CardDescription>Performance metrics for current month</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Hours Tracked</span>
              <div className="flex items-center gap-2">
                <span className="font-bold">{monthHours.toFixed(1)}h</span>
                <Badge variant={monthTrend > 0 ? "default" : "destructive"} className="flex items-center gap-1">
                  {monthTrend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(monthTrend)}%
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Revenue</span>
              <div className="flex items-center gap-2">
                <span className="font-bold">{formatCurrency(monthRevenue)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Entries</span>
              <span className="font-bold">{monthEntries.length}</span>
            </div>

            <Progress value={(monthHours / 160) * 100} />
            <p className="text-xs text-muted-foreground text-right">
              {((monthHours / 160) * 100).toFixed(0)}% of 160h goal
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Projects */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Top Projects
          </CardTitle>
          <CardDescription>Most time spent on these projects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topProjects.map((project, index) => (
              <div key={project.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{project.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {project.entries} entries
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatDuration(project.time)}</div>
                  {project.revenue > 0 && (
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(project.revenue)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity Heatmap (simplified) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Activity Overview
          </CardTitle>
          <CardDescription>Time tracking activity over the past week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => {
              const dayEntries = weekEntries.filter(e => {
                const date = new Date(e.startTime);
                return date.getDay() === index;
              });
              const dayHours = dayEntries.reduce((sum, e) => sum + e.duration, 0) / 3600;
              const intensity = Math.min(dayHours / 8, 1);
              
              return (
                <div key={day} className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">{day}</div>
                  <div 
                    className="h-12 rounded-md flex items-center justify-center text-sm font-medium"
                    style={{
                      backgroundColor: dayHours > 0 
                        ? `rgba(var(--primary-rgb), ${intensity * 0.3 + 0.1})`
                        : 'var(--muted)',
                      color: intensity > 0.5 ? 'var(--primary-foreground)' : 'inherit'
                    }}
                  >
                    {dayHours > 0 ? `${dayHours.toFixed(1)}h` : '-'}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}