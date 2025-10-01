import { z } from "zod";

export const EncryptionAlgorithmSchema = z.enum([
  "AES-256-GCM",
  "AES-256-CBC", 
  "AES-192-GCM",
  "AES-128-GCM",
  "ChaCha20-Poly1305",
  "RSA-OAEP",
  "RSA-PSS",
  "ECDSA",
  "Ed25519"
]);

export const KeyTypeSchema = z.enum([
  "symmetric",
  "asymmetric_public",
  "asymmetric_private",
  "master_key",
  "data_encryption_key",
  "key_encryption_key"
]);

export const KeyStatusSchema = z.enum([
  "active",
  "pending_activation",
  "disabled",
  "compromised",
  "expired",
  "pending_deletion",
  "destroyed"
]);

export const EncryptionKeySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: KeyTypeSchema,
  algorithm: EncryptionAlgorithmSchema,
  keySize: z.number(),
  usage: z.array(z.enum([
    "encrypt",
    "decrypt", 
    "sign",
    "verify",
    "key_wrap",
    "key_unwrap"
  ])),
  status: KeyStatusSchema,
  createdDate: z.date(),
  activationDate: z.date().optional(),
  expirationDate: z.date().optional(),
  lastUsedDate: z.date().optional(),
  rotationSchedule: z.object({
    enabled: z.boolean().default(false),
    intervalDays: z.number().optional(),
    nextRotationDate: z.date().optional(),
  }).optional(),
  metadata: z.object({
    purpose: z.string(),
    owner: z.string(),
    environment: z.enum(["development", "staging", "production"]),
    compliance: z.array(z.string()).optional(),
    tags: z.record(z.string()).optional(),
  }),
  accessPolicy: z.object({
    allowedUsers: z.array(z.string()),
    allowedRoles: z.array(z.string()),
    allowedOperations: z.array(z.string()),
    ipWhitelist: z.array(z.string()).optional(),
    timeRestrictions: z.object({
      allowedHours: z.string().optional(),
      timezone: z.string().optional(),
    }).optional(),
  }).optional(),
});

