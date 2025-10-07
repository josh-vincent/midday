import { google, gmail_v1 } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { logger } from "@midday/logger";
import type {
  EmailMessage,
  EmailAttachment,
  EmailSyncOptions,
  EmailSyncResult,
  EmailSearchOptions,
  EmailFolder,
  EmailThread,
  EmailBatchOperation,
  EmailQuota,
  EmailWatchOptions,
  GmailCredentials,
} from "../types";

export class GmailProvider {
  private oauth2Client: OAuth2Client;
  private gmail: gmail_v1.Gmail;

  constructor(credentials: GmailCredentials) {
    if (credentials.type === "service_account" && credentials.serviceAccountKey) {
      this.oauth2Client = new google.auth.JWT({
        email: credentials.serviceAccountKey.client_email,
        key: credentials.serviceAccountKey.private_key,
        scopes: [
          "https://www.googleapis.com/auth/gmail.readonly",
          "https://www.googleapis.com/auth/gmail.send",
          "https://www.googleapis.com/auth/gmail.modify",
        ],
      });
    } else {
      this.oauth2Client = new OAuth2Client(
        credentials.clientId,
        credentials.clientSecret
      );

      if (credentials.refreshToken) {
        this.oauth2Client.setCredentials({
          refresh_token: credentials.refreshToken,
          access_token: credentials.accessToken,
          expiry_date: credentials.expiryDate,
        });
      }
    }

    this.gmail = google.gmail({ version: "v1", auth: this.oauth2Client });
  }

