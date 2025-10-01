"use client";

import { createFilterParamsHook } from "@midday/ai-search";
import { jobFilterSchema } from "@/config/jobs-filters";

/**
 * Type-safe hook for job filter URL parameters
 * Automatically syncs with URL using nuqs
 */
export const useJobFilterParams = createFilterParamsHook(jobFilterSchema, {
  shallow: true,
  excludeFromHasFilters: ["groupBy"], // Don't count groupBy as an active filter
});