import Bull, { Queue, Job, JobOptions } from "bull";
import type { 
  Message, 
  SendResult, 
  QueueJobData,
  Priority 
} from "../types/communication";
import type { BaseProvider } from "../providers/base-provider";

export interface QueueConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  defaultJobOptions?: JobOptions;
  maxConcurrency?: number;
}

export interface MessageProvider {
  getProvider(channel: string, provider?: string): BaseProvider | null;
}

export class QueueManager {
  private queues: Map<string, Queue<QueueJobData>> = new Map();
  private config: QueueConfig;
  private messageProvider: MessageProvider;

  constructor(config: QueueConfig, messageProvider: MessageProvider) {
    this.config = config;
    this.messageProvider = messageProvider;
  }

  private getQueue(channel: string): Queue<QueueJobData> {
    if (!this.queues.has(channel)) {
      const queue = new Bull<QueueJobData>(`communications-${channel}`, {
        redis: this.config.redis,
        defaultJobOptions: {
          removeOnComplete: true,
          removeOnFail: false,
          ...this.config.defaultJobOptions,
        },
      });

      // Process jobs
      queue.process(
        this.config.maxConcurrency || 5,
        async (job) => this.processJob(job)
      );

      // Handle events
      queue.on("completed", (job, result) => {
        console.log(`Job ${job.id} completed:`, result);
      });

      queue.on("failed", (job, err) => {
        console.error(`Job ${job.id} failed:`, err);
      });

      queue.on("stalled", (job) => {
        console.warn(`Job ${job.id} stalled and will be retried`);
      });

      this.queues.set(channel, queue);
    }

    return this.queues.get(channel)!;
  }

  async enqueue(
    message: Message,
    options?: {
      delay?: number;
      priority?: number;
      attempts?: number;
      backoff?: number | { type: string; delay: number };
      scheduledAt?: Date;
    }
  ): Promise<Job<QueueJobData>> {
    const queue = this.getQueue(message.channel);
    
    const jobOptions: JobOptions = {
      delay: options?.delay,
      priority: this.mapPriority(message.priority),
      attempts: options?.attempts || message.maxRetries || 3,
      backoff: options?.backoff || { type: "exponential", delay: 2000 },
    };

    // Handle scheduled messages
    if (message.scheduledAt || options?.scheduledAt) {
      const scheduledTime = message.scheduledAt || options?.scheduledAt!;
      const delay = scheduledTime.getTime() - Date.now();
      if (delay > 0) {
        jobOptions.delay = delay;
      }
    }

    // Override with custom priority if provided
    if (options?.priority !== undefined) {
      jobOptions.priority = options.priority;
    }

    const jobData: QueueJobData = {
      message,
      attempts: 0,
      delay: jobOptions.delay,
    };

    return queue.add(jobData, jobOptions);
  }

  async enqueueBatch(
    messages: Message[],
    options?: JobOptions
  ): Promise<Job<QueueJobData>[]> {
    const jobs = await Promise.all(
      messages.map(message => this.enqueue(message, options))
    );
    return jobs;
  }

  private async processJob(job: Job<QueueJobData>): Promise<SendResult> {
    const { message } = job.data;
    
    try {
      // Get the appropriate provider
      const provider = this.messageProvider.getProvider(
        message.channel,
        (message as any).provider
      );

      if (!provider) {
        throw new Error(`No provider available for channel: ${message.channel}`);
      }

      // Update attempt count
      job.data.attempts = (job.data.attempts || 0) + 1;

      // Send the message
      const result = await provider.send(message as any);

      // Handle failure with retry
      if (!result.success && job.opts.attempts && job.attemptsMade < job.opts.attempts) {
        throw result.error || new Error("Message sending failed");
      }

      return result;
    } catch (error) {
      // Log the error
      console.error(`Failed to process job ${job.id}:`, error);
      
      // Re-throw to trigger retry
      throw error;
    }
  }

  private mapPriority(priority?: Priority): number {
    const priorityMap: Record<Priority, number> = {
      urgent: 1,
      high: 2,
      normal: 5,
      low: 10,
    };

    return priority ? priorityMap[priority] : 5;
  }

  async pause(channel?: string): Promise<void> {
    if (channel) {
      const queue = this.queues.get(channel);
      if (queue) {
        await queue.pause();
      }
    } else {
      await Promise.all(
        Array.from(this.queues.values()).map(q => q.pause())
      );
    }
  }

  async resume(channel?: string): Promise<void> {
    if (channel) {
      const queue = this.queues.get(channel);
      if (queue) {
        await queue.resume();
      }
    } else {
      await Promise.all(
        Array.from(this.queues.values()).map(q => q.resume())
      );
    }
  }

  async getJob(channel: string, jobId: string): Promise<Job<QueueJobData> | null> {
    const queue = this.getQueue(channel);
    return queue.getJob(jobId);
  }

  async getJobs(
    channel: string,
    status?: "completed" | "waiting" | "active" | "delayed" | "failed" | "paused"
  ): Promise<Job<QueueJobData>[]> {
    const queue = this.getQueue(channel);
    
    switch (status) {
      case "completed":
        return queue.getCompleted();
      case "waiting":
        return queue.getWaiting();
      case "active":
        return queue.getActive();
      case "delayed":
        return queue.getDelayed();
      case "failed":
        return queue.getFailed();
      case "paused":
        return queue.getPaused();
      default:
        return queue.getJobs(["completed", "waiting", "active", "delayed", "failed", "paused"]);
    }
  }

  async retryJob(channel: string, jobId: string): Promise<void> {
    const job = await this.getJob(channel, jobId);
    if (job) {
      await job.retry();
    }
  }

  async removeJob(channel: string, jobId: string): Promise<void> {
    const job = await this.getJob(channel, jobId);
    if (job) {
      await job.remove();
    }
  }

  async clean(
    channel: string,
    grace: number = 0,
    status?: "completed" | "wait" | "active" | "delayed" | "failed"
  ): Promise<Job<QueueJobData>[]> {
    const queue = this.getQueue(channel);
    return queue.clean(grace, status);
  }

  async empty(channel: string): Promise<void> {
    const queue = this.getQueue(channel);
    await queue.empty();
  }

  async getQueueStatus(channel: string): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: boolean;
  }> {
    const queue = this.getQueue(channel);
    
    const [waiting, active, completed, failed, delayed, isPaused] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
      queue.isPaused(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      paused: isPaused,
    };
  }

  async close(): Promise<void> {
    await Promise.all(
      Array.from(this.queues.values()).map(q => q.close())
    );
    this.queues.clear();
  }

  async obliterate(channel: string): Promise<void> {
    const queue = this.getQueue(channel);
    await queue.obliterate({ force: true });
    this.queues.delete(channel);
  }
}