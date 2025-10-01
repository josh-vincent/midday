export interface MockTimeEntry {
  id: string;
  description: string;
  projectId?: string;
  projectName?: string;
  jobId?: string;
  jobName?: string;
  clientId: string;
  clientName: string;
  userId: string;
  userName: string;
  startTime: string;
  endTime?: string;
  duration: number; // in minutes
  date: string;
  billable: boolean;
  billed: boolean;
  hourlyRate: number;
  tags?: string[];
  notes?: string;
  status: "running" | "paused" | "stopped";
  createdAt: string;
  updatedAt: string;
}

export interface MockTimer {
  id: string;
  startTime: string;
  pausedDuration: number; // in minutes
  isPaused: boolean;
  description: string;
  projectId?: string;
  jobId?: string;
  userId: string;
  createdAt: string;
}

export interface MockTimesheet {
  id: string;
  userId: string;
  weekStarting: string;
  entries: MockTimeEntry[];
  totalHours: number;
  totalBillable: number;
  approved: boolean;
  submittedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const projectNames = [
  "Website Redesign",
  "Mobile App Development", 
  "Marketing Campaign",
  "E-commerce Platform",
  "CRM Implementation",
  "Data Migration",
  "Security Audit",
  "API Development",
  "Brand Identity",
  "Content Strategy",
];

const jobTitles = [
  "Frontend Development",
  "Backend API Integration",
  "Database Design",
  "UI/UX Design",
  "Content Creation",
  "Testing & QA",
  "Performance Optimization",
  "Security Review",
  "Documentation",
  "Deployment Setup",
];

const clientNames = [
  "Acme Corporation",
  "TechStart Inc",
  "Global Services Ltd",
  "Digital Agency Co",
  "Enterprise Solutions",
  "Innovate Labs",
  "Creative Studios",
  "Future Tech",
  "Smart Systems",
  "Cloud Dynamics",
];

const userNames = [
  "John Smith",
  "Sarah Johnson",
  "Mike Chen",
  "Emily Davis",
  "Alex Thompson",
  "Lisa Anderson",
  "David Wilson",
  "Rachel Green",
];

const timeDescriptions = [
  "Working on user authentication",
  "Implementing payment gateway",
  "Code review and testing",
  "Client meeting preparation",
  "Bug fixes and optimizations",
  "Research and documentation",
  "Design mockups",
  "Database optimization",
  "API endpoint development",
  "Performance monitoring",
  "Security implementation",
  "Feature development",
  "User interface updates",
  "Integration testing",
  "Deployment preparation",
];

const tags = ["development", "design", "meeting", "testing", "documentation", "research", "bug-fix", "feature", "optimization"];

function generateTimeEntries(count: number): MockTimeEntry[] {
  const entries: MockTimeEntry[] = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const entryDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    
    // Generate start time (8 AM to 6 PM)
    const startHour = Math.floor(Math.random() * 10) + 8;
    const startMinute = Math.floor(Math.random() * 60);
    const startTime = new Date(entryDate);
    startTime.setHours(startHour, startMinute, 0, 0);
    
    // Generate duration (15 minutes to 8 hours)
    const duration = Math.floor(Math.random() * 465) + 15; // 15 minutes to 8 hours
    const endTime = new Date(startTime.getTime() + duration * 60 * 1000);
    
    const billable = Math.random() > 0.2; // 80% billable
    const hourlyRate = Math.floor(Math.random() * 100) + 50;
    const clientIndex = Math.floor(Math.random() * clientNames.length);
    const userIndex = Math.floor(Math.random() * userNames.length);
    
    const hasProject = Math.random() > 0.3;
    const projectIndex = hasProject ? Math.floor(Math.random() * projectNames.length) : null;
    const hasJob = hasProject && Math.random() > 0.4;
    const jobIndex = hasJob ? Math.floor(Math.random() * jobTitles.length) : null;
    
    const entry: MockTimeEntry = {
      id: `time_${i + 1}`,
      description: timeDescriptions[Math.floor(Math.random() * timeDescriptions.length)],
      projectId: hasProject ? `proj_${projectIndex! + 1}` : undefined,
      projectName: hasProject ? projectNames[projectIndex!] : undefined,
      jobId: hasJob ? `job_${jobIndex! + 1}` : undefined,
      jobName: hasJob ? jobTitles[jobIndex!] : undefined,
      clientId: `client_${clientIndex + 1}`,
      clientName: clientNames[clientIndex],
      userId: `user_${userIndex + 1}`,
      userName: userNames[userIndex],
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration,
      date: entryDate.toISOString().split('T')[0],
      billable,
      billed: billable && Math.random() > 0.4, // 60% of billable entries are billed
      hourlyRate,
      tags: Math.random() > 0.5 ? [tags[Math.floor(Math.random() * tags.length)]] : undefined,
      notes: Math.random() > 0.7 ? "Additional notes about the work performed" : undefined,
      status: "stopped",
      createdAt: startTime.toISOString(),
      updatedAt: endTime.toISOString(),
    };
    
    entries.push(entry);
  }
  
