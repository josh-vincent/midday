import { z } from "zod";

export const ReportTypeSchema = z.enum([
  "audit_trail",
  "compliance_assessment", 
  "gdpr_summary",
  "data_breach",
  "risk_assessment",
  "security_metrics",
  "privacy_impact_assessment",
  "vendor_compliance",
  "incident_response",
  "regulatory_filing"
]);

export const ReportFormatSchema = z.enum([
  "pdf",
  "html", 
  "json",
  "csv",
  "xml",
  "excel"
]);

export const ReportFrequencySchema = z.enum([
  "on_demand",
  "daily",
  "weekly", 
  "monthly",
  "quarterly",
  "annually"
]);

export const ReportStatusSchema = z.enum([
  "draft",
  "generating",
  "completed",
  "failed",
  "cancelled",
  "approved",
  "published"
]);

export const ReportTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: ReportTypeSchema,
  category: z.string(),
  version: z.string(),
  sections: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    order: z.number(),
    required: z.boolean(),
    dataSource: z.string(),
    visualization: z.enum([
      "table",
      "chart",
      "graph", 
      "text",
      "list",
      "metrics",
      "timeline"
    ]).optional(),
    filters: z.record(z.any()).optional(),
  })),
  parameters: z.array(z.object({
    name: z.string(),
    type: z.enum(["string", "number", "date", "boolean", "array"]),
    required: z.boolean(),
    defaultValue: z.any().optional(),
    description: z.string(),
    validation: z.string().optional(),
  })),
  outputFormats: z.array(ReportFormatSchema),
  permissions: z.object({
    canGenerate: z.array(z.string()),
    canView: z.array(z.string()),
    canEdit: z.array(z.string()),
  }),
  isActive: z.boolean().default(true),
  createdBy: z.string(),
  createdDate: z.date(),
  lastModified: z.date(),
});

export const ReportDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  templateId: z.string(),
  parameters: z.record(z.any()),
  schedule: z.object({
    frequency: ReportFrequencySchema,
    startDate: z.date(),
    endDate: z.date().optional(),
    timeOfDay: z.string().optional(), // HH:MM format
    timezone: z.string().default("UTC"),
    enabled: z.boolean().default(true),
  }).optional(),
  delivery: z.object({
    method: z.array(z.enum(["email", "file_system", "cloud_storage", "webhook"])),
    recipients: z.array(z.string()),
    subject: z.string().optional(),
    message: z.string().optional(),
    attachments: z.boolean().default(true),
  }).optional(),
  retention: z.object({
    keepDays: z.number().default(365),
    archiveAfterDays: z.number().optional(),
    autoDelete: z.boolean().default(false),
  }),
  access: z.object({
    isPublic: z.boolean().default(false),
    allowedUsers: z.array(z.string()),
    allowedRoles: z.array(z.string()),
    confidentialityLevel: z.enum(["public", "internal", "confidential", "restricted"]),
  }),
  isActive: z.boolean().default(true),
  createdBy: z.string(),
  createdDate: z.date(),
});

export const ReportInstanceSchema = z.object({
  id: z.string(),
  definitionId: z.string(),
  name: z.string(),
  type: ReportTypeSchema,
  status: ReportStatusSchema,
  format: ReportFormatSchema,
  parameters: z.record(z.any()),
  period: z.object({
    startDate: z.date(),
    endDate: z.date(),
  }),
  generatedBy: z.string(),
  generatedDate: z.date(),
  completedDate: z.date().optional(),
  fileSize: z.number().optional(),
  filePath: z.string().optional(),
  downloadUrl: z.string().optional(),
  expiryDate: z.date().optional(),
  metadata: z.object({
    recordCount: z.number().optional(),
    processingTime: z.number().optional(), // milliseconds
    dataSourcesUsed: z.array(z.string()),
    errors: z.array(z.string()).optional(),
    warnings: z.array(z.string()).optional(),
    signature: z.string().optional(), // digital signature
    checksum: z.string().optional(),
  }),
  approvals: z.array(z.object({
    approver: z.string(),
    status: z.enum(["pending", "approved", "rejected"]),
    date: z.date(),
    comments: z.string().optional(),
  })).optional(),
  distribution: z.object({
    sent: z.boolean().default(false),
    sentDate: z.date().optional(),
    recipients: z.array(z.object({
      email: z.string(),
      status: z.enum(["pending", "sent", "delivered", "failed"]),
      sentDate: z.date().optional(),
    })),
    downloadCount: z.number().default(0),
    lastDownloaded: z.date().optional(),
  }).optional(),
});

