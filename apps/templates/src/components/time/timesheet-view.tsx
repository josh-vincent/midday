"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { Button } from "@midday/ui/button";
import { Badge } from "@midday/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@midday/ui/table";
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  CheckCircle, 
  Send, 
  Eye,
  AlertCircle,
  User,
  FileText
} from "lucide-react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import type { MockTimesheet } from "@/lib/mock/time-mock";

type Props = {
  timesheets: MockTimesheet[];
  onSubmit: (timesheet: MockTimesheet) => void;
  onView: (timesheet: MockTimesheet) => void;
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

export function TimesheetView({ timesheets, onSubmit, onView }: Props) {
  const getTimesheetStatus = (timesheet: MockTimesheet) => {
    if (timesheet.approved) return { status: "approved", label: "Approved", variant: "default" as const, icon: CheckCircle };
    if (timesheet.submittedAt) return { status: "submitted", label: "Submitted", variant: "secondary" as const, icon: Send };
    return { status: "draft", label: "Draft", variant: "outline" as const, icon: FileText };
  };

  const canSubmit = (timesheet: MockTimesheet) => {
    return !timesheet.submittedAt && timesheet.totalHours > 0;
  };

  // Group timesheets by user
  const timesheetsByUser = timesheets.reduce((acc, timesheet) => {
    if (!acc[timesheet.userId]) {
      acc[timesheet.userId] = [];
    }
    acc[timesheet.userId].push(timesheet);
    return acc;
  }, {} as Record<string, MockTimesheet[]>);

  return (
    <div className="space-y-6">
      {/* Current Week Timesheet */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Current Week Timesheet
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            const now = new Date();
            const weekStart = startOfWeek(now);
            const weekEnd = endOfWeek(now);
            const currentWeekKey = format(weekStart, 'yyyy-MM-dd');
            
            const currentTimesheet = timesheets.find(t => t.weekStarting === currentWeekKey);
            
            if (!currentTimesheet) {
              return (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No timesheet for current week</p>
                  <p className="text-sm">Start tracking time to create your timesheet</p>
                </div>
              );
            }

            const statusInfo = getTimesheetStatus(currentTimesheet);
            const StatusIcon = statusInfo.icon;
            const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

            // Group entries by day
            const entriesByDay = currentTimesheet.entries.reduce((acc, entry) => {
              if (!acc[entry.date]) {
                acc[entry.date] = [];
              }
              acc[entry.date].push(entry);
              return acc;
            }, {} as Record<string, typeof currentTimesheet.entries>);

            return (
              <div className="space-y-4">
                {/* Timesheet Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">
                      Week of {format(weekStart, 'MMM dd')} - {format(weekEnd, 'MMM dd, yyyy')}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span>{currentTimesheet.totalHours.toFixed(1)} hours total</span>
                      <span>{currentTimesheet.totalBillable.toFixed(1)} hours billable</span>
                      <span>${(currentTimesheet.entries.filter(e => e.billable).reduce((sum, e) => sum + (e.duration / 60) * e.hourlyRate, 0)).toFixed(2)} revenue</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={statusInfo.variant} className="gap-1">
                      <StatusIcon className="h-3 w-3" />
                      {statusInfo.label}
                    </Badge>
                    
                    {canSubmit(currentTimesheet) && (
                      <Button size="sm" onClick={() => onSubmit(currentTimesheet)}>
                        <Send className="h-4 w-4 mr-2" />
                        Submit
                      </Button>
                    )}
                    
                    <Button size="sm" variant="outline" onClick={() => onView(currentTimesheet)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </div>
                </div>

                {/* Daily Breakdown */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Day</TableHead>
                      <TableHead>Entries</TableHead>
                      <TableHead>Total Time</TableHead>
                      <TableHead>Billable</TableHead>
                      <TableHead>Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {weekDays.map((day) => {
                      const dayKey = format(day, 'yyyy-MM-dd');
                      const dayEntries = entriesByDay[dayKey] || [];
                      const totalTime = dayEntries.reduce((sum, e) => sum + e.duration, 0);
                      const billableTime = dayEntries.filter(e => e.billable).reduce((sum, e) => sum + e.duration, 0);
                      const revenue = dayEntries.filter(e => e.billable).reduce((sum, e) => sum + (e.duration / 60) * e.hourlyRate, 0);
                      
                      return (
                        <TableRow key={dayKey}>
                          <TableCell className="font-medium">
                            {format(day, 'EEE, MMM dd')}
                          </TableCell>
                          <TableCell>
                            {dayEntries.length > 0 ? (
                              <div className="text-sm">
                                {dayEntries.length} {dayEntries.length === 1 ? 'entry' : 'entries'}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">No entries</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {totalTime > 0 ? formatDuration(totalTime) : '—'}
                          </TableCell>
                          <TableCell>
                            {billableTime > 0 ? formatDuration(billableTime) : '—'}
                          </TableCell>
                          <TableCell>
                            {revenue > 0 ? `$${revenue.toFixed(2)}` : '—'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* All Timesheets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            All Timesheets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(timesheetsByUser).map(([userId, userTimesheets]) => (
              <div key={userId} className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  User {userId.replace('user_', '')}
                </h4>
                
                <div className="grid gap-3">
                  {userTimesheets.map((timesheet) => {
                    const statusInfo = getTimesheetStatus(timesheet);
                    const StatusIcon = statusInfo.icon;
                    const weekStart = new Date(timesheet.weekStarting);
                    const weekEnd = endOfWeek(weekStart);
                    
                    return (
                      <div key={timesheet.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">
                              Week of {format(weekStart, 'MMM dd')} - {format(weekEnd, 'MMM dd, yyyy')}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {timesheet.totalHours.toFixed(1)}h
                              </span>
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                {timesheet.totalBillable.toFixed(1)}h billable
                              </span>
                              <span>{timesheet.entries.length} entries</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge variant={statusInfo.variant} className="gap-1">
                              <StatusIcon className="h-3 w-3" />
                              {statusInfo.label}
                            </Badge>
                            
                            {canSubmit(timesheet) && (
                              <Button size="sm" onClick={() => onSubmit(timesheet)}>
                                <Send className="h-4 w-4 mr-2" />
                                Submit
                              </Button>
                            )}
                            
                            <Button size="sm" variant="outline" onClick={() => onView(timesheet)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </div>
                        </div>
                        
                        {/* Status Details */}
                        {timesheet.submittedAt && (
                          <div className="text-sm text-muted-foreground">
                            Submitted on {format(new Date(timesheet.submittedAt), 'MMM dd, yyyy')}
                            {timesheet.approved && timesheet.approvedAt && (
                              <span className="ml-2">
                                • Approved on {format(new Date(timesheet.approvedAt), 'MMM dd, yyyy')}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            
            {timesheets.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No timesheets available</p>
                <p className="text-sm">Timesheets will appear here once you start tracking time</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}