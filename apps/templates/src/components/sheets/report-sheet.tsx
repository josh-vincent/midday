"use client";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@midday/ui/sheet";
import { Button } from "@midday/ui/button";
import { Badge } from "@midday/ui/badge";
import { Separator } from "@midday/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { ScrollArea } from "@midday/ui/scroll-area";
import { format } from "date-fns";
import { 
  Download, 
  Calendar, 
  Share,
  Clock,
  FileText,
  Users,
  Settings,
  Trash,
  Eye,
  BarChart3,
  PieChart,
  TrendingUp
} from "lucide-react";
import { cn } from "@midday/ui/cn";
import type { MockReport } from "@/lib/mock/reports-mock";

type Props = {
  report: MockReport | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport?: (reportId: string, format: "pdf" | "excel" | "csv") => void;
  onSchedule?: (report: MockReport) => void;
  onDelete?: (reportId: string) => void;
};

const reportTypeConfig = {
  revenue: { 
    label: "Revenue Report", 
    icon: TrendingUp, 
    color: "text-green-600",
    description: "Analysis of revenue streams and growth trends"
  },
  expenses: { 
    label: "Expense Report", 
    icon: PieChart, 
    color: "text-red-600",
    description: "Breakdown of expenses by category and trends"
  },
  "profit-loss": { 
    label: "Profit & Loss", 
    icon: BarChart3, 
    color: "text-blue-600",
    description: "Comprehensive profit and loss statement"
  },
  cashflow: { 
    label: "Cash Flow Report", 
    icon: BarChart3, 
    color: "text-purple-600",
    description: "Cash flow analysis and projections"
  },
  client: { 
    label: "Client Analysis", 
    icon: Users, 
    color: "text-orange-600",
    description: "Client performance and relationship metrics"
  },
  project: { 
    label: "Project Report", 
    icon: FileText, 
    color: "text-indigo-600",
    description: "Project profitability and progress analysis"
  },
  time: { 
    label: "Time Analysis", 
    icon: Clock, 
    color: "text-emerald-600",
    description: "Time utilization and efficiency metrics"
  },
};

const statusConfig = {
  draft: { label: "Draft", variant: "secondary" as const, color: "bg-gray-100 text-gray-700" },
  active: { label: "Active", variant: "default" as const, color: "bg-green-100 text-green-700" },
  archived: { label: "Archived", variant: "outline" as const, color: "bg-yellow-100 text-yellow-700" },
};

