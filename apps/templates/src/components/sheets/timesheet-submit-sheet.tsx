"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@midday/ui/sheet";
import { Button } from "@midday/ui/button";
import { Textarea } from "@midday/ui/textarea";
import { Label } from "@midday/ui/label";
import { Badge } from "@midday/ui/badge";
import { Separator } from "@midday/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@midday/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { 
  Send, 
  CheckCircle, 
  Clock,
  DollarSign,
  Calendar,
  User,
  FileText,
  AlertCircle,
  Eye,
  Edit,
  Briefcase,
  Tag
} from "lucide-react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import type { MockTimesheet } from "@/lib/mock/time-mock";

type Props = {
  timesheet: MockTimesheet | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (timesheetId: string) => void;
  onApprove?: (timesheetId: string) => void;
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

export function TimesheetSubmitSheet({ 
  timesheet, 
  open, 
  onOpenChange, 
  onSubmit,
  onApprove 
}: Props) {
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!timesheet) return null;

  const weekStart = new Date(timesheet.weekStarting);
  const weekEnd = endOfWeek(weekStart);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Group entries by day
  const entriesByDay = timesheet.entries.reduce((acc, entry) => {
    if (!acc[entry.date]) {
      acc[entry.date] = [];
    }
    acc[entry.date].push(entry);
    return acc;
  }, {} as Record<string, typeof timesheet.entries>);

  // Calculate summary stats
  const totalRevenue = timesheet.entries
    .filter(e => e.billable)
    .reduce((sum, e) => sum + (e.duration / 60) * e.hourlyRate, 0);

  const clientBreakdown = timesheet.entries.reduce((acc, entry) => {
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

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(timesheet.id);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!onApprove) return;
    
    setIsSubmitting(true);
    try {
      await onApprove(timesheet.id);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = !timesheet.submittedAt && timesheet.totalHours > 0;
  const canApprove = timesheet.submittedAt && !timesheet.approved && onApprove;
  const isApproved = timesheet.approved;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[800px] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Timesheet Details
              </SheetTitle>
              <SheetDescription>
                Week of {format(weekStart, 'MMM dd')} - {format(weekEnd, 'MMM dd, yyyy')}
              </SheetDescription>
            </div>
            
            <div className="flex items-center gap-2">
              {isApproved ? (
                <Badge variant="default" className="gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Approved
                </Badge>
              ) : timesheet.submittedAt ? (
                <Badge variant="secondary" className="gap-1">
                  <Send className="h-3 w-3" />
                  Submitted
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1">
                  <Edit className="h-3 w-3" />
                  Draft
                </Badge>
              )}
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Total Hours</span>
                </div>
                <div className="text-2xl font-bold">{timesheet.totalHours.toFixed(1)}h</div>
                <div className="text-xs text-muted-foreground">
                  {timesheet.entries.length} entries
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Billable Hours</span>
                </div>
                <div className="text-2xl font-bold">{timesheet.totalBillable.toFixed(1)}h</div>
                <div className="text-xs text-muted-foreground">
                  {((timesheet.totalBillable / timesheet.totalHours) * 100).toFixed(0)}% of total
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Revenue</span>
                </div>
                <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">
                  Avg ${timesheet.totalBillable > 0 ? (totalRevenue / timesheet.totalBillable).toFixed(0) : 0}/h
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Daily Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Daily Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
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
                            <span>{dayEntries.length}</span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
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
            </CardContent>
          </Card>

          {/* Client Breakdown */}
          {Object.keys(clientBreakdown).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Client Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(clientBreakdown).map(([client, stats]) => (
                    <div key={client} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{client}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{formatDuration(stats.totalTime)}</span>
                        <span>{formatDuration(stats.billableTime)} billable</span>
                        <span>${stats.revenue.toFixed(2)}</span>
                        <span>{stats.entries} entries</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Time Entries List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Time Entries ({timesheet.entries.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {timesheet.entries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{entry.description}</div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(entry.date), 'MMM dd')}
                        <Clock className="h-3 w-3 ml-2" />
                        {format(new Date(entry.startTime), 'HH:mm')}
                        {entry.endTime && ` - ${format(new Date(entry.endTime), 'HH:mm')}`}
                        {entry.projectName && (
                          <>
                            <Briefcase className="h-3 w-3 ml-2" />
                            {entry.projectName}
                          </>
                        )}
                        {entry.tags && entry.tags.length > 0 && (
                          <>
                            <Tag className="h-3 w-3 ml-2" />
                            {entry.tags.join(', ')}
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{formatDuration(entry.duration)}</span>
                      {entry.billable ? (
                        <Badge variant="default" className="text-xs">
                          <DollarSign className="h-3 w-3 mr-1" />
                          ${((entry.duration / 60) * entry.hourlyRate).toFixed(2)}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Non-billable
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Status Information */}
          {timesheet.submittedAt && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Send className="h-4 w-4" />
                    <span>Submitted on {format(new Date(timesheet.submittedAt), 'MMM dd, yyyy \'at\' HH:mm')}</span>
                  </div>
                  
                  {timesheet.approved && timesheet.approvedAt && timesheet.approvedBy && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>
                        Approved by {timesheet.approvedBy} on {format(new Date(timesheet.approvedAt), 'MMM dd, yyyy \'at\' HH:mm')}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comments */}
          {(canSubmit || canApprove) && (
            <div>
              <Label htmlFor="comments">Comments (Optional)</Label>
              <Textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder={canSubmit ? "Add any notes for the reviewer..." : "Add approval comments..."}
                rows={3}
              />
            </div>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            
            <div className="flex gap-2">
              {canSubmit && (
                <Button 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  {isSubmitting ? "Submitting..." : "Submit Timesheet"}
                </Button>
              )}
              
              {canApprove && (
                <Button 
                  onClick={handleApprove}
                  disabled={isSubmitting}
                  className="gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  {isSubmitting ? "Approving..." : "Approve Timesheet"}
                </Button>
              )}
              
              {!canSubmit && !canApprove && !isApproved && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  Awaiting approval
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}