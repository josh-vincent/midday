import { Client, PageCollection } from "@microsoft/microsoft-graph-client";
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
  OutlookCredentials,
} from "../types";

export class OutlookProvider {
  private client: Client;
  private credentials: OutlookCredentials;

  constructor(credentials: OutlookCredentials) {
    this.credentials = credentials;
    
    this.client = Client.init({
      authProvider: async (done) => {
        try {
          const token = await this.getAccessToken();
          done(null, token);
        } catch (error: any) {
          done(error, null);
        }
      },
    });
  }

  private async getAccessToken(): Promise<string> {
    if (this.credentials.accessToken && 
        this.credentials.expiryDate && 
        this.credentials.expiryDate > Date.now()) {
      return this.credentials.accessToken;
    }

    const tokenEndpoint = `https://login.microsoftonline.com/${this.credentials.tenantId}/oauth2/v2.0/token`;
    
    const params = new URLSearchParams({
      client_id: this.credentials.clientId!,
      client_secret: this.credentials.clientSecret!,
      refresh_token: this.credentials.refreshToken!,
      grant_type: "refresh_token",
      scope: "https://graph.microsoft.com/.default",
    });

    const response = await fetch(tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${response.statusText}`);
    }

    const data = await response.json();
    
    this.credentials.accessToken = data.access_token;
    this.credentials.expiryDate = Date.now() + (data.expires_in * 1000);
    
    return data.access_token;
  }

  async sendEmail(message: EmailMessage): Promise<{ messageId: string }> {
    try {
      const outlookMessage = this.convertToOutlookMessage(message);
      
      const response = await this.client
        .api("/me/sendMail")
        .post({
          message: outlookMessage,
          saveToSentItems: true,
        });

      logger.info("Email sent via Outlook");
      
      return { messageId: response.id || "sent" };
    } catch (error: any) {
      logger.error("Failed to send email via Outlook:", error);
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
    };

    try {
      let endpoint = "/me/messages";
      const filters: string[] = [];

      if (options.startDate) {
        filters.push(`receivedDateTime ge ${options.startDate.toISOString()}`);
      }

      if (options.endDate) {
        filters.push(`receivedDateTime le ${options.endDate.toISOString()}`);
      }

      if (!options.syncDrafts) {
        filters.push("isDraft eq false");
      }

      const queryParams: any = {
        $top: Math.min(options.maxResults || 100, 999),
        $select: "id,subject,from,to,receivedDateTime,bodyPreview,hasAttachments,conversationId",
        $orderby: "receivedDateTime desc",
      };

      if (filters.length > 0) {
        queryParams.$filter = filters.join(" and ");
      }

      let messages: PageCollection = await this.client
        .api(endpoint)
        .query(queryParams)
        .get();

      while (messages.value.length > 0) {
        for (const message of messages.value) {
          await this.syncMessage(message, options, result);
        }

        if (!messages["@odata.nextLink"] || 
            (options.maxResults && result.synced.messages >= options.maxResults)) {
          break;
        }

        messages = await this.client
          .api(messages["@odata.nextLink"])
          .get();
      }

      if (options.folders) {
        await this.syncFolders(options.folders, result);
      }

      result.nextSyncToken = messages["@odata.deltaLink"];
    } catch (error: any) {
      logger.error("Outlook sync failed:", error);
      result.success = false;
      result.errors.push({ error: error.message });
    }

    return result;
  }

  async getEmail(messageId: string): Promise<EmailMessage | null> {
    try {
      const message = await this.client
        .api(`/me/messages/${messageId}`)
        .select("id,subject,from,to,cc,bcc,body,hasAttachments,receivedDateTime")
        .expand("attachments")
        .get();

      return this.parseOutlookMessage(message);
    } catch (error: any) {
      logger.error(`Failed to get email ${messageId}:`, error);
      return null;
    }
  }

  async searchEmails(options: EmailSearchOptions): Promise<EmailMessage[]> {
    const messages: EmailMessage[] = [];
    
    try {
      const filters: string[] = [];
      
      if (options.query) {
        filters.push(`contains(subject,'${options.query}') or contains(body/content,'${options.query}')`);
      }

      if (options.from) {
        filters.push(`from/emailAddress/address eq '${options.from}'`);
      }

      if (options.to) {
        filters.push(`toRecipients/any(t: t/emailAddress/address eq '${options.to}')`);
      }

      if (options.subject) {
        filters.push(`contains(subject,'${options.subject}')`);
      }

      if (options.hasAttachments) {
        filters.push("hasAttachments eq true");
      }

      if (options.isUnread) {
        filters.push("isRead eq false");
      }

      if (options.isImportant) {
        filters.push("importance eq 'high'");
      }

      if (options.startDate) {
        filters.push(`receivedDateTime ge ${options.startDate.toISOString()}`);
      }

      if (options.endDate) {
        filters.push(`receivedDateTime le ${options.endDate.toISOString()}`);
      }

      const queryParams: any = {
        $top: options.maxResults || 50,
        $select: "id,subject,from,to,receivedDateTime,body,hasAttachments",
      };

      if (filters.length > 0) {
        queryParams.$filter = filters.join(" and ");
      }

      const response = await this.client
        .api("/me/messages")
        .query(queryParams)
        .get();

      for (const message of response.value) {
        const email = this.parseOutlookMessage(message);
        if (email) {
          messages.push(email);
        }
      }
    } catch (error: any) {
      logger.error("Failed to search emails:", error);
      throw new Error(`Failed to search emails: ${error.message}`);
    }

    return messages;
  }

  async getFolders(): Promise<EmailFolder[]> {
    try {
      const response = await this.client
        .api("/me/mailFolders")
        .select("id,displayName,totalItemCount,unreadItemCount,parentFolderId")
        .get();

      const folders: EmailFolder[] = [];
      
      for (const folder of response.value) {
        folders.push({
          id: folder.id,
          name: folder.displayName,
          type: this.getFolderType(folder.displayName),
          messageCount: folder.totalItemCount,
          unreadCount: folder.unreadItemCount,
          parentId: folder.parentFolderId,
        });
      }

      return folders;
    } catch (error: any) {
      logger.error("Failed to get Outlook folders:", error);
      throw new Error(`Failed to get folders: ${error.message}`);
    }
  }

  async getThreads(maxResults = 50): Promise<EmailThread[]> {
    try {
      const response = await this.client
        .api("/me/messages")
        .query({
          $top: maxResults,
          $select: "id,conversationId,subject,from,receivedDateTime,isRead,importance",
          $orderby: "receivedDateTime desc",
        })
        .get();

      const threadsMap = new Map<string, EmailThread>();
      
      for (const message of response.value) {
        const conversationId = message.conversationId;
        
        if (!threadsMap.has(conversationId)) {
          threadsMap.set(conversationId, {
            id: conversationId,
            subject: message.subject,
            snippet: message.bodyPreview || "",
            messageIds: [],
            participantEmails: [],
            lastMessageDate: new Date(message.receivedDateTime),
            unread: !message.isRead,
            important: message.importance === "high",
          });
        }

        const thread = threadsMap.get(conversationId)!;
        thread.messageIds.push(message.id);
        
        if (message.from?.emailAddress?.address) {
          thread.participantEmails.push(message.from.emailAddress.address);
        }
      }

      return Array.from(threadsMap.values());
    } catch (error: any) {
      logger.error("Failed to get Outlook threads:", error);
      throw new Error(`Failed to get threads: ${error.message}`);
    }
  }

  async batchOperation(operation: EmailBatchOperation): Promise<void> {
    try {
      const batchRequests = [];

      for (const messageId of operation.messageIds) {
        let request: any = {
          id: messageId,
          method: "PATCH",
          url: `/me/messages/${messageId}`,
          headers: {
            "Content-Type": "application/json",
          },
        };

        switch (operation.operation) {
          case "archive":
            request.body = { isRead: true };
            batchRequests.push(request);
            batchRequests.push({
              id: `${messageId}_move`,
              method: "POST",
              url: `/me/messages/${messageId}/move`,
              body: { destinationId: "archive" },
            });
            break;

          case "delete":
            request.method = "DELETE";
            delete request.body;
            batchRequests.push(request);
            break;

          case "markRead":
            request.body = { isRead: true };
            batchRequests.push(request);
            break;

          case "markUnread":
            request.body = { isRead: false };
            batchRequests.push(request);
            break;

          case "move":
            if (operation.targetFolder) {
              batchRequests.push({
                id: messageId,
                method: "POST",
                url: `/me/messages/${messageId}/move`,
                body: { destinationId: operation.targetFolder },
              });
            }
            break;

          case "addLabel":
          case "removeLabel":
            logger.warn("Labels are not supported in Outlook, using categories instead");
            break;
        }
      }

      if (batchRequests.length > 0) {
        await this.client
          .api("/$batch")
          .post({ requests: batchRequests });
      }

      logger.info(`Batch operation ${operation.operation} completed for ${operation.messageIds.length} messages`);
    } catch (error: any) {
      logger.error(`Batch operation ${operation.operation} failed:`, error);
      throw new Error(`Batch operation failed: ${error.message}`);
    }
  }

  async getQuota(): Promise<EmailQuota> {
    try {
      const user = await this.client
        .api("/me")
        .select("mailboxSettings")
        .get();

      const mailbox = await this.client
        .api("/me/mailboxSettings")
        .get();

      return {
        used: 0,
        total: 50 * 1024 * 1024 * 1024, // 50GB default Outlook quota
        unit: "bytes",
      };
    } catch (error: any) {
      logger.error("Failed to get Outlook quota:", error);
      throw new Error(`Failed to get quota: ${error.message}`);
    }
  }

  async watchEmails(options: EmailWatchOptions): Promise<{ subscriptionId: string; expiration: number }> {
    try {
      const subscription = await this.client
        .api("/subscriptions")
        .post({
          changeType: "created,updated",
          notificationUrl: options.webhookUrl,
          resource: "/me/messages",
          expirationDateTime: new Date(
            Date.now() + (options.expirationTime || 4230 * 60 * 1000)
          ).toISOString(),
          clientState: `team_${options.teamId}_user_${options.userId}`,
        });

      logger.info(`Outlook subscription created: ${subscription.id}`);

      return {
        subscriptionId: subscription.id,
        expiration: new Date(subscription.expirationDateTime).getTime(),
      };
    } catch (error: any) {
      logger.error("Failed to set up Outlook watch:", error);
      throw new Error(`Failed to watch emails: ${error.message}`);
    }
  }

  async stopWatch(subscriptionId: string): Promise<void> {
    try {
      await this.client
        .api(`/subscriptions/${subscriptionId}`)
        .delete();
      
      logger.info(`Outlook subscription deleted: ${subscriptionId}`);
    } catch (error: any) {
      logger.error("Failed to stop Outlook watch:", error);
      throw new Error(`Failed to stop watch: ${error.message}`);
    }
  }

  private async syncMessage(
    message: any,
    options: EmailSyncOptions,
    result: EmailSyncResult
  ): Promise<void> {
    try {
      result.synced.messages++;
      
      if (message.hasAttachments && options.syncAttachments) {
        const fullMessage = await this.client
          .api(`/me/messages/${message.id}`)
          .expand("attachments")
          .get();
        
        if (fullMessage.attachments) {
          result.synced.attachments += fullMessage.attachments.length;
        }
      }
    } catch (error: any) {
      logger.error(`Failed to sync message ${message.id}:`, error);
      result.errors.push({
        messageId: message.id,
        error: error.message,
      });
    }
  }

  private async syncFolders(folderIds: string[], result: EmailSyncResult): Promise<void> {
    for (const folderId of folderIds) {
      try {
        await this.client
          .api(`/me/mailFolders/${folderId}`)
          .get();
        result.synced.folders++;
      } catch (error: any) {
        logger.error(`Failed to sync folder ${folderId}:`, error);
        result.errors.push({
          error: `Failed to sync folder ${folderId}: ${error.message}`,
        });
      }
    }
  }

  private convertToOutlookMessage(message: EmailMessage): any {
    const outlookMessage: any = {
      subject: message.subject,
      body: {
        contentType: message.html ? "HTML" : "Text",
        content: message.html || message.text || "",
      },
      toRecipients: this.formatRecipients(message.to),
    };

    if (message.cc) {
      outlookMessage.ccRecipients = this.formatRecipients(message.cc);
    }

    if (message.bcc) {
      outlookMessage.bccRecipients = this.formatRecipients(message.bcc);
    }

    if (message.attachments) {
      outlookMessage.attachments = message.attachments.map(att => ({
        "@odata.type": "#microsoft.graph.fileAttachment",
        name: att.filename,
        contentType: att.contentType || "application/octet-stream",
        contentBytes: att.content instanceof Buffer
          ? att.content.toString("base64")
          : att.content,
      }));
    }

    if (message.priority) {
      outlookMessage.importance = message.priority === "high" ? "high" : 
                                   message.priority === "low" ? "low" : "normal";
    }

    return outlookMessage;
  }

  private formatRecipients(recipients: string | string[] | any | any[]): any[] {
    const formatted: any[] = [];
    
    const addRecipient = (recipient: string | any) => {
      if (typeof recipient === "string") {
        formatted.push({
          emailAddress: { address: recipient },
        });
      } else {
        formatted.push({
          emailAddress: {
            address: recipient.email,
            name: recipient.name,
          },
        });
      }
    };

    if (Array.isArray(recipients)) {
      recipients.forEach(addRecipient);
    } else {
      addRecipient(recipients);
    }

    return formatted;
  }

  private parseOutlookMessage(message: any): EmailMessage {
    const email: EmailMessage = {
      id: message.id,
      from: message.from?.emailAddress?.address || "",
      to: message.toRecipients?.map((r: any) => r.emailAddress.address).join(", ") || "",
      subject: message.subject || "",
      text: message.body?.contentType === "Text" ? message.body.content : undefined,
      html: message.body?.contentType === "HTML" ? message.body.content : undefined,
      metadata: {
        conversationId: message.conversationId,
        importance: message.importance,
        isRead: message.isRead,
        receivedDateTime: message.receivedDateTime,
      },
    };

    if (message.ccRecipients?.length > 0) {
      email.cc = message.ccRecipients.map((r: any) => r.emailAddress.address).join(", ");
    }

    if (message.bccRecipients?.length > 0) {
      email.bcc = message.bccRecipients.map((r: any) => r.emailAddress.address).join(", ");
    }

    if (message.attachments) {
      email.attachments = message.attachments.map((att: any) => ({
        filename: att.name,
        contentType: att.contentType,
        size: att.size,
        contentId: att.id,
      }));
    }

    return email;
  }

  private getFolderType(folderName: string): EmailFolder["type"] {
    const lowerName = folderName.toLowerCase();
    
    if (lowerName === "inbox") return "inbox";
    if (lowerName === "sent" || lowerName === "sent items") return "sent";
    if (lowerName === "drafts") return "drafts";
    if (lowerName === "deleted items" || lowerName === "trash") return "trash";
    if (lowerName === "junk" || lowerName === "spam") return "spam";
    
    return "custom";
  }
}