export interface TimeEntry {
  id: string;
  projectId: string;
  projectName?: string;
  jobId: string;
  jobTitle?: string;
  description: string;
  startTime: string;
  endTime?: string;
  duration: number; // in seconds
  status: 'running' | 'stopped';
  billable: boolean;
  rate?: number;
  userId?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TimerStartData {
  projectId: string;
  jobId: string;
  projectName?: string;
  jobTitle?: string;
  description?: string;
  billable?: boolean;
  tags?: string[];
}

// Mock data
let mockEntries: TimeEntry[] = [
  {
    id: "te_1",
    projectId: "proj_1",
    projectName: "Website Redesign",
    jobId: "job_1",
    jobTitle: "Homepage Design",
    description: "Working on hero section",
    startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    endTime: new Date().toISOString(),
    duration: 7200,
    status: 'stopped',
    billable: true,
    rate: 150,
    tags: ['design', 'frontend'],
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "te_2",
    projectId: "proj_1",
    projectName: "Website Redesign",
    jobId: "job_2",
    jobTitle: "Navigation Implementation",
    description: "Implementing responsive navigation",
    startTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    duration: 7200,
    status: 'stopped',
    billable: true,
    rate: 150,
    tags: ['development', 'frontend'],
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "te_3",
    projectId: "proj_2",
    projectName: "Mobile App Development",
    jobId: "job_5",
    jobTitle: "User Authentication",
    description: "Setting up OAuth integration",
    startTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() - 21 * 60 * 60 * 1000).toISOString(),
    duration: 10800,
    status: 'stopped',
    billable: true,
    rate: 175,
    tags: ['backend', 'authentication'],
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 21 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "te_4",
    projectId: "proj_3",
    projectName: "E-commerce Platform",
    jobId: "job_8",
    jobTitle: "Payment Gateway Integration",
    description: "Stripe integration and testing",
    startTime: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() - 44 * 60 * 60 * 1000).toISOString(),
    duration: 14400,
    status: 'stopped',
    billable: true,
    rate: 200,
    tags: ['backend', 'payments'],
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 44 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "te_5",
    projectId: "proj_1",
    projectName: "Website Redesign",
    jobId: "job_3",
    jobTitle: "Content Management",
    description: "CMS setup and configuration",
    startTime: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() - 70 * 60 * 60 * 1000).toISOString(),
    duration: 7200,
    status: 'stopped',
    billable: true,
    rate: 150,
    tags: ['backend', 'cms'],
    createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 70 * 60 * 60 * 1000).toISOString()
  }
];

let runningTimer: NodeJS.Timer | null = null;

