export interface MockEmail {
  id: string;
  from: {
    name: string;
    email: string;
  };
  to: string[];
  subject: string;
  snippet: string;
  body?: string;
  date: Date;
  read: boolean;
  starred: boolean;
  important: boolean;
  labels: string[];
  attachments?: {
    name: string;
    size: number;
    type: string;
  }[];
  provider: "gmail" | "outlook";
}

export interface MockFolder {
  id: string;
  name: string;
  type: "inbox" | "sent" | "drafts" | "trash" | "spam" | "custom";
  count: number;
  unreadCount: number;
  icon?: string;
  provider: "gmail" | "outlook";
}

export interface MockThread {
  id: string;
  subject: string;
  participants: string[];
  messageCount: number;
  lastMessage: Date;
  snippet: string;
  unread: boolean;
  important: boolean;
}

export interface MockEmailSync {
  id: string;
  provider: "gmail" | "outlook";
  status: "idle" | "syncing" | "completed" | "failed";
  lastSync: Date;
  messagesScanned: number;
  messagesSynced: number;
  errors: number;
  progress: number;
}

// Generate mock emails
export const mockEmails: MockEmail[] = [
  {
    id: "email_1",
    from: {
      name: "Sarah Johnson",
      email: "sarah.johnson@techcorp.com",
    },
    to: ["you@company.com"],
    subject: "Q4 Revenue Report Ready",
    snippet: "Hi team, The Q4 revenue report is now ready for review. Please find the attached...",
    body: "Hi team,\n\nThe Q4 revenue report is now ready for review. Please find the attached document with detailed analysis of our performance.\n\nKey highlights:\n- Revenue up 23% YoY\n- New customer acquisition increased by 45%\n- Retention rate at 95%\n\nBest regards,\nSarah",
    date: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    read: false,
    starred: true,
    important: true,
    labels: ["work", "reports"],
    attachments: [
      {
        name: "Q4_Revenue_Report.pdf",
        size: 2456789,
        type: "application/pdf",
      },
    ],
    provider: "gmail",
  },
  {
    id: "email_2",
    from: {
      name: "Mike Chen",
      email: "mike@designstudio.io",
    },
    to: ["you@company.com"],
    subject: "New mockups for review",
    snippet: "Hey! I've completed the new mockups for the dashboard. They include all the changes we discussed...",
    date: new Date(Date.now() - 4 * 60 * 60 * 1000),
    read: true,
    starred: false,
    important: false,
    labels: ["design", "project"],
    attachments: [
      {
        name: "Dashboard_Mockups_v2.fig",
        size: 5432100,
        type: "application/octet-stream",
      },
    ],
    provider: "gmail",
  },
  {
    id: "email_3",
    from: {
      name: "Emily Rodriguez",
      email: "emily.r@partner.com",
    },
    to: ["you@company.com", "team@company.com"],
    subject: "Partnership Proposal - Follow Up",
    snippet: "Following up on our conversation last week about the potential partnership. I've prepared a detailed proposal...",
    date: new Date(Date.now() - 24 * 60 * 60 * 1000),
    read: true,
    starred: true,
    important: true,
    labels: ["partnership", "follow-up"],
    provider: "outlook",
  },
  {
    id: "email_4",
    from: {
      name: "System Notifications",
      email: "noreply@stripe.com",
    },
    to: ["you@company.com"],
    subject: "Payment received - Invoice #INV-2024-1234",
    snippet: "You've received a payment of $2,499.00 from Acme Corporation...",
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    read: true,
    starred: false,
    important: false,
    labels: ["stripe", "payments"],
    provider: "gmail",
  },
  {
    id: "email_5",
    from: {
      name: "David Park",
      email: "david@customer.com",
    },
    to: ["support@company.com"],
    subject: "Issue with subscription billing",
    snippet: "Hi, I'm having an issue with my subscription. I was charged twice this month...",
    date: new Date(Date.now() - 5 * 60 * 60 * 1000),
    read: false,
    starred: false,
    important: true,
    labels: ["support", "urgent"],
    provider: "outlook",
  },
  {
    id: "email_6",
    from: {
      name: "Newsletter",
      email: "weekly@techdigest.com",
    },
    to: ["you@company.com"],
    subject: "Weekly Tech Digest: AI Updates & More",
    snippet: "This week's top stories: OpenAI announces new features, Google's latest AI research...",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    read: true,
    starred: false,
    important: false,
    labels: ["newsletter"],
    provider: "gmail",
  },
  {
    id: "email_7",
    from: {
      name: "Alex Thompson",
      email: "alex.t@development.com",
    },
    to: ["you@company.com"],
    subject: "Code review completed - PR #456",
    snippet: "I've completed the code review for your pull request. Everything looks good with a few minor suggestions...",
    date: new Date(Date.now() - 6 * 60 * 60 * 1000),
    read: true,
    starred: false,
    important: false,
    labels: ["development", "code-review"],
    provider: "gmail",
  },
  {
    id: "email_8",
    from: {
      name: "HR Department",
      email: "hr@company.com",
    },
    to: ["all@company.com"],
    subject: "Important: Updated Remote Work Policy",
    snippet: "Dear team, We're updating our remote work policy effective next month. Please review the attached document...",
    date: new Date(Date.now() - 12 * 60 * 60 * 1000),
    read: false,
    starred: true,
    important: true,
    labels: ["hr", "policy", "important"],
    attachments: [
      {
        name: "Remote_Work_Policy_2025.pdf",
        size: 1234567,
        type: "application/pdf",
      },
    ],
    provider: "outlook",
  },
];

