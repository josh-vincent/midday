"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { Badge } from "@midday/ui/badge";
import { Button } from "@midday/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@midday/ui/select";
import { Progress } from "@midday/ui/progress";
import { 
  Database, 
  Activity, 
  HardDrive, 
  Zap, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Users,
  FileText,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  BarChart3
} from "lucide-react";
import { databaseAPI } from "@/lib/mock/database-mock";

interface DatabaseStats {
  totalSize: number;
  availableStorage: number;
  connectionCount: number;
  maxConnections: number;
  cacheHitRatio: number;
  queriesPerSecond: number;
  averageQueryTime: number;
  uptime: number;
  lastBackup: Date;
  slowQueries: number;
  indexUsage: number;
}

interface TablePerformance {
  name: string;
  queries: number;
  avgQueryTime: number;
  cacheHit: number;
  totalSize: number;
  indexSize: number;
  lastVacuum: Date;
  lastAnalyze: Date;
}

export function DatabaseStats() {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [tablePerformance, setTablePerformance] = useState<TablePerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("24h");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
  }, [selectedPeriod]);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      // Mock database stats
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setStats({
        totalSize: 1247.8,
        availableStorage: 8752.2,
        connectionCount: 42,
        maxConnections: 100,
        cacheHitRatio: 94.7,
        queriesPerSecond: 1243,
        averageQueryTime: 2.4,
        uptime: 25 * 24 * 60 * 60 * 1000, // 25 days
        lastBackup: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        slowQueries: 15,
        indexUsage: 87.3,
      });

      // Mock table performance data
      setTablePerformance([
        {
          name: "invoices",
          queries: 15430,
          avgQueryTime: 3.2,
          cacheHit: 92.1,
          totalSize: 12.3,
          indexSize: 2.1,
          lastVacuum: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          lastAnalyze: new Date(Date.now() - 12 * 60 * 60 * 1000),
        },
        {
          name: "users",
          queries: 8921,
          avgQueryTime: 1.8,
          cacheHit: 96.4,
          totalSize: 2.4,
          indexSize: 0.8,
          lastVacuum: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          lastAnalyze: new Date(Date.now() - 6 * 60 * 60 * 1000),
        },
        {
          name: "customers",
          queries: 5634,
          avgQueryTime: 2.1,
          cacheHit: 89.7,
          totalSize: 4.5,
          indexSize: 1.2,
          lastVacuum: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          lastAnalyze: new Date(Date.now() - 18 * 60 * 60 * 1000),
        },
        {
          name: "teams",
          queries: 2341,
          avgQueryTime: 1.4,
          cacheHit: 95.8,
          totalSize: 0.8,
          indexSize: 0.3,
          lastVacuum: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          lastAnalyze: new Date(Date.now() - 8 * 60 * 60 * 1000),
        },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshStats = async () => {
    setRefreshing(true);
    await loadStats();
  };

  const formatUptime = (milliseconds: number) => {
    const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
    const hours = Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}d ${hours}h`;
  };

  const formatSize = (sizeInMB: number) => {
    if (sizeInMB >= 1024) {
      return `${(sizeInMB / 1024).toFixed(1)} GB`;
    }
    return `${sizeInMB.toFixed(1)} MB`;
  };

  const getPerformanceColor = (value: number, threshold: { good: number; warning: number }) => {
    if (value >= threshold.good) return "text-green-500";
    if (value >= threshold.warning) return "text-yellow-500";
    return "text-red-500";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Database Performance</CardTitle>
              <CardDescription>
                Monitor database health, performance metrics, and resource usage
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Last Hour</SelectItem>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={refreshStats} disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center space-x-2">
              <Database className="h-4 w-4" />
              <span>Database Size</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{formatSize(stats.totalSize)}</div>
              <Progress value={(stats.totalSize / (stats.totalSize + stats.availableStorage)) * 100} className="h-2" />
              <div className="text-sm text-muted-foreground">
                {formatSize(stats.availableStorage)} available
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Connections</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{stats.connectionCount}</div>
              <Progress value={(stats.connectionCount / stats.maxConnections) * 100} className="h-2" />
              <div className="text-sm text-muted-foreground">
                {stats.maxConnections} max
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center space-x-2">
              <Zap className="h-4 w-4" />
              <span>Cache Hit Ratio</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className={`text-2xl font-bold ${getPerformanceColor(stats.cacheHitRatio, { good: 90, warning: 70 })}`}>
                {stats.cacheHitRatio}%
              </div>
              <Progress value={stats.cacheHitRatio} className="h-2" />
              <div className="text-sm text-muted-foreground">
                {stats.cacheHitRatio >= 90 ? "Excellent" : stats.cacheHitRatio >= 70 ? "Good" : "Poor"}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>Queries/sec</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{stats.queriesPerSecond.toLocaleString()}</div>
              <div className="flex items-center space-x-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-sm text-green-500">+12%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Query Performance</CardTitle>
            <CardDescription>
              Average query execution times and slow query count
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Average Query Time</span>
              </div>
              <div className={`text-lg font-semibold ${getPerformanceColor(5 - stats.averageQueryTime, { good: 3, warning: 1 })}`}>
                {stats.averageQueryTime}ms
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                <span>Slow Queries (1s+)</span>
              </div>
              <Badge variant={stats.slowQueries > 20 ? "destructive" : stats.slowQueries > 10 ? "secondary" : "default"}>
                {stats.slowQueries}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <span>Index Usage</span>
              </div>
              <div className={`text-lg font-semibold ${getPerformanceColor(stats.indexUsage, { good: 85, warning: 70 })}`}>
                {stats.indexUsage}%
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>
              Database uptime and maintenance status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Database Uptime</span>
              </div>
              <div className="text-lg font-semibold">
                {formatUptime(stats.uptime)}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <HardDrive className="h-4 w-4 text-muted-foreground" />
                <span>Last Backup</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {stats.lastBackup.toLocaleString()}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span>Storage Usage</span>
              </div>
              <div className="text-sm">
                {((stats.totalSize / (stats.totalSize + stats.availableStorage)) * 100).toFixed(1)}%
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Table Performance</CardTitle>
          <CardDescription>
            Query statistics and maintenance status by table
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Table</th>
                  <th className="text-left p-3">Queries</th>
                  <th className="text-left p-3">Avg Time</th>
                  <th className="text-left p-3">Cache Hit</th>
                  <th className="text-left p-3">Size</th>
                  <th className="text-left p-3">Last Vacuum</th>
                  <th className="text-left p-3">Last Analyze</th>
                </tr>
              </thead>
              <tbody>
                {tablePerformance.map((table) => (
                  <tr key={table.name} className="border-b hover:bg-muted/50">
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{table.name}</span>
                      </div>
                    </td>
                    <td className="p-3">{table.queries.toLocaleString()}</td>
                    <td className={`p-3 ${getPerformanceColor(5 - table.avgQueryTime, { good: 3, warning: 1 })}`}>
                      {table.avgQueryTime}ms
                    </td>
                    <td className={`p-3 ${getPerformanceColor(table.cacheHit, { good: 90, warning: 70 })}`}>
                      {table.cacheHit}%
                    </td>
                    <td className="p-3">
                      <div className="text-sm">
                        <div>{formatSize(table.totalSize)}</div>
                        <div className="text-muted-foreground">
                          +{formatSize(table.indexSize)} idx
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="text-sm text-muted-foreground">
                        {table.lastVacuum.toLocaleDateString()}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="text-sm text-muted-foreground">
                        {table.lastAnalyze.toLocaleDateString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}