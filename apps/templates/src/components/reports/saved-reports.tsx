"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { Button } from "@midday/ui/button";
import { Badge } from "@midday/ui/badge";
import { Skeleton } from "@midday/ui/skeleton";
import { Input } from "@midday/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@midday/ui/alert-dialog";
import { 
  FileText, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Download, 
  Calendar, 
  Trash,
  Search,
  Filter,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import type { MockReport } from "@/lib/mock/reports-mock";

type Props = {
  reports: MockReport[];
  loading?: boolean;
  onViewReport: (report: MockReport) => void;
  onEditReport: (report: MockReport) => void;
  onDeleteReport: (reportId: string) => void;
  onExportReport: (reportId: string, format: "pdf" | "excel" | "csv") => void;
  onScheduleReport: (report: MockReport) => void;
};

const reportTypeLabels = {
  revenue: "Revenue",
  expenses: "Expenses", 
  "profit-loss": "P&L",
  cashflow: "Cash Flow",
  client: "Client",
  project: "Project",
  time: "Time",
};

const statusColors = {
  draft: "bg-gray-100 text-gray-700",
  active: "bg-green-100 text-green-700",
  archived: "bg-yellow-100 text-yellow-700",
};

const statusIcons = {
  draft: <Edit className="h-3 w-3" />,
  active: <CheckCircle className="h-3 w-3" />,
  archived: <AlertCircle className="h-3 w-3" />,
};

export function SavedReports({
  reports,
  loading = false,
  onViewReport,
  onEditReport,
  onDeleteReport,
  onExportReport,
  onScheduleReport,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [deleteReportId, setDeleteReportId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-8 w-8" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         reportTypeLabels[report.type].toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || report.status === statusFilter;
    const matchesType = !typeFilter || report.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const uniqueTypes = Array.from(new Set(reports.map(r => r.type)));
  const uniqueStatuses = Array.from(new Set(reports.map(r => r.status)));

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Saved Reports</h3>
          <Badge variant="outline">
            {filteredReports.length} of {reports.length}
          </Badge>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Type
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setTypeFilter("")}>
                All Types
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {uniqueTypes.map((type) => (
                <DropdownMenuItem 
                  key={type} 
                  onClick={() => setTypeFilter(type)}
                >
                  {reportTypeLabels[type]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setStatusFilter("")}>
                All Statuses
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {uniqueStatuses.map((status) => (
                <DropdownMenuItem 
                  key={status} 
                  onClick={() => setStatusFilter(status)}
                >
                  <div className="flex items-center space-x-2">
                    {statusIcons[status as keyof typeof statusIcons]}
                    <span className="capitalize">{status}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-3">
        {filteredReports.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No reports found</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter || typeFilter
                  ? "Try adjusting your filters"
                  : "Create your first report to get started"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredReports.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <h4 className="font-medium">{report.name}</h4>
                      <Badge 
                        variant="outline" 
                        className={statusColors[report.status as keyof typeof statusColors]}
                      >
                        <div className="flex items-center space-x-1">
                          {statusIcons[report.status as keyof typeof statusIcons]}
                          <span className="capitalize">{report.status}</span>
                        </div>
                      </Badge>
                      <Badge variant="secondary">
                        {reportTypeLabels[report.type]}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {format(new Date(report.generatedAt), "MMM dd, yyyy")}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span className="capitalize">{report.frequency}</span>
                      </div>
                      {report.scheduled && (
                        <Badge variant="outline" className="text-xs">
                          Scheduled
                        </Badge>
                      )}
                      {report.recipients.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {report.recipients.length} recipients
                        </Badge>
                      )}
                    </div>

                    {report.lastGenerated && (
                      <p className="text-xs text-muted-foreground">
                        Last generated: {format(new Date(report.lastGenerated), "MMM dd, yyyy 'at' h:mm a")}
                      </p>
                    )}
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewReport(report)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Report
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEditReport(report)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onExportReport(report.id, "pdf")}>
                        <Download className="h-4 w-4 mr-2" />
                        Export as PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onExportReport(report.id, "excel")}>
                        <Download className="h-4 w-4 mr-2" />
                        Export as Excel
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onExportReport(report.id, "csv")}>
                        <Download className="h-4 w-4 mr-2" />
                        Export as CSV
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onScheduleReport(report)}>
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => setDeleteReportId(report.id)}
                        className="text-red-600"
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteReportId} onOpenChange={() => setDeleteReportId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this report? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteReportId) {
                  onDeleteReport(deleteReportId);
                  setDeleteReportId(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}