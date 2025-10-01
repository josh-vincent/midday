import { z } from "zod";

export const ComplianceStandardSchema = z.enum([
  "GDPR",      // General Data Protection Regulation
  "CCPA",      // California Consumer Privacy Act
  "PIPEDA",    // Personal Information Protection and Electronic Documents Act
  "LGPD",      // Lei Geral de Proteção de Dados
  "SOX",       // Sarbanes-Oxley Act
  "HIPAA",     // Health Insurance Portability and Accountability Act
  "PCI_DSS",   // Payment Card Industry Data Security Standard
  "ISO_27001", // Information Security Management
  "SOC2",      // Service Organization Control 2
  "COPPA",     // Children's Online Privacy Protection Act
]);

export const ComplianceStatusSchema = z.enum([
  "compliant",
  "non_compliant",
  "partially_compliant",
  "under_review",
  "remediation_in_progress",
  "not_applicable"
]);

export const RiskLevelSchema = z.enum([
  "low",
  "medium", 
  "high",
  "critical"
]);

export const ComplianceFrameworkSchema = z.object({
  id: z.string(),
  standard: ComplianceStandardSchema,
  version: z.string(),
  effectiveDate: z.date(),
  description: z.string(),
  requirements: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    category: z.string(),
    mandatory: z.boolean(),
    riskLevel: RiskLevelSchema,
    controls: z.array(z.string()),
  })),
  jurisdiction: z.string().optional(),
  industry: z.string().optional(),
  applicability: z.object({
    dataTypes: z.array(z.string()),
    businessTypes: z.array(z.string()),
    geographicScope: z.array(z.string()),
  }),
});

export const ComplianceAssessmentSchema = z.object({
  id: z.string(),
  frameworkId: z.string(),
  assessmentDate: z.date(),
  assessor: z.string(),
  scope: z.string(),
  methodology: z.string(),
  findings: z.array(z.object({
    requirementId: z.string(),
    status: ComplianceStatusSchema,
    evidence: z.array(z.string()),
    gaps: z.array(z.string()),
    recommendations: z.array(z.string()),
    riskLevel: RiskLevelSchema,
    notes: z.string().optional(),
  })),
  overallStatus: ComplianceStatusSchema,
  riskScore: z.number().min(0).max(100),
  nextAssessmentDate: z.date(),
  approvedBy: z.string().optional(),
  approvalDate: z.date().optional(),
});

export const RemediationPlanSchema = z.object({
  id: z.string(),
  assessmentId: z.string(),
  title: z.string(),
  description: z.string(),
  priority: z.enum(["low", "medium", "high", "critical"]),
  status: z.enum(["planned", "in_progress", "on_hold", "completed", "cancelled"]),
  assignee: z.string(),
  dueDate: z.date(),
  estimatedEffort: z.number().optional(), // in hours
  actualEffort: z.number().optional(),
  cost: z.number().optional(),
  tasks: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    status: z.enum(["pending", "in_progress", "completed"]),
    assignee: z.string().optional(),
    dueDate: z.date().optional(),
    completedDate: z.date().optional(),
  })),
  milestones: z.array(z.object({
    id: z.string(),
    title: z.string(),
    targetDate: z.date(),
    actualDate: z.date().optional(),
    status: z.enum(["pending", "achieved", "missed"]),
  })),
  createdDate: z.date(),
  completedDate: z.date().optional(),
});

export const ComplianceReportSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum([
    "assessment_summary",
    "gap_analysis", 
    "remediation_status",
    "risk_assessment",
    "executive_summary",
    "detailed_findings",
    "trend_analysis"
  ]),
  period: z.object({
    startDate: z.date(),
    endDate: z.date(),
  }),
  scope: z.array(z.string()),
  standards: z.array(ComplianceStandardSchema),
  generatedDate: z.date(),
  generatedBy: z.string(),
  format: z.enum(["pdf", "html", "json", "csv"]),
  data: z.record(z.any()),
  metadata: z.object({
    version: z.string(),
    confidentiality: z.enum(["public", "internal", "confidential", "restricted"]),
    recipients: z.array(z.string()),
    retentionPeriod: z.number(), // in days
  }),
});

export const ComplianceConfigSchema = z.object({
  enabled: z.boolean().default(true),
  autoAssessment: z.boolean().default(false),
  assessmentFrequency: z.number().default(90), // days
  alertThresholds: z.object({
    riskScore: z.number().default(70),
    overdueTasks: z.number().default(5),
    assessmentOverdue: z.number().default(30), // days
  }),
  reportingSchedule: z.object({
    enabled: z.boolean().default(true),
    frequency: z.enum(["daily", "weekly", "monthly", "quarterly"]),
    recipients: z.array(z.string()),
    format: z.enum(["pdf", "html", "json"]),
  }),
  notifications: z.object({
    enabled: z.boolean().default(true),
    channels: z.array(z.enum(["email", "slack", "webhook"])),
    escalation: z.boolean().default(true),
  }),
});

export type ComplianceStandard = z.infer<typeof ComplianceStandardSchema>;
export type ComplianceStatus = z.infer<typeof ComplianceStatusSchema>;
export type RiskLevel = z.infer<typeof RiskLevelSchema>;
export type ComplianceFramework = z.infer<typeof ComplianceFrameworkSchema>;
export type ComplianceAssessment = z.infer<typeof ComplianceAssessmentSchema>;
export type RemediationPlan = z.infer<typeof RemediationPlanSchema>;
export type ComplianceReport = z.infer<typeof ComplianceReportSchema>;
export type ComplianceConfig = z.infer<typeof ComplianceConfigSchema>;

export interface ComplianceRepository {
  // Framework management
  createFramework(framework: Omit<ComplianceFramework, "id">): Promise<ComplianceFramework>;
  getFramework(id: string): Promise<ComplianceFramework | null>;
  updateFramework(id: string, updates: Partial<ComplianceFramework>): Promise<ComplianceFramework>;
  listFrameworks(standard?: ComplianceStandard): Promise<ComplianceFramework[]>;

  // Assessment management
  createAssessment(assessment: Omit<ComplianceAssessment, "id">): Promise<ComplianceAssessment>;
  getAssessment(id: string): Promise<ComplianceAssessment | null>;
  updateAssessment(id: string, updates: Partial<ComplianceAssessment>): Promise<ComplianceAssessment>;
  listAssessments(frameworkId?: string): Promise<ComplianceAssessment[]>;

  // Remediation management
  createRemediationPlan(plan: Omit<RemediationPlan, "id">): Promise<RemediationPlan>;
  getRemediationPlan(id: string): Promise<RemediationPlan | null>;
  updateRemediationPlan(id: string, updates: Partial<RemediationPlan>): Promise<RemediationPlan>;
  listRemediationPlans(assessmentId?: string): Promise<RemediationPlan[]>;

  // Reporting
  generateReport(config: Partial<ComplianceReport>): Promise<ComplianceReport>;
  getReport(id: string): Promise<ComplianceReport | null>;
  listReports(filter?: { type?: string; startDate?: Date; endDate?: Date }): Promise<ComplianceReport[]>;
}