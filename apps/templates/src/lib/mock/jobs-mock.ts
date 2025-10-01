export interface MockProject {
  id: string;
  name: string;
  description?: string;
  client: {
    id: string;
    name: string;
    email: string;
  };
  status: "active" | "completed" | "on_hold" | "cancelled";
  startDate: string;
  endDate?: string;
  budget?: number;
  totalHours: number;
  completedHours: number;
  color: string;
}

export interface MockJob {
  id: string;
  title: string;
  description?: string;
  projectId?: string;
  projectName?: string;
  client: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  assignee?: {
    id: string;
    name: string;
    avatar?: string;
  };
  status: "pending" | "in_progress" | "completed" | "on_hold" | "cancelled" | "overdue";
  priority: "low" | "medium" | "high" | "urgent";
  startDate?: string;
  dueDate?: string;
  completedDate?: string;
  estimatedHours: number;
  actualHours: number;
  hourlyRate: number;
  progress: number;
  tags?: string[];
  attachments?: string[];
  comments?: {
    id: string;
    author: string;
    content: string;
    createdAt: string;
  }[];
  timeEntries?: {
    id: string;
    date: string;
    hours: number;
    description: string;
    userId: string;
  }[];
  milestones?: {
    id: string;
    name: string;
    dueDate: string;
    completed: boolean;
  }[];
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
  "User Research",
  "Wireframing",
  "Logo Design",
  "SEO Optimization",
  "Analytics Setup",
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

const assigneeNames = [
  "John Smith",
  "Sarah Johnson",
  "Mike Chen",
  "Emily Davis",
  "Alex Thompson",
  "Lisa Anderson",
  "David Wilson",
  "Rachel Green",
];

const tags = ["urgent", "client-review", "blocked", "needs-approval", "bug-fix", "feature", "enhancement", "research"];

function generateProjects(count: number): MockProject[] {
  const projects: MockProject[] = [];
  const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#74B9FF", "#A29BFE", "#FD79A8"];
  
  for (let i = 0; i < count; i++) {
    const startDate = new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000);
    const totalHours = Math.floor(Math.random() * 500) + 100;
    const completedHours = Math.floor(Math.random() * totalHours);
    const status = completedHours === totalHours ? "completed" : 
                  Math.random() > 0.8 ? "on_hold" : "active";
    
    projects.push({
      id: `proj_${i + 1}`,
      name: projectNames[i % projectNames.length],
      description: "Project description for " + projectNames[i % projectNames.length],
      client: {
        id: `client_${i + 1}`,
        name: clientNames[i % clientNames.length],
        email: `contact@${clientNames[i % clientNames.length].toLowerCase().replace(/\s+/g, '')}.com`,
      },
      status,
      startDate: startDate.toISOString(),
      endDate: status === "completed" ? new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      budget: Math.floor(Math.random() * 100000) + 10000,
      totalHours,
      completedHours,
      color: colors[i % colors.length],
    });
  }
  
  return projects;
}

