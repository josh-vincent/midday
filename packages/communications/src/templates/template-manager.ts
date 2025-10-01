import * as Handlebars from "handlebars";
import type { 
  MessageTemplate, 
  TemplateVariable,
  EmailMessage,
  SmsMessage,
  WhatsAppMessage,
  Message,
  CommunicationChannel 
} from "../types/communication";

export interface TemplateStore {
  get(id: string): Promise<MessageTemplate | null>;
  getByName(name: string): Promise<MessageTemplate | null>;
  save(template: MessageTemplate): Promise<void>;
  delete(id: string): Promise<void>;
  list(channel?: CommunicationChannel): Promise<MessageTemplate[]>;
}

export class TemplateManager {
  private store: TemplateStore;
  private compiledTemplates: Map<string, Handlebars.TemplateDelegate> = new Map();
  
  constructor(store: TemplateStore) {
    this.store = store;
    this.registerHelpers();
  }

  private registerHelpers(): void {
    // Register common Handlebars helpers
    Handlebars.registerHelper("formatDate", (date: Date | string, format?: string) => {
      const d = new Date(date);
      if (format === "short") {
        return d.toLocaleDateString();
      }
      return d.toLocaleString();
    });

    Handlebars.registerHelper("formatCurrency", (amount: number, currency = "USD") => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
      }).format(amount);
    });

    Handlebars.registerHelper("uppercase", (str: string) => {
      return str?.toUpperCase();
    });

    Handlebars.registerHelper("lowercase", (str: string) => {
      return str?.toLowerCase();
    });

    Handlebars.registerHelper("capitalize", (str: string) => {
      return str?.charAt(0).toUpperCase() + str?.slice(1);
    });

    Handlebars.registerHelper("pluralize", (count: number, singular: string, plural?: string) => {
      return count === 1 ? singular : (plural || `${singular}s`);
    });

    Handlebars.registerHelper("ifEquals", function(arg1: any, arg2: any, options: any) {
      return arg1 === arg2 ? options.fn(this) : options.inverse(this);
    });
  }

  async compileTemplate(templateId: string): Promise<Handlebars.TemplateDelegate> {
    // Check cache first
    if (this.compiledTemplates.has(templateId)) {
      return this.compiledTemplates.get(templateId)!;
    }

    const template = await this.store.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const compiled = Handlebars.compile(template.body);
    this.compiledTemplates.set(templateId, compiled);
    
    return compiled;
  }

  async renderTemplate(
    templateId: string, 
    data: Record<string, any>
  ): Promise<string> {
    const compiled = await this.compileTemplate(templateId);
    return compiled(data);
  }

  async renderSubject(
    template: MessageTemplate,
    data: Record<string, any>
  ): Promise<string | undefined> {
    if (!template.subject) return undefined;
    
    const subjectTemplate = Handlebars.compile(template.subject);
    return subjectTemplate(data);
  }

  async applyTemplate(
    templateId: string,
    baseMessage: Partial<Message>,
    data: Record<string, any>
  ): Promise<Message> {
    const template = await this.store.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Validate template matches message channel
    if (template.channel !== baseMessage.channel) {
      throw new Error(`Template channel mismatch: expected ${baseMessage.channel}, got ${template.channel}`);
    }

    // Validate required variables
    this.validateTemplateData(template, data);

    // Apply default values
    const mergedData = this.applyDefaultValues(template, data);

    // Render template body
    const body = await this.renderTemplate(templateId, mergedData);
    const subject = await this.renderSubject(template, mergedData);

    // Build message based on channel
    switch (template.channel) {
      case "email":
        return {
          ...baseMessage,
          channel: "email",
          subject: subject || "No Subject",
          html: body,
          templateId,
          templateData: mergedData,
        } as EmailMessage;

      case "sms":
        return {
          ...baseMessage,
          channel: "sms",
          body,
          templateId,
          templateData: mergedData,
        } as SmsMessage;

      case "whatsapp":
        return {
          ...baseMessage,
          channel: "whatsapp",
          body,
          templateName: templateId,
          templateData: mergedData,
        } as WhatsAppMessage;

      default:
        throw new Error(`Unsupported template channel: ${template.channel}`);
    }
  }

  private validateTemplateData(
    template: MessageTemplate,
    data: Record<string, any>
  ): void {
    if (!template.variables) return;

    for (const variable of template.variables) {
      if (variable.required && !(variable.name in data)) {
        throw new Error(`Required template variable missing: ${variable.name}`);
      }

      // Type validation
      if (variable.name in data) {
        const value = data[variable.name];
        const valueType = Array.isArray(value) ? "array" : typeof value;
        
        if (valueType !== variable.type && value !== null) {
          console.warn(
            `Template variable type mismatch for ${variable.name}: expected ${variable.type}, got ${valueType}`
          );
        }
      }
    }
  }

  private applyDefaultValues(
    template: MessageTemplate,
    data: Record<string, any>
  ): Record<string, any> {
    if (!template.variables) return data;

    const merged = { ...data };

    for (const variable of template.variables) {
      if (!(variable.name in merged) && variable.defaultValue !== undefined) {
        merged[variable.name] = variable.defaultValue;
      }
    }

    return merged;
  }

  async createTemplate(template: Omit<MessageTemplate, "id" | "createdAt" | "updatedAt">): Promise<MessageTemplate> {
    const newTemplate: MessageTemplate = {
      ...template,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Validate template syntax
    try {
      Handlebars.compile(newTemplate.body);
      if (newTemplate.subject) {
        Handlebars.compile(newTemplate.subject);
      }
    } catch (error) {
      throw new Error(`Invalid template syntax: ${error}`);
    }

    await this.store.save(newTemplate);
    return newTemplate;
  }

  async updateTemplate(
    id: string, 
    updates: Partial<Omit<MessageTemplate, "id" | "createdAt" | "updatedAt">>
  ): Promise<MessageTemplate> {
    const existing = await this.store.get(id);
    if (!existing) {
      throw new Error(`Template not found: ${id}`);
    }

    const updated: MessageTemplate = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };

    // Validate updated template syntax
    if (updated.body) {
      try {
        Handlebars.compile(updated.body);
      } catch (error) {
        throw new Error(`Invalid template body syntax: ${error}`);
      }
    }

    if (updated.subject) {
      try {
        Handlebars.compile(updated.subject);
      } catch (error) {
        throw new Error(`Invalid template subject syntax: ${error}`);
      }
    }

    await this.store.save(updated);
    
    // Clear compiled template cache
    this.compiledTemplates.delete(id);
    
    return updated;
  }

  async deleteTemplate(id: string): Promise<void> {
    await this.store.delete(id);
    this.compiledTemplates.delete(id);
  }

  async listTemplates(channel?: CommunicationChannel): Promise<MessageTemplate[]> {
    return this.store.list(channel);
  }

  async getTemplate(id: string): Promise<MessageTemplate | null> {
    return this.store.get(id);
  }

  async getTemplateByName(name: string): Promise<MessageTemplate | null> {
    return this.store.getByName(name);
  }

  clearCache(): void {
    this.compiledTemplates.clear();
  }

  private generateId(): string {
    return `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// In-memory template store implementation
export class InMemoryTemplateStore implements TemplateStore {
  private templates: Map<string, MessageTemplate> = new Map();

  async get(id: string): Promise<MessageTemplate | null> {
    return this.templates.get(id) || null;
  }

  async getByName(name: string): Promise<MessageTemplate | null> {
    for (const template of this.templates.values()) {
      if (template.name === name) {
        return template;
      }
    }
    return null;
  }

  async save(template: MessageTemplate): Promise<void> {
    this.templates.set(template.id, template);
  }

  async delete(id: string): Promise<void> {
    this.templates.delete(id);
  }

  async list(channel?: CommunicationChannel): Promise<MessageTemplate[]> {
    const all = Array.from(this.templates.values());
    if (channel) {
      return all.filter(t => t.channel === channel);
    }
    return all;
  }
}