// Generate mock folders
export const mockFolders: MockFolder[] = [
  {
    id: "folder_1",
    name: "Inbox",
    type: "inbox",
    count: 156,
    unreadCount: 23,
    icon: "📥",
    provider: "gmail",
  },
  {
    id: "folder_2",
    name: "Sent",
    type: "sent",
    count: 89,
    unreadCount: 0,
    icon: "📤",
    provider: "gmail",
  },
  {
    id: "folder_3",
    name: "Drafts",
    type: "drafts",
    count: 5,
    unreadCount: 0,
    icon: "📝",
    provider: "gmail",
  },
  {
    id: "folder_4",
    name: "Starred",
    type: "custom",
    count: 12,
    unreadCount: 3,
    icon: "⭐",
    provider: "gmail",
  },
  {
    id: "folder_5",
    name: "Important",
    type: "custom",
    count: 45,
    unreadCount: 8,
    icon: "⚡",
    provider: "gmail",
  },
  {
    id: "folder_6",
    name: "Work",
    type: "custom",
    count: 234,
    unreadCount: 15,
    icon: "💼",
    provider: "gmail",
  },
  {
    id: "folder_7",
    name: "Inbox",
    type: "inbox",
    count: 98,
    unreadCount: 12,
    icon: "📥",
    provider: "outlook",
  },
  {
    id: "folder_8",
    name: "Sent Items",
    type: "sent",
    count: 67,
    unreadCount: 0,
    icon: "📤",
    provider: "outlook",
  },
  {
    id: "folder_9",
    name: "Trash",
    type: "trash",
    count: 23,
    unreadCount: 0,
    icon: "🗑️",
    provider: "both",
  },
  {
    id: "folder_10",
    name: "Spam",
    type: "spam",
    count: 145,
    unreadCount: 145,
    icon: "🚫",
    provider: "both",
  },
];

// Generate mock threads
export const mockThreads: MockThread[] = [
  {
    id: "thread_1",
    subject: "Project Alpha - Status Update",
    participants: ["sarah.johnson@techcorp.com", "mike@designstudio.io", "alex.t@development.com"],
    messageCount: 12,
    lastMessage: new Date(Date.now() - 1 * 60 * 60 * 1000),
    snippet: "Great progress on the frontend implementation. The new components are ready for review...",
    unread: true,
    important: true,
  },
  {
    id: "thread_2",
    subject: "Budget Discussion Q1 2025",
    participants: ["cfo@company.com", "finance@company.com"],
    messageCount: 8,
    lastMessage: new Date(Date.now() - 4 * 60 * 60 * 1000),
    snippet: "Based on the projections, we should allocate more resources to marketing...",
    unread: false,
    important: true,
  },
  {
    id: "thread_3",
    subject: "Customer Feedback - Product Launch",
    participants: ["support@company.com", "product@company.com", "marketing@company.com"],
    messageCount: 24,
    lastMessage: new Date(Date.now() - 12 * 60 * 60 * 1000),
    snippet: "We've received overwhelmingly positive feedback from the beta users...",
    unread: false,
    important: false,
  },
];

// Generate mock sync status
export const mockSyncStatus: MockEmailSync[] = [
  {
    id: "sync_1",
    provider: "gmail",
    status: "completed",
    lastSync: new Date(Date.now() - 5 * 60 * 1000),
    messagesScanned: 1245,
    messagesSynced: 1245,
    errors: 0,
    progress: 100,
  },
  {
    id: "sync_2",
    provider: "outlook",
    status: "syncing",
    lastSync: new Date(Date.now() - 2 * 60 * 1000),
    messagesScanned: 567,
    messagesSynced: 489,
    errors: 2,
    progress: 86,
  },
];

// Helper functions to simulate API calls
export const emailAPI = {
  async getEmails(provider?: "gmail" | "outlook"): Promise<MockEmail[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return provider 
      ? mockEmails.filter(e => e.provider === provider)
      : mockEmails;
  },

  async getFolders(provider?: "gmail" | "outlook"): Promise<MockFolder[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return provider
      ? mockFolders.filter(f => f.provider === provider || f.provider === "both")
      : mockFolders;
  },

  async getThreads(): Promise<MockThread[]> {
    await new Promise(resolve => setTimeout(resolve, 400));
    return mockThreads;
  },

  async getSyncStatus(): Promise<MockEmailSync[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockSyncStatus;
  },

  async sendEmail(email: Partial<MockEmail>): Promise<{ success: boolean; id: string }> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      success: true,
      id: `email_${Date.now()}`,
    };
  },

  async syncEmails(provider: "gmail" | "outlook"): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 2000));
  },

  async markAsRead(emailIds: string[]): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
  },

  async deleteEmails(emailIds: string[]): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
  },

  async archiveEmails(emailIds: string[]): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
  },
};