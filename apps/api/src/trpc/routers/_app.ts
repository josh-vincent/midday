import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { createTRPCRouter } from "../init";
// import { apiKeysRouter } from "./api-keys"; // Not needed for invoicing MVP
import { customersRouter } from "./customers";
import { invoiceRouter } from "./invoice";
import { invoiceTemplateRouter } from "./invoice-template";
import { jobsRouter } from "./job";
import { reportsRouter } from "./reports";
import { shortLinksRouter } from "./short-links";
import { tagsRouter } from "./tags";
import { teamRouter } from "./team";
import { userRouter } from "./user";

export const appRouter = createTRPCRouter({
  // apiKeys: apiKeysRouter, // Not needed for invoicing MVP
  customers: customersRouter,
  invoice: invoiceRouter,
  invoiceTemplate: invoiceTemplateRouter,
  shortLinks: shortLinksRouter,
  tags: tagsRouter,
  team: teamRouter,
  user: userRouter,
  job: jobsRouter,
  reports: reportsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
export type RouterInputs = inferRouterInputs<AppRouter>;
