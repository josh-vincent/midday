"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { Badge } from "@midday/ui/badge";
import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { ScrollArea } from "@midday/ui/scroll-area";
import { 
  GitBranch, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Search,
  Calendar,
  Hash,
  Play
} from "lucide-react";
import { databaseAPI, type MockMigration } from "@/lib/mock/database-mock";

export function MigrationsPanel() {
  const [migrations, setMigrations] = useState<MockMigration[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<"all" | "applied" | "pending" | "failed">("all");

  useEffect(() => {
    loadMigrations();
  }, []);

  const loadMigrations = async () => {
    try {
      const data = await databaseAPI.getMigrations();
      setMigrations(data);
    } finally {
      setLoading(false);
    }
  };

  const filteredMigrations = migrations.filter(migration => {
    const matchesSearch = migration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      migration.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === "all" || migration.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: MockMigration["status"]) => {
    switch (status) {
      case "applied":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: MockMigration["status"]) => {
    const variants = {
      applied: "default" as const,
      pending: "secondary" as const,
      failed: "destructive" as const,
    };
    return (
      <Badge variant={variants[status]} className="text-xs">
        {status.toUpperCase()}
      </Badge>
    );
  };

  const stats = {
    total: migrations.length,
    applied: migrations.filter(m => m.status === "applied").length,
    pending: migrations.filter(m => m.status === "pending").length,
    failed: migrations.filter(m => m.status === "failed").length,
  };

  return (
    <div className="space-y-6">
      {/* Header and Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Database Migrations</CardTitle>
          <CardDescription>
            Track database schema changes and migration history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">{stats.applied}</p>
                <p className="text-sm text-muted-foreground">Applied</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-500">{stats.failed}</p>
                <p className="text-sm text-muted-foreground">Failed</p>
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search migrations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex space-x-2">
              {(["all", "applied", "pending", "failed"] as const).map((status) => (
                <Button
                  key={status}
                  variant={selectedStatus === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedStatus(status)}
                  className="capitalize"
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Migrations List */}
      <Card>
        <CardHeader>
          <CardTitle>Migration History</CardTitle>
          <CardDescription>
            {filteredMigrations.length} migration(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {filteredMigrations.map((migration) => (
                <div
                  key={migration.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(migration.status)}
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-semibold">{migration.name}</p>
                        {getStatusBadge(migration.status)}
                      </div>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Hash className="h-3 w-3" />
                          <span>{migration.id}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <GitBranch className="h-3 w-3" />
                          <span>{migration.version}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{migration.appliedAt.toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{migration.executionTime}ms</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs font-mono">
                      {migration.checksum}
                    </Badge>
                    {migration.status === "pending" && (
                      <Button size="sm" variant="outline">
                        <Play className="h-3 w-3 mr-1" />
                        Run
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest migration activity and changes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {migrations
              .filter(m => m.status === "applied")
              .sort((a, b) => b.appliedAt.getTime() - a.appliedAt.getTime())
              .slice(0, 5)
              .map((migration) => (
                <div
                  key={migration.id}
                  className="flex items-center justify-between p-3 border rounded"
                >
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="font-medium text-sm">{migration.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Applied {migration.appliedAt.toLocaleString()} • {migration.executionTime}ms
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {migration.version}
                  </Badge>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}