export const trackerAPI = {
  // Get all entries
  async getEntries(): Promise<TimeEntry[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    return [...mockEntries].sort((a, b) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
  },

  // Get entries by date range
  async getEntriesByRange(startDate: Date, endDate: Date): Promise<TimeEntry[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return mockEntries.filter(entry => {
      const entryDate = new Date(entry.startTime);
      return entryDate >= startDate && entryDate <= endDate;
    });
  },

  // Get entries by project
  async getEntriesByProject(projectId: string): Promise<TimeEntry[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return mockEntries.filter(entry => entry.projectId === projectId);
  },

  // Get entries by job
  async getEntriesByJob(jobId: string): Promise<TimeEntry[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return mockEntries.filter(entry => entry.jobId === jobId);
  },

  // Start timer
  async startTimer(data: TimerStartData): Promise<TimeEntry> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Stop any running timer
    const runningEntry = mockEntries.find(e => e.status === 'running');
    if (runningEntry) {
      await this.stopTimer(runningEntry.id);
    }

    const newEntry: TimeEntry = {
      id: `te_${Date.now()}`,
      projectId: data.projectId,
      projectName: data.projectName,
      jobId: data.jobId,
      jobTitle: data.jobTitle,
      description: data.description || '',
      startTime: new Date().toISOString(),
      duration: 0,
      status: 'running',
      billable: data.billable !== undefined ? data.billable : true,
      tags: data.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    mockEntries.unshift(newEntry);

    // Start updating duration
    if (runningTimer) {
      clearInterval(runningTimer);
    }
    
    runningTimer = setInterval(() => {
      const entry = mockEntries.find(e => e.id === newEntry.id);
      if (entry && entry.status === 'running') {
        const start = new Date(entry.startTime);
        const now = new Date();
        entry.duration = Math.floor((now.getTime() - start.getTime()) / 1000);
      }
    }, 1000);

    return newEntry;
  },

  // Stop timer
  async stopTimer(entryId: string): Promise<TimeEntry> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const entry = mockEntries.find(e => e.id === entryId);
    if (!entry) {
      throw new Error('Entry not found');
    }

    if (entry.status !== 'running') {
      throw new Error('Timer is not running');
    }

    // Calculate final duration
    const start = new Date(entry.startTime);
    const end = new Date();
    
    entry.endTime = end.toISOString();
    entry.duration = Math.floor((end.getTime() - start.getTime()) / 1000);
    entry.status = 'stopped';
    entry.updatedAt = end.toISOString();

    // Clear the interval
    if (runningTimer) {
      clearInterval(runningTimer);
      runningTimer = null;
    }

    return entry;
  },

  // Create manual entry
  async createEntry(data: Partial<TimeEntry>): Promise<TimeEntry> {
    await new Promise(resolve => setTimeout(resolve, 100));

    const startTime = data.startTime || new Date().toISOString();
    const endTime = data.endTime || new Date().toISOString();
    const duration = data.duration || Math.floor(
      (new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000
    );

    const newEntry: TimeEntry = {
      id: `te_${Date.now()}`,
      projectId: data.projectId || '',
      jobId: data.jobId || '',
      description: data.description || '',
      startTime,
      endTime,
      duration,
      status: 'stopped',
      billable: data.billable !== undefined ? data.billable : true,
      rate: data.rate,
      tags: data.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    mockEntries.unshift(newEntry);
    return newEntry;
  },

  // Update entry
  async updateEntry(entryId: string, data: Partial<TimeEntry>): Promise<TimeEntry> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const index = mockEntries.findIndex(e => e.id === entryId);
    if (index === -1) {
      throw new Error('Entry not found');
    }

    // If updating start/end time, recalculate duration
    if (data.startTime || data.endTime) {
      const start = new Date(data.startTime || mockEntries[index].startTime);
      const end = data.endTime ? new Date(data.endTime) : 
                  mockEntries[index].endTime ? new Date(mockEntries[index].endTime!) :
                  new Date();
      data.duration = Math.floor((end.getTime() - start.getTime()) / 1000);
    }

    mockEntries[index] = {
      ...mockEntries[index],
      ...data,
      updatedAt: new Date().toISOString()
    };

    return mockEntries[index];
  },

  // Delete entry
  async deleteEntry(entryId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const index = mockEntries.findIndex(e => e.id === entryId);
    if (index === -1) {
      throw new Error('Entry not found');
    }

    // If it's running, clear the timer
    if (mockEntries[index].status === 'running' && runningTimer) {
      clearInterval(runningTimer);
      runningTimer = null;
    }

    mockEntries.splice(index, 1);
  },

  // Get running timer
  async getRunningTimer(): Promise<TimeEntry | null> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return mockEntries.find(e => e.status === 'running') || null;
  },

  // Get stats
  async getStats(startDate?: Date, endDate?: Date): Promise<{
    totalTime: number;
    billableTime: number;
    nonBillableTime: number;
    totalRevenue: number;
    projectBreakdown: { projectId: string; time: number; revenue: number }[];
  }> {
    await new Promise(resolve => setTimeout(resolve, 100));

    let entries = mockEntries;
    if (startDate && endDate) {
      entries = entries.filter(entry => {
        const entryDate = new Date(entry.startTime);
        return entryDate >= startDate && entryDate <= endDate;
      });
    }

    const totalTime = entries.reduce((sum, e) => sum + e.duration, 0);
    const billableTime = entries
      .filter(e => e.billable)
      .reduce((sum, e) => sum + e.duration, 0);
    const nonBillableTime = totalTime - billableTime;
    
    const totalRevenue = entries
      .filter(e => e.billable && e.rate)
      .reduce((sum, e) => sum + (e.duration / 3600 * (e.rate || 0)), 0);

    const projectMap = new Map<string, { time: number; revenue: number }>();
    entries.forEach(entry => {
      const existing = projectMap.get(entry.projectId) || { time: 0, revenue: 0 };
      existing.time += entry.duration;
      if (entry.billable && entry.rate) {
        existing.revenue += (entry.duration / 3600 * entry.rate);
      }
      projectMap.set(entry.projectId, existing);
    });

    return {
      totalTime,
      billableTime,
      nonBillableTime,
      totalRevenue,
      projectBreakdown: Array.from(projectMap.entries()).map(([projectId, data]) => ({
        projectId,
        ...data
      }))
    };
  }
};