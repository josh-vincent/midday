import { OpenAPIHono } from "@hono/zod-openapi";
// Temporarily disabled REST API routers - missing schema files and utilities
// Focus on tRPC API for MVP deployment
// import { protectedMiddleware } from "../middleware";
// import { customersRouter } from "./customers";
// import { invoicesRouter } from "./invoices";
// import { notificationsRouter } from "./notifications";
// import oauthRouter from "./oauth";
// import { reportsRouter } from "./reports";
// import { searchRouter } from "./search";
// import { tagsRouter } from "./tags";
// import { teamsRouter } from "./teams";
// import { transactionsRouter } from "./transactions";
// import { usersRouter } from "./users";

const routers = new OpenAPIHono();

// REST API routes temporarily disabled for MVP
// Will be re-enabled once schema files and utilities are created

// Mount OAuth routes first (publicly accessible)
// routers.route("/oauth", oauthRouter);

// Apply protected middleware to all subsequent routes
// routers.use(...protectedMiddleware);

// Mount protected routes
// routers.route("/notifications", notificationsRouter);
// routers.route("/transactions", transactionsRouter);
// routers.route("/teams", teamsRouter);
// routers.route("/users", usersRouter);
// routers.route("/customers", customersRouter);
// routers.route("/tags", tagsRouter);
// routers.route("/invoices", invoicesRouter);
// routers.route("/search", searchRouter);
// routers.route("/reports", reportsRouter);

export { routers };
