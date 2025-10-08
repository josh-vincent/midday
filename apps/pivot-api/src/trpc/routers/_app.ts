import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { createTRPCRouter } from "../init";
// import { apiKeysRouter } from "./api-keys"; // Not needed for invoicing MVP
import { accountingConnectionsRouter } from "./accounting-connections";
import { appsRouter } from "./apps";
import { bankAccountsRouter } from "./bank-accounts";
import { billingRouter } from "./billing";
import { customersRouter } from "./customers";
import { documentsRouter } from "./documents";
import { emailsRouter } from "./emails";
import { inboxRouter } from "./inbox";
import { invoiceRouter } from "./invoice";
import { invoiceProductsRouter } from "./invoice-products";
import { invoiceTemplateRouter } from "./invoice-template";
import { jobsRouter } from "./job";
import { oauthApplicationsRouter } from "./oauth-applications";
import { reportsRouter } from "./reports";
import { searchRouter } from "./search";
import { shortLinksRouter } from "./short-links";
import { tagsRouter } from "./tags";
import { teamRouter } from "./team";
import { trackerEntriesRouter } from "./tracker-entries";
import { trackerProjectsRouter } from "./tracker-projects";
import { transactionAttachmentsRouter } from "./transaction-attachments";
import { transactionCategoriesRouter } from "./transaction-categories";
import { transactionTagsRouter } from "./transaction-tags";
import { transactionsRouter } from "./transactions";
import { userRouter } from "./user";

export const appRouter = createTRPCRouter({
  // apiKeys: apiKeysRouter, // Not needed for invoicing MVP
  accountingConnections: accountingConnectionsRouter,
  apps: appsRouter,
  bankAccounts: bankAccountsRouter,
  billing: billingRouter,
  customers: customersRouter,
  documents: documentsRouter,
  emails: emailsRouter,
  inbox: inboxRouter,
  invoice: invoiceRouter,
  invoiceProducts: invoiceProductsRouter,
  invoiceTemplate: invoiceTemplateRouter,
  job: jobsRouter,
  oauthApplications: oauthApplicationsRouter,
  reports: reportsRouter,
  search: searchRouter,
  shortLinks: shortLinksRouter,
  tags: tagsRouter,
  team: teamRouter,
  trackerEntries: trackerEntriesRouter,
  trackerProjects: trackerProjectsRouter,
  transactionAttachments: transactionAttachmentsRouter,
  transactionCategories: transactionCategoriesRouter,
  transactions: transactionsRouter,
  transactionTags: transactionTagsRouter,
  user: userRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
export type RouterInputs = inferRouterInputs<AppRouter>;
