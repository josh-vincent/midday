/**
 * @midday/api-core
 *
 * Shared tRPC routers and API logic used across api and pivot-api
 * This package contains all the common API endpoints, middleware,
 * and business logic that is duplicated between the two API applications.
 */

export * from "./types";
export { createTagsRouter } from "./routers/tags";
export { createCustomersRouter } from "./routers/customers";
export { createUserRouter } from "./routers/user";
