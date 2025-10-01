"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { Badge } from "@midday/ui/badge";
import { Button } from "@midday/ui/button";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@midday/ui/table";
import { Download, FileText, Filter } from "lucide-react";
import { format, startOfWeek, endOfWeek } from "date-fns";
import type { TimeEntry } from "@/lib/mock/tracker-mock";

interface TrackerReportProps {
  entries: TimeEntry[];
  projects?: any[];
  jobs?: any[];
  groupBy: "project" | "job" | "date";
}

export function TrackerReport({ 
  entries, 
  projects = [], 
  jobs = [],
  groupBy 
}: TrackerReportProps) {
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

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || "Unknown Project";
  };

  const getJobTitle = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    return job?.title || "Unknown Job";
  };

  // Group entries based on groupBy parameter
  const groupedData = new Map();
  
  entries.forEach(entry => {
    let key;
    let label;
    
    switch (groupBy) {
      case "project":
        key = entry.projectId;
        label = getProjectName(entry.projectId);
        break;
      case "job":
        key = entry.jobId;
        label = getJobTitle(entry.jobId);
        break;
      case "date":
        key = new Date(entry.startTime).toDateString();
        label = format(new Date(entry.startTime), "EEEE, MMMM d, yyyy");
        break;
      default:
        key = "all";
        label = "All Entries";
    }
    
    const existing = groupedData.get(key) || {
      label,
      entries: [],
      totalTime: 0,
      billableTime: 0,
      nonBillableTime: 0,
      revenue: 0,
      count: 0
    };
    
    existing.entries.push(entry);
    existing.count += 1;
    existing.totalTime += entry.duration;
    
    if (entry.billable) {
      existing.billableTime += entry.duration;
      if (entry.rate) {
        existing.revenue += (entry.duration / 3600) * entry.rate;
      }
    } else {
      existing.nonBillableTime += entry.duration;
    }
    
    groupedData.set(key, existing);
  });

  // Convert to array and sort
  const reportData = Array.from(groupedData.values()).sort((a, b) => {
    if (groupBy === "date") {
      return new Date(b.entries[0].startTime).getTime() - new Date(a.entries[0].startTime).getTime();
    }
    return b.totalTime - a.totalTime;
  });

  // Calculate totals
  const totals = {
    totalTime: entries.reduce((sum, e) => sum + e.duration, 0),
    billableTime: entries.filter(e => e.billable).reduce((sum, e) => sum + e.duration, 0),
    nonBillableTime: entries.filter(e => !e.billable).reduce((sum, e) => sum + e.duration, 0),
    revenue: entries
      .filter(e => e.billable && e.rate)
      .reduce((sum, e) => sum + (e.duration / 3600 * (e.rate || 0)), 0),
    count: entries.length
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    // Mock export functionality
    console.log(`Exporting report as ${format}`);
  };

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Time Tracking Report</CardTitle>
              <CardDescription>
                Grouped by {groupBy === "project" ? "Project" : groupBy === "job" ? "Job" : "Date"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
                <FileText className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Total Time</div>
              <div className="text-xl font-bold">{formatDuration(totals.totalTime)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Billable</div>
              <div className="text-xl font-bold text-green-600">
                {formatDuration(totals.billableTime)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Non-Billable</div>
              <div className="text-xl font-bold text-orange-600">
                {formatDuration(totals.nonBillableTime)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Revenue</div>
              <div className="text-xl font-bold text-green-600">
                {formatCurrency(totals.revenue)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Entries</div>
              <div className="text-xl font-bold">{totals.count}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  {groupBy === "project" ? "Project" : groupBy === "job" ? "Job" : "Date"}
                </TableHead>
                <TableHead className="text-right">Entries</TableHead>
                <TableHead className="text-right">Total Time</TableHead>
                <TableHead className="text-right">Billable</TableHead>
                <TableHead className="text-right">Non-Billable</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Utilization</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.map((group, index) => {
                const utilization = group.totalTime > 0 
                  ? (group.billableTime / group.totalTime) * 100 
                  : 0;
                
                return (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {group.label}
                    </TableCell>
                    <TableCell className="text-right">
                      {group.count}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatDuration(group.totalTime)}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      {formatDuration(group.billableTime)}
                    </TableCell>
                    <TableCell className="text-right text-orange-600">
                      {formatDuration(group.nonBillableTime)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(group.revenue)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={utilization >= 80 ? "default" : utilization >= 50 ? "secondary" : "destructive"}>
                        {utilization.toFixed(0)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
              
              {/* Totals Row */}
              <TableRow className="font-bold bg-muted/50">
                <TableCell>Total</TableCell>
                <TableCell className="text-right">{totals.count}</TableCell>
                <TableCell className="text-right">{formatDuration(totals.totalTime)}</TableCell>
                <TableCell className="text-right text-green-600">
                  {formatDuration(totals.billableTime)}
                </TableCell>
                <TableCell className="text-right text-orange-600">
                  {formatDuration(totals.nonBillableTime)}
                </TableCell>
                <TableCell className="text-right">{formatCurrency(totals.revenue)}</TableCell>
                <TableCell className="text-right">
                  <Badge>
                    {totals.totalTime > 0 
                      ? ((totals.billableTime / totals.totalTime) * 100).toFixed(0)
                      : 0}%
                  </Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detailed Breakdown */}
      {groupBy !== "date" && (
        <Card>
          <CardHeader>
            <CardTitle>Entry Details</CardTitle>
            <CardDescription>Individual time entries breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.slice(0, 5).map((group, groupIndex) => (
                <div key={groupIndex} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">{group.label}</h4>
                    <Badge variant="outline">
                      {group.count} entries
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {group.entries.slice(0, 3).map(entry => (
                      <div key={entry.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">
                            {format(new Date(entry.startTime), "MMM d, h:mm a")}
                          </span>
                          {entry.description && (
                            <span className="truncate max-w-[200px]">
                              {entry.description}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span>{formatDuration(entry.duration)}</span>
                          {entry.billable && (
                            <Badge variant="secondary" className="text-xs">
                              Billable
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                    {group.entries.length > 3 && (
                      <div className="text-sm text-muted-foreground">
                        +{group.entries.length - 3} more entries
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}