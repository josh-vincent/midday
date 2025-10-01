"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { Badge } from "@midday/ui/badge";
import { Progress } from "@midday/ui/progress";
import { Button } from "@midday/ui/button";
import { useToast } from "@midday/ui/use-toast";
import { 
  User, 
  Activity, 
  Cpu, 
  HardDrive,
  Power,
  RotateCcw,
  Trash2,
  Plus
} from "lucide-react";
import { queueAPI, type MockWorker } from "@/lib/mock/queue-mock";

export function WorkerStatus() {
  const [workers, setWorkers] = useState<MockWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadWorkers();
    const interval = setInterval(loadWorkers, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadWorkers = async () => {
    try {
      const data = await queueAPI.getWorkers();
      setWorkers(data);
    } finally {
      setLoading(false);
    }
  };

  const handleWorkerAction = (action: string, workerId: string) => {
    toast({
      title: `Worker ${action}`,
      description: `Worker ${workerId} ${action} initiated`,
    });
  };

  const getStatusIcon = (status: MockWorker["status"]) => {
    switch (status) {
      case "busy":
        return <Activity className="h-4 w-4 text-blue-500" />;
      case "idle":
        return <Power className="h-4 w-4 text-green-500" />;
      case "offline":
        return <Power className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: MockWorker["status"]) => {
    const variants = {
      busy: "default" as const,
      idle: "secondary" as const,
      offline: "outline" as const,
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getCPUColor = (cpu: number) => {
    if (cpu > 80) return "text-red-500";
    if (cpu > 60) return "text-yellow-500";
    return "text-green-500";
  };

  const getMemoryColor = (memory: number) => {
    if (memory > 80) return "text-red-500";
    if (memory > 60) return "text-yellow-500";
    return "text-green-500";
  };

  return (
    <div className="space-y-6">
      {/* Worker Summary */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Workers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{workers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {workers.filter(w => w.status === "busy").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Idle</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {workers.filter(w => w.status === "idle").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Offline</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {workers.filter(w => w.status === "offline").length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Worker Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {workers.map((worker) => (
          <Card key={worker.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5" />
                  <CardTitle>{worker.name}</CardTitle>
                </div>
                {getStatusBadge(worker.status)}
              </div>
              <CardDescription>
                Last active: {new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
                  Math.floor((worker.lastActive.getTime() - Date.now()) / 60000),
                  "minute"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Job */}
              {worker.currentJob && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Processing</p>
                  <p className="font-medium">{worker.currentJob}</p>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Processed</p>
                  <p className="text-xl font-bold">{worker.processedJobs}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Failed</p>
                  <p className="text-xl font-bold text-red-500">{worker.failedJobs}</p>
                </div>
              </div>

              {/* Resource Usage */}
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2 text-sm">
                      <Cpu className="h-3 w-3" />
                      <span>CPU Usage</span>
                    </div>
                    <span className={`text-sm font-medium ${getCPUColor(worker.cpu)}`}>
                      {worker.cpu}%
                    </span>
                  </div>
                  <Progress value={worker.cpu} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2 text-sm">
                      <HardDrive className="h-3 w-3" />
                      <span>Memory</span>
                    </div>
                    <span className={`text-sm font-medium ${getMemoryColor(worker.memory)}`}>
                      {worker.memory}%
                    </span>
                  </div>
                  <Progress value={worker.memory} className="h-2" />
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                {worker.status === "offline" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleWorkerAction("start", worker.id)}
                  >
                    <Power className="h-4 w-4 mr-1" />
                    Start
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleWorkerAction("restart", worker.id)}
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Restart
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleWorkerAction("remove", worker.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Worker */}
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <Button onClick={() => handleWorkerAction("add", "new")}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Worker
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              Scale up processing capacity by adding more workers
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}