"use client";

import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { Skeleton } from "@midday/ui/skeleton";
import { Badge } from "@midday/ui/badge";
import { Progress } from "@midday/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { 
  FolderOpen, 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Pause
} from "lucide-react";
import { format } from "date-fns";

type ProjectData = {
  profitability?: Array<{ 
    name: string; 
    revenue: number; 
    costs: number; 
    profit: number; 
    margin: number; 
  }>;
  timeline?: Array<{ 
    name: string; 
    startDate: string; 
    endDate: string; 
    progress: number; 
    budget: number; 
    spent: number; 
  }>;
  byStatus?: Array<{ 
    status: string; 
    count: number; 
    revenue: number; 
  }>;
};

type Props = {
  data: ProjectData;
  loading?: boolean;
};

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

const statusIcons = {
  Active: <Clock className="h-4 w-4 text-blue-600" />,
  Completed: <CheckCircle className="h-4 w-4 text-green-600" />,
  "On Hold": <Pause className="h-4 w-4 text-yellow-600" />,
  Planning: <FolderOpen className="h-4 w-4 text-purple-600" />,
};

export function ProjectAnalytics({ data, loading = false }: Props) {
  if (loading) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  const formatCurrency = (value: number) => {
    return `$${(value / 1000).toFixed(0)}K`;
  };

  const getTotalProjects = () => {
    return data.byStatus?.reduce((sum, status) => sum + status.count, 0) || 0;
  };

  const getTotalRevenue = () => {
    return data.byStatus?.reduce((sum, status) => sum + status.revenue, 0) || 0;
  };

  const getAvgMargin = () => {
    if (!data.profitability?.length) return 0;
    return data.profitability.reduce((sum, project) => sum + project.margin, 0) / data.profitability.length;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FolderOpen className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Projects</p>
                <p className="text-2xl font-bold">{getTotalProjects()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Project Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(getTotalRevenue())}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Margin</p>
                <p className="text-2xl font-bold">{getAvgMargin().toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="profitability" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profitability">Profitability</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profitability">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Profitability</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.profitability} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={formatCurrency} />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={100}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip 
                      formatter={(value: number, name: string) => {
                        const label = name === "profit" ? "Profit" : 
                                     name === "revenue" ? "Revenue" : "Costs";
                        return [formatCurrency(value), label];
                      }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                      }}
                    />
                    <Bar dataKey="revenue" fill="#10b981" radius={[0, 2, 2, 0]} />
                    <Bar dataKey="costs" fill="#ef4444" radius={[0, 2, 2, 0]} />
                    <Bar dataKey="profit" fill="#3b82f6" radius={[0, 2, 2, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Profit Margins</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.profitability?.map((project) => (
                    <div key={project.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{project.name}</span>
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-medium ${
                            project.margin > 30 ? "text-green-600" :
                            project.margin > 15 ? "text-yellow-600" : "text-red-600"
                          }`}>
                            {project.margin.toFixed(1)}%
                          </span>
                          {project.margin > 30 ? (
                            <TrendingUp className="h-3 w-3 text-green-600" />
                          ) : project.margin < 15 ? (
                            <TrendingDown className="h-3 w-3 text-red-600" />
                          ) : (
                            <AlertTriangle className="h-3 w-3 text-yellow-600" />
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Revenue: {formatCurrency(project.revenue)} | 
                        Costs: {formatCurrency(project.costs)} | 
                        Profit: {formatCurrency(project.profit)}
                      </div>
                      <Progress 
                        value={Math.min(project.margin, 100)} 
                        className={`h-2 ${
                          project.margin > 30 ? "[&>div]:bg-green-600" :
                          project.margin > 15 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-red-600"
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Project Timeline & Budget</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {data.timeline?.map((project) => {
                  const budgetUtilization = (project.spent / project.budget) * 100;
                  const isOverBudget = budgetUtilization > 100;
                  const isNearBudget = budgetUtilization > 80;

                  return (
                    <div key={project.name} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{project.name}</h4>
                        <Badge 
                          variant={
                            project.progress === 100 ? "default" :
                            project.progress > 75 ? "secondary" : "outline"
                          }
                        >
                          {project.progress}% Complete
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Timeline</p>
                          <p>
                            {format(new Date(project.startDate), "MMM dd")} - {" "}
                            {format(new Date(project.endDate), "MMM dd, yyyy")}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Budget Status</p>
                          <p className={
                            isOverBudget ? "text-red-600" :
                            isNearBudget ? "text-yellow-600" : "text-green-600"
                          }>
                            {formatCurrency(project.spent)} / {formatCurrency(project.budget)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Progress</span>
                          <span>{project.progress}%</span>
                        </div>
                        <Progress value={project.progress} className="h-2" />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Budget Utilization</span>
                          <span className={
                            isOverBudget ? "text-red-600" :
                            isNearBudget ? "text-yellow-600" : "text-green-600"
                          }>
                            {budgetUtilization.toFixed(1)}%
                          </span>
                        </div>
                        <Progress 
                          value={Math.min(budgetUtilization, 100)} 
                          className={`h-2 ${
                            isOverBudget ? "[&>div]:bg-red-600" :
                            isNearBudget ? "[&>div]:bg-yellow-500" : "[&>div]:bg-green-600"
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="status">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Projects by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.byStatus?.map((item, index) => ({
                        ...item,
                        fill: COLORS[index % COLORS.length],
                      }))}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="count"
                      label={({ status, count }) => `${status}: ${count}`}
                    >
                      {data.byStatus?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name: string) => [value, "Projects"]}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.byStatus?.map((status) => (
                    <div key={status.status} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {statusIcons[status.status as keyof typeof statusIcons]}
                        <div>
                          <p className="font-medium text-sm">{status.status}</p>
                          <p className="text-xs text-muted-foreground">
                            {status.count} projects
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">{formatCurrency(status.revenue)}</p>
                        <p className="text-xs text-muted-foreground">
                          Avg: {formatCurrency(status.revenue / status.count)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}