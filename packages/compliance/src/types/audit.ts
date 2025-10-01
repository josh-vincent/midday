import { z } from "zod";

export const AuditEventSchema = z.object({
  id: z.string(),
  timestamp: z.date(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  action: z.string(),
  resource: z.string(),
  resourceId: z.string().optional(),
  details: z.record(z.any()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  location: z.object({
    country: z.string().optional(),
    region: z.string().optional(),
    city: z.string().optional(),
  }).optional(),
  risk: z.enum(["low", "medium", "high", "critical"]).default("low"),
  category: z.enum([
    "authentication",
    "authorization",
    "data_access",
    "data_modification",
    "system_change",
    "security_event",
    "privacy_event",
    "financial_transaction",
    "compliance_event"
  ]),
  outcome: z.enum(["success", "failure", "pending"]),
  metadata: z.record(z.any()).optional(),
});

export const AuditFilterSchema = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  userId: z.string().optional(),
  action: z.string().optional(),
  resource: z.string().optional(),
  category: z.array(z.string()).optional(),
  risk: z.array(z.string()).optional(),
  outcome: z.array(z.string()).optional(),
  limit: z.number().min(1).max(1000).default(100),
  offset: z.number().min(0).default(0),
});

export const AuditTrailConfigSchema = z.object({
  enabled: z.boolean().default(true),
  retentionDays: z.number().min(1).max(2555).default(365), // 7 years max
  anonymizeAfterDays: z.number().min(1).optional(),
  encryptionEnabled: z.boolean().default(true),
  realTimeAlerts: z.boolean().default(false),
  alertThresholds: z.object({
    suspiciousActivity: z.number().default(10),
    failedAttempts: z.number().default(5),
    dataVolumeThreshold: z.number().default(1000),
  }).optional(),
  storage: z.object({
    type: z.enum(["database", "file", "cloud"]),
    location: z.string(),
    encryption: z.boolean().default(true),
  }),
});

export type AuditEvent = z.infer<typeof AuditEventSchema>;
export type AuditFilter = z.infer<typeof AuditFilterSchema>;
export type AuditTrailConfig = z.infer<typeof AuditTrailConfigSchema>;

export interface AuditRepository {
  createEvent(event: AuditEvent): Promise<void>;
  getEvents(filter: AuditFilter): Promise<AuditEvent[]>;
  getEventById(id: string): Promise<AuditEvent | null>;
  deleteOldEvents(olderThanDays: number): Promise<number>;
  anonymizeEvents(olderThanDays: number): Promise<number>;
  exportEvents(filter: AuditFilter, format: "json" | "csv" | "xml"): Promise<string>;
}