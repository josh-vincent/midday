// Core user and team queries
export * from "./users";
export * from "./teams";
export * from "./users-on-team";
export * from "./user-invites";

// Invoice-related queries
export * from "./invoices";
export * from "./invoice-templates";
export * from "./invoice-products";
export * from "./jobs";
export * from "./jobs-enhanced";
export * from "./customers";

// Supporting queries
export * from "./activities";
export * from "./notification-settings";
export * from "./tags";
export * from "./accounting";

// Use minimal stubs for complex features that require schema changes
// Keep real implementations only for core business features that have schema support

// OAuth stubs (requires complex schema changes)
export async function validateAccessToken(db: any, token: string) {
  return null;
}

export async function createAuthorizationCode(db: any, params: any) {
  return null;
}

export async function exchangeAuthorizationCode(db: any, params: any) {
  return null;
}

export async function refreshAccessToken(db: any, params: any) {
  return null;
}

export async function revokeAccessToken(db: any, params: any) {
  return null;
}

export async function getOAuthApplicationByClientId(db: any, params: any) {
  return null;
}

// Document stubs (since we removed documents functionality)
export async function getDocumentById(db: any, params: any) {
  return null;
}

export async function getDocuments(db: any, params: any) {
  return [];
}

export async function createDocument(db: any, params: any) {
  return null;
}

export async function updateDocument(db: any, params: any) {
  return null;
}

export async function deleteDocument(db: any, params: any) {
  return null;
}

// Transaction stubs (transactions table missing from schema)
export async function getTransactions(db: any, params: any) {
  return [];
}

export async function getTransactionById(db: any, params: any) {
  return null;
}

export async function createTransaction(db: any, params: any) {
  return null;
}

export async function updateTransaction(db: any, params: any) {
  return null;
}

export async function deleteTransaction(db: any, params: any) {
  return null;
}

export async function createTransactions(db: any, params: any) {
  return [];
}

export async function deleteTransactions(db: any, params: any) {
  return null;
}

export async function updateTransactions(db: any, params: any) {
  return null;
}

export async function bulkDeleteTransactions(db: any, params: any) {
  return null;
}

export async function getTransactionsAmountFullRangeData(db: any, teamId: string) {
  return { min: 0, max: 0 };
}

export async function getSimilarTransactions(db: any, params: any) {
  return [];
}

export async function searchTransactionMatch(db: any, params: any) {
  return [];
}

// Bank account stubs (bank_accounts table missing from schema)
export async function getBankAccounts(db: any, params: any) {
  return [];
}

export async function createBankAccount(db: any, params: any) {
  return null;
}

export async function updateBankAccount(db: any, params: any) {
  return null;
}

export async function deleteBankAccount(db: any, params: any) {
  return null;
}

export async function getBankAccountsBalances(db: any, teamId: string) {
  return [];
}

export async function getBankAccountsCurrencies(db: any, teamId: string) {
  return [];
}

// Inbox stubs (inbox table missing from schema)
export async function getInbox(db: any, params: any) {
  return [];
}

export async function getInboxById(db: any, params: any) {
  return null;
}

export async function createInbox(db: any, params: any) {
  return null;
}

export async function updateInbox(db: any, params: any) {
  return null;
}

export async function deleteInbox(db: any, params: any) {
  return null;
}

export async function deleteInboxEmbedding(db: any, params: any) {
  return null;
}

export async function getInboxSearch(db: any, params: any) {
  return [];
}

export async function getInboxByStatus(db: any, params: any) {
  return [];
}

export async function matchTransaction(db: any, params: any) {
  return null;
}

export async function unmatchTransaction(db: any, params: any) {
  return null;
}

export async function confirmSuggestedMatch(db: any, params: any) {
  return null;
}

export async function declineSuggestedMatch(db: any, params: any) {
  return null;
}

// Transaction attachments stubs
export async function createAttachments(db: any, params: any) {
  return [];
}

export async function deleteAttachment(db: any, params: any) {
  return null;
}

// Transaction categories stubs
export async function getCategories(db: any, params: any) {
  return [];
}

export async function getCategoryById(db: any, params: any) {
  return null;
}

export async function createTransactionCategory(db: any, params: any) {
  return null;
}

export async function updateTransactionCategory(db: any, params: any) {
  return null;
}

export async function deleteTransactionCategory(db: any, params: any) {
  return null;
}

// Transaction tags stubs
export async function createTransactionTag(db: any, params: any) {
  return null;
}

export async function deleteTransactionTag(db: any, params: any) {
  return null;
}

// Tracker stubs
export async function getTrackerProjects(db: any, params: any) {
  return [];
}

export async function getTrackerProjectById(db: any, params: any) {
  return null;
}

export async function upsertTrackerProject(db: any, params: any) {
  return null;
}

export async function deleteTrackerProject(db: any, params: any) {
  return null;
}

export async function getTrackerEntries(db: any, params: any) {
  return [];
}

export async function createTrackerEntry(db: any, params: any) {
  return null;
}

export async function updateTrackerEntry(db: any, params: any) {
  return null;
}

export async function deleteTrackerEntry(db: any, params: any) {
  return null;
}