export const EncryptionOperationSchema = z.object({
  id: z.string(),
  type: z.enum(["encrypt", "decrypt", "sign", "verify", "key_generation", "key_rotation"]),
  keyId: z.string(),
  algorithm: EncryptionAlgorithmSchema,
  timestamp: z.date(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  status: z.enum(["success", "failure", "pending"]),
  dataSize: z.number().optional(),
  processingTime: z.number().optional(), // milliseconds
  errorCode: z.string().optional(),
  errorMessage: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export const DataClassificationSchema = z.enum([
  "public",
  "internal",
  "confidential",
  "restricted",
  "top_secret",
  "personal_data",
  "sensitive_personal_data",
  "financial_data",
  "health_data",
  "payment_card_data"
]);

export const EncryptionPolicySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  dataClassification: DataClassificationSchema,
  requiredAlgorithm: EncryptionAlgorithmSchema,
  minimumKeySize: z.number(),
  encryptionAtRest: z.boolean().default(true),
  encryptionInTransit: z.boolean().default(true),
  keyRotationRequired: z.boolean().default(true),
  keyRotationInterval: z.number().optional(), // days
  retentionPeriod: z.number().optional(), // days
  auditRequired: z.boolean().default(true),
  complianceStandards: z.array(z.string()),
  exceptions: z.array(z.object({
    condition: z.string(),
    justification: z.string(),
    approvedBy: z.string(),
    expiryDate: z.date().optional(),
  })).optional(),
  effectiveDate: z.date(),
  version: z.string(),
  isActive: z.boolean().default(true),
});

export const EncryptionConfigSchema = z.object({
  enabled: z.boolean().default(true),
  defaultAlgorithm: EncryptionAlgorithmSchema.default("AES-256-GCM"),
  keyManagement: z.object({
    provider: z.enum(["local", "aws_kms", "azure_keyvault", "google_kms", "hashicorp_vault"]),
    config: z.record(z.any()),
  }),
  automaticRotation: z.boolean().default(true),
  rotationInterval: z.number().default(90), // days
  auditLogging: z.boolean().default(true),
  performanceMonitoring: z.boolean().default(true),
  alerts: z.object({
    keyExpiration: z.boolean().default(true),
    rotationFailure: z.boolean().default(true),
    unauthorizedAccess: z.boolean().default(true),
    performanceDegradation: z.boolean().default(true),
  }),
});

export type EncryptionAlgorithm = z.infer<typeof EncryptionAlgorithmSchema>;
export type KeyType = z.infer<typeof KeyTypeSchema>;
export type KeyStatus = z.infer<typeof KeyStatusSchema>;
export type EncryptionKey = z.infer<typeof EncryptionKeySchema>;
export type EncryptionOperation = z.infer<typeof EncryptionOperationSchema>;
export type DataClassification = z.infer<typeof DataClassificationSchema>;
export type EncryptionPolicy = z.infer<typeof EncryptionPolicySchema>;
export type EncryptionConfig = z.infer<typeof EncryptionConfigSchema>;

export interface EncryptionKeyManager {
  // Key lifecycle management
  generateKey(config: {
    name: string;
    type: KeyType;
    algorithm: EncryptionAlgorithm;
    keySize: number;
    metadata: EncryptionKey["metadata"];
  }): Promise<EncryptionKey>;
  
  importKey(keyData: {
    name: string;
    type: KeyType;
    algorithm: EncryptionAlgorithm;
    keyMaterial: string;
    metadata: EncryptionKey["metadata"];
  }): Promise<EncryptionKey>;
  
  rotateKey(keyId: string): Promise<EncryptionKey>;
  disableKey(keyId: string): Promise<void>;
  destroyKey(keyId: string): Promise<void>;
  
  // Key operations
  encrypt(keyId: string, plaintext: string, context?: Record<string, string>): Promise<string>;
  decrypt(keyId: string, ciphertext: string, context?: Record<string, string>): Promise<string>;
  sign(keyId: string, data: string): Promise<string>;
  verify(keyId: string, data: string, signature: string): Promise<boolean>;
  
  // Key retrieval
  getKey(keyId: string): Promise<EncryptionKey | null>;
  listKeys(filter?: {
    type?: KeyType[];
    status?: KeyStatus[];
    algorithm?: EncryptionAlgorithm[];
  }): Promise<EncryptionKey[]>;
  
  // Audit and monitoring
  getOperationHistory(keyId: string, limit?: number): Promise<EncryptionOperation[]>;
  getKeyUsageStats(keyId: string, period: { start: Date; end: Date }): Promise<{
    operationCount: number;
    dataProcessed: number;
    averageResponseTime: number;
    errorRate: number;
  }>;
}

export interface EncryptionService {
  // High-level encryption operations
  encryptData(data: string, classification: DataClassification, context?: Record<string, string>): Promise<{
    ciphertext: string;
    keyId: string;
    algorithm: EncryptionAlgorithm;
    metadata: Record<string, any>;
  }>;
  
  decryptData(encryptedData: {
    ciphertext: string;
    keyId: string;
    algorithm: EncryptionAlgorithm;
    metadata: Record<string, any>;
  }, context?: Record<string, string>): Promise<string>;
  
  // Policy management
  createPolicy(policy: Omit<EncryptionPolicy, "id">): Promise<EncryptionPolicy>;
  updatePolicy(id: string, updates: Partial<EncryptionPolicy>): Promise<EncryptionPolicy>;
  getPolicy(classification: DataClassification): Promise<EncryptionPolicy | null>;
  listPolicies(): Promise<EncryptionPolicy[]>;
  
  // Compliance and audit
  validateCompliance(data: {
    classification: DataClassification;
    algorithm: EncryptionAlgorithm;
    keySize: number;
  }): Promise<{
    compliant: boolean;
    violations: string[];
    recommendations: string[];
  }>;
  
  generateComplianceReport(period: { start: Date; end: Date }): Promise<{
    totalOperations: number;
    complianceRate: number;
    violations: Array<{
      type: string;
      count: number;
      severity: "low" | "medium" | "high";
    }>;
    keyRotationStatus: Array<{
      keyId: string;
      lastRotation: Date;
      nextRotation: Date;
      overdue: boolean;
    }>;
  }>;
}