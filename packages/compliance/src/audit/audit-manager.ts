import { nanoid } from "nanoid";
import { format } from "date-fns";
import {
  type AuditEvent,
  type AuditFilter,
  type AuditTrailConfig,
  type AuditRepository,
  AuditEventSchema,
  AuditFilterSchema,
} from "../types/audit";

export class AuditManager {
  private repository: AuditRepository;
  private config: AuditTrailConfig;

  constructor(repository: AuditRepository, config: AuditTrailConfig) {
    this.repository = repository;
    this.config = config;
  }

  /**
   * Log an audit event
   */
  async logEvent(eventData: Omit<AuditEvent, "id" | "timestamp">): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      const event: AuditEvent = {
        id: nanoid(),
        timestamp: new Date(),
        ...eventData,
      };

      // Validate the event
      const validatedEvent = AuditEventSchema.parse(event);

      // Store the event
      await this.repository.createEvent(validatedEvent);

      // Check for real-time alerts
      if (this.config.realTimeAlerts) {
        await this.checkAlertThresholds(validatedEvent);
      }
    } catch (error) {
      console.error("Failed to log audit event:", error);
      throw new Error(`Audit logging failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Retrieve audit events with filtering
   */
  async getEvents(filter: AuditFilter): Promise<AuditEvent[]> {
    try {
      const validatedFilter = AuditFilterSchema.parse(filter);
      return await this.repository.getEvents(validatedFilter);
    } catch (error) {
      console.error("Failed to retrieve audit events:", error);
      throw new Error(`Failed to retrieve audit events: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Get a specific audit event by ID
   */
  async getEventById(id: string): Promise<AuditEvent | null> {
    try {
      return await this.repository.getEventById(id);
    } catch (error) {
      console.error("Failed to retrieve audit event:", error);
      throw new Error(`Failed to retrieve audit event: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Export audit events in various formats
   */
  async exportEvents(
    filter: AuditFilter,
    format: "json" | "csv" | "xml" = "json"
  ): Promise<string> {
    try {
      const validatedFilter = AuditFilterSchema.parse(filter);
      return await this.repository.exportEvents(validatedFilter, format);
    } catch (error) {
      console.error("Failed to export audit events:", error);
      throw new Error(`Failed to export audit events: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Clean up old audit events based on retention policy
   */
  async cleanup(): Promise<{ deleted: number; anonymized: number }> {
    try {
      let deleted = 0;
      let anonymized = 0;

      // Delete old events
      if (this.config.retentionDays) {
        deleted = await this.repository.deleteOldEvents(this.config.retentionDays);
      }

      // Anonymize events if configured
      if (this.config.anonymizeAfterDays) {
        anonymized = await this.repository.anonymizeEvents(this.config.anonymizeAfterDays);
      }

      return { deleted, anonymized };
    } catch (error) {
      console.error("Failed to cleanup audit events:", error);
      throw new Error(`Failed to cleanup audit events: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Generate audit summary for a time period
   */
  async generateSummary(startDate: Date, endDate: Date): Promise<{
    totalEvents: number;
    eventsByCategory: Record<string, number>;
    eventsByRisk: Record<string, number>;
    eventsByOutcome: Record<string, number>;
    topUsers: Array<{ userId: string; eventCount: number }>;
    topActions: Array<{ action: string; eventCount: number }>;
    failureRate: number;
    criticalEvents: number;
  }> {
    try {
      const events = await this.getEvents({
        startDate,
        endDate,
        limit: 10000, // Get all events for analysis
      });

      const summary = {
        totalEvents: events.length,
        eventsByCategory: {} as Record<string, number>,
        eventsByRisk: {} as Record<string, number>,
        eventsByOutcome: {} as Record<string, number>,
        topUsers: [] as Array<{ userId: string; eventCount: number }>,
        topActions: [] as Array<{ action: string; eventCount: number }>,
        failureRate: 0,
        criticalEvents: 0,
      };

      const userCounts = new Map<string, number>();
      const actionCounts = new Map<string, number>();
      let failures = 0;

      for (const event of events) {
        // Count by category
        summary.eventsByCategory[event.category] = (summary.eventsByCategory[event.category] || 0) + 1;

        // Count by risk
        summary.eventsByRisk[event.risk] = (summary.eventsByRisk[event.risk] || 0) + 1;

        // Count by outcome
        summary.eventsByOutcome[event.outcome] = (summary.eventsByOutcome[event.outcome] || 0) + 1;

        // Count failures
        if (event.outcome === "failure") {
          failures++;
        }

        // Count critical events
        if (event.risk === "critical") {
          summary.criticalEvents++;
        }

        // Count by user
        if (event.userId) {
          userCounts.set(event.userId, (userCounts.get(event.userId) || 0) + 1);
        }

        // Count by action
        actionCounts.set(event.action, (actionCounts.get(event.action) || 0) + 1);
      }

      // Calculate failure rate
      summary.failureRate = events.length > 0 ? (failures / events.length) * 100 : 0;

      // Get top users
      summary.topUsers = Array.from(userCounts.entries())
        .map(([userId, eventCount]) => ({ userId, eventCount }))
        .sort((a, b) => b.eventCount - a.eventCount)
        .slice(0, 10);

      // Get top actions
      summary.topActions = Array.from(actionCounts.entries())
        .map(([action, eventCount]) => ({ action, eventCount }))
        .sort((a, b) => b.eventCount - a.eventCount)
        .slice(0, 10);

      return summary;
    } catch (error) {
      console.error("Failed to generate audit summary:", error);
      throw new Error(`Failed to generate audit summary: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Check alert thresholds for real-time monitoring
   */
  private async checkAlertThresholds(event: AuditEvent): Promise<void> {
    if (!this.config.alertThresholds) {
      return;
    }

    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Check for suspicious activity
      if (event.risk === "high" || event.risk === "critical") {
        const recentHighRiskEvents = await this.getEvents({
          startDate: oneHourAgo,
          endDate: now,
          risk: ["high", "critical"],
          userId: event.userId,
          limit: 100,
        });

        if (recentHighRiskEvents.length >= this.config.alertThresholds.suspiciousActivity) {
          await this.triggerAlert("suspicious_activity", {
            userId: event.userId,
            eventCount: recentHighRiskEvents.length,
            threshold: this.config.alertThresholds.suspiciousActivity,
            event,
          });
        }
      }

      // Check for failed attempts
      if (event.outcome === "failure") {
        const recentFailures = await this.getEvents({
          startDate: oneHourAgo,
          endDate: now,
          outcome: ["failure"],
          userId: event.userId,
          action: event.action,
          limit: 100,
        });

        if (recentFailures.length >= this.config.alertThresholds.failedAttempts) {
          await this.triggerAlert("failed_attempts", {
            userId: event.userId,
            action: event.action,
            failureCount: recentFailures.length,
            threshold: this.config.alertThresholds.failedAttempts,
            event,
          });
        }
      }
    } catch (error) {
      console.error("Failed to check alert thresholds:", error);
    }
  }

  /**
   * Trigger an alert
   */
  private async triggerAlert(type: string, data: any): Promise<void> {
    // This would integrate with your alerting system
    console.warn(`AUDIT ALERT [${type}]:`, data);
    
    // You could emit events, send webhooks, notifications, etc.
    // For example:
    // await this.notificationService.send({
    //   type: 'audit_alert',
    //   severity: 'high',
    //   data
    // });
  }

  /**
   * Validate event data before logging
   */
  private validateEvent(event: Partial<AuditEvent>): void {
    if (!event.action) {
      throw new Error("Action is required for audit events");
    }

    if (!event.resource) {
      throw new Error("Resource is required for audit events");
    }

    if (!event.category) {
      throw new Error("Category is required for audit events");
    }

    if (!event.outcome) {
      throw new Error("Outcome is required for audit events");
    }
  }

  /**
   * Get audit configuration
   */
  getConfig(): AuditTrailConfig {
    return { ...this.config };
  }

  /**
   * Update audit configuration
   */
  updateConfig(updates: Partial<AuditTrailConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}