  return entries.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
}

function generateActiveTimers(count: number): MockTimer[] {
  const timers: MockTimer[] = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const startTime = new Date(now.getTime() - Math.random() * 4 * 60 * 60 * 1000); // Started up to 4 hours ago
    const isPaused = Math.random() > 0.7;
    const pausedDuration = isPaused ? Math.floor(Math.random() * 30) : 0; // Up to 30 minutes paused
    
    const timer: MockTimer = {
      id: `timer_${i + 1}`,
      startTime: startTime.toISOString(),
      pausedDuration,
      isPaused,
      description: timeDescriptions[Math.floor(Math.random() * timeDescriptions.length)],
      projectId: Math.random() > 0.5 ? `proj_${Math.floor(Math.random() * 10) + 1}` : undefined,
      jobId: Math.random() > 0.5 ? `job_${Math.floor(Math.random() * 10) + 1}` : undefined,
      userId: `user_${Math.floor(Math.random() * userNames.length) + 1}`,
      createdAt: startTime.toISOString(),
    };
    
    timers.push(timer);
  }
  
  return timers;
}

function generateTimesheets(count: number, entries: MockTimeEntry[]): MockTimesheet[] {
  const timesheets: MockTimesheet[] = [];
  const now = new Date();
  
  // Group entries by user and week
  const entriesByUserWeek = new Map<string, MockTimeEntry[]>();
  
  entries.forEach(entry => {
    const entryDate = new Date(entry.date);
    const weekStart = new Date(entryDate);
    weekStart.setDate(entryDate.getDate() - entryDate.getDay()); // Start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0);
    
    const key = `${entry.userId}_${weekStart.toISOString().split('T')[0]}`;
    
    if (!entriesByUserWeek.has(key)) {
      entriesByUserWeek.set(key, []);
    }
    entriesByUserWeek.get(key)!.push(entry);
  });
  
  let timesheetId = 1;
  entriesByUserWeek.forEach((weekEntries, key) => {
    const [userId, weekStarting] = key.split('_');
    const totalHours = weekEntries.reduce((sum, entry) => sum + entry.duration / 60, 0);
    const totalBillable = weekEntries.filter(e => e.billable).reduce((sum, entry) => sum + entry.duration / 60, 0);
    
    const approved = Math.random() > 0.3; // 70% approved
    const submitted = approved || Math.random() > 0.2; // 80% submitted
    
    const timesheet: MockTimesheet = {
      id: `timesheet_${timesheetId++}`,
      userId,
      weekStarting,
      entries: weekEntries,
      totalHours,
      totalBillable,
      approved,
      submittedAt: submitted ? new Date(new Date(weekStarting).getTime() + 6 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      approvedBy: approved ? `user_${Math.floor(Math.random() * userNames.length) + 1}` : undefined,
      approvedAt: approved ? new Date(new Date(weekStarting).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      createdAt: weekStarting,
      updatedAt: new Date().toISOString(),
    };
    
    timesheets.push(timesheet);
  });
  
  return timesheets.sort((a, b) => new Date(b.weekStarting).getTime() - new Date(a.weekStarting).getTime());
}

// Mock API
export const timeAPI = {
  getTimeEntries: async (filters?: {
    userId?: string;
    projectId?: string;
    clientId?: string;
    startDate?: string;
    endDate?: string;
    billable?: boolean;
    status?: string;
  }): Promise<MockTimeEntry[]> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    let entries = generateTimeEntries(200);
    
    if (filters) {
      if (filters.userId) entries = entries.filter(e => e.userId === filters.userId);
      if (filters.projectId) entries = entries.filter(e => e.projectId === filters.projectId);
      if (filters.clientId) entries = entries.filter(e => e.clientId === filters.clientId);
      if (filters.startDate) entries = entries.filter(e => e.date >= filters.startDate!);
      if (filters.endDate) entries = entries.filter(e => e.date <= filters.endDate!);
      if (filters.billable !== undefined) entries = entries.filter(e => e.billable === filters.billable);
      if (filters.status) entries = entries.filter(e => e.status === filters.status);
    }
    
    return entries;
  },

  getActiveTimers: async (userId?: string): Promise<MockTimer[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    let timers = generateActiveTimers(3);
    
    if (userId) {
      timers = timers.filter(t => t.userId === userId);
    }
    
    return timers;
  },

  getTimesheets: async (userId?: string): Promise<MockTimesheet[]> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const entries = generateTimeEntries(200);
    let timesheets = generateTimesheets(20, entries);
    
    if (userId) {
      timesheets = timesheets.filter(t => t.userId === userId);
    }
    
    return timesheets;
  },

  getTimeEntry: async (id: string): Promise<MockTimeEntry | null> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const entries = generateTimeEntries(200);
    return entries.find(e => e.id === id) || null;
  },

  createTimeEntry: async (data: Partial<MockTimeEntry>): Promise<MockTimeEntry> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const now = new Date();
    const startTime = data.startTime ? new Date(data.startTime) : now;
    const endTime = data.endTime ? new Date(data.endTime) : new Date(startTime.getTime() + 60 * 60 * 1000);
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60));
    
    return {
      id: `time_${Date.now()}`,
      description: data.description || "New time entry",
      projectId: data.projectId,
      projectName: data.projectName,
      jobId: data.jobId,
      jobName: data.jobName,
      clientId: data.clientId || "client_1",
      clientName: data.clientName || "Default Client",
      userId: data.userId || "user_1",
      userName: data.userName || "Current User",
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration,
      date: startTime.toISOString().split('T')[0],
      billable: data.billable ?? true,
      billed: false,
      hourlyRate: data.hourlyRate || 100,
      tags: data.tags,
      notes: data.notes,
      status: "stopped",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      ...data,
    } as MockTimeEntry;
  },

  updateTimeEntry: async (id: string, data: Partial<MockTimeEntry>): Promise<MockTimeEntry> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    const entries = generateTimeEntries(200);
    const entry = entries.find(e => e.id === id);
    if (!entry) throw new Error("Time entry not found");
    
    const updated = { ...entry, ...data, updatedAt: new Date().toISOString() };
    
    // Recalculate duration if start or end time changed
    if (data.startTime || data.endTime) {
      const startTime = new Date(data.startTime || entry.startTime);
      const endTime = new Date(data.endTime || entry.endTime!);
      updated.duration = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60));
    }
    
    return updated;
  },

  deleteTimeEntry: async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));
  },

  startTimer: async (data: {
    description: string;
    projectId?: string;
    jobId?: string;
    userId: string;
  }): Promise<MockTimer> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      id: `timer_${Date.now()}`,
      startTime: new Date().toISOString(),
      pausedDuration: 0,
      isPaused: false,
      description: data.description,
      projectId: data.projectId,
      jobId: data.jobId,
      userId: data.userId,
      createdAt: new Date().toISOString(),
    };
  },

  stopTimer: async (id: string): Promise<MockTimeEntry> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const timers = generateActiveTimers(5);
    const timer = timers.find(t => t.id === id);
    if (!timer) throw new Error("Timer not found");
    
    const now = new Date();
    const startTime = new Date(timer.startTime);
    const duration = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60)) - timer.pausedDuration;
    
    return {
      id: `time_${Date.now()}`,
      description: timer.description,
      projectId: timer.projectId,
      projectName: timer.projectId ? projectNames[0] : undefined,
      jobId: timer.jobId,
      jobName: timer.jobId ? jobTitles[0] : undefined,
      clientId: "client_1",
      clientName: "Default Client",
      userId: timer.userId,
      userName: "Current User",
      startTime: timer.startTime,
      endTime: now.toISOString(),
      duration,
      date: now.toISOString().split('T')[0],
      billable: true,
      billed: false,
      hourlyRate: 100,
      status: "stopped",
      createdAt: timer.createdAt,
      updatedAt: now.toISOString(),
    };
  },

  pauseTimer: async (id: string): Promise<MockTimer> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const timers = generateActiveTimers(5);
    const timer = timers.find(t => t.id === id);
    if (!timer) throw new Error("Timer not found");
    
    return { ...timer, isPaused: true };
  },

  resumeTimer: async (id: string): Promise<MockTimer> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const timers = generateActiveTimers(5);
    const timer = timers.find(t => t.id === id);
    if (!timer) throw new Error("Timer not found");
    
    return { ...timer, isPaused: false };
  },

  bulkUpdateEntries: async (ids: string[], data: Partial<MockTimeEntry>): Promise<MockTimeEntry[]> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const entries = generateTimeEntries(200);
    return entries.filter(e => ids.includes(e.id)).map(e => ({ ...e, ...data, updatedAt: new Date().toISOString() }));
  },

  exportTimeEntries: async (filters?: any): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return "https://example.com/download/timesheet.csv";
  },

  submitTimesheet: async (timesheetId: string): Promise<MockTimesheet> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const entries = generateTimeEntries(200);
    const timesheets = generateTimesheets(20, entries);
    const timesheet = timesheets.find(t => t.id === timesheetId);
    if (!timesheet) throw new Error("Timesheet not found");
    
    return { 
      ...timesheet, 
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  },

  approveTimesheet: async (timesheetId: string, approverId: string): Promise<MockTimesheet> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const entries = generateTimeEntries(200);
    const timesheets = generateTimesheets(20, entries);
    const timesheet = timesheets.find(t => t.id === timesheetId);
    if (!timesheet) throw new Error("Timesheet not found");
    
    return { 
      ...timesheet, 
      approved: true,
      approvedBy: approverId,
      approvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  },
};