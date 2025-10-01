"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { Progress } from "@midday/ui/progress";
import { Badge } from "@midday/ui/badge";
import { 
  Clock, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Target,
  BarChart3,
  PieChart,
  Activity
} from "lucide-react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isWithinInterval } from "date-fns";
import type { MockTimeEntry, MockTimer } from "@/lib/mock/time-mock";

type Props = {
  entries: MockTimeEntry[];
  timers: MockTimer[];
};

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins}m`;
  }
  
  if (mins === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${mins}m`;
}

export function TimeStats({ entries, timers }: Props) {
  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Filter entries for different time periods
  const todayEntries = entries.filter(e => e.date === format(now, 'yyyy-MM-dd'));
  const weekEntries = entries.filter(e => {
    const entryDate = new Date(e.date);
    return isWithinInterval(entryDate, { start: weekStart, end: weekEnd });
  });
  const monthEntries = entries.filter(e => {
    const entryDate = new Date(e.date);
    return entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();
  });

  // Calculate statistics
  const todayStats = {
    totalTime: todayEntries.reduce((sum, e) => sum + e.duration, 0),
    billableTime: todayEntries.filter(e => e.billable).reduce((sum, e) => sum + e.duration, 0),
    revenue: todayEntries.filter(e => e.billable).reduce((sum, e) => sum + (e.duration / 60) * e.hourlyRate, 0),
    entries: todayEntries.length,
  };

  const weekStats = {
    totalTime: weekEntries.reduce((sum, e) => sum + e.duration, 0),
    billableTime: weekEntries.filter(e => e.billable).reduce((sum, e) => sum + e.duration, 0),
    revenue: weekEntries.filter(e => e.billable).reduce((sum, e) => sum + (e.duration / 60) * e.hourlyRate, 0),
    entries: weekEntries.length,
    avgDaily: weekEntries.reduce((sum, e) => sum + e.duration, 0) / 7,
  };

  const monthStats = {
    totalTime: monthEntries.reduce((sum, e) => sum + e.duration, 0),
    billableTime: monthEntries.filter(e => e.billable).reduce((sum, e) => sum + e.duration, 0),
    revenue: monthEntries.filter(e => e.billable).reduce((sum, e) => sum + (e.duration / 60) * e.hourlyRate, 0),
    entries: monthEntries.length,
  };

  // Client breakdown
  const clientStats = entries.reduce((acc, entry) => {
    if (!acc[entry.clientName]) {
      acc[entry.clientName] = {
        totalTime: 0,
        billableTime: 0,
        revenue: 0,
        entries: 0,
      };
    }
    acc[entry.clientName].totalTime += entry.duration;
    acc[entry.clientName].entries += 1;
    if (entry.billable) {
      acc[entry.clientName].billableTime += entry.duration;
      acc[entry.clientName].revenue += (entry.duration / 60) * entry.hourlyRate;
    }
    return acc;
  }, {} as Record<string, { totalTime: number; billableTime: number; revenue: number; entries: number }>);

  const topClients = Object.entries(clientStats)
    .sort(([,a], [,b]) => b.totalTime - a.totalTime)
    .slice(0, 5);

  // Daily breakdown for this week
  const dailyBreakdown = weekDays.map(day => {
    const dayKey = format(day, 'yyyy-MM-dd');
    const dayEntries = entries.filter(e => e.date === dayKey);
    const totalTime = dayEntries.reduce((sum, e) => sum + e.duration, 0);
    const billableTime = dayEntries.filter(e => e.billable).reduce((sum, e) => sum + e.duration, 0);
    
    return {
      day: format(day, 'EEE'),
      date: day,
      totalTime,
      billableTime,
      entries: dayEntries.length,
      utilization: totalTime > 0 ? (totalTime / 480) * 100 : 0, // 8 hours = 480 minutes
    };
  });

  const utilizationTarget = 80; // 80% of 8-hour day
  const avgUtilization = dailyBreakdown.reduce((sum, day) => sum + day.utilization, 0) / 7;

  return (
    <div className="space-y-6">
      {/* Time Period Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Today */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              Today
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Time</span>
                <span className="font-medium">{formatDuration(todayStats.totalTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Billable</span>
                <span className="font-medium">{formatDuration(todayStats.billableTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Revenue</span>
                <span className="font-medium">${todayStats.revenue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Entries</span>
                <span className="font-medium">{todayStats.entries}</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Billable Ratio</span>
                <span>{todayStats.totalTime > 0 ? ((todayStats.billableTime / todayStats.totalTime) * 100).toFixed(0) : 0}%</span>
              </div>
              <Progress 
                value={todayStats.totalTime > 0 ? (todayStats.billableTime / todayStats.totalTime) * 100 : 0} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* This Week */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-500" />
              This Week
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Time</span>
                <span className="font-medium">{formatDuration(weekStats.totalTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Billable</span>
                <span className="font-medium">{formatDuration(weekStats.billableTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Revenue</span>
                <span className="font-medium">${weekStats.revenue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Avg Daily</span>
                <span className="font-medium">{formatDuration(weekStats.avgDaily)}</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Weekly Goal (40h)</span>
                <span>{((weekStats.totalTime / 60) / 40 * 100).toFixed(0)}%</span>
              </div>
              <Progress 
                value={(weekStats.totalTime / 60) / 40 * 100} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* This Month */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Time</span>
                <span className="font-medium">{formatDuration(monthStats.totalTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Billable</span>
                <span className="font-medium">{formatDuration(monthStats.billableTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Revenue</span>
                <span className="font-medium">${monthStats.revenue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Entries</span>
                <span className="font-medium">{monthStats.entries}</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Avg Rate</span>
                <span>${monthStats.billableTime > 0 ? (monthStats.revenue / (monthStats.billableTime / 60)).toFixed(0) : 0}/h</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Weekly Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dailyBreakdown.map((day) => (
              <div key={day.day} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium w-12">{day.day}</span>
                    <Badge variant={day.utilization >= utilizationTarget ? "default" : "secondary"}>
                      {day.utilization.toFixed(0)}%
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDuration(day.totalTime)} 
                    {day.billableTime > 0 && (
                      <span className="text-green-600 ml-2">
                        ({formatDuration(day.billableTime)} billable)
                      </span>
                    )}
                  </div>
                </div>
                <Progress value={day.utilization} className="h-2" />
              </div>
            ))}
            
            <div className="pt-2 border-t">
              <div className="flex justify-between text-sm">
                <span>Average Utilization</span>
                <span className={avgUtilization >= utilizationTarget ? "text-green-600" : "text-yellow-600"}>
                  {avgUtilization.toFixed(0)}% (Target: {utilizationTarget}%)
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Clients */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Top Clients
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topClients.map(([client, stats]) => {
              const percentage = (stats.totalTime / entries.reduce((sum, e) => sum + e.duration, 0)) * 100;
              
              return (
                <div key={client} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{client}</span>
                    <div className="text-sm text-muted-foreground">
                      {formatDuration(stats.totalTime)} • ${stats.revenue.toFixed(0)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={percentage} className="flex-1 h-2" />
                    <span className="text-sm text-muted-foreground w-12">
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Active Timers Summary */}
      {timers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-red-500" />
              Active Timers ({timers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {timers.map((timer) => (
                <div key={timer.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{timer.description}</div>
                    <div className="text-sm text-muted-foreground">
                      Started {format(new Date(timer.startTime), 'HH:mm')}
                      {timer.isPaused && " • Paused"}
                    </div>
                  </div>
                  <Badge variant={timer.isPaused ? "secondary" : "default"}>
                    {timer.isPaused ? "Paused" : "Running"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}