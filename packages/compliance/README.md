# @midday/compliance

A comprehensive compliance package providing audit trails, GDPR/CCPA compliance, data privacy management, and security controls for the Midday platform.

## Features

- **Audit Trails**: Complete audit logging with real-time alerts and configurable retention
- **GDPR Compliance**: Data subject rights, consent management, data mapping
- **Privacy Management**: Data classification, encryption policies, retention management
- **Compliance Frameworks**: Support for GDPR, CCPA, SOX, HIPAA, PCI-DSS, ISO 27001
- **Reporting**: Automated compliance reports with multiple export formats
- **Encryption**: Key management and data encryption with compliance standards

## Installation

```bash
npm install @midday/compliance
```

## Quick Start

### Audit Trail

```typescript
import { AuditTrail, BaseAuditRepository } from "@midday/compliance";

const config = {
  enabled: true,
  retentionDays: 365,
  encryptionEnabled: true,
  realTimeAlerts: true,
  storage: {
    type: "database" as const,
    location: "postgresql://...",
    encryption: true,
  },
};

const auditTrail = new AuditTrail(config);

// Log user authentication
await auditTrail.logAuthentication("user123", "login", {
  method: "password",
  ipAddress: "192.168.1.1",
  location: { country: "US", region: "CA" },
});

// Log data access
await auditTrail.logDataAccess("user123", "read", "customer_data", "cust456", {
  recordCount: 1,
  sensitive: true,
});

// Log financial transaction
await auditTrail.logFinancialTransaction("user123", "payment", {
  transactionId: "txn789",
  amount: 1500.00,
  currency: "USD",
  status: "completed",
});
```

### GDPR Compliance

```typescript
import { GDPRManager, ConsentManager } from "@midday/compliance";

const gdprManager = new GDPRManager(repository);

// Handle data subject request
const request = await gdprManager.createDataSubjectRequest({
  type: "access",
  subjectEmail: "user@example.com",
  description: "Request for all personal data",
});

// Record consent
const consentManager = new ConsentManager(repository);
await consentManager.recordConsent({
  subjectId: "user123",
  purpose: "marketing",
  legalBasis: "consent",
  consentMethod: "explicit",
  consentText: "I agree to receive marketing emails",
  version: "1.0",
});

// Check consent status
const hasConsent = await consentManager.hasValidConsent("user123", "marketing");
```

### Compliance Assessment

```typescript
import { ComplianceManager } from "@midday/compliance";

const complianceManager = new ComplianceManager(repository);

// Create assessment
const assessment = await complianceManager.createAssessment({
  frameworkId: "gdpr-framework",
  assessor: "compliance-officer",
  scope: "customer-data-processing",
  methodology: "gap-analysis",
});

// Generate compliance report
const report = await complianceManager.generateReport({
  type: "assessment_summary",
  period: {
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-12-31"),
  },
  standards: ["GDPR", "CCPA"],
});
```

### Data Encryption

```typescript
import { EncryptionManager } from "@midday/compliance";

const encryptionManager = new EncryptionManager(keyManager, config);

// Encrypt sensitive data
const encrypted = await encryptionManager.encryptData(
  "sensitive customer information",
  "personal_data"
);

// Decrypt data
const decrypted = await encryptionManager.decryptData(encrypted);

// Validate encryption compliance
const validation = await encryptionManager.validateCompliance({
  classification: "personal_data",
  algorithm: "AES-256-GCM",
  keySize: 256,
});
```

## API Reference

### AuditTrail

The main class for logging audit events with built-in methods for common scenarios.

#### Methods

- `logAuthentication(userId, action, details?)` - Log authentication events
- `logDataAccess(userId, action, resource, resourceId?, details?)` - Log data access
- `logDataModification(userId, action, resource, resourceId?, details?)` - Log data changes
- `logSecurityEvent(action, details)` - Log security events
- `logFinancialTransaction(userId, action, details)` - Log financial transactions
- `logPrivacyEvent(action, details)` - Log privacy-related events
- `logSystemChange(userId, action, resource, details?)` - Log system changes

### GDPRManager

Handles GDPR compliance including data subject requests and privacy management.

#### Methods

- `createDataSubjectRequest(request)` - Create new GDPR request
- `processRequest(requestId)` - Process pending request
- `getPersonalData(subjectId)` - Retrieve all personal data for subject
- `deletePersonalData(subjectId)` - Delete personal data (right to be forgotten)
- `exportPersonalData(subjectId, format?)` - Export data in portable format

### ConsentManager

Manages user consent for data processing activities.

#### Methods

- `recordConsent(consent)` - Record new consent
- `withdrawConsent(consentId)` - Withdraw existing consent
- `hasValidConsent(subjectId, purpose)` - Check consent status
- `getConsentHistory(subjectId)` - Get consent history
- `updateConsent(consentId, updates)` - Update consent record

### ComplianceManager

Handles compliance assessments and framework management.

#### Methods

- `createFramework(framework)` - Create compliance framework
- `createAssessment(assessment)` - Create new assessment
- `generateReport(config)` - Generate compliance report
- `getComplianceStatus(standard?)` - Get current compliance status

### EncryptionManager

Manages data encryption and key lifecycle for compliance.

#### Methods

- `encryptData(data, classification, context?)` - Encrypt data with appropriate policy
- `decryptData(encryptedData, context?)` - Decrypt data
- `validateCompliance(data)` - Validate encryption compliance
- `generateComplianceReport(period)` - Generate encryption compliance report

## Configuration

### Audit Configuration

```typescript
interface AuditTrailConfig {
  enabled: boolean;
  retentionDays: number;
  anonymizeAfterDays?: number;
  encryptionEnabled: boolean;
  realTimeAlerts: boolean;
  alertThresholds?: {
    suspiciousActivity: number;
    failedAttempts: number;
    dataVolumeThreshold: number;
  };
  storage: {
    type: "database" | "file" | "cloud";
    location: string;
    encryption: boolean;
  };
}
```

### GDPR Configuration

```typescript
interface GDPRConfig {
  dataRetentionDays: number;
  requestProcessingDays: number;
  autoProcessing: boolean;
  notifications: {
    enabled: boolean;
    channels: Array<"email" | "webhook">;
  };
  defaultLegalBasis: LegalBasis;
}
```

## Compliance Standards Supported

- **GDPR** - General Data Protection Regulation
- **CCPA** - California Consumer Privacy Act
- **PIPEDA** - Personal Information Protection and Electronic Documents Act
- **LGPD** - Lei Geral de Proteção de Dados
- **SOX** - Sarbanes-Oxley Act
- **HIPAA** - Health Insurance Portability and Accountability Act
- **PCI DSS** - Payment Card Industry Data Security Standard
- **ISO 27001** - Information Security Management
- **SOC 2** - Service Organization Control 2

## Testing

```bash
npm test
```

## License

Private package for Midday platform.