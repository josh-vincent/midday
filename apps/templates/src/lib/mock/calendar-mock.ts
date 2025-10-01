export interface MockEvent {
  id: string;
  title: string;
  description?: string;
  type: "meeting" | "task" | "reminder" | "deadline" | "milestone";
  startDate: string;
  endDate: string;
  allDay: boolean;
  location?: string;
  attendees: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    status: "accepted" | "declined" | "pending" | "tentative";
  }[];
  organizer: {
    id: string;
    name: string;
    email: string;
  };
  status: "tentative" | "confirmed" | "cancelled";
  color: string;
  recurrence?: {
    type: "daily" | "weekly" | "monthly" | "yearly";
    interval: number;
    endDate?: string;
    daysOfWeek?: number[];
    dayOfMonth?: number;
  };
  projectId?: string;
  jobId?: string;
  clientId?: string;
  reminders: {
    id: string;
    minutes: number;
    type: "popup" | "email";
  }[];
  notes?: string;
  attachments?: {
    id: string;
    name: string;
    url: string;
    size: number;
  }[];
  videoConference?: {
    type: "zoom" | "teams" | "meet";
    url: string;
    meetingId?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface MockCalendar {
  id: string;
  name: string;
  color: string;
  isDefault: boolean;
  isVisible: boolean;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  shared: {
    id: string;
    name: string;
    email: string;
    permission: "read" | "write" | "admin";
  }[];
}

export interface MockAvailability {
  id: string;
  userId: string;
  date: string;
  timeSlots: {
    startTime: string;
    endTime: string;
    available: boolean;
  }[];
}

const eventTypes = ["meeting", "task", "reminder", "deadline", "milestone"] as const;
const eventStatuses = ["tentative", "confirmed", "cancelled"] as const;
const attendeeStatuses = ["accepted", "declined", "pending", "tentative"] as const;
const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#74B9FF", "#A29BFE", "#FD79A8"];

const sampleTitles = {
  meeting: ["Team Standup", "Client Call", "Project Review", "Strategy Session", "All Hands", "Design Review"],
  task: ["Complete Report", "Review Code", "Update Documentation", "Prepare Presentation", "Send Invoices"],
  reminder: ["Call Client", "Submit Timesheet", "Review Contracts", "Backup Data", "Update Portfolio"],
  deadline: ["Project Delivery", "Contract Renewal", "Payment Due", "Proposal Submission", "Tax Filing"],
  milestone: ["Project Kickoff", "Alpha Release", "Beta Launch", "Go Live", "Project Complete"]
};

const sampleLocations = [
  "Conference Room A",
  "Conference Room B", 
  "Main Office",
  "Client Office",
  "Remote",
  "Zoom Meeting",
  "Coffee Shop",
  "Co-working Space"
];

const sampleAttendees = [
  { id: "user_1", name: "John Smith", email: "john@company.com" },
  { id: "user_2", name: "Sarah Johnson", email: "sarah@company.com" },
  { id: "user_3", name: "Mike Chen", email: "mike@company.com" },
  { id: "user_4", name: "Emily Davis", email: "emily@company.com" },
  { id: "user_5", name: "Alex Thompson", email: "alex@company.com" },
  { id: "user_6", name: "Lisa Anderson", email: "lisa@company.com" },
];

function generateEvents(count: number): MockEvent[] {
  const events: MockEvent[] = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const titles = sampleTitles[type];
    const title = titles[Math.floor(Math.random() * titles.length)];
    
    // Generate dates within the next 3 months
    const startDate = new Date(now.getTime() + (Math.random() - 0.5) * 90 * 24 * 60 * 60 * 1000);
    const allDay = Math.random() > 0.7;
    
    let endDate: Date;
    if (allDay) {
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + (Math.random() > 0.8 ? 1 : 0));
    } else {
      const duration = type === "meeting" ? (Math.random() * 2 + 0.5) * 60 * 60 * 1000 : 
                     type === "task" ? (Math.random() * 4 + 1) * 60 * 60 * 1000 : 
                     60 * 60 * 1000; // 1 hour default
      endDate = new Date(startDate.getTime() + duration);
    }
    
    const numAttendees = Math.floor(Math.random() * 4) + 1;
    const attendees = sampleAttendees
      .sort(() => 0.5 - Math.random())
      .slice(0, numAttendees)
      .map(attendee => ({
        ...attendee,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${attendee.id}`,
        status: attendeeStatuses[Math.floor(Math.random() * attendeeStatuses.length)]
      }));
    
    const organizer = attendees[0] || sampleAttendees[0];
    
    // Generate recurrence for some events
    const hasRecurrence = Math.random() > 0.8;
    const recurrence = hasRecurrence ? {
      type: ["daily", "weekly", "monthly"][Math.floor(Math.random() * 3)] as any,
      interval: Math.floor(Math.random() * 2) + 1,
      endDate: new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      daysOfWeek: type === "meeting" ? [1, 3, 5] : undefined
    } : undefined;
    
    const event: MockEvent = {
      id: `event_${i + 1}`,
      title,
      description: `${type} description for ${title}. This includes important details and agenda items.`,
      type,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      allDay,
      location: Math.random() > 0.3 ? sampleLocations[Math.floor(Math.random() * sampleLocations.length)] : undefined,
      attendees,
      organizer: {
        id: organizer.id,
        name: organizer.name,
        email: organizer.email
      },
      status: eventStatuses[Math.floor(Math.random() * eventStatuses.length)],
      color: colors[Math.floor(Math.random() * colors.length)],
      recurrence,
      projectId: Math.random() > 0.7 ? `proj_${Math.floor(Math.random() * 10) + 1}` : undefined,
      jobId: Math.random() > 0.8 ? `job_${Math.floor(Math.random() * 50) + 1}` : undefined,
      clientId: Math.random() > 0.6 ? `client_${Math.floor(Math.random() * 10) + 1}` : undefined,
      reminders: [
        {
          id: `reminder_${i}_1`,
          minutes: 15,
          type: "popup"
        },
        ...(Math.random() > 0.5 ? [{
          id: `reminder_${i}_2`,
          minutes: 1440, // 24 hours
          type: "email" as const
        }] : [])
      ],
      notes: Math.random() > 0.6 ? "Additional notes and important information for this event." : undefined,
      attachments: Math.random() > 0.8 ? [
        {
          id: `attach_${i}_1`,
          name: "agenda.pdf",
          url: "/files/agenda.pdf",
          size: 1024000
        }
      ] : undefined,
      videoConference: type === "meeting" && Math.random() > 0.4 ? {
        type: ["zoom", "teams", "meet"][Math.floor(Math.random() * 3)] as any,
        url: "https://zoom.us/j/123456789",
        meetingId: "123-456-789"
      } : undefined,
      createdAt: new Date(startDate.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    events.push(event);
  }
  
  return events.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
}

function generateCalendars(): MockCalendar[] {
  return [
    {
      id: "cal_1",
      name: "Personal",
      color: "#4ECDC4",
      isDefault: true,
      isVisible: true,
      owner: {
        id: "user_1",
        name: "John Smith",
        email: "john@company.com"
      },
      shared: []
    },
    {
      id: "cal_2", 
      name: "Work",
      color: "#45B7D1",
      isDefault: false,
      isVisible: true,
      owner: {
        id: "user_1",
        name: "John Smith", 
        email: "john@company.com"
      },
      shared: [
        {
          id: "user_2",
          name: "Sarah Johnson",
          email: "sarah@company.com",
          permission: "write"
        }
      ]
    },
    {
      id: "cal_3",
      name: "Projects",
      color: "#96CEB4",
      isDefault: false,
      isVisible: true,
      owner: {
        id: "user_1",
        name: "John Smith",
        email: "john@company.com"
      },
      shared: [
        {
          id: "user_3",
          name: "Mike Chen",
          email: "mike@company.com", 
          permission: "read"
        }
      ]
    },
    {
      id: "cal_4",
      name: "Team Events",
      color: "#A29BFE",
      isDefault: false,
      isVisible: false,
      owner: {
        id: "user_2",
        name: "Sarah Johnson",
        email: "sarah@company.com"
      },
      shared: [
        {
          id: "user_1",
          name: "John Smith",
          email: "john@company.com",
          permission: "write"
        }
      ]
    }
  ];
}

function generateAvailability(): MockAvailability[] {
  const availability: MockAvailability[] = [];
  const now = new Date();
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    
    const timeSlots = [];
    for (let hour = 9; hour < 18; hour++) {
      timeSlots.push({
        startTime: `${hour.toString().padStart(2, '0')}:00`,
        endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
        available: !isWeekend && Math.random() > 0.3
      });
    }
    
    availability.push({
      id: `avail_${i + 1}`,
      userId: "user_1",
      date: date.toISOString().split('T')[0],
      timeSlots
    });
  }
  
  return availability;
}

// Mock API
export const calendarAPI = {
  getEvents: async (startDate?: string, endDate?: string, calendarIds?: string[]): Promise<MockEvent[]> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    let events = generateEvents(150);
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      events = events.filter(event => {
        const eventStart = new Date(event.startDate);
        return eventStart >= start && eventStart <= end;
      });
    }
    
    if (calendarIds && calendarIds.length > 0) {
      // Filter by calendar - for now just return all since events don't have calendarId
      // In real implementation, events would have calendarId
    }
    
    return events;
  },

  getEvent: async (id: string): Promise<MockEvent | null> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const events = generateEvents(150);
    return events.find(e => e.id === id) || null;
  },

  createEvent: async (data: Partial<MockEvent>): Promise<MockEvent> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      id: `event_${Date.now()}`,
      title: data.title || "New Event",
      type: data.type || "meeting",
      startDate: data.startDate || new Date().toISOString(),
      endDate: data.endDate || new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      allDay: data.allDay || false,
      attendees: data.attendees || [],
      organizer: data.organizer || {
        id: "user_1",
        name: "John Smith",
        email: "john@company.com"
      },
      status: "confirmed",
      color: data.color || "#4ECDC4",
      reminders: data.reminders || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    } as MockEvent;
  },

  updateEvent: async (id: string, data: Partial<MockEvent>): Promise<MockEvent> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const events = generateEvents(150);
    const event = events.find(e => e.id === id);
    if (!event) throw new Error("Event not found");
    return { ...event, ...data, updatedAt: new Date().toISOString() };
  },

  deleteEvent: async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 600));
  },

  getCalendars: async (): Promise<MockCalendar[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return generateCalendars();
  },

  createCalendar: async (data: Partial<MockCalendar>): Promise<MockCalendar> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      id: `cal_${Date.now()}`,
      name: data.name || "New Calendar",
      color: data.color || "#4ECDC4",
      isDefault: false,
      isVisible: true,
      owner: data.owner || {
        id: "user_1",
        name: "John Smith",
        email: "john@company.com"
      },
      shared: data.shared || [],
      ...data,
    } as MockCalendar;
  },

  updateCalendar: async (id: string, data: Partial<MockCalendar>): Promise<MockCalendar> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    const calendars = generateCalendars();
    const calendar = calendars.find(c => c.id === id);
    if (!calendar) throw new Error("Calendar not found");
    return { ...calendar, ...data };
  },

  deleteCalendar: async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));
  },

  checkAvailability: async (date: string, duration: number): Promise<string[]> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const availability = generateAvailability();
    const dayAvailability = availability.find(a => a.date === date);
    
    if (!dayAvailability) return [];
    
    return dayAvailability.timeSlots
      .filter(slot => slot.available)
      .map(slot => slot.startTime);
  },

  detectConflicts: async (startDate: string, endDate: string, excludeEventId?: string): Promise<MockEvent[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const events = generateEvents(150);
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return events.filter(event => {
      if (excludeEventId && event.id === excludeEventId) return false;
      
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      
      return (eventStart < end && eventEnd > start);
    });
  },

  getUpcomingEvents: async (limit: number = 10): Promise<MockEvent[]> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const events = generateEvents(150);
    const now = new Date();
    
    return events
      .filter(event => new Date(event.startDate) > now)
      .slice(0, limit);
  },
};