function generateJobs(count: number, projects: MockProject[]): MockJob[] {
  const jobs: MockJob[] = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const project = projects[Math.floor(Math.random() * projects.length)];
    const estimatedHours = Math.floor(Math.random() * 40) + 5;
    const progress = Math.floor(Math.random() * 101);
    const actualHours = (estimatedHours * progress / 100) + (Math.random() * 5 - 2.5);
    
    const createdDaysAgo = Math.floor(Math.random() * 60);
    const createdAt = new Date(now.getTime() - createdDaysAgo * 24 * 60 * 60 * 1000);
    const dueDate = new Date(createdAt.getTime() + (Math.floor(Math.random() * 30) + 7) * 24 * 60 * 60 * 1000);
    
    let status: MockJob["status"] = "pending";
    if (progress === 100) {
      status = "completed";
    } else if (progress > 0) {
      status = "in_progress";
    } else if (dueDate < now && progress < 100) {
      status = "overdue";
    } else if (Math.random() > 0.9) {
      status = "on_hold";
    }
    
    const priority = ["low", "medium", "high", "urgent"][Math.floor(Math.random() * 4)] as MockJob["priority"];
    const assignee = Math.random() > 0.2 ? {
      id: `user_${Math.floor(Math.random() * 8) + 1}`,
      name: assigneeNames[Math.floor(Math.random() * assigneeNames.length)],
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`,
    } : undefined;
    
    const job: MockJob = {
      id: `job_${i + 1}`,
      title: jobTitles[Math.floor(Math.random() * jobTitles.length)],
      description: "Job description with detailed requirements and specifications",
      projectId: project.id,
      projectName: project.name,
      client: project.client,
      assignee,
      status,
      priority,
      startDate: status !== "pending" ? new Date(createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      dueDate: dueDate.toISOString(),
      completedDate: status === "completed" ? new Date(Math.min(dueDate.getTime(), now.getTime())).toISOString() : undefined,
      estimatedHours,
      actualHours: Math.max(0, actualHours),
      hourlyRate: Math.floor(Math.random() * 100) + 50,
      progress,
      tags: Math.random() > 0.5 ? [tags[Math.floor(Math.random() * tags.length)]] : undefined,
      createdAt: createdAt.toISOString(),
      updatedAt: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      timeEntries: status !== "pending" ? [
        {
          id: `entry_${i}_1`,
          date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          hours: Math.random() * 4 + 1,
          description: "Initial work on task",
          userId: assignee?.id || "user_1",
        },
        {
          id: `entry_${i}_2`,
          date: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
          hours: Math.random() * 3 + 2,
          description: "Continued development",
          userId: assignee?.id || "user_1",
        },
      ] : undefined,
      milestones: estimatedHours > 20 ? [
        {
          id: `milestone_${i}_1`,
          name: "Initial Draft",
          dueDate: new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          completed: progress > 30,
        },
        {
          id: `milestone_${i}_2`,
          name: "Review & Feedback",
          dueDate: new Date(createdAt.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          completed: progress > 70,
        },
        {
          id: `milestone_${i}_3`,
          name: "Final Delivery",
          dueDate: dueDate.toISOString(),
          completed: progress === 100,
        },
      ] : undefined,
    };
    
    jobs.push(job);
  }
  
  return jobs.sort((a, b) => {
    // Sort by priority first, then by due date
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });
}

// Mock API
export const jobsAPI = {
  getJobs: async (): Promise<MockJob[]> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const projects = generateProjects(10);
    return generateJobs(100, projects);
  },

  getProjects: async (): Promise<MockProject[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return generateProjects(10);
  },

  getJob: async (id: string): Promise<MockJob | null> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const projects = generateProjects(10);
    const jobs = generateJobs(100, projects);
    return jobs.find(j => j.id === id) || null;
  },

  createJob: async (data: Partial<MockJob>): Promise<MockJob> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      id: `job_${Date.now()}`,
      title: data.title || "New Job",
      status: "pending",
      priority: "medium",
      estimatedHours: 10,
      actualHours: 0,
      hourlyRate: 100,
      progress: 0,
      client: data.client || {
        id: "client_1",
        name: "Default Client",
        email: "client@example.com",
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    } as MockJob;
  },

  updateJob: async (id: string, data: Partial<MockJob>): Promise<MockJob> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    const projects = generateProjects(10);
    const jobs = generateJobs(100, projects);
    const job = jobs.find(j => j.id === id);
    if (!job) throw new Error("Job not found");
    return { ...job, ...data, updatedAt: new Date().toISOString() };
  },

  deleteJob: async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));
  },

  createProject: async (data: Partial<MockProject>): Promise<MockProject> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      id: `proj_${Date.now()}`,
      name: data.name || "New Project",
      status: "active",
      startDate: new Date().toISOString(),
      totalHours: 0,
      completedHours: 0,
      color: "#4ECDC4",
      client: data.client || {
        id: "client_1",
        name: "Default Client",
        email: "client@example.com",
      },
      ...data,
    } as MockProject;
  },
};