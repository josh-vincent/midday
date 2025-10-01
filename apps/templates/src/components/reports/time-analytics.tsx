"use client";

import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  ComposedChart
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { Skeleton } from "@midday/ui/skeleton";
import { Badge } from "@midday/ui/badge";
import { Progress } from "@midday/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { 
  Clock, 
  Target, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  DollarSign
} from "lucide-react";

type TimeData = {
  utilization?: Array<{ 
    month: string; 
    billableHours: number; 
    totalHours: number; 
    utilization: number; 
  }>;
  byProject?: Array<{ 
    project: string; 
    hours: number; 
    billableHours: number; 
    rate: number; 
    revenue: number; 
  }>;
  efficiency?: Array<{ 
    month: string; 
    estimatedHours: number; 
    actualHours: number; 
    efficiency: number; 
  }>;
};

type Props = {
  data: TimeData;
  loading?: boolean;
};

export function TimeAnalytics({ data, loading = false }: Props) {
  if (loading) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  const formatHours = (hours: number) => {
    return `${hours.toLocaleString()}h`;
  };

  const formatCurrency = (value: number) => {
    return `$${(value / 1000).toFixed(0)}K`;
  };

  const getTotalBillableHours = () => {
    return data.utilization?.reduce((sum, month) => sum + month.billableHours, 0) || 0;
  };

  const getAvgUtilization = () => {
    if (!data.utilization?.length) return 0;
    return data.utilization.reduce((sum, month) => sum + month.utilization, 0) / data.utilization.length;
  };

  const getTotalRevenue = () => {
    return data.byProject?.reduce((sum, project) => sum + project.revenue, 0) || 0;
  };

  const getAvgEfficiency = () => {
    if (!data.efficiency?.length) return 0;
    return data.efficiency.reduce((sum, month) => sum + month.efficiency, 0) / data.efficiency.length;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Billable Hours</p>
                <p className="text-2xl font-bold">{formatHours(getTotalBillableHours())}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Utilization</p>
                <p className="text-2xl font-bold">{getAvgUtilization().toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Time Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(getTotalRevenue())}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="utilization" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="utilization">Utilization</TabsTrigger>
          <TabsTrigger value="projects">By Project</TabsTrigger>
          <TabsTrigger value="efficiency">Efficiency</TabsTrigger>
        </TabsList>
        
        <TabsContent value="utilization">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Utilization Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={data.utilization}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="hours" orientation="left" />
                    <YAxis yAxisId="percentage" orientation="right" domain={[0, 100]} />
                    <Tooltip 
                      formatter={(value: number, name: string) => {
                        if (name === "utilization") return [`${value}%`, "Utilization"];
                        return [formatHours(value), name];
                      }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                      }}
                    />
                    <Bar yAxisId="hours" dataKey="billableHours" fill="#3b82f6" fillOpacity={0.6} />
                    <Bar yAxisId="hours" dataKey="totalHours" fill="#94a3b8" fillOpacity={0.4} />
                    <Line 
                      yAxisId="percentage"
                      type="monotone" 
                      dataKey="utilization" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.utilization?.map((month) => {
                    const target = 85; // 85% target utilization
                    const isOnTarget = month.utilization >= target;
                    const nonBillableHours = month.totalHours - month.billableHours;

                    return (
                      <div key={month.month} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{month.month}</span>
                          <div className="flex items-center space-x-2">
                            <span className={`text-sm font-medium ${
                              isOnTarget ? "text-green-600" : "text-yellow-600"
                            }`}>
                              {month.utilization.toFixed(1)}%
                            </span>
                            {isOnTarget ? (
                              <CheckCircle className="h-3 w-3 text-green-600" />
                            ) : (
                              <AlertTriangle className="h-3 w-3 text-yellow-600" />
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Billable: {formatHours(month.billableHours)} | 
                          Non-billable: {formatHours(nonBillableHours)} | 
                          Total: {formatHours(month.totalHours)}
                        </div>
                        <Progress 
                          value={month.utilization} 
                          className={`h-2 ${
                            isOnTarget ? "[&>div]:bg-green-600" : "[&>div]:bg-yellow-500"
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="projects">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Time by Project</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.byProject} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis 
                      dataKey="project" 
                      type="category" 
                      width={80}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip 
                      formatter={(value: number, name: string) => {
                        if (name === "revenue") return [formatCurrency(value), "Revenue"];
                        return [formatHours(value), name];
                      }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                      }}
                    />
                    <Bar dataKey="billableHours" fill="#3b82f6" radius={[0, 2, 2, 0]} />
                    <Bar dataKey="hours" fill="#94a3b8" fillOpacity={0.6} radius={[0, 2, 2, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.byProject?.sort((a, b) => b.revenue - a.revenue).map((project) => {
                    const utilization = (project.billableHours / project.hours) * 100;
                    const avgRate = project.revenue / project.billableHours;

                    return (
                      <div key={project.project} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">{project.project}</h4>
                          <Badge variant="outline">
                            ${avgRate.toFixed(0)}/hr
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Total Hours:</span>
                            <span className="ml-1 font-medium">{formatHours(project.hours)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Billable:</span>
                            <span className="ml-1 font-medium">{formatHours(project.billableHours)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Utilization:</span>
                            <span className={`ml-1 font-medium ${
                              utilization > 80 ? "text-green-600" : 
                              utilization > 60 ? "text-yellow-600" : "text-red-600"
                            }`}>
                              {utilization.toFixed(1)}%
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Revenue:</span>
                            <span className="ml-1 font-medium">{formatCurrency(project.revenue)}</span>
                          </div>
                        </div>
                        
                        <Progress 
                          value={utilization} 
                          className={`h-1 ${
                            utilization > 80 ? "[&>div]:bg-green-600" :
                            utilization > 60 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-red-600"
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="efficiency">
          <Card>
            <CardHeader>
              <CardTitle>Project Efficiency Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Average Efficiency:</span>
                  <div className="flex items-center space-x-2">
                    <span className={`font-medium ${
                      getAvgEfficiency() > 100 ? "text-green-600" :
                      getAvgEfficiency() > 90 ? "text-yellow-600" : "text-red-600"
                    }`}>
                      {getAvgEfficiency().toFixed(1)}%
                    </span>
                    {getAvgEfficiency() > 100 ? (
                      <TrendingUp className="h-3 w-3 text-green-600" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-600" />
                    )}
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={data.efficiency}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number, name: string) => {
                        if (name === "efficiency") return [`${value}%`, "Efficiency"];
                        return [formatHours(value), name];
                      }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                      }}
                    />
                    <Bar dataKey="estimatedHours" fill="#94a3b8" fillOpacity={0.6} />
                    <Bar dataKey="actualHours" fill="#3b82f6" fillOpacity={0.8} />
                    <Line 
                      type="monotone" 
                      dataKey="efficiency" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      yAxisId="efficiency"
                      dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>

                <div className="space-y-3">
                  {data.efficiency?.map((month) => {
                    const variance = month.actualHours - month.estimatedHours;
                    const isEfficient = month.efficiency >= 100;

                    return (
                      <div key={month.month} className="flex items-center justify-between text-sm">
                        <span className="font-medium">{month.month}</span>
                        <div className="flex items-center space-x-4">
                          <span className="text-muted-foreground">
                            Est: {formatHours(month.estimatedHours)}
                          </span>
                          <span className="text-muted-foreground">
                            Actual: {formatHours(month.actualHours)}
                          </span>
                          <div className={`flex items-center space-x-1 ${
                            isEfficient ? "text-green-600" : "text-red-600"
                          }`}>
                            {isEfficient ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            <span className="font-medium">
                              {month.efficiency.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}