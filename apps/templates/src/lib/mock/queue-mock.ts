export interface MockJob {
  id: string;
  queue: "email" | "invoice" | "sync" | "export" | "webhook";
  type: string;
  status: "pending" | "processing" | "completed" | "failed" | "retrying";
  priority: number;
  attempts: number;
  maxAttempts: number;
  progress: number;
  data: any;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
  completedAt?: Date;
}

export interface MockQueue {
  name: string;
  active: number;
  waiting: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
  throughput: number;
  avgProcessTime: number;
}

export interface MockWorker {
  id: string;
  name: string;
  status: "idle" | "busy" | "offline";
  currentJob?: string;
  processedJobs: number;
  failedJobs: number;
  lastActive: Date;
  cpu: number;
  memory: number;
}

const jobTypes = {
  email: ["send", "batch-send", "template-process"],
  invoice: ["generate", "send", "reminder", "reconcile"],
  sync: ["full-sync", "incremental-sync", "webhook-sync"],
  export: ["pdf", "csv", "excel", "json"],
  webhook: ["delivery", "retry", "batch"],
};

export const mockJobs: MockJob[] = [
  {
    id: "job_1",
    queue: "email",
    type: "send",
    status: "completed",
    priority: 1,
    attempts: 1,
    maxAttempts: 3,
    progress: 100,
    data: { to: "customer@example.com", subject: "Invoice #1234" },
    createdAt: new Date(Date.now() - 3600000),
    updatedAt: new Date(Date.now() - 3000000),
    processedAt: new Date(Date.now() - 3500000),
    completedAt: new Date(Date.now() - 3000000),
  },
  {
    id: "job_2",
    queue: "invoice",
    type: "generate",
    status: "processing",
    priority: 2,
    attempts: 1,
    maxAttempts: 3,
    progress: 65,
    data: { invoiceId: "inv_5678", customerId: "cus_123" },
    createdAt: new Date(Date.now() - 600000),
    updatedAt: new Date(Date.now() - 100000),
    processedAt: new Date(Date.now() - 500000),
  },
  {
    id: "job_3",
    queue: "sync",
    type: "full-sync",
    status: "failed",
    priority: 1,
    attempts: 3,
    maxAttempts: 3,
    progress: 45,
    data: { provider: "stripe", accountId: "acc_789" },
    error: "Connection timeout after 30 seconds",
    createdAt: new Date(Date.now() - 7200000),
    updatedAt: new Date(Date.now() - 6000000),
  },
  {
    id: "job_4",
    queue: "export",
    type: "pdf",
    status: "pending",
    priority: 3,
    attempts: 0,
    maxAttempts: 3,
    progress: 0,
    data: { reportType: "monthly", period: "2024-10" },
    createdAt: new Date(Date.now() - 60000),
    updatedAt: new Date(Date.now() - 60000),
  },
  {
    id: "job_5",
    queue: "webhook",
    type: "delivery",
    status: "retrying",
    priority: 1,
    attempts: 2,
    maxAttempts: 5,
    progress: 0,
    data: { url: "https://api.client.com/webhook", event: "invoice.paid" },
    error: "HTTP 503: Service unavailable",
    createdAt: new Date(Date.now() - 1800000),
    updatedAt: new Date(Date.now() - 300000),
  },
];

export const mockQueues: MockQueue[] = [
  {
    name: "email",
    active: 2,
    waiting: 15,
    completed: 1234,
    failed: 12,
    delayed: 5,
    paused: false,
    throughput: 250,
    avgProcessTime: 1.2,
  },
  {
    name: "invoice",
    active: 1,
    waiting: 8,
    completed: 567,
    failed: 3,
    delayed: 2,
    paused: false,
    throughput: 120,
    avgProcessTime: 3.5,
  },
  {
    name: "sync",
    active: 3,
    waiting: 4,
    completed: 89,
    failed: 7,
    delayed: 0,
    paused: false,
    throughput: 30,
    avgProcessTime: 15.2,
  },
  {
    name: "export",
    active: 0,
    waiting: 12,
    completed: 234,
    failed: 1,
    delayed: 3,
    paused: false,
    throughput: 50,
    avgProcessTime: 8.7,
  },
  {
    name: "webhook",
    active: 4,
    waiting: 28,
    completed: 3456,
    failed: 45,
    delayed: 10,
    paused: false,
    throughput: 500,
    avgProcessTime: 0.8,
  },
];

export const mockWorkers: MockWorker[] = [
  {
    id: "worker_1",
    name: "worker-01",
    status: "busy",
    currentJob: "job_2",
    processedJobs: 1523,
    failedJobs: 12,
    lastActive: new Date(),
    cpu: 45,
    memory: 62,
  },
  {
    id: "worker_2",
    name: "worker-02",
    status: "idle",
    processedJobs: 1456,
    failedJobs: 8,
    lastActive: new Date(Date.now() - 60000),
    cpu: 12,
    memory: 34,
  },
  {
    id: "worker_3",
    name: "worker-03",
    status: "busy",
    currentJob: "job_5",
    processedJobs: 1678,
    failedJobs: 15,
    lastActive: new Date(),
    cpu: 78,
    memory: 81,
  },
  {
    id: "worker_4",
    name: "worker-04",
    status: "offline",
    processedJobs: 923,
    failedJobs: 5,
    lastActive: new Date(Date.now() - 3600000),
    cpu: 0,
    memory: 0,
  },
];

// Mock API functions
export const queueAPI = {
  getJobs: async (queue?: string, status?: string): Promise<MockJob[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    let jobs = [...mockJobs];
    if (queue) {
      jobs = jobs.filter(j => j.queue === queue);
    }
    if (status) {
      jobs = jobs.filter(j => j.status === status);
    }
    return jobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  getQueues: async (): Promise<MockQueue[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockQueues;
  },

  getWorkers: async (): Promise<MockWorker[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockWorkers;
  },

  retryJob: async (jobId: string): Promise<{ success: boolean }> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true };
  },

  cancelJob: async (jobId: string): Promise<{ success: boolean }> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true };
  },

  pauseQueue: async (queueName: string): Promise<{ success: boolean }> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true };
  },

  resumeQueue: async (queueName: string): Promise<{ success: boolean }> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true };
  },

  getJobDetails: async (jobId: string): Promise<MockJob | null> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockJobs.find(j => j.id === jobId) || null;
  },

  getQueueMetrics: async (queueName: string, period: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const hours = period === "1h" ? 1 : period === "24h" ? 24 : 168;
    const dataPoints = [];
    for (let i = 0; i < hours; i++) {
      dataPoints.push({
        timestamp: new Date(Date.now() - (hours - i) * 3600000),
        processed: Math.floor(Math.random() * 100) + 50,
        failed: Math.floor(Math.random() * 10),
        avgTime: Math.random() * 5 + 1,
      });
    }
    return dataPoints;
  },
};