export async function getCurrentTimer(db: any, params: any) {
  return null;
}

export async function getTimerStatus(db: any, params: any) {
  return null;
}

export async function getTrackerRecordsByDate(db: any, params: any) {
  return [];
}

export async function getTrackerRecordsByRange(db: any, params: any) {
  return [];
}

export async function startTimer(db: any, params: any) {
  return null;
}

export async function stopTimer(db: any, params: any) {
  return null;
}

export async function upsertTrackerEntries(db: any, params: any) {
  return [];
}

// Reports/metrics stubs
export async function getReports(db: any, params: any) {
  return [];
}

export async function getMetrics(db: any, params: any) {
  return {};
}

export async function getRunway(db: any, params: any) {
  return {};
}

export async function getExpenses(db: any, params: any) {
  return [];
}

export async function getBurnRate(db: any, params: any) {
  return {};
}

export async function getRevenue(db: any, params: any) {
  return {};
}

export async function getRecurringRevenue(db: any, params: any) {
  return {};
}

export async function getProfitAndLoss(db: any, params: any) {
  return {};
}

export async function getSpending(db: any, params: any) {
  return {};
}

export async function getTaxSummary(db: any, params: any) {
  return {};
}

// Customer analytics functions
export type GetTopRevenueClientParams = {
  teamId: string;
};

export async function getTopRevenueClient(
  db: any,
  params: GetTopRevenueClientParams,
) {
  const { teamId } = params;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const result = await db
    .select({
      customerId: customers.id,
      customerName: customers.name,
      totalRevenue: sql<number>`SUM(${invoices.amount})::float`,
      currency: invoices.currency,
      invoiceCount: sql<number>`COUNT(${invoices.id})::int`,
    })
    .from(customers)
    .innerJoin(
      invoices,
      and(
        eq(invoices.customerId, customers.id),
        gte(invoices.createdAt, thirtyDaysAgo.toISOString()),
        inArray(invoices.status, ["paid", "unpaid", "overdue"]), // Exclude drafts
      ),
    )
    .where(eq(customers.teamId, teamId))
    .groupBy(customers.id, customers.name, invoices.currency)
    .orderBy(sql`SUM(${invoices.amount}) DESC`)
    .limit(1);

  return result[0] || null;
}

export type GetNewCustomersCountParams = {
  teamId: string;
};

export async function getNewCustomersCount(
  db: any,
  params: GetNewCustomersCountParams,
) {
  const { teamId } = params;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [result] = await db
    .select({
      count: sql<number>`COUNT(*)::int`,
    })
    .from(customers)
    .where(
      and(
        eq(customers.teamId, teamId),
        gte(customers.createdAt, thirtyDaysAgo.toISOString()),
      ),
    );

  return result?.count || 0;
}

// Short links functions

export type ShortLink = {
  id: string;
  shortId: string;
  url: string;
  teamId: string;
  userId: string;
  createdAt: string;
};

export async function getShortLinkByShortId(db: any, shortId: string) {
  const [result] = await db
    .select({
      id: shortLinks.id,
      shortId: shortLinks.shortId,
      url: shortLinks.url,
      teamId: shortLinks.teamId,
      userId: shortLinks.userId,
      createdAt: shortLinks.createdAt,
      fileName: shortLinks.fileName,
      teamName: teams.name,
      type: shortLinks.type,
      size: shortLinks.size,
      mimeType: shortLinks.mimeType,
      expiresAt: shortLinks.expiresAt,
    })
    .from(shortLinks)
    .leftJoin(teams, eq(shortLinks.teamId, teams.id))
    .where(eq(shortLinks.shortId, shortId))
    .limit(1);

  return result;
}

type CreateShortLinkData = {
  url: string;
  teamId: string;
  userId: string;
  type: "redirect" | "download";
  fileName?: string;
  mimeType?: string;
  size?: number;
  expiresAt?: string;
};

export async function createShortLink(db: any, data: CreateShortLinkData) {
  const shortId = nanoid(8);

  const [result] = await db
    .insert(shortLinks)
    .values({
      shortId,
      url: data.url,
      teamId: data.teamId,
      userId: data.userId,
      type: data.type,
      fileName: data.fileName,
      mimeType: data.mimeType,
      size: data.size,
      expiresAt: data.expiresAt,
    })
    .returning({
      id: shortLinks.id,
      shortId: shortLinks.shortId,
      url: shortLinks.url,
      type: shortLinks.type,
      fileName: shortLinks.fileName,
      mimeType: shortLinks.mimeType,
      size: shortLinks.size,
      createdAt: shortLinks.createdAt,
      expiresAt: shortLinks.expiresAt,
    });

  return result;
}

export async function getShortLinks(db: any, params: any) {
  return [];
}

export async function updateShortLink(db: any, params: any) {
  return null;
}

export async function deleteShortLink(db: any, params: any) {
  return null;
}

// Additional imports for real implementations
import { sql, eq, and, desc, inArray, lte, ne, gte } from "drizzle-orm";
import { shortLinks, teams, activities, customers, invoices } from "@db/schema";
import type { activityStatusEnum } from "@db/schema";
import type { SQL } from "drizzle-orm/sql/sql";
import { nanoid } from "nanoid";

