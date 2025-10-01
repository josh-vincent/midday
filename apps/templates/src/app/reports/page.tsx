"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { useToast } from "@midday/ui/use-toast";
import { Button } from "@midday/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  FolderOpen, 
  Clock,
  BarChart3,
  PieChart,
  Calendar,
  Download,
  Settings,
  Plus
} from "lucide-react";

// Components
import { ReportsHeader } from "@/components/reports-header";
import { MetricsGrid } from "@/components/reports/metrics-grid";
import { RevenueChart } from "@/components/reports/revenue-chart";
import { ExpenseChart } from "@/components/reports/expense-chart";
import { CashflowChart } from "@/components/reports/cashflow-chart";
import { ClientAnalytics } from "@/components/reports/client-analytics";
import { ProjectAnalytics } from "@/components/reports/project-analytics";
import { TimeAnalytics } from "@/components/reports/time-analytics";
import { ReportBuilder } from "@/components/reports/report-builder";
import { SavedReports } from "@/components/reports/saved-reports";

// Sheets
import { ReportSheet } from "@/components/sheets/report-sheet";
import { ReportBuilderSheet } from "@/components/sheets/report-builder-sheet";
import { ReportScheduleSheet } from "@/components/sheets/report-schedule-sheet";

// Mock data
import { 
  reportsAPI, 
  type MockReport, 
  type MockMetric, 
  type MockChartData 
} from "@/lib/mock/reports-mock";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  // State
  const [reports, setReports] = useState<MockReport[]>([]);
  const [metrics, setMetrics] = useState<MockMetric[]>([]);
  const [chartData, setChartData] = useState<Partial<MockChartData>>({});
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), 0, 1),
    to: new Date(),
  });

  // Sheet states
  const [selectedReport, setSelectedReport] = useState<MockReport | null>(null);
  const [showReportDetails, setShowReportDetails] = useState(false);
  const [showReportBuilder, setShowReportBuilder] = useState(false);
  const [showReportSchedule, setShowReportSchedule] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [reportsData, metricsData, revenueData, expensesData, cashflowData, clientsData, projectsData, timeData] = await Promise.all([
        reportsAPI.getReports(),
        reportsAPI.getMetrics(),
        reportsAPI.getChartData('revenue'),
        reportsAPI.getChartData('expenses'),
        reportsAPI.getChartData('cashflow'),
        reportsAPI.getChartData('clients'),
        reportsAPI.getChartData('projects'),
        reportsAPI.getChartData('time'),
      ]);

      setReports(reportsData);
      setMetrics(metricsData);
      setChartData({
        revenue: revenueData,
        expenses: expensesData,
        cashflow: cashflowData,
        clients: clientsData,
        projects: projectsData,
        time: timeData,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load reports data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Event handlers
  const handleGenerateReport = async (config: Partial<MockReport>) => {
    try {
      const report = await reportsAPI.generateReport(config);
      toast({
        title: "Report generated",
        description: `${report.name} has been generated successfully`,
      });
      await loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      });
    }
  };

  const handleExportReport = async (reportId: string, format: "pdf" | "excel" | "csv") => {
    try {
      const filename = await reportsAPI.exportReport(reportId, format);
      toast({
        title: "Export started",
        description: `Report is being exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export report",
        variant: "destructive",
      });
    }
  };

  const handleScheduleReport = async (reportId: string, schedule: string, recipients: string[]) => {
    try {
      await reportsAPI.scheduleReport(reportId, schedule, recipients);
      toast({
        title: "Report scheduled",
        description: "Report has been scheduled successfully",
      });
      setShowReportSchedule(false);
      await loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to schedule report",
        variant: "destructive",
      });
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      await reportsAPI.deleteReport(reportId);
      toast({
        title: "Report deleted",
        description: "Report has been deleted successfully",
      });
      await loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete report",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = () => {
    loadData();
  };

  const handleExportAll = () => {
    toast({
      title: "Export started",
      description: "All reports are being exported",
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <ReportsHeader
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onCreateReport={() => setShowReportBuilder(true)}
        onExportAll={handleExportAll}
        onRefresh={handleRefresh}
        isRefreshing={loading}
        totalReports={reports.length}
      />

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* Key Metrics */}
          <MetricsGrid metrics={metrics} loading={loading} />

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Revenue Trend</span>
                </CardTitle>
                <CardDescription>Monthly revenue and expenses</CardDescription>
              </CardHeader>
              <CardContent>
                <RevenueChart data={chartData.revenue?.monthly || []} loading={loading} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="h-5 w-5" />
                  <span>Expense Breakdown</span>
                </CardTitle>
                <CardDescription>Expenses by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ExpenseChart data={chartData.expenses?.byCategory || []} loading={loading} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Cash Flow</span>
                </CardTitle>
                <CardDescription>Monthly cash flow analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <CashflowChart data={chartData.cashflow?.monthly || []} loading={loading} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Top Clients</span>
                </CardTitle>
                <CardDescription>Revenue by client</CardDescription>
              </CardHeader>
              <CardContent>
                <ClientAnalytics 
                  data={chartData.clients?.topClients || []} 
                  loading={loading}
                  compact={true}
                />
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex-col space-y-2"
              onClick={() => setShowReportBuilder(true)}
            >
              <Plus className="h-6 w-6" />
              <span>Create Report</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col space-y-2"
              onClick={() => setActiveTab("reports")}
            >
              <Calendar className="h-6 w-6" />
              <span>Scheduled Reports</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col space-y-2"
              onClick={handleExportAll}
            >
              <Download className="h-6 w-6" />
              <span>Export All</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col space-y-2"
              onClick={() => setShowReportSchedule(true)}
            >
              <Settings className="h-6 w-6" />
              <span>Settings</span>
            </Button>
          </div>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Revenue Analytics</CardTitle>
                <CardDescription>Detailed revenue analysis and trends</CardDescription>
              </CardHeader>
              <CardContent>
                <RevenueChart 
                  data={chartData.revenue?.monthly || []} 
                  loading={loading}
                  detailed={true}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {chartData.revenue?.byCategory?.map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm">{item.category}</span>
                      <div className="text-right">
                        <div className="font-medium">${item.amount.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">{item.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Daily Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {chartData.revenue?.daily?.slice(0, 7).map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{new Date(item.date).toLocaleDateString()}</span>
                      <span className="font-medium">${item.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Expense Analytics</CardTitle>
                <CardDescription>Expense trends and category breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ExpenseChart 
                  data={chartData.expenses?.byCategory || []} 
                  loading={loading}
                  detailed={true}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Trending Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {chartData.expenses?.trending?.map((item, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{item.category}</span>
                        <div className={`flex items-center text-sm ${
                          item.change > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {item.change > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                          {Math.abs(item.change)}%
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ${item.currentMonth.toLocaleString()} vs ${item.previousMonth.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Monthly Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {chartData.expenses?.monthly?.slice(-6).map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.month}</span>
                      <span className="font-medium">${item.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Clients Tab */}
        <TabsContent value="clients" className="mt-6 space-y-6">
          <ClientAnalytics 
            data={chartData.clients || {}} 
            loading={loading}
          />
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProjectAnalytics 
              data={chartData.projects || {}} 
              loading={loading}
            />
            <TimeAnalytics 
              data={chartData.time || {}} 
              loading={loading}
            />
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <SavedReports 
                reports={reports}
                loading={loading}
                onViewReport={(report) => {
                  setSelectedReport(report);
                  setShowReportDetails(true);
                }}
                onEditReport={(report) => {
                  setSelectedReport(report);
                  setShowReportBuilder(true);
                }}
                onDeleteReport={handleDeleteReport}
                onExportReport={handleExportReport}
                onScheduleReport={(report) => {
                  setSelectedReport(report);
                  setShowReportSchedule(true);
                }}
              />
            </div>
            <div>
              <ReportBuilder 
                onCreateReport={handleGenerateReport}
                compact={true}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Sheet Components */}
      <ReportSheet
        report={selectedReport}
        open={showReportDetails}
        onOpenChange={setShowReportDetails}
        onExport={handleExportReport}
        onSchedule={(report) => {
          setSelectedReport(report);
          setShowReportSchedule(true);
        }}
        onDelete={handleDeleteReport}
      />

      <ReportBuilderSheet
        report={selectedReport}
        open={showReportBuilder}
        onOpenChange={(open) => {
          setShowReportBuilder(open);
          if (!open) setSelectedReport(null);
        }}
        onCreateReport={handleGenerateReport}
      />

      <ReportScheduleSheet
        report={selectedReport}
        open={showReportSchedule}
        onOpenChange={(open) => {
          setShowReportSchedule(open);
          if (!open) setSelectedReport(null);
        }}
        onSchedule={handleScheduleReport}
      />
    </div>
  );
}