import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { createTRPCRouter } from "../init";
// import { apiKeysRouter } from "./api-keys"; // Not needed for invoicing MVP
import { customersRouter } from "./customers";
import { invoiceRouter } from "./invoice";
import { invoiceTemplateRouter } from "./invoice-template";
import { shortLinksRouter } from "./short-links";
import { teamRouter } from "./team";
import { userRouter } from "./user";
import { jobsRouter } from "./job";

export const appRouter = createTRPCRouter({
  // apiKeys: apiKeysRouter, // Not needed for invoicing MVP
  customers: customersRouter,
  invoice: invoiceRouter,
  invoiceTemplate: invoiceTemplateRouter,
  shortLinks: shortLinksRouter,
  team: teamRouter,
  user: userRouter,
  job: jobsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
export type RouterInputs = inferRouterInputs<AppRouter>;
