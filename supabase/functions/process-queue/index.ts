import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { QueueManager } from "../../../packages/queue/src/queue-manager.ts";
import { WebhookQueue } from "../../../packages/queue/src/queues/webhook-queue.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, queueName, options } = await req.json();
    
    const redisConfig = {
      redis: {
        host: Deno.env.get("REDIS_HOST") || "localhost",
        port: parseInt(Deno.env.get("REDIS_PORT") || "6379"),
        password: Deno.env.get("REDIS_PASSWORD"),
        db: parseInt(Deno.env.get("REDIS_DB") || "0"),
      },
    };

    const queueManager = new QueueManager(redisConfig);
    
    let result: any = { success: true };

    switch (action) {
      case "process-failed-webhooks": {
        const webhookQueue = new WebhookQueue(queueManager);
        const retryCount = await webhookQueue.retryFailedWebhooks();
        result.message = `Retrying ${retryCount} failed webhooks`;
        break;
      }

      case "clean-completed": {
        const gracePeriod = options?.gracePeriod || 24 * 60 * 60 * 1000;
        const removed = await queueManager.cleanQueue(
          queueName || "webhooks",
          gracePeriod,
          1000,
          "completed"
        );
        result.message = `Cleaned ${removed.length} completed jobs`;
        break;
      }

      case "get-metrics": {
        const metrics = await queueManager.getQueueMetrics(
          queueName || "webhooks"
        );
        result.metrics = metrics;
        break;
      }

      case "pause-queue": {
        await queueManager.pauseQueue(queueName || "webhooks");
        result.message = `Queue ${queueName || "webhooks"} paused`;
        break;
      }

      case "resume-queue": {
        await queueManager.resumeQueue(queueName || "webhooks");
        result.message = `Queue ${queueName || "webhooks"} resumed`;
        break;
      }

      case "drain-queue": {
        if (options?.confirm === true) {
          await queueManager.drainQueue(queueName || "webhooks");
          result.message = `Queue ${queueName || "webhooks"} drained`;
        } else {
          result.error = "Confirmation required to drain queue";
          result.success = false;
        }
        break;
      }

      case "retry-job": {
        if (options?.jobId) {
          await queueManager.retryJob(
            queueName || "webhooks",
            options.jobId
          );
          result.message = `Job ${options.jobId} scheduled for retry`;
        } else {
          result.error = "Job ID required";
          result.success = false;
        }
        break;
      }

      case "remove-job": {
        if (options?.jobId) {
          await queueManager.removeJob(
            queueName || "webhooks",
            options.jobId
          );
          result.message = `Job ${options.jobId} removed`;
        } else {
          result.error = "Job ID required";
          result.success = false;
        }
        break;
      }

      case "list-failed": {
        const failedJobs = await queueManager.getJobs(
          queueName || "webhooks",
          "failed",
          0,
          options?.limit || 50
        );
        result.jobs = failedJobs.map(job => ({
          id: job.id,
          name: job.name,
          data: job.data,
          failedReason: job.failedReason,
          attemptsMade: job.attemptsMade,
          timestamp: job.timestamp,
        }));
        break;
      }

      case "list-active": {
        const activeJobs = await queueManager.getJobs(
          queueName || "webhooks",
          "active",
          0,
          options?.limit || 50
        );
        result.jobs = activeJobs.map(job => ({
          id: job.id,
          name: job.name,
          data: job.data,
          progress: job.progress,
          timestamp: job.timestamp,
        }));
        break;
      }

      case "health-check": {
        const queues = queueManager.getQueueNames();
        const health: any = {};
        
        for (const queue of queues) {
          health[queue] = await queueManager.getQueueMetrics(queue);
        }
        
        result.health = health;
        result.status = "healthy";
        break;
      }

      default:
        result.error = `Unknown action: ${action}`;
        result.success = false;
    }

    await queueManager.close();

    return new Response(
      JSON.stringify(result),
      { 
        status: result.success ? 200 : 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Queue processing error:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        message: error.message,
        success: false 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});