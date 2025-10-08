import { z } from "zod";

export const disconnectEmailSchema = z.object({
  id: z.string().uuid(),
});

export const syncEmailsSchema = z.object({
  connectionId: z.string().uuid(),
  folders: z.array(z.string()).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  maxResults: z.number().int().positive().max(500).optional().default(100),
});

export const searchEmailsSchema = z.object({
  connectionId: z.string().uuid(),
  query: z.string(),
  folder: z.string().optional(),
  hasAttachments: z.boolean().optional(),
  isUnread: z.boolean().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.number().int().positive().max(100).optional().default(20),
});

export const getEmailSchema = z.object({
  connectionId: z.string().uuid(),
  messageId: z.string(),
});

export const sendEmailSchema = z.object({
  connectionId: z.string().uuid(),
  to: z.union([z.string().email(), z.array(z.string().email())]),
  subject: z.string(),
  body: z.string(),
  cc: z.union([z.string().email(), z.array(z.string().email())]).optional(),
  bcc: z.union([z.string().email(), z.array(z.string().email())]).optional(),
});
