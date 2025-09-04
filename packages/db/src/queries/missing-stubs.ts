import type { Database } from "../client";

// All stub implementations for missing functions

export async function getTopRevenueClient(db: Database, params: any) {
  return null;
}

export async function createShortLink(db: Database, params: any) {
  return null;
}

export async function getShortLinkByShortId(db: Database, shortId: string) {
  return null;
}

export async function getDocumentById(db: Database, params: any) {
  return null;
}

export async function getDocuments(db: Database, params: any) {
  return [];
}

export async function createDocument(db: Database, params: any) {
  return null;
}

export async function updateDocument(db: Database, params: any) {
  return null;
}

export async function deleteDocument(db: Database, params: any) {
  return null;
}

export async function getTransactions(db: Database, params: any) {
  return [];
}

export async function getTransactionById(db: Database, params: any) {
  return null;
}

export async function updateTransaction(db: Database, params: any) {
  return null;
}

export async function deleteTransaction(db: Database, params: any) {
  return null;
}

export async function createTransaction(db: Database, params: any) {
  return null;
}

export async function getReports(db: Database, params: any) {
  return [];
}

export async function getMetrics(db: Database, params: any) {
  return {};
}

export async function getExpenses(db: Database, params: any) {
  return [];
}

export async function getRevenue(db: Database, params: any) {
  return [];
}

export async function getProfit(db: Database, params: any) {
  return [];
}

export async function getBurn(db: Database, params: any) {
  return [];
}

export async function getRunway(db: Database, params: any) {
  return null;
}

export async function updateInbox(db: Database, params: any) {
  return null;
}

export async function getInbox(db: Database, params: any) {
  return null;
}

export async function getInboxById(db: Database, params: any) {
  return null;
}

export async function getInboxItems(db: Database, params: any) {
  return [];
}

export async function deleteInboxItem(db: Database, params: any) {
  return null;
}

export async function updateInboxItem(db: Database, params: any) {
  return null;
}

export async function getCategories(db: Database, params: any) {
  return [];
}

export async function getCategory(db: Database, params: any) {
  return null;
}

export async function createCategory(db: Database, params: any) {
  return null;
}

export async function updateCategory(db: Database, params: any) {
  return null;
}

export async function deleteCategory(db: Database, params: any) {
  return null;
}

export async function deleteInbox(db: Database, params: any) {
  return null;
}

// OAuth-related stubs
export async function createAuthorizationCode(db: Database, params: any) {
  return null;
}

export async function getAuthorizationCode(db: Database, params: any) {
  return null;
}

export async function deleteAuthorizationCode(db: Database, params: any) {
  return null;
}

export async function createAccessToken(db: Database, params: any) {
  return null;
}

export async function getAccessToken(db: Database, params: any) {
  return null;
}

export async function deleteAccessToken(db: Database, params: any) {
  return null;
}

export async function revokeAccessToken(db: Database, params: any) {
  return null;
}

export async function createOAuthApplication(db: Database, params: any) {
  return null;
}

export async function getOAuthApplications(db: Database, params: any) {
  return [];
}

export async function getOAuthApplicationById(db: Database, params: any) {
  return null;
}

export async function updateOAuthApplication(db: Database, params: any) {
  return null;
}

export async function deleteOAuthApplication(db: Database, params: any) {
  return null;
}

export async function getOAuthApplicationByClientId(db: Database, params: any) {
  return null;
}

export async function exchangeAuthorizationCode(db: Database, params: any) {
  return null;
}

export async function refreshAccessToken(db: Database, params: any) {
  return null;
}

export async function getBurnRate(db: Database, params: any) {
  return null;
}

export async function getCurrentUserTeamInfo(db: Database, params: any) {
  return null;
}

export async function getSpending(db: Database, params: any) {
  return null;
}

export async function getTrackerProjectsByTeam(db: Database, params: any) {
  return [];
}


export async function getTeamSettings(db: Database, params: any) {
  return null;
}

export async function updateTeamSettings(db: Database, params: any) {
  return null;
}

export async function getSubscriptions(db: Database, params: any) {
  return [];
}

export async function cancelSubscription(db: Database, params: any) {
  return null;
}

export async function globalSearchQuery(db: Database, params: any) {
  return [];
}

// Timer-related stubs
export async function getTimerStatus(db: Database, params: any) {
  return null;
}

export async function startTimer(db: Database, params: any) {
  return null;
}

export async function stopTimer(db: Database, params: any) {
  return null;
}

export async function updateTimer(db: Database, params: any) {
  return null;
}

export async function getTrackerEntries(db: Database, params: any) {
  return [];
}

export async function createTrackerEntry(db: Database, params: any) {
  return null;
}

export async function updateTrackerEntry(db: Database, params: any) {
  return null;
}

export async function deleteTrackerEntry(db: Database, params: any) {
  return null;
}

export async function getTrackerReports(db: Database, params: any) {
  return [];
}

export async function upsertTrackerEntries(db: Database, params: any) {
  return null;
}

export async function getCurrentTimer(db: Database, params: any) {
  return null;
}


export async function updateActivityStatus(db: Database, params: any) {
  return null;
}

export async function getActivityById(db: Database, params: any) {
  return null;
}

export async function getActivities(db: Database, params: any) {
  return [];
}


export async function sendInvoice(db: Database, params: any) {
  return null;
}

export async function markInvoiceAsPaid(db: Database, params: any) {
  return null;
}

export async function getPayments(db: Database, params: any) {
  return [];
}

export async function createPayment(db: Database, params: any) {
  return null;
}

export async function updatePayment(db: Database, params: any) {
  return null;
}

export async function deletePayment(db: Database, params: any) {
  return null;
}

export async function updateAllActivitiesStatus(db: Database, params: any) {
  return null;
}

export async function getTrackerRecordsByRange(db: Database, params: any) {
  return [];
}

export async function bulkCreateTrackerEntries(db: Database, params: any) {
  return [];
}

export async function createTransactions(db: Database, params: any) {
  return [];
}

export async function deleteTransactions(db: Database, params: any) {
  return [];
}

export async function updateTransactions(db: Database, params: any) {
  return [];
}

export async function getNewCustomersCount(db: Database, params: any) {
  return { data: { count: 0, previousCount: 0 } };
}


