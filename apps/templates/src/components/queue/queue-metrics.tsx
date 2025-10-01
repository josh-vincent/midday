"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@midday/ui/select";
import { Badge } from "@midday/ui/badge";
import { TrendingUp, TrendingDown, Activity, Clock } from "lucide-react";

export function QueueMetrics() {
  const [selectedQueue, setSelectedQueue] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState("24h");

  const metrics = [
    { label: "Total Processed", value: "12,543", change: "+15%", trend: "up" },
    { label: "Success Rate", value: "98.2%", change: "+2.1%", trend: "up" },
    { label: "Avg Process Time", value: "2.3s", change: "-0.5s", trend: "down" },
    { label: "Queue Depth", value: "67", change: "+12", trend: "up" },
  ];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Metrics Dashboard</CardTitle>
          <CardDescription>
            Monitor queue performance and throughput
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Select value={selectedQueue} onValueChange={setSelectedQueue}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Queues</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="invoice">Invoice</SelectItem>
                <SelectItem value="sync">Sync</SelectItem>
                <SelectItem value="export">Export</SelectItem>
                <SelectItem value="webhook">Webhook</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{metric.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{metric.value}</span>
                <div className="flex items-center space-x-1">
                  {metric.trend === "up" ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-sm ${
                    metric.trend === "up" ? "text-green-500" : "text-red-500"
                  }`}>
                    {metric.change}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Queue Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Queue Performance</CardTitle>
          <CardDescription>
            Processing metrics by queue type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {["email", "invoice", "sync", "export", "webhook"].map((queue) => {
              const processed = Math.floor(Math.random() * 1000) + 500;
              const failed = Math.floor(Math.random() * 50);
              const successRate = ((processed - failed) / processed * 100).toFixed(1);
              
              return (
                <div key={queue} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Activity className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium capitalize">{queue}</p>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                        <span>Processed: {processed}</span>
                        <span>Failed: {failed}</span>
                        <span>Success Rate: {successRate}%</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={parseFloat(successRate) > 95 ? "default" : "secondary"}>
                    {successRate}%
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Processing Time Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Processing Time Distribution</CardTitle>
          <CardDescription>
            Job completion times across queues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">&lt; 1s</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-48 bg-muted rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: "65%" }} />
                </div>
                <span className="text-sm font-medium">65%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">1s - 5s</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-48 bg-muted rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{ width: "25%" }} />
                </div>
                <span className="text-sm font-medium">25%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">5s - 30s</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-48 bg-muted rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: "8%" }} />
                </div>
                <span className="text-sm font-medium">8%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">&gt; 30s</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-48 bg-muted rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: "2%" }} />
                </div>
                <span className="text-sm font-medium">2%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}