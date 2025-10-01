"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { Button } from "@midday/ui/button";
import { Badge } from "@midday/ui/badge";
import { Progress } from "@midday/ui/progress";
import { useToast } from "@midday/ui/use-toast";
import { 
  PlayCircle, 
  PauseCircle, 
  RefreshCw, 
  Trash2,
  Activity,
  Clock,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { queueAPI, type MockQueue } from "@/lib/mock/queue-mock";

export function QueueOverview() {
  const [queues, setQueues] = useState<MockQueue[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadQueues();
    const interval = setInterval(loadQueues, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadQueues = async () => {
    try {
      const data = await queueAPI.getQueues();
      setQueues(data);
    } finally {
      setLoading(false);
    }
  };

  const handleQueueAction = async (action: string, queueName: string) => {
    if (action === "pause") {
      await queueAPI.pauseQueue(queueName);
      toast({
        title: "Queue Paused",
        description: `${queueName} queue has been paused`,
      });
    } else if (action === "resume") {
      await queueAPI.resumeQueue(queueName);
      toast({
        title: "Queue Resumed",
        description: `${queueName} queue has been resumed`,
      });
    }
    loadQueues();
  };

  const getQueueHealth = (queue: MockQueue) => {
    const failureRate = queue.failed / (queue.completed + queue.failed) * 100;
    if (failureRate > 10) return "critical";
    if (failureRate > 5) return "warning";
    if (queue.waiting > 100) return "warning";
    return "healthy";
  };

  const getHealthBadge = (health: string) => {
    const variants = {
      healthy: "default" as const,
      warning: "secondary" as const,
      critical: "destructive" as const,
    };
    return <Badge variant={variants[health as keyof typeof variants]}>{health}</Badge>;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {queues.map((queue) => {
        const health = getQueueHealth(queue);
        const totalJobs = queue.active + queue.waiting + queue.completed + queue.failed;
        const completionRate = totalJobs > 0 ? (queue.completed / totalJobs) * 100 : 0;

        return (
          <Card key={queue.name}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="capitalize">{queue.name}</CardTitle>
                {getHealthBadge(health)}
              </div>
              <CardDescription>
                {queue.throughput} jobs/hour avg
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Queue Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Activity className="h-3 w-3" />
                    <span>Active</span>
                  </div>
                  <p className="text-xl font-bold">{queue.active}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Waiting</span>
                  </div>
                  <p className="text-xl font-bold">{queue.waiting}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-3 w-3" />
                    <span>Completed</span>
                  </div>
                  <p className="text-xl font-bold">{queue.completed}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <AlertCircle className="h-3 w-3" />
                    <span>Failed</span>
                  </div>
                  <p className="text-xl font-bold">{queue.failed}</p>
                </div>
              </div>

              {/* Completion Rate */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Completion Rate</span>
                  <span>{completionRate.toFixed(1)}%</span>
                </div>
                <Progress value={completionRate} className="h-2" />
              </div>

              {/* Processing Time */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avg Process Time</span>
                <span className="text-sm font-medium">{queue.avgProcessTime.toFixed(1)}s</span>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                {queue.paused ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleQueueAction("resume", queue.name)}
                  >
                    <PlayCircle className="h-4 w-4 mr-1" />
                    Resume
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleQueueAction("pause", queue.name)}
                  >
                    <PauseCircle className="h-4 w-4 mr-1" />
                    Pause
                  </Button>
                )}
                <Button size="sm" variant="outline">
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}