export function ReportSheet({ 
  report, 
  open, 
  onOpenChange,
  onExport,
  onSchedule,
  onDelete,
}: Props) {
  if (!report) return null;

  const typeConfig = reportTypeConfig[report.type];
  const Icon = typeConfig.icon;
  const status = statusConfig[report.status as keyof typeof statusConfig];

  const formatCurrency = (value: number) => {
    return `$${(value / 1000).toFixed(0)}K`;
  };

  const getDataSummary = () => {
    // Generate summary based on report type and data
    switch (report.type) {
      case "revenue":
        if (report.data?.monthly) {
          const totalRevenue = report.data.monthly.reduce((sum: number, item: any) => sum + item.revenue, 0);
          const avgRevenue = totalRevenue / report.data.monthly.length;
          return {
            title: "Revenue Summary",
            metrics: [
              { label: "Total Revenue", value: formatCurrency(totalRevenue) },
              { label: "Average Monthly", value: formatCurrency(avgRevenue) },
              { label: "Data Points", value: report.data.monthly.length.toString() },
            ],
          };
        }
        break;
      case "expenses":
        if (report.data?.byCategory) {
          const totalExpenses = report.data.byCategory.reduce((sum: number, item: any) => sum + item.amount, 0);
          const categories = report.data.byCategory.length;
          return {
            title: "Expense Summary",
            metrics: [
              { label: "Total Expenses", value: formatCurrency(totalExpenses) },
              { label: "Categories", value: categories.toString() },
              { label: "Largest Category", value: report.data.byCategory[0]?.category || "N/A" },
            ],
          };
        }
        break;
      case "client":
        if (report.data?.topClients) {
          const totalClients = report.data.topClients.length;
          const totalRevenue = report.data.topClients.reduce((sum: number, item: any) => sum + item.revenue, 0);
          return {
            title: "Client Summary",
            metrics: [
              { label: "Total Clients", value: totalClients.toString() },
              { label: "Total Revenue", value: formatCurrency(totalRevenue) },
              { label: "Top Client", value: report.data.topClients[0]?.name || "N/A" },
            ],
          };
        }
        break;
      default:
        return {
          title: "Report Summary",
          metrics: [
            { label: "Status", value: status.label },
            { label: "Format", value: report.format.toUpperCase() },
            { label: "Generated", value: format(new Date(report.generatedAt), "MMM dd, yyyy") },
          ],
        };
    }

    return {
      title: "Report Summary",
      metrics: [
        { label: "Status", value: status.label },
        { label: "Format", value: report.format.toUpperCase() },
        { label: "Generated", value: format(new Date(report.generatedAt), "MMM dd, yyyy") },
      ],
    };
  };

  const dataSummary = getDataSummary();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] overflow-hidden flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center space-x-2">
            <Icon className={cn("h-5 w-5", typeConfig.color)} />
            <span>Report Details</span>
          </SheetTitle>
          <SheetDescription>
            View and manage your report
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 pr-6">
          <div className="space-y-6 pb-6">
            {/* Report Header */}
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold">{report.name}</h2>
                <p className="text-muted-foreground mt-1">{typeConfig.description}</p>
              </div>

              <div className="flex items-center space-x-2">
                <Badge variant={status.variant} className={status.color}>
                  {status.label}
                </Badge>
                <Badge variant="outline">
                  {typeConfig.label}
                </Badge>
                <Badge variant="outline">
                  {report.format.toUpperCase()}
                </Badge>
                {report.scheduled && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    <Calendar className="h-3 w-3 mr-1" />
                    Scheduled
                  </Badge>
                )}
              </div>
            </div>

            <Separator />

            {/* Report Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Created</p>
                <p className="font-medium">
                  {format(new Date(report.generatedAt), "MMMM dd, yyyy 'at' h:mm a")}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Frequency</p>
                <p className="font-medium capitalize">{report.frequency}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Date Range</p>
                <p className="font-medium">
                  {format(new Date(report.dateRange.from), "MMM dd")} - {" "}
                  {format(new Date(report.dateRange.to), "MMM dd, yyyy")}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Created By</p>
                <p className="font-medium">{report.createdBy}</p>
              </div>
              {report.lastGenerated && (
                <>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Last Generated</p>
                    <p className="font-medium">
                      {format(new Date(report.lastGenerated), "MMMM dd, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                </>
              )}
            </div>

            <Separator />

            {/* Data Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{dataSummary.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4">
                  {dataSummary.metrics.map((metric, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-muted-foreground">{metric.label}</span>
                      <span className="font-medium">{metric.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Filters */}
            {(report.filters.categories?.length > 0 || 
              report.filters.clients?.length > 0 || 
              report.filters.projects?.length > 0) && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Applied Filters</h3>
                  
                  {report.filters.categories?.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Categories</p>
                      <div className="flex flex-wrap gap-2">
                        {report.filters.categories.map((category) => (
                          <Badge key={category} variant="secondary">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {report.filters.clients?.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Clients</p>
                      <div className="flex flex-wrap gap-2">
                        {report.filters.clients.map((client) => (
                          <Badge key={client} variant="secondary">
                            {client}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {report.filters.projects?.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Projects</p>
                      <div className="flex flex-wrap gap-2">
                        {report.filters.projects.map((project) => (
                          <Badge key={project} variant="secondary">
                            {project}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Recipients */}
            {report.recipients.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="text-lg font-medium flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>Recipients ({report.recipients.length})</span>
                  </h3>
                  <div className="space-y-2">
                    {report.recipients.map((email, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span>{email}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="border-t pt-4 space-y-3">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExport?.(report.id, "pdf")}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExport?.(report.id, "excel")}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSchedule?.(report)}
              className="flex-1"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Schedule
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>

          <Separator />

          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              onDelete?.(report.id);
              onOpenChange(false);
            }}
            className="w-full"
          >
            <Trash className="h-4 w-4 mr-2" />
            Delete Report
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}