import { AuditManager } from "./audit-manager";
import { BaseAuditRepository } from "./audit-repository";
import { type AuditTrailConfig } from "../types/audit";

/**
 * High-level audit trail service that provides convenient methods
 * for common audit operations
 */
export class AuditTrail {
  private manager: AuditManager;

  constructor(config: AuditTrailConfig, repository?: BaseAuditRepository) {
    const repo = repository || new BaseAuditRepository();
    this.manager = new AuditManager(repo, config);
  }

  /**
   * Log user authentication events
   */
  async logAuthentication(
    userId: string,
    action: "login" | "logout" | "login_failed" | "password_change" | "mfa_challenge",
    details?: {
      method?: string;
      ipAddress?: string;
      userAgent?: string;
      location?: { country?: string; region?: string; city?: string };
      reason?: string;
    }
  ) {
    await this.manager.logEvent({
      userId,
      action,
      resource: "authentication",
      category: "authentication",
      outcome: action.includes("failed") ? "failure" : "success",
      risk: action.includes("failed") ? "medium" : "low",
      ipAddress: details?.ipAddress,
      userAgent: details?.userAgent,
      location: details?.location,
      details: {
        method: details?.method,
        reason: details?.reason,
      },
    });
  }

  /**
   * Log data access events
   */
  async logDataAccess(
    userId: string,
    action: "read" | "download" | "export" | "view",
    resource: string,
    resourceId?: string,
    details?: {
      recordCount?: number;
      dataSize?: number;
      format?: string;
      ipAddress?: string;
      sensitive?: boolean;
    }
  ) {
    await this.manager.logEvent({
      userId,
      action,
      resource,
      resourceId,
      category: "data_access",
      outcome: "success",
      risk: details?.sensitive ? "medium" : "low",
      ipAddress: details?.ipAddress,
      details: {
        recordCount: details?.recordCount,
        dataSize: details?.dataSize,
        format: details?.format,
        sensitive: details?.sensitive,
      },
    });
  }

  /**
   * Log data modification events
   */
  async logDataModification(
    userId: string,
    action: "create" | "update" | "delete" | "bulk_update" | "bulk_delete",
    resource: string,
    resourceId?: string,
    details?: {
      oldValues?: Record<string, any>;
      newValues?: Record<string, any>;
      recordCount?: number;
      ipAddress?: string;
      reason?: string;
    }
  ) {
    await this.manager.logEvent({
      userId,
      action,
      resource,
      resourceId,
      category: "data_modification",
      outcome: "success",
      risk: action.includes("delete") ? "high" : "medium",
      ipAddress: details?.ipAddress,
      details: {
        oldValues: details?.oldValues,
        newValues: details?.newValues,
        recordCount: details?.recordCount,
        reason: details?.reason,
      },
    });
  }

  /**
   * Log security events
   */
  async logSecurityEvent(
    action: string,
    details: {
      userId?: string;
      severity: "low" | "medium" | "high" | "critical";
      threatType?: string;
      blocked?: boolean;
      ipAddress?: string;
      userAgent?: string;
      description?: string;
    }
  ) {
    await this.manager.logEvent({
      userId: details.userId,
      action,
      resource: "security",
      category: "security_event",
      outcome: details.blocked ? "success" : "failure",
      risk: details.severity,
      ipAddress: details.ipAddress,
      userAgent: details.userAgent,
      details: {
        threatType: details.threatType,
        blocked: details.blocked,
        description: details.description,
      },
    });
  }

  /**
   * Log financial transactions
   */
  async logFinancialTransaction(
    userId: string,
    action: "payment" | "refund" | "charge" | "transfer" | "withdrawal",
    details: {
      transactionId: string;
      amount: number;
      currency: string;
      paymentMethod?: string;
      status: "pending" | "completed" | "failed" | "cancelled";
      ipAddress?: string;
      merchantId?: string;
    }
  ) {
    await this.manager.logEvent({
      userId,
      action,
      resource: "financial_transaction",
      resourceId: details.transactionId,
      category: "financial_transaction",
      outcome: details.status === "completed" ? "success" : 
               details.status === "failed" ? "failure" : "pending",
      risk: details.amount > 10000 ? "high" : details.amount > 1000 ? "medium" : "low",
      ipAddress: details.ipAddress,
      details: {
        amount: details.amount,
        currency: details.currency,
        paymentMethod: details.paymentMethod,
        status: details.status,
        merchantId: details.merchantId,
      },
    });
  }

  /**
   * Log privacy-related events
   */
  async logPrivacyEvent(
    action: "consent_given" | "consent_withdrawn" | "data_request" | "data_deletion" | "data_export",
    details: {
      userId?: string;
      subjectId?: string;
      dataType?: string;
      legalBasis?: string;
      requestId?: string;
      ipAddress?: string;
      automated?: boolean;
    }
  ) {
    await this.manager.logEvent({
      userId: details.userId,
      action,
      resource: "privacy",
      resourceId: details.requestId || details.subjectId,
      category: "privacy_event",
      outcome: "success",
      risk: action.includes("deletion") ? "medium" : "low",
      ipAddress: details.ipAddress,
      details: {
        subjectId: details.subjectId,
        dataType: details.dataType,
        legalBasis: details.legalBasis,
        automated: details.automated,
      },
    });
  }

  /**
   * Log system changes
   */
  async logSystemChange(
    userId: string,
    action: "config_change" | "permission_change" | "user_role_change" | "system_update",
    resource: string,
    details?: {
      oldValue?: any;
      newValue?: any;
      targetUserId?: string;
      ipAddress?: string;
      reason?: string;
      automated?: boolean;
    }
  ) {
    await this.manager.logEvent({
      userId,
      action,
      resource,
      resourceId: details?.targetUserId,
      category: "system_change",
      outcome: "success",
      risk: action.includes("permission") || action.includes("role") ? "high" : "medium",
      ipAddress: details?.ipAddress,
      details: {
        oldValue: details?.oldValue,
        newValue: details?.newValue,
        reason: details?.reason,
        automated: details?.automated,
      },
    });
  }

  /**
   * Get the underlying audit manager for advanced operations
   */
  getManager(): AuditManager {
    return this.manager;
  }
}