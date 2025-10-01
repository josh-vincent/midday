import { Queue, Worker, QueueEvents, Job, JobsOptions } from "bullmq";
import Redis from "ioredis";
import { logger } from "@midday/logger";
import type {
  QueueConfig,
  JobData,
  JobProcessor,
  QueueMetrics,
  QueueEventHandlers,
  RetryStrategy,
  DeadLetterConfig,
  JobResult,
  JobType,
  BulkJobOptions,
} from "./types";

export class QueueManager {
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();
  private queueEvents: Map<string, QueueEvents> = new Map();
  private processors: Map<JobType, JobProcessor> = new Map();
  private connection: Redis;
  private config: QueueConfig;

  constructor(config: QueueConfig) {
    this.config = config;
    this.connection = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
      maxRetriesPerRequest: config.redis.maxRetriesPerRequest || 3,
    });

    this.connection.on("error", (error) => {
      logger.error("Queue Redis connection error:", error);
    });

    this.connection.on("connect", () => {
      logger.info("Queue Redis connected");
    });
  }

  /**
   * Get or create a queue
   */
  getQueue(queueName: string): Queue {
    if (!this.queues.has(queueName)) {
      const queue = new Queue(queueName, {
        connection: this.connection.duplicate(),
        defaultJobOptions: {
          removeOnComplete: { count: 100 },
          removeOnFail: { count: 50 },
          ...this.config.defaultJobOptions,
        },
      });

      this.queues.set(queueName, queue);
      logger.info(`Queue created: ${queueName}`);
    }

    return this.queues.get(queueName)!;
  }

  /**
   * Register a job processor
   */
  registerProcessor(jobType: JobType, processor: JobProcessor): void {
    this.processors.set(jobType, processor);
    logger.info(`Processor registered for job type: ${jobType}`);
  }

  /**
   * Create a worker for a queue
   */
  createWorker(
    queueName: string,
    processor?: JobProcessor,
    eventHandlers?: QueueEventHandlers
  ): Worker {
    if (this.workers.has(queueName)) {
      logger.warn(`Worker already exists for queue: ${queueName}`);
      return this.workers.get(queueName)!;
    }

    const worker = new Worker(
      queueName,
      async (job: Job<JobData>) => {
        // Use registered processor based on job type
        const jobProcessor = processor || this.processors.get(job.data.type);
        
        if (!jobProcessor) {
          throw new Error(`No processor found for job type: ${job.data.type}`);
        }

        logger.info(`Processing job ${job.id} of type ${job.data.type}`);
        
        try {
          const result = await jobProcessor(job);
          logger.info(`Job ${job.id} completed successfully`);
          return result;
        } catch (error) {
          logger.error(`Job ${job.id} failed:`, error);
          throw error;
        }
      },
      {
        connection: this.connection.duplicate(),
        concurrency: this.config.workers?.concurrency || 5,
        maxStalledCount: this.config.workers?.maxStalledCount || 2,
        stalledInterval: this.config.workers?.stalledInterval || 30000,
      }
    );

    // Set up event handlers
    if (eventHandlers) {
      this.setupWorkerEvents(worker, eventHandlers);
    }

    // Set up queue events
    const queueEvents = new QueueEvents(queueName, {
      connection: this.connection.duplicate(),
    });

    this.queueEvents.set(queueName, queueEvents);
    this.workers.set(queueName, worker);

    logger.info(`Worker created for queue: ${queueName}`);
    return worker;
  }

  /**
   * Setup event handlers for a worker
   */
  private setupWorkerEvents(worker: Worker, handlers: QueueEventHandlers): void {
    if (handlers.onCompleted) {
      worker.on("completed", handlers.onCompleted);
    }

    if (handlers.onFailed) {
      worker.on("failed", handlers.onFailed);
    }

    if (handlers.onProgress) {
      worker.on("progress", handlers.onProgress);
    }

    if (handlers.onActive) {
      worker.on("active", handlers.onActive);
    }

    if (handlers.onStalled) {
      worker.on("stalled", handlers.onStalled);
    }
  }

  /**
   * Add a job to a queue
   */
  async addJob<T extends JobData>(
    queueName: string,
    jobName: string,
    data: T,
    options?: JobsOptions
  ): Promise<Job<T>> {
    const queue = this.getQueue(queueName);
    
    const jobOptions: JobsOptions = {
      ...options,
      attempts: options?.attempts || 3,
      backoff: options?.backoff || {
        type: "exponential",
        delay: 2000,
      },
    };

    const job = await queue.add(jobName, data, jobOptions);
    logger.info(`Job ${job.id} added to queue ${queueName}`);
    
    return job as Job<T>;
  }

  /**
   * Add multiple jobs in bulk
   */
  async addBulkJobs(
    queueName: string,
    options: BulkJobOptions
  ): Promise<Job[]> {
    const queue = this.getQueue(queueName);
    const { jobs, batchSize = 100 } = options;

    const results: Job[] = [];
    
    for (let i = 0; i < jobs.length; i += batchSize) {
      const batch = jobs.slice(i, i + batchSize);
      const batchJobs = await queue.addBulk(batch);
      results.push(...batchJobs);
    }

    logger.info(`Added ${results.length} jobs to queue ${queueName}`);
    return results;
  }

  /**
   * Schedule a job for later execution
   */
  async scheduleJob<T extends JobData>(
    queueName: string,
    jobName: string,
    data: T,
    delay: number,
    options?: JobsOptions
  ): Promise<Job<T>> {
    return this.addJob(queueName, jobName, data, {
      ...options,
      delay,
    });
  }

  /**
   * Schedule a recurring job (cron)
   */
  async scheduleRecurringJob<T extends JobData>(
    queueName: string,
    jobName: string,
    data: T,
    pattern: string,
    options?: JobsOptions
  ): Promise<Job<T>> {
    return this.addJob(queueName, jobName, data, {
      ...options,
      repeat: {
        pattern,
      },
    });
  }

  /**
   * Retry a failed job
   */
  async retryJob(queueName: string, jobId: string): Promise<void> {
    const queue = this.getQueue(queueName);
    const job = await queue.getJob(jobId);
    
    if (!job) {
      throw new Error(`Job ${jobId} not found in queue ${queueName}`);
    }

    await job.retry();
    logger.info(`Job ${jobId} scheduled for retry`);
  }

  /**
   * Get job by ID
   */
  async getJob(queueName: string, jobId: string): Promise<Job | undefined> {
    const queue = this.getQueue(queueName);
    return queue.getJob(jobId);
  }

  /**
   * Get jobs by status
   */
  async getJobs(
    queueName: string,
    status: "completed" | "waiting" | "active" | "delayed" | "failed",
    start = 0,
    end = -1
  ): Promise<Job[]> {
    const queue = this.getQueue(queueName);
    
    switch (status) {
      case "completed":
        return queue.getCompleted(start, end);
      case "waiting":
        return queue.getWaiting(start, end);
      case "active":
        return queue.getActive(start, end);
      case "delayed":
        return queue.getDelayed(start, end);
      case "failed":
        return queue.getFailed(start, end);
      default:
        return [];
    }
  }

  /**
   * Remove a job
   */
  async removeJob(queueName: string, jobId: string): Promise<void> {
    const job = await this.getJob(queueName, jobId);
    
    if (job) {
      await job.remove();
      logger.info(`Job ${jobId} removed from queue ${queueName}`);
    }
  }

  /**
   * Clean jobs from queue
   */
  async cleanQueue(
    queueName: string,
    grace: number,
    limit: number,
    status?: "completed" | "wait" | "active" | "paused" | "delayed" | "failed"
  ): Promise<string[]> {
    const queue = this.getQueue(queueName);
    return queue.clean(grace, limit, status);
  }

  /**
   * Pause a queue
   */
  async pauseQueue(queueName: string): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.pause();
    logger.info(`Queue ${queueName} paused`);
  }

  /**
   * Resume a queue
   */
  async resumeQueue(queueName: string): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.resume();
    logger.info(`Queue ${queueName} resumed`);
  }

  /**
   * Get queue metrics
   */
  async getQueueMetrics(queueName: string): Promise<QueueMetrics> {
    const queue = this.getQueue(queueName);
    
    const [waiting, active, completed, failed, delayed, isPaused] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
      queue.isPaused(),
    ]);

    // Calculate success rate
    const total = completed + failed;
    const successRate = total > 0 ? (completed / total) * 100 : 0;

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      paused: isPaused,
      successRate,
    };
  }

  /**
   * Drain a queue (remove all jobs)
   */
  async drainQueue(queueName: string): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.drain();
    logger.info(`Queue ${queueName} drained`);
  }

  /**
   * Close all connections
   */
  async close(): Promise<void> {
    // Close all workers
    const workerClosePromises = Array.from(this.workers.values()).map((worker) =>
      worker.close()
    );

    // Close all queue events
    const queueEventClosePromises = Array.from(this.queueEvents.values()).map(
      (queueEvents) => queueEvents.close()
    );

    // Close all queues
    const queueClosePromises = Array.from(this.queues.values()).map((queue) =>
      queue.close()
    );

    await Promise.all([
      ...workerClosePromises,
      ...queueEventClosePromises,
      ...queueClosePromises,
    ]);

    // Close Redis connection
    await this.connection.quit();
    
    logger.info("Queue manager closed");
  }

  /**
   * Get all queue names
   */
  getQueueNames(): string[] {
    return Array.from(this.queues.keys());
  }

  /**
   * Check if a queue exists
   */
  hasQueue(queueName: string): boolean {
    return this.queues.has(queueName);
  }

  /**
   * Get worker for a queue
   */
  getWorker(queueName: string): Worker | undefined {
    return this.workers.get(queueName);
  }
}