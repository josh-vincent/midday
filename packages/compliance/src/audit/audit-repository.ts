import { type AuditEvent, type AuditFilter, type AuditRepository } from "../types/audit";

/**
 * Base audit repository interface implementation
 * This can be extended for different storage backends (SQL, NoSQL, etc.)
 */
export class BaseAuditRepository implements AuditRepository {
  private events: Map<string, AuditEvent> = new Map();

  async createEvent(event: AuditEvent): Promise<void> {
    this.events.set(event.id, { ...event });
  }

  async getEvents(filter: AuditFilter): Promise<AuditEvent[]> {
    let events = Array.from(this.events.values());

    // Apply filters
    if (filter.startDate) {
      events = events.filter(e => e.timestamp >= filter.startDate!);
    }

    if (filter.endDate) {
      events = events.filter(e => e.timestamp <= filter.endDate!);
    }

    if (filter.userId) {
      events = events.filter(e => e.userId === filter.userId);
    }

    if (filter.action) {
      events = events.filter(e => e.action === filter.action);
    }

    if (filter.resource) {
      events = events.filter(e => e.resource === filter.resource);
    }

    if (filter.category && filter.category.length > 0) {
      events = events.filter(e => filter.category!.includes(e.category));
    }

    if (filter.risk && filter.risk.length > 0) {
      events = events.filter(e => filter.risk!.includes(e.risk));
    }

    if (filter.outcome && filter.outcome.length > 0) {
      events = events.filter(e => filter.outcome!.includes(e.outcome));
    }

    // Sort by timestamp (newest first)
    events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    const start = filter.offset || 0;
    const end = start + (filter.limit || 100);
    return events.slice(start, end);
  }

  async getEventById(id: string): Promise<AuditEvent | null> {
    return this.events.get(id) || null;
  }

  async deleteOldEvents(olderThanDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    let deletedCount = 0;
    for (const [id, event] of this.events.entries()) {
      if (event.timestamp < cutoffDate) {
        this.events.delete(id);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  async anonymizeEvents(olderThanDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    let anonymizedCount = 0;
    for (const [id, event] of this.events.entries()) {
      if (event.timestamp < cutoffDate && (event.userId || event.ipAddress)) {
        const anonymizedEvent = {
          ...event,
          userId: event.userId ? "[ANONYMIZED]" : event.userId,
          ipAddress: event.ipAddress ? "[ANONYMIZED]" : event.ipAddress,
          userAgent: event.userAgent ? "[ANONYMIZED]" : event.userAgent,
          location: undefined,
          details: event.details ? { ...event.details, personal_info: "[ANONYMIZED]" } : event.details,
        };
        this.events.set(id, anonymizedEvent);
        anonymizedCount++;
      }
    }

    return anonymizedCount;
  }

  async exportEvents(filter: AuditFilter, format: "json" | "csv" | "xml"): Promise<string> {
    const events = await this.getEvents(filter);

    switch (format) {
      case "json":
        return JSON.stringify(events, null, 2);
      
      case "csv":
        if (events.length === 0) return "";
        
        const headers = Object.keys(events[0]).join(",");
        const rows = events.map(event => 
          Object.values(event).map(value => 
            typeof value === "object" ? JSON.stringify(value) : String(value)
          ).join(",")
        );
        return [headers, ...rows].join("\n");
      
      case "xml":
        const xmlContent = events.map(event => {
          const eventXml = Object.entries(event).map(([key, value]) => {
            const xmlValue = typeof value === "object" ? JSON.stringify(value) : String(value);
            return `    <${key}>${xmlValue}</${key}>`;
          }).join("\n");
          return `  <event>\n${eventXml}\n  </event>`;
        }).join("\n");
        return `<?xml version="1.0" encoding="UTF-8"?>\n<auditEvents>\n${xmlContent}\n</auditEvents>`;
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }
}