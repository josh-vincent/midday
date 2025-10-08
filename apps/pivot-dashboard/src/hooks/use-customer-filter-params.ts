"use client";

import { createFilterParamsHook } from "@midday/ai-search";
import { customerFilterSchema } from "@/config/customer-filters";

/**
 * Type-safe hook for customer filter URL parameters
 * Automatically syncs with URL using nuqs
 */
export const useCustomerFilterParams = createFilterParamsHook(customerFilterSchema, {
  shallow: true,
});
