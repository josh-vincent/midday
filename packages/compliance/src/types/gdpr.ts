import { z } from "zod";

export const PersonalDataCategorySchema = z.enum([
  "identification",      // Name, email, phone, etc.
  "demographic",        // Age, gender, location
  "financial",          // Payment info, bank details
  "professional",       // Job title, company
  "behavioral",         // Usage patterns, preferences
  "biometric",          // Fingerprints, facial recognition
  "health",             // Medical data
  "genetic",            // DNA data
  "political",          // Political opinions
  "criminal",           // Criminal history
  "social",             // Social media data
  "location",           // GPS, IP address
  "communication",      // Messages, emails
  "technical"           // Device info, logs
]);

export const LegalBasisSchema = z.enum([
  "consent",            // Article 6(1)(a)
  "contract",           // Article 6(1)(b)
  "legal_obligation",   // Article 6(1)(c)
  "vital_interests",    // Article 6(1)(d)
  "public_task",        // Article 6(1)(e)
  "legitimate_interests" // Article 6(1)(f)
]);

export const ProcessingPurposeSchema = z.enum([
  "service_provision",
  "marketing",
  "analytics",
  "security",
  "legal_compliance",
  "customer_support",
  "product_improvement",
  "fraud_prevention",
  "business_operations"
]);

export const DataSubjectRightSchema = z.enum([
  "access",             // Article 15
  "rectification",      // Article 16
  "erasure",            // Article 17 (Right to be forgotten)
  "restrict_processing", // Article 18
  "data_portability",   // Article 20
  "object",             // Article 21
  "withdraw_consent"    // Article 7(3)
]);

export const GDPRRequestSchema = z.object({
  id: z.string(),
  type: DataSubjectRightSchema,
  subjectId: z.string(),
  subjectEmail: z.string().email(),
  requestDate: z.date(),
  dueDate: z.date(),
  status: z.enum(["pending", "in_progress", "completed", "rejected", "cancelled"]),
  description: z.string().optional(),
  verificationStatus: z.enum(["pending", "verified", "failed"]),
  attachments: z.array(z.string()).optional(),
  processingNotes: z.string().optional(),
  completedDate: z.date().optional(),
  assignedTo: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
});

export const DataMappingSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  dataCategories: z.array(PersonalDataCategorySchema),
  legalBasis: LegalBasisSchema,
  processingPurpose: z.array(ProcessingPurposeSchema),
  dataSource: z.string(),
  dataLocation: z.array(z.string()),
  retentionPeriod: z.number(), // in days
  recipients: z.array(z.string()),
  thirdCountryTransfers: z.array(z.object({
    country: z.string(),
    adequacyDecision: z.boolean(),
    safeguards: z.string().optional(),
  })).optional(),
  encryptionRequired: z.boolean().default(true),
  consentRequired: z.boolean(),
  lastUpdated: z.date(),
});

export const ConsentRecordSchema = z.object({
  id: z.string(),
  subjectId: z.string(),
  purpose: ProcessingPurposeSchema,
  legalBasis: LegalBasisSchema,
  consentDate: z.date(),
  consentMethod: z.enum(["explicit", "implicit", "opt_in", "pre_ticked"]),
  consentText: z.string(),
  version: z.string(),
  withdrawnDate: z.date().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  isActive: z.boolean().default(true),
  metadata: z.record(z.any()).optional(),
});

export const PrivacyPolicySchema = z.object({
  id: z.string(),
  version: z.string(),
  effectiveDate: z.date(),
  expiryDate: z.date().optional(),
  language: z.string().default("en"),
  content: z.string(),
  dataProcessingPurposes: z.array(ProcessingPurposeSchema),
  retentionPeriods: z.record(z.number()),
  thirdParties: z.array(z.string()),
  userRights: z.array(DataSubjectRightSchema),
  contactInfo: z.object({
    dpo: z.string().optional(),
    email: z.string().email(),
    address: z.string().optional(),
  }),
  isActive: z.boolean().default(true),
});

export type PersonalDataCategory = z.infer<typeof PersonalDataCategorySchema>;
export type LegalBasis = z.infer<typeof LegalBasisSchema>;
export type ProcessingPurpose = z.infer<typeof ProcessingPurposeSchema>;
export type DataSubjectRight = z.infer<typeof DataSubjectRightSchema>;
export type GDPRRequest = z.infer<typeof GDPRRequestSchema>;
export type DataMapping = z.infer<typeof DataMappingSchema>;
export type ConsentRecord = z.infer<typeof ConsentRecordSchema>;
export type PrivacyPolicy = z.infer<typeof PrivacyPolicySchema>;

export interface GDPRRepository {
  // Request management
  createRequest(request: Omit<GDPRRequest, "id" | "requestDate" | "dueDate">): Promise<GDPRRequest>;
  getRequest(id: string): Promise<GDPRRequest | null>;
  updateRequest(id: string, updates: Partial<GDPRRequest>): Promise<GDPRRequest>;
  listRequests(filter?: {
    status?: string[];
    type?: DataSubjectRight[];
    startDate?: Date;
    endDate?: Date;
  }): Promise<GDPRRequest[]>;

  // Data mapping
  createDataMapping(mapping: Omit<DataMapping, "id">): Promise<DataMapping>;
  getDataMapping(id: string): Promise<DataMapping | null>;
  updateDataMapping(id: string, updates: Partial<DataMapping>): Promise<DataMapping>;
  listDataMappings(): Promise<DataMapping[]>;

  // Consent management
  recordConsent(consent: Omit<ConsentRecord, "id">): Promise<ConsentRecord>;
  getConsent(subjectId: string, purpose: ProcessingPurpose): Promise<ConsentRecord | null>;
  withdrawConsent(id: string): Promise<void>;
  listConsents(subjectId: string): Promise<ConsentRecord[]>;

  // Privacy policy
  createPrivacyPolicy(policy: Omit<PrivacyPolicy, "id">): Promise<PrivacyPolicy>;
  getActivePrivacyPolicy(language?: string): Promise<PrivacyPolicy | null>;
  updatePrivacyPolicy(id: string, updates: Partial<PrivacyPolicy>): Promise<PrivacyPolicy>;
}