export const ReportMetricsSchema = z.object({
  period: z.object({
    startDate: z.date(),
    endDate: z.date(),
  }),
  totalReports: z.number(),
  reportsByType: z.record(z.number()),
  reportsByStatus: z.record(z.number()),
  averageGenerationTime: z.number(), // milliseconds
  totalDataProcessed: z.number(), // bytes
  failureRate: z.number(), // percentage
  userActivity: z.object({
    activeUsers: z.number(),
    topGenerators: z.array(z.object({
      userId: z.string(),
      reportCount: z.number(),
    })),
    topDownloaders: z.array(z.object({
      userId: z.string(),
      downloadCount: z.number(),
    })),
  }),
  systemPerformance: z.object({
    averageResponseTime: z.number(),
    peakConcurrentReports: z.number(),
    resourceUtilization: z.object({
      cpu: z.number(),
      memory: z.number(),
      storage: z.number(),
    }),
  }),
});

export type ReportType = z.infer<typeof ReportTypeSchema>;
export type ReportFormat = z.infer<typeof ReportFormatSchema>;
export type ReportFrequency = z.infer<typeof ReportFrequencySchema>;
export type ReportStatus = z.infer<typeof ReportStatusSchema>;
export type ReportTemplate = z.infer<typeof ReportTemplateSchema>;
export type ReportDefinition = z.infer<typeof ReportDefinitionSchema>;
export type ReportInstance = z.infer<typeof ReportInstanceSchema>;
export type ReportMetrics = z.infer<typeof ReportMetricsSchema>;

export interface ReportingRepository {
  // Template management
  createTemplate(template: Omit<ReportTemplate, "id">): Promise<ReportTemplate>;
  getTemplate(id: string): Promise<ReportTemplate | null>;
  updateTemplate(id: string, updates: Partial<ReportTemplate>): Promise<ReportTemplate>;
  listTemplates(type?: ReportType): Promise<ReportTemplate[]>;
  deleteTemplate(id: string): Promise<void>;

  // Report definition management
  createDefinition(definition: Omit<ReportDefinition, "id">): Promise<ReportDefinition>;
  getDefinition(id: string): Promise<ReportDefinition | null>;
  updateDefinition(id: string, updates: Partial<ReportDefinition>): Promise<ReportDefinition>;
  listDefinitions(filter?: { type?: ReportType; isActive?: boolean }): Promise<ReportDefinition[]>;
  deleteDefinition(id: string): Promise<void>;

  // Report instance management
  createInstance(instance: Omit<ReportInstance, "id">): Promise<ReportInstance>;
  getInstance(id: string): Promise<ReportInstance | null>;
  updateInstance(id: string, updates: Partial<ReportInstance>): Promise<ReportInstance>;
  listInstances(filter?: {
    definitionId?: string;
    status?: ReportStatus[];
    startDate?: Date;
    endDate?: Date;
    generatedBy?: string;
  }): Promise<ReportInstance[]>;
  deleteInstance(id: string): Promise<void>;

  // Metrics and analytics
  getMetrics(period: { startDate: Date; endDate: Date }): Promise<ReportMetrics>;
  getUsageStats(userId?: string): Promise<{
    reportsGenerated: number;
    reportsDownloaded: number;
    favoriteTypes: ReportType[];
    averageGenerationTime: number;
  }>;
}

export interface ReportGenerator {
  generateReport(definitionId: string, parameters?: Record<string, any>): Promise<ReportInstance>;
  generateFromTemplate(templateId: string, parameters: Record<string, any>): Promise<ReportInstance>;
  getReportData(instanceId: string): Promise<Buffer>;
  downloadReport(instanceId: string, format?: ReportFormat): Promise<{
    data: Buffer;
    filename: string;
    mimeType: string;
  }>;
  cancelGeneration(instanceId: string): Promise<void>;
  
  // Bulk operations
  generateBulkReports(requests: Array<{
    definitionId: string;
    parameters?: Record<string, any>;
  }>): Promise<ReportInstance[]>;
  
  // Scheduled reports
  processScheduledReports(): Promise<void>;
  getNextScheduledReports(limit?: number): Promise<Array<{
    definitionId: string;
    nextRunDate: Date;
    frequency: ReportFrequency;
  }>>;
}