// Search functions

export type GlobalSearchReturnType = {
  id: string;
  type: string;
  title: string;
  relevance: number;
  created_at: string;
  data: any;
};

export type GlobalSemanticSearchParams = {
  teamId: string;
  searchTerm: string;
  itemsPerTableLimit: number;
  language?: string;
  types?: string[];
  amount?: number;
  amountMin?: number;
  amountMax?: number;
  status?: string;
  currency?: string;
  startDate?: string;
  endDate?: string;
  dueDateStart?: string;
  dueDateEnd?: string;
};

type GlobalSearchParams = {
  teamId: string;
  searchTerm?: string;
  limit?: number;
  itemsPerTableLimit?: number;
  language?: string;
  relevanceThreshold?: number;
};

export async function globalSearchQuery(
  db: any,
  params: GlobalSearchParams,
) {
  const result: GlobalSearchReturnType[] = await db.executeOnReplica(
    sql`SELECT * FROM global_search(
        ${params.searchTerm ?? null},
        ${params.teamId ?? null},
        ${params.language ?? "english"},
        ${params.limit ?? null},
        ${params.itemsPerTableLimit ?? null},
        ${params.relevanceThreshold ?? null}
      )`,
  );

  return result;
}

export async function globalSemanticSearchQuery(
  db: any,
  params: GlobalSemanticSearchParams,
) {
  return [];
}

// API key stubs (api_keys table missing from schema)
export async function getApiKeyByToken(db: any, token: string) {
  return null;
}

export async function updateApiKeyLastUsedAt(db: any, id: string) {
  return null;
}

// Activity functions (additional ones not in activities.ts)

export async function updateActivityStatus(
  db: any,
  activityId: string,
  status: (typeof activityStatusEnum.enumValues)[number],
  teamId: string,
) {
  const [result] = await db
    .update(activities)
    .set({ status })
    .where(and(eq(activities.id, activityId), eq(activities.teamId, teamId)))
    .returning();

  return result;
}

export async function updateAllActivitiesStatus(
  db: any,
  teamId: string,
  status: (typeof activityStatusEnum.enumValues)[number],
  options: { userId: string },
) {
  const conditions = [
    eq(activities.teamId, teamId),
    eq(activities.userId, options.userId),
  ];

  // Only update specific statuses based on the target status
  if (status === "archived") {
    // When archiving, update unread and read notifications
    conditions.push(inArray(activities.status, ["unread", "read"]));
  } else if (status === "read") {
    // When marking as read, only update unread notifications (never archived)
    conditions.push(eq(activities.status, "unread"));
  } else {
    // For other statuses, use the original logic but exclude archived
    conditions.push(ne(activities.status, status));
    conditions.push(ne(activities.status, "archived"));
  }

  const result = await db
    .update(activities)
    .set({ status })
    .where(and(...conditions))
    .returning();

  return result;
}

export type GetActivitiesParams = {
  teamId: string;
  cursor?: string | null;
  pageSize?: number;
  status?:
    | (typeof activityStatusEnum.enumValues)[number][]
    | (typeof activityStatusEnum.enumValues)[number]
    | null;
  userId?: string | null;
  priority?: number | null;
  maxPriority?: number | null; // For filtering notifications (priority <= 3)
};

export async function getActivities(db: any, params: GetActivitiesParams) {
  const {
    teamId,
    cursor,
    pageSize = 20,
    status,
    userId,
    priority,
    maxPriority,
  } = params;

  // Convert cursor to offset
  const offset = cursor ? Number.parseInt(cursor, 10) : 0;

  // Base conditions for the WHERE clause
  const whereConditions: SQL[] = [eq(activities.teamId, teamId)];

  // Filter by status - support both single status and array of statuses
  if (status) {
    if (Array.isArray(status)) {
      whereConditions.push(inArray(activities.status, status));
    } else {
      whereConditions.push(eq(activities.status, status));
    }
  }

  // Filter by user if specified
  if (userId) {
    whereConditions.push(eq(activities.userId, userId));
  }

  // Filter by priority if specified
  if (priority) {
    whereConditions.push(eq(activities.priority, priority));
  }

  // Filter by max priority if specified (for notifications: priority <= 3)
  if (maxPriority) {
    whereConditions.push(lte(activities.priority, maxPriority));
  }

  // Execute the query with proper ordering and pagination
  const data = await db
    .select()
    .from(activities)
    .where(and(...whereConditions))
    .orderBy(desc(activities.createdAt)) // Most recent first
    .limit(pageSize)
    .offset(offset);

  // Calculate next cursor
  const nextOffset = data.length === pageSize ? offset + pageSize : null;
  const nextCursor = nextOffset !== null ? nextOffset.toString() : null;

  return {
    data,
    cursor: nextCursor,
  };
}

export async function getActivityById(db: any, id: string, teamId: string) {
  const [result] = await db
    .select()
    .from(activities)
    .where(and(eq(activities.id, id), eq(activities.teamId, teamId)))
    .limit(1);

  return result;
}