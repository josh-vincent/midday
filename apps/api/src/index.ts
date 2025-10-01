import { trpcServer } from "@hono/trpc-server";
import { OpenAPIHono } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { routers } from "./rest/routers";
import type { Context } from "./rest/types";
import { createTRPCContext } from "./trpc/init";
import { appRouter } from "./trpc/routers/_app";
import { checkHealth } from "./utils/health";

const app = new OpenAPIHono<Context>();

app.use(secureHeaders());

app.use("*", async (c, next) => {
  // Get allowed origins from env (works in both Node.js and Cloudflare Workers)
  // @ts-ignore - c.env exists in Cloudflare Workers
  const allowedOrigins = (c.env?.ALLOWED_API_ORIGINS || process.env.ALLOWED_API_ORIGINS || "")
    .split(",")
    .filter(Boolean);

  const corsMiddleware = cors({
    origin: allowedOrigins,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowHeaders: [
      "Authorization",
      "Content-Type",
      "accept-language",
      "x-trpc-source",
      "x-user-locale",
      "x-user-timezone",
      "x-user-country",
    ],
    exposeHeaders: ["Content-Length"],
    maxAge: 86400,
  });

  return corsMiddleware(c, next);
});

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: createTRPCContext,
  }),
);

app.get("/health", async (c) => {
  try {
    await checkHealth();

    return c.json({ status: "ok" }, 200);
  } catch (error) {
    return c.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

app.doc("/openapi", {
  openapi: "3.1.0",
  info: {
    version: "0.0.1",
    title: "DirtWorks API",
    description:
      "DirtWorks is a platform for Invoicing, Time tracking, Job management, and Financial Overview.",
    contact: {
      name: "DirtWorks Support",
      email: "support@dirtworks.com",
      url: "https://dirtworks.com",
    },
    license: {
      name: "AGPL-3.0 license",
      url: "https://github.com/josh-vincent/midday/blob/main/LICENSE",
    },
  },
  servers: [
    {
      url: "https://dirtworks-api.vendors-f81.workers.dev",
      description: "Production API",
    },
  ],
  security: [
    {
      oauth2: [],
    },
    { token: [] },
  ],
});

// Register security scheme
app.openAPIRegistry.registerComponent("securitySchemes", "token", {
  type: "http",
  scheme: "bearer",
  description: "Default authentication mechanism",
  "x-speakeasy-example": "DIRTWORKS_API_KEY",
});

app.get(
  "/",
  Scalar({ url: "/openapi", pageTitle: "DirtWorks API", theme: "saturn" }),
);

app.route("/", routers);

// Export the Hono app for Cloudflare Workers and Vercel
export default app;