  async sendEmail(message: EmailMessage): Promise<{ messageId: string }> {
    try {
      const raw = this.createMimeMessage(message);
      
      const response = await this.gmail.users.messages.send({
        userId: "me",
        requestBody: {
          raw,
        },
      });

      console.log(`Email sent via Gmail: ${response.data.id}`);
      
      return { messageId: response.data.id! };
    } catch (error: any) {
      console.error("Failed to send email via Gmail:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async syncEmails(options: EmailSyncOptions): Promise<EmailSyncResult> {
    const result: EmailSyncResult = {
      success: true,
      synced: {
        messages: 0,
        attachments: 0,
        folders: 0,
      },
      errors: [],
      emails: [], // Initialize emails array
    };

    try {
      const query = this.buildSearchQuery(options);
      console.log("[Gmail Provider] Search query:", query, "maxResults:", options.maxResults);

      let pageToken: string | undefined;
      do {
        const response = await this.gmail.users.messages.list({
          userId: "me",
          q: query,
          maxResults: Math.min(options.maxResults || 100, 500),
          pageToken,
        });

        console.log("[Gmail Provider] API response:", {
          messageCount: response.data.messages?.length || 0,
          resultSizeEstimate: response.data.resultSizeEstimate,
          hasNextPageToken: !!response.data.nextPageToken,
        });

        if (response.data.messages) {
          for (const message of response.data.messages) {
            await this.syncMessage(message.id!, options, result);
          }
        }

        pageToken = response.data.nextPageToken || undefined;
        
        if (options.maxResults && result.synced.messages >= options.maxResults) {
          break;
        }
      } while (pageToken);

      if (options.folders) {
        await this.syncLabels(options.folders, result);
      }

      result.nextSyncToken = pageToken;
    } catch (error: any) {
      console.error("Gmail sync failed:", error);
      result.success = false;
      result.errors.push({ error: error.message });
    }

    return result;
  }

  async getEmail(messageId: string): Promise<EmailMessage | null> {
    try {
      const response = await this.gmail.users.messages.get({
        userId: "me",
        id: messageId,
        format: "full",
      });

      return this.parseGmailMessage(response.data);
    } catch (error: any) {
      console.error(`Failed to get email ${messageId}:`, error);
      return null;
    }
  }

  async searchEmails(options: EmailSearchOptions): Promise<EmailMessage[]> {
    const messages: EmailMessage[] = [];
    
    try {
      const query = this.buildSearchQueryFromOptions(options);
      
      const response = await this.gmail.users.messages.list({
        userId: "me",
        q: query,
        maxResults: options.maxResults || 50,
        pageToken: options.pageToken,
      });

      if (response.data.messages) {
        for (const message of response.data.messages) {
          const email = await this.getEmail(message.id!);
          if (email) {
            messages.push(email);
          }
        }
      }
    } catch (error: any) {
      console.error("Failed to search emails:", error);
      throw new Error(`Failed to search emails: ${error.message}`);
    }

    return messages;
  }

  async getFolders(): Promise<EmailFolder[]> {
    try {
      const response = await this.gmail.users.labels.list({
        userId: "me",
      });

      const folders: EmailFolder[] = [];
      
      if (response.data.labels) {
        for (const label of response.data.labels) {
          folders.push({
            id: label.id!,
            name: label.name!,
            type: this.getLabelType(label.type),
            messageCount: label.messagesTotal || 0,
            unreadCount: label.messagesUnread || 0,
          });
        }
      }

      return folders;
    } catch (error: any) {
      console.error("Failed to get Gmail folders:", error);
      throw new Error(`Failed to get folders: ${error.message}`);
    }
  }

  async getThreads(maxResults = 50): Promise<EmailThread[]> {
    try {
      const response = await this.gmail.users.threads.list({
        userId: "me",
        maxResults,
      });

      const threads: EmailThread[] = [];
      
      if (response.data.threads) {
        for (const thread of response.data.threads) {
          const threadData = await this.gmail.users.threads.get({
            userId: "me",
            id: thread.id!,
          });

          if (threadData.data) {
            threads.push(this.parseGmailThread(threadData.data));
          }
        }
      }

      return threads;
    } catch (error: any) {
      console.error("Failed to get Gmail threads:", error);
      throw new Error(`Failed to get threads: ${error.message}`);
    }
  }

  async batchOperation(operation: EmailBatchOperation): Promise<void> {
    try {
      const batchRequest = {
        userId: "me",
        requestBody: {
          ids: operation.messageIds,
        },
      };

      switch (operation.operation) {
        case "archive":
          await this.gmail.users.messages.batchModify({
            ...batchRequest,
            requestBody: {
              ...batchRequest.requestBody,
              removeLabelIds: ["INBOX"],
            },
          });
          break;

        case "delete":
          await this.gmail.users.messages.batchDelete(batchRequest);
          break;

        case "markRead":
          await this.gmail.users.messages.batchModify({
            ...batchRequest,
            requestBody: {
              ...batchRequest.requestBody,
              removeLabelIds: ["UNREAD"],
            },
          });
          break;

        case "markUnread":
          await this.gmail.users.messages.batchModify({
            ...batchRequest,
            requestBody: {
              ...batchRequest.requestBody,
              addLabelIds: ["UNREAD"],
            },
          });
          break;

        case "addLabel":
          if (operation.labels) {
            await this.gmail.users.messages.batchModify({
              ...batchRequest,
              requestBody: {
                ...batchRequest.requestBody,
                addLabelIds: operation.labels,
              },
            });
          }
          break;

        case "removeLabel":
          if (operation.labels) {
            await this.gmail.users.messages.batchModify({
              ...batchRequest,
              requestBody: {
                ...batchRequest.requestBody,
                removeLabelIds: operation.labels,
              },
            });
          }
          break;

        case "move":
          if (operation.targetFolder) {
            await this.gmail.users.messages.batchModify({
              ...batchRequest,
              requestBody: {
                ...batchRequest.requestBody,
                addLabelIds: [operation.targetFolder],
                removeLabelIds: ["INBOX"],
              },
            });
          }
          break;
      }

      console.log(`Batch operation ${operation.operation} completed for ${operation.messageIds.length} messages`);
    } catch (error: any) {
      console.error(`Batch operation ${operation.operation} failed:`, error);
      throw new Error(`Batch operation failed: ${error.message}`);
    }
  }

  async getQuota(): Promise<EmailQuota> {
    try {
      const response = await this.gmail.users.getProfile({
        userId: "me",
      });

      return {
        used: response.data.messagesTotal || 0,
        total: 15 * 1024 * 1024 * 1024, // 15GB default Gmail quota
        unit: "bytes",
      };
    } catch (error: any) {
      console.error("Failed to get Gmail quota:", error);
      throw new Error(`Failed to get quota: ${error.message}`);
    }
  }

  async watchEmails(options: EmailWatchOptions): Promise<{ historyId: string; expiration: number }> {
    try {
      const requestBody: gmail_v1.Schema$WatchRequest = {
        topicName: options.topicName || `projects/midday/topics/gmail-push`,
        labelIds: options.labelIds || ["INBOX"],
      };

      if (options.labelIds) {
        requestBody.labelFilterBehavior = "include";
      }

      const response = await this.gmail.users.watch({
        userId: "me",
        requestBody,
      });

      console.log(`Gmail watch created with history ID: ${response.data.historyId}`);

      return {
        historyId: response.data.historyId!,
        expiration: response.data.expiration!,
      };
    } catch (error: any) {
      console.error("Failed to set up Gmail watch:", error);
      throw new Error(`Failed to watch emails: ${error.message}`);
    }
  }

  async stopWatch(): Promise<void> {
    try {
      await this.gmail.users.stop({
        userId: "me",
      });
      
      console.log("Gmail watch stopped");
    } catch (error: any) {
      console.error("Failed to stop Gmail watch:", error);
      throw new Error(`Failed to stop watch: ${error.message}`);
    }
  }

  private async syncMessage(
    messageId: string,
    options: EmailSyncOptions,
    result: EmailSyncResult
  ): Promise<void> {
    try {
      const message = await this.getEmail(messageId);

      if (message) {
        result.synced.messages++;

        // Add the email to the result array
        if (result.emails) {
          result.emails.push(message);
        }

        if (message.attachments && options.syncAttachments) {
          result.synced.attachments += message.attachments.length;
        }
      }
    } catch (error: any) {
      console.error(`Failed to sync message ${messageId}:`, error);
      result.errors.push({
        messageId,
        error: error.message,
      });
    }
  }

  private async syncLabels(labelIds: string[], result: EmailSyncResult): Promise<void> {
    for (const labelId of labelIds) {
      try {
        await this.gmail.users.labels.get({
          userId: "me",
          id: labelId,
        });
        result.synced.folders++;
      } catch (error: any) {
        console.error(`Failed to sync label ${labelId}:`, error);
        result.errors.push({
          error: `Failed to sync label ${labelId}: ${error.message}`,
        });
      }
    }
  }

  private createMimeMessage(message: EmailMessage): string {
    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substr(2)}`;
    const lines: string[] = [];

    lines.push(`From: ${this.formatEmailAddress(message.from)}`);
    lines.push(`To: ${this.formatEmailAddresses(message.to)}`);
    
    if (message.cc) {
      lines.push(`Cc: ${this.formatEmailAddresses(message.cc)}`);
    }
    
    if (message.bcc) {
      lines.push(`Bcc: ${this.formatEmailAddresses(message.bcc)}`);
    }
    
    lines.push(`Subject: ${message.subject}`);
    lines.push("MIME-Version: 1.0");
    
    if (message.attachments && message.attachments.length > 0) {
      lines.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
      lines.push("");
      lines.push(`--${boundary}`);
    }

    if (message.html) {
      lines.push("Content-Type: text/html; charset=UTF-8");
      lines.push("Content-Transfer-Encoding: 7bit");
      lines.push("");
      lines.push(message.html);
    } else if (message.text) {
      lines.push("Content-Type: text/plain; charset=UTF-8");
      lines.push("Content-Transfer-Encoding: 7bit");
      lines.push("");
      lines.push(message.text);
    }

    if (message.attachments) {
      for (const attachment of message.attachments) {
        lines.push(`--${boundary}`);
        lines.push(`Content-Type: ${attachment.contentType || "application/octet-stream"}; name="${attachment.filename}"`);
        lines.push("Content-Transfer-Encoding: base64");
        lines.push(`Content-Disposition: attachment; filename="${attachment.filename}"`);
        lines.push("");
        
        const content = attachment.content instanceof Buffer
          ? attachment.content.toString("base64")
          : attachment.content || "";
        
        lines.push(content);
      }
      lines.push(`--${boundary}--`);
    }

    return Buffer.from(lines.join("\r\n")).toString("base64url");
  }

  private formatEmailAddress(address: string | any): string {
    if (typeof address === "string") {
      return address;
    }
    return address.name ? `"${address.name}" <${address.email}>` : address.email;
  }

  private formatEmailAddresses(addresses: string | string[] | any | any[]): string {
    if (typeof addresses === "string") {
      return addresses;
    }
    if (Array.isArray(addresses)) {
      return addresses.map(addr => this.formatEmailAddress(addr)).join(", ");
    }
    return this.formatEmailAddress(addresses);
  }

  private parseGmailMessage(message: gmail_v1.Schema$Message): EmailMessage {
    const headers = message.payload?.headers || [];
    const getHeader = (name: string) =>
      headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value || "";

    let text: string | undefined;
    let html: string | undefined;
    let attachments: EmailAttachment[] = [];

    if (message.payload) {
      const content = this.extractMessageContent(message.payload);
      text = content.text;
      html = content.html;
      attachments = content.attachments;
    }

    const email: EmailMessage = {
      id: message.id!,
      threadId: message.threadId,
      from: getHeader("from"),
      to: getHeader("to"),
      subject: getHeader("subject"),
      text,
      html,
      attachments,
      receivedAt: message.internalDate ? new Date(parseInt(message.internalDate, 10)) : undefined,
      isRead: !message.labelIds?.includes("UNREAD"),
      hasAttachments: attachments.length > 0,
      bodyPreview: message.snippet,
      labels: message.labelIds || [],
      metadata: {
        threadId: message.threadId,
        labelIds: message.labelIds,
        snippet: message.snippet,
      },
    };

    const cc = getHeader("cc");
    if (cc) email.cc = cc;

    const bcc = getHeader("bcc");
    if (bcc) email.bcc = bcc;

    return email;
  }

  private extractMessageContent(payload: gmail_v1.Schema$MessagePart): {
    text?: string;
    html?: string;
    attachments: EmailAttachment[];
  } {
    let text: string | undefined;
    let html: string | undefined;
    const attachments: EmailAttachment[] = [];

    const processPartRecursive = (part: gmail_v1.Schema$MessagePart) => {
      if (part.mimeType === "text/plain" && part.body?.data) {
        text = Buffer.from(part.body.data, "base64").toString("utf-8");
      } else if (part.mimeType === "text/html" && part.body?.data) {
        html = Buffer.from(part.body.data, "base64").toString("utf-8");
      } else if (part.filename && part.body?.attachmentId) {
        attachments.push({
          filename: part.filename,
          contentType: part.mimeType || "application/octet-stream",
          size: part.body.size || 0,
        });
      }

      if (part.parts) {
        for (const subpart of part.parts) {
          processPartRecursive(subpart);
        }
      }
    };

    processPartRecursive(payload);

    return { text, html, attachments };
  }

  private parseGmailThread(thread: gmail_v1.Schema$Thread): EmailThread {
    const messages = thread.messages || [];
    const lastMessage = messages[messages.length - 1];
    const headers = lastMessage?.payload?.headers || [];
    
    const getHeader = (name: string) =>
      headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value || "";

    const participantEmails = new Set<string>();
    
    for (const message of messages) {
      const msgHeaders = message.payload?.headers || [];
      const from = msgHeaders.find(h => h.name === "From")?.value;
      const to = msgHeaders.find(h => h.name === "To")?.value;
      
      if (from) participantEmails.add(from);
      if (to) participantEmails.add(to);
    }

    return {
      id: thread.id!,
      subject: getHeader("subject"),
      snippet: thread.snippet || "",
      messageIds: messages.map(m => m.id!),
      participantEmails: Array.from(participantEmails),
      lastMessageDate: new Date(parseInt(lastMessage?.internalDate || "0")),
      unread: messages.some(m => m.labelIds?.includes("UNREAD")) || false,
      important: messages.some(m => m.labelIds?.includes("IMPORTANT")) || false,
      labels: lastMessage?.labelIds || [],
    };
  }

  private buildSearchQuery(options: EmailSyncOptions): string {
    const parts: string[] = [];

    if (options.startDate) {
      parts.push(`after:${Math.floor(options.startDate.getTime() / 1000)}`);
    }

    if (options.endDate) {
      parts.push(`before:${Math.floor(options.endDate.getTime() / 1000)}`);
    }

    if (!options.syncDrafts) {
      parts.push("-in:drafts");
    }

    if (!options.syncTrash) {
      parts.push("-in:trash");
    }

    if (!options.syncSent) {
      parts.push("-in:sent");
    }

    return parts.join(" ");
  }

  private buildSearchQueryFromOptions(options: EmailSearchOptions): string {
    const parts: string[] = [];

    if (options.query) {
      parts.push(options.query);
    }

    if (options.from) {
      parts.push(`from:${options.from}`);
    }

    if (options.to) {
      parts.push(`to:${options.to}`);
    }

    if (options.subject) {
      parts.push(`subject:${options.subject}`);
    }

    if (options.hasAttachments) {
      parts.push("has:attachment");
    }

    if (options.isUnread) {
      parts.push("is:unread");
    }

    if (options.isImportant) {
      parts.push("is:important");
    }

    if (options.labels) {
      for (const label of options.labels) {
        parts.push(`label:${label}`);
      }
    }

    if (options.startDate) {
      parts.push(`after:${Math.floor(options.startDate.getTime() / 1000)}`);
    }

    if (options.endDate) {
      parts.push(`before:${Math.floor(options.endDate.getTime() / 1000)}`);
    }

    return parts.join(" ");
  }

  private getLabelType(labelType?: string | null): EmailFolder["type"] {
    switch (labelType) {
      case "system":
        return "inbox";
      case "user":
        return "custom";
      default:
        return "custom";